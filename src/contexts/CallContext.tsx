import { Socket } from "socket.io-client";
import { socketService } from '../services/socket';
import { useWebRTC } from "../hooks/useWebRTC";
import type {
  CallState,
  CallType,
  IncomingCallData,
  CallOfferData,
  CallAnswerData,
  IceCandidateData,
  CallUser,
} from "../types/call";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

export interface CallContextValue extends CallState {
  initiateCall: (
    conversationId: string,
    receiverId: string,
    callType: CallType,
    receiverInfo?: Partial<CallUser>,
    callerInfo?: Partial<CallUser>,
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  incomingCall: IncomingCallData | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CallContext = createContext<CallContextValue | undefined>(
  undefined,
);

interface CallProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const CallProvider: React.FC<CallProviderProps> = ({
  children,
  userId,
}) => {
  const [callState, setCallState] = useState<CallState>({
    callId: null,
    conversationId: null,
    callType: "video",
    status: "idle",
    isInitiator: false,
    isCaller: false,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    otherUser: null,
    error: null,
    startTime: null,
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [pendingOffer, setPendingOffer] = useState<CallOfferData | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const currentOtherUserIdRef = useRef<string | null>(null);
  const incomingCallRef = useRef<IncomingCallData | null>(null);
  const acceptedCallIdRef = useRef<string | null>(null);

  const callSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    currentCallIdRef.current = callState.callId;
    currentOtherUserIdRef.current = callState.otherUser?.id || null;
  }, [callState.callId, callState.otherUser]);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // webRTC hooks
  const {
    initializePeerConnection,
    getLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleVideo: toggleVideoTrack,
    toggleAudio: toggleAudioTrack,
    cleanup: cleanupWebRTC,
  } = useWebRTC({
    onRemoteStream: (stream) => {
      console.log("Remote stream received");
      setCallState((prev) => ({
        ...prev,
        remoteStream: stream,
        status: "connected",
        startTime: Date.now(),
      }));
    },
    onIceCandidate: (candidate) => {
      const socket = callSocketRef.current;
      const activeCallId = currentCallIdRef.current;
      const targetUserId = currentOtherUserIdRef.current;

      if (socket && activeCallId && targetUserId) {
        socket.emit("call:ice-candidate", {
          callId: activeCallId,
          targetUserId,
          candidate,
        });
      } else {
        console.warn(
          "[CallContext] Skip ICE emit: missing callId/targetUserId",
        );
      }
    },
    onConnectionStateChange: (state) => {
      console.log("Connection state changed:", state);
      if (state === "failed") {
        // Chỉ set failed khi thực sự "failed", không set khi "disconnected"
        // ICE restart trong useWebRTC sẽ tự xử lý
        setCallState((prev) => ({
          ...prev,
          error: "Connection failed",
          status: "failed",
        }));
      }
      // "disconnected" chỉ là tạm thời, WebRTC có thể tự recover
      // useWebRTC sẽ tự ICE restart nếu vẫn disconnected sau 3s
    },
    onIceRestart: async (offer) => {
      const socket = callSocketRef.current;
      const activeCallId = currentCallIdRef.current;
      const targetUserId = currentOtherUserIdRef.current;

      if (!socket || !activeCallId || !targetUserId) {
        console.warn(
          "[CallContext] Skip ICE restart offer: missing call context",
        );
        return;
      }

      socket.emit("call:offer", {
        callId: activeCallId,
        receiverId: targetUserId,
        offer,
      });
      console.log("[CallContext] ICE restart offer emitted");
    },
  });

  // cleanup call
  const cleanupCall = useCallback(() => {
    cleanupWebRTC();
    setCallState({
      callId: null,
      conversationId: null,
      callType: "video",
      status: "idle",
      isInitiator: false,
      isCaller: false,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      otherUser: null,
      error: null,
      startTime: null,
    });
    setIncomingCall(null);
    setPendingOffer(null);
    acceptedCallIdRef.current = null;
  }, [cleanupWebRTC]);

  const processAcceptedOffer = useCallback(
    async (offerData: CallOfferData, callData: IncomingCallData) => {
      const socket = callSocketRef.current;
      if (!socket) return;

      initializePeerConnection();

      // Lấy local stream - nếu thất bại vẫn tiếp tục (audio call có thể không cần video)
      try {
        const stream = await getLocalStream(
          callData.callType === "video",
          true,
        );
        console.log("[CallContext] Local stream obtained:", stream);
        setCallState((prev) => ({ ...prev, localStream: stream }));
      } catch (streamError) {
        console.error("[CallContext] Could not get local stream:", streamError);
        // Thông báo cho user nhưng vẫn tiếp tục để ít nhất nhận được stream từ người kia
        setCallState((prev) => ({
          ...prev,
          error:
            "Không thể truy cập camera/mic. Bạn vẫn có thể nghe/thấy người kia.",
        }));
      }

      const answer = await handleOffer(offerData.offer);
      console.log("[CallContext] Answer created:", answer);

      socket.emit("call:answer", {
        callId: offerData.callId,
        callerId: offerData.callerId,
        answer,
      });
      console.log("[CallContext] Answer sent to caller");

      setPendingOffer(null);
      setIncomingCall(null);
      acceptedCallIdRef.current = null;
    },
    [getLocalStream, handleOffer, initializePeerConnection],
  );

  // Dùng refs cho các callbacks để stabilize useEffect dependencies
  const addIceCandidateRef = useRef(addIceCandidate);
  const handleOfferRef = useRef(handleOffer);
  const handleAnswerRef = useRef(handleAnswer);
  const processAcceptedOfferRef = useRef(processAcceptedOffer);
  const cleanupCallRef = useRef(cleanupCall);

  useEffect(() => {
    addIceCandidateRef.current = addIceCandidate;
  }, [addIceCandidate]);
  useEffect(() => {
    handleOfferRef.current = handleOffer;
  }, [handleOffer]);
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);
  useEffect(() => {
    processAcceptedOfferRef.current = processAcceptedOffer;
  }, [processAcceptedOffer]);
  useEffect(() => {
    cleanupCallRef.current = cleanupCall;
  }, [cleanupCall]);

  // khởi tạo call socket - chỉ depend trên userId để tránh listener bị tear down/rebuild
  useEffect(() => {
    console.log("[CallContext] Initializing socket for userId:", userId);
    const socket = socketService.connectCall(userId);
    callSocketRef.current = socket;

    // debug: nghe tất cả các sự kiện
    socket.onAny((eventName, ...args) => {
      console.log(`[CallContext] >>> Received event: ${eventName}`, args);
    });

    // listen to incoming call
    const handleIncomingCall = (data: IncomingCallData) => {
      console.log("[CallContext] Incoming call:", data);
      setIncomingCall(data);
    };
    socket.on("call:incoming", handleIncomingCall);

    // listen to call offer - lưu offer, chưa xử lý
    const handleCallOffer = async (data: CallOfferData) => {
      console.log("[CallContext] Received offer:", data);

      // Offer trong cuộc gọi đang active (renegotiation / ICE restart)
      if (
        currentCallIdRef.current === data.callId &&
        !incomingCallRef.current
      ) {
        try {
          const answer = await handleOfferRef.current(data.offer);
          socket.emit("call:answer", {
            callId: data.callId,
            callerId: data.callerId,
            answer,
          });
          console.log("[CallContext] Renegotiation answer sent");
        } catch (error) {
          console.error(
            "[CallContext] Error handling renegotiation offer:",
            error,
          );
        }
        return;
      }

      if (
        acceptedCallIdRef.current === data.callId &&
        incomingCallRef.current
      ) {
        try {
          await processAcceptedOfferRef.current(data, incomingCallRef.current);
        } catch (error) {
          console.error(
            "[CallContext] Error processing accepted offer:",
            error,
          );
        }
        return;
      }

      setPendingOffer(data);
    };
    socket.on("call:offer", handleCallOffer);

    // listen to call answer
    const handleCallAnswer = async (data: CallAnswerData) => {
      console.log("[CallContext] Received answer:", data);
      try {
        await handleAnswerRef.current(data.answer);
      } catch (error) {
        console.error("[CallContext] Error handling answer:", error);
      }
    };
    socket.on("call:answer", handleCallAnswer);

    // listen to ICE candidates
    const handleIceCandidate = async (data: IceCandidateData) => {
      console.log("[CallContext] Received ICE candidate");
      try {
        await addIceCandidateRef.current(data.candidate);
      } catch (error) {
        console.error("[CallContext] Error adding ICE candidate:", error);
      }
    };
    socket.on("call:ice-candidate", handleIceCandidate);

    // listen to call accepted (caller side - cập nhật UI khi receiver chấp nhận)
    const handleCallAccepted = (data: {
      callId: string;
      receiverId: string;
    }) => {
      console.log("[CallContext] Call accepted by receiver:", data);
      setCallState((prev) => {
        if (prev.isCaller && prev.status === "calling") {
          return { ...prev, status: "ringing" };
        }
        return prev;
      });
    };
    socket.on("call:accept", handleCallAccepted);

    // listen to call rejected
    const handleCallRejected = (data?: {
      callId?: string;
      rejectedBy?: string;
    }) => {
      console.log("[CallContext] Call rejected:", data);
      setCallState((prev) => ({ ...prev, status: "rejected" }));
      cleanupCallRef.current();
    };
    socket.on("call:reject", handleCallRejected);
    socket.on("call:rejected", handleCallRejected);

    // listen to call ended
    const handleCallEnded = () => {
      console.log("[CallContext] Call ended");
      setCallState((prev) => ({ ...prev, status: "ended" }));
      cleanupCallRef.current();
    };
    socket.on("call:ended", handleCallEnded);

    // listen to media toggled
    const handleMediaToggled = (data: {
      userId: string;
      mediaType: "video" | "audio";
      enabled: boolean;
    }) => {
      console.log("[CallContext] Media toggled:", data);
    };
    socket.on("call:media-toggled", handleMediaToggled);

    // listen to errors
    const handleCallError = (error: { message: string; code?: string }) => {
      console.error("[CallContext] Call error:", error);

      let errorMessage = error.message;
      if (error.code === "USER_OFFLINE") {
        errorMessage =
          "User is not online. Please make sure they are connected.";
      }

      setCallState((prev) => ({
        ...prev,
        error: errorMessage,
        status: "failed",
      }));

      setTimeout(() => {
        cleanupCallRef.current();
      }, 3000);
    };
    socket.on("call:error", handleCallError);

    return () => {
      console.log("[CallContext] Cleaning up socket listeners");
      socket.offAny();
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:offer", handleCallOffer);
      socket.off("call:answer", handleCallAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:accept", handleCallAccepted);
      socket.off("call:reject", handleCallRejected);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:media-toggled", handleMediaToggled);
      socket.off("call:error", handleCallError);
    };
  }, [userId]); // Chỉ depend trên userId - các callbacks dùng refs

  // khởi tạo call
  const initiateCall = useCallback(
    async (
      conversationId: string,
      receiverId: string,
      callType: CallType,
      receiverInfo?: Partial<CallUser>,
      callerInfo?: Partial<CallUser>,
    ) => {
      const socket = callSocketRef.current;
      if (!socket) {
        throw new Error("Socket not connected");
      }

      try {
        setCallState((prev) => ({
          ...prev,
          conversationId,
          callType,
          status: "calling",
          isInitiator: true,
          isCaller: true,
          otherUser: {
            id: receiverId,
            name: receiverInfo?.name || "Unknown",
            avatar: receiverInfo?.avatar,
          },
        }));

        // khởi tạo peer connection first
        initializePeerConnection();

        // lấy luồng local
        const stream = await getLocalStream(callType === "video", true);
        setCallState((prev) => ({ ...prev, localStream: stream }));

        // phát sự kiện khởi tạo call
        socket.emit("call:initiate", {
          conversationId,
          receiverId,
          callType,
          callerName: callerInfo?.name,
          callerAvatar: callerInfo?.avatar,
        });

        // lắng nghe xác nhận cuộc gọi đã bắt đầu
        socket.once("call:initiated", async (data: { callId: string }) => {
          setCallState((prev) => ({ ...prev, callId: data.callId }));

          // tạo and gửi offer
          const offer = await createOffer();
          socket.emit("call:offer", {
            callId: data.callId,
            receiverId,
            offer,
          });
        });
      } catch (error) {
        console.log("Error initiating call:", error);
        setCallState((prev) => ({
          ...prev,
          error: "Failed to start call",
          status: "failed",
        }));
        cleanupCall();
        throw error;
      }
    },
    [initializePeerConnection, getLocalStream, createOffer, cleanupCall],
  );

  // accept cuộc gọi đến
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const socket = callSocketRef.current;
    if (!socket) return;

    try {
      console.log(
        "[CallContext] Accepting call with type:",
        incomingCall.callType,
      );
      console.log("[CallContext] Pending offer exists?", !!pendingOffer);
      acceptedCallIdRef.current = incomingCall.callId;

      setCallState((prev) => ({
        ...prev,
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType,
        status: "ringing",
        isInitiator: false,
        isCaller: false,
        otherUser: {
          id: incomingCall.callerId,
          name: incomingCall.callerName || "Unknown",
          avatar: incomingCall.callerAvatar,
        },
      }));

      // chuẩn bị kết nối peer và local trước khi tạo câu trả lời
      if (pendingOffer) {
        console.log("[CallContext] Processing pending offer");
        await processAcceptedOffer(pendingOffer, incomingCall);
      } else {
        console.warn(
          "[CallContext] No pending offer yet. Waiting for caller offer...",
        );
      }

      // thông báo cho người gọi biết cuộc gọi đã được chấp nhận.
      socket.emit("call:accept", {
        callId: incomingCall.callId,
        targetUserId: incomingCall.callerId,
      });
      console.log("[CallContext] Accept notification sent");

      if (pendingOffer) {
        setIncomingCall(null);
      }
    } catch (error) {
      console.error("[CallContext] Error accepting call:", error);
      console.error("[CallContext] Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      setCallState((prev) => ({
        ...prev,
        error: "Failed to accept call",
        status: "failed",
      }));
    }
  }, [incomingCall, pendingOffer, processAcceptedOffer]);

  // reject cuộc gọi đến
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    const socket = callSocketRef.current;
    if (!socket) return;

    socket.emit("call:reject", {
      callId: incomingCall.callId,
      targetUserId: incomingCall.callerId,
    });

    setIncomingCall(null);
    setPendingOffer(null);
  }, [incomingCall]);

  // end call
  const endCall = useCallback(() => {
    const socket = callSocketRef.current;
    if (!socket || !callState.callId || !callState.otherUser) return;

    socket.emit("call:end", {
      callId: callState.callId,
      targetUserId: callState.otherUser.id,
    });

    cleanupCall();
  }, [callState.callId, callState.otherUser, cleanupCall]);

  // toggle video
  const toggleVideo = useCallback(() => {
    const newState = !callState.isVideoEnabled;
    toggleVideoTrack(newState);

    setCallState((prev) => ({ ...prev, isVideoEnabled: newState }));

    // notify other user
    const socket = callSocketRef.current;
    if (socket && callState.callId && callState.otherUser) {
      socket.emit("call:toggle-media", {
        callId: callState.callId,
        targetUserId: callState.otherUser.id,
        mediaType: "video",
        enabled: newState,
      });
    }
  }, [
    toggleVideoTrack,
    callState.isVideoEnabled,
    callState.callId,
    callState.otherUser,
  ]);

  // toggle audio
  const toggleAudio = useCallback(() => {
    const newState = !callState.isAudioEnabled;
    toggleAudioTrack(newState);

    setCallState((prev) => ({ ...prev, isAudioEnabled: newState }));

    // notify other user
    const socket = callSocketRef.current;
    if (socket && callState.callId && callState.otherUser) {
      socket.emit("call:toggle-media", {
        callId: callState.callId,
        targetUserId: callState.otherUser.id,
        mediaType: "audio",
        enabled: newState,
      });
    }
  }, [
    toggleAudioTrack,
    callState.isAudioEnabled,
    callState.callId,
    callState.otherUser,
  ]);

  const value: CallContextValue = {
    ...callState,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    incomingCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
