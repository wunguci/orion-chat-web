import { Socket } from "socket.io-client";
import socketService from "../services/socket";
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

interface CallContextValue extends CallState {
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

// eslint-disable-next-line react-refresh/only-export-components
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

  const callSocketRef = useRef<Socket | null>(null);

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
      if (socket && callState.callId && callState.otherUser) {
        socket.emit("call:ice-candidate", {
          callId: callState.callId,
          targetUserId: callState.otherUser.id,
          candidate,
        });
      }
    },
    onConnectionStateChange: (state) => {
      console.log("Connection state changed:", state);
      if (state === "failed" || state === "disconnected") {
        setCallState((prev) => ({
          ...prev,
          error: "Connection failed",
          status: "failed",
        }));
      }
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
  }, [cleanupWebRTC]);

  // khởi tạo call socket
  useEffect(() => {
    console.log('[CallContext] Initializing socket for userId:', userId);
    const socket = socketService.connectCall(userId);
    callSocketRef.current = socket;

    // Debug: Listen to ALL events
    socket.onAny((eventName, ...args) => {
      console.log(`[CallContext] >>> Received event: ${eventName}`, args);
    });

    // listen to incoming call
    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('[CallContext] Incoming call:', data);
      console.log('[CallContext] Incoming call callerName:', data.callerName);
      console.log('[CallContext] Incoming call callerAvatar:', data.callerAvatar);
      setIncomingCall(data);
    };
    socket.on("call:incoming", handleIncomingCall);

    // listen to call offer - SAVE offer, don't process yet
    const handleCallOffer = async (data: CallOfferData) => {
      console.log('[CallContext] Received offer, saving for later:', data);
      // Save offer to process when user accepts
      setPendingOffer(data);
    };
    socket.on("call:offer", handleCallOffer);

    // listen to call answer
    const handleCallAnswer = async (data: CallAnswerData) => {
      console.log('[CallContext] Received answer:', data);
      try {
        await handleAnswer(data.answer);
      } catch (error) {
        console.error('[CallContext] Error handling answer:', error);
      }
    };
    socket.on("call:answer", handleCallAnswer);

    // listen to ICE candidates
    const handleIceCandidate = async (data: IceCandidateData) => {
      console.log('[CallContext] Received ICE candidate');
      try {
        await addIceCandidate(data.candidate);
      } catch (error) {
        console.error('[CallContext] Error adding ICE candidate:', error);
      }
    };
    socket.on("call:ice-candidate", handleIceCandidate);

    // listen to call rejected
    const handleCallRejected = () => {
      console.log('[CallContext] Call rejected');
      setCallState((prev) => ({ ...prev, status: "rejected" }));
      cleanupCall();
    };
    socket.on("call:rejected", handleCallRejected);

    // listen to call ended
    const handleCallEnded = () => {
      console.log('[CallContext] Call ended');
      setCallState((prev) => ({ ...prev, status: "ended" }));
      cleanupCall();
    };
    socket.on("call:ended", handleCallEnded);

    // listen to media toggled
    const handleMediaToggled = (data: {
      userId: string;
      mediaType: "video" | "audio";
      enabled: boolean;
    }) => {
      console.log('[CallContext] Media toggled:', data);
    };
    socket.on("call:media-toggled", handleMediaToggled);

    // listen to errors
    const handleCallError = (error: { message: string; code?: string }) => {
      console.error('[CallContext] Call error:', error);
      
      // Show user-friendly error
      let errorMessage = error.message;
      if (error.code === 'USER_OFFLINE') {
        errorMessage = 'User is not online. Please make sure they are connected.';
      }
      
      setCallState((prev) => ({
        ...prev,
        error: errorMessage,
        status: "failed",
      }));
      
      // Auto cleanup after 3 seconds
      setTimeout(() => {
        cleanupCall();
      }, 3000);
    };
    socket.on("call:error", handleCallError);

    return () => {
      console.log('[CallContext] Cleaning up socket listeners');
      socket.offAny(); // Remove catch-all listener
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:offer", handleCallOffer);
      socket.off("call:answer", handleCallAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleCallRejected);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:media-toggled", handleMediaToggled);
      socket.off("call:error", handleCallError);
    };
  }, [userId]); // Only re-run when userId changes

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

        // Initialize peer connection first
        initializePeerConnection();

        // lấy lường local
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
      console.log('[CallContext] Accepting call with type:', incomingCall.callType);
      console.log('[CallContext] Pending offer exists?', !!pendingOffer);
      
      setCallState((prev) => ({
        ...prev,
        callId: incomingCall.callId,
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType, // Use call type from incoming call
        status: "ringing",
        isInitiator: false,
        isCaller: false,
        otherUser: {
          id: incomingCall.callerId,
          name: incomingCall.callerName || "Unknown",
          avatar: incomingCall.callerAvatar,
        },
      }));

      // Process pending offer FIRST (before getting local stream)
      if (pendingOffer) {
        console.log('[CallContext] Processing pending offer');
        
        // Initialize peer connection before handling offer
        initializePeerConnection();
        
        const answer = await handleOffer(pendingOffer.offer);
        console.log('[CallContext] Answer created:', answer);

        // NOW get local stream and add tracks
        console.log('[CallContext] Getting local stream...');
        let stream: MediaStream | null = null;
        try {
          stream = await getLocalStream(
            incomingCall.callType === "video",
            true,
          );
          console.log('[CallContext] Local stream obtained:', stream);
          setCallState((prev) => ({ ...prev, localStream: stream }));
        } catch (streamError) {
          console.warn('[CallContext] Could not get local stream (device busy?):', streamError);
          alert('Camera/Mic is busy. Make sure to close other tabs using it, or test in different browsers.');
        }
        
        // Send answer to caller
        socket.emit("call:answer", {
          callId: pendingOffer.callId,
          callerId: pendingOffer.callerId,
          answer,
        });
        console.log('[CallContext] Answer sent to caller');
        
        setPendingOffer(null);
      } else {
        console.warn('[CallContext] No pending offer to process!');
      }

      // thông báo cho người gọi biết cuộc gọi đã được chấp nhận.
      socket.emit("call:accept", {
        callId: incomingCall.callId,
        targetUserId: incomingCall.callerId,
      });
      console.log('[CallContext] Accept notification sent');

      setIncomingCall(null);
      setPendingOffer(null);
    } catch (error) {
      console.error("[CallContext] Error accepting call:", error);
      console.error("[CallContext] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setCallState((prev) => ({
        ...prev,
        error: "Failed to accept call",
        status: "failed",
      }));
    }
  }, [incomingCall, pendingOffer, initializePeerConnection, getLocalStream, handleOffer]);

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
