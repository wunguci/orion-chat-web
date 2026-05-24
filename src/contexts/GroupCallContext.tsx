import { Socket } from "socket.io-client";
import {
  socketService,
  chatSocketService,
  sendMessage,
} from "../services/socket";
import { useGroupCall } from "../hooks/useGroupCall";
import type {
  GroupCallState,
  GroupCallParticipant,
  CallType,
  GroupIncomingCallData,
  GroupCallOfferData,
  GroupCallAnswerData,
  GroupCallIceCandidateData,
  GroupParticipantJoinedData,
  GroupParticipantLeftData,
} from "../types/call";
import { createContext, useCallback, useEffect, useRef, useState } from "react";

export interface GroupCallContextValue extends GroupCallState {
  initiateGroupCall: (
    conversationId: string,
    participantIds: string[],
    callType: CallType,
    participantNames?: Record<string, string>,
  ) => Promise<void>;
  joinGroupCall: (callId: string, conversationId: string) => Promise<void>;
  acceptGroupCall: () => Promise<void>;
  rejectGroupCall: () => void;
  leaveGroupCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleAudioForParticipant: (userId: string, enabled: boolean) => void;
  toggleVideoForParticipant: (userId: string, enabled: boolean) => void;
  setActiveParticipant: (userId: string) => void;
  incomingCall: GroupIncomingCallData | null;
}

// eslint-disable-next-line react-refresh/only-export-components
export const GroupCallContext = createContext<
  GroupCallContextValue | undefined
>(undefined);

interface GroupCallProviderProps {
  children: React.ReactNode;
  userId: string;
  userName?: string;
}

export const GroupCallProvider: React.FC<GroupCallProviderProps> = ({
  children,
  userId,
  userName = "User",
}) => {
  const [callState, setCallState] = useState<GroupCallState>({
    callId: null,
    conversationId: null,
    callType: "video",
    callMode: "group",
    status: "idle",
    isInitiator: false,
    isCaller: false,
    isHost: false,
    localStream: null,
    participants: [],
    isVideoEnabled: true,
    isAudioEnabled: true,
    error: null,
    startTime: null,
  });

  const [incomingCall, setIncomingCall] =
    useState<GroupIncomingCallData | null>(null);

  const callSocketRef = useRef<Socket | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const failedStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const hasPersistedCallHistoryRef = useRef(false);

  const persistGroupCallHistory = useCallback(
    async (finalStatus: "ended" | "failed" | "rejected" | "idle") => {
      if (hasPersistedCallHistoryRef.current) return;
      if (!callState.isInitiator || !callState.conversationId) return;

      const duration = callState.startTime
        ? Math.max(0, Math.floor((Date.now() - callState.startTime) / 1000))
        : 0;

      const callHistoryStatus: "completed" | "missed" | "declined" =
        finalStatus === "failed" || finalStatus === "rejected"
          ? "declined"
          : duration > 0
            ? "completed"
            : "missed";

      try {
        const socket = chatSocketService.connect();

        if (!socket.connected) {
          await new Promise<void>((resolve) => {
            socket.once("connect", () => resolve());
          });
        }

        sendMessage({
          requestId: `req_${Date.now()}`,
          clientMessageId: `group_call_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          type: "call",
          content: "",
          conversationId: callState.conversationId,
          callData: {
            callType: callState.callType,
            callStatus: callHistoryStatus,
            duration,
            isInitiator: true,
            wasRejected: callHistoryStatus === "declined",
          },
        });

        hasPersistedCallHistoryRef.current = true;
      } catch (error) {
        console.error(
          "[GroupCallContext] Failed to persist group call history:",
          error,
        );
      }
    },
    [
      callState.isInitiator,
      callState.conversationId,
      callState.startTime,
      callState.callType,
    ],
  );

  // Group call hooks
  const {
    getLocalStream,
    createPeerForParticipant,
    createOfferForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    toggleAudioForParticipant: toggleAudioForPeer,
    toggleVideoForParticipant: toggleVideoForPeer,
    toggleMediaForAll,
    toggleLocalVideo,
    toggleLocalAudio,
    removeParticipant,
    cleanup: cleanupGroupCall,
    getAllParticipantIds,
    getParticipantStream,
    localStream,
  } = useGroupCall({
    onParticipantStream: (userId, stream) => {
      console.log(`[GroupCallContext] Received stream from ${userId}`);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === userId ? { ...p, stream } : p,
        ),
      }));
    },
    onParticipantLeft: (userId) => {
      console.log(`[GroupCallContext] Participant ${userId} left`);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== userId),
      }));
    },
    onIceCandidate: (targetUserId, candidate) => {
      const socket = callSocketRef.current;
      const callId = currentCallIdRef.current;
      if (!socket || !callId) return;

      socket.emit("groupcall:ice-candidate", {
        callId,
        targetUserId,
        candidate,
      });
    },
    onConnectionStateChange: (userId, state) => {
      console.log(
        `[GroupCallContext] Connection state with ${userId}: ${state}`,
      );
    },
  });

  useEffect(() => {
    currentCallIdRef.current = callState.callId;
  }, [callState.callId]);

  // Cleanup call
  const cleanupCall = useCallback(() => {
    if (failedStateTimerRef.current) {
      clearTimeout(failedStateTimerRef.current);
      failedStateTimerRef.current = null;
    }

    cleanupGroupCall();
    setCallState({
      callId: null,
      conversationId: null,
      callType: "video",
      callMode: "group",
      status: "idle",
      isInitiator: false,
      isCaller: false,
      isHost: false,
      localStream: null,
      participants: [],
      isVideoEnabled: true,
      isAudioEnabled: true,
      error: null,
      startTime: null,
    });
    setIncomingCall(null);
    hasPersistedCallHistoryRef.current = false;
  }, [cleanupGroupCall]);

  const cleanupCallRef = useRef(cleanupCall);
  useEffect(() => {
    cleanupCallRef.current = cleanupCall;
  }, [cleanupCall]);

  // Connect call socket
  useEffect(() => {
    console.log(
      `[GroupCallContext] Connecting call socket for userId: ${userId}`,
    );
    const socket = socketService.connectCall(userId);
    callSocketRef.current = socket;

    const handleSocketConnect = () => {
      console.log("[GroupCallContext] Call socket connected successfully");
    };

    const handleSocketError = (error: any) => {
      console.error("[GroupCallContext] Call socket connection error:", error);
    };

    const handleSocketDisconnect = () => {
      console.log("[GroupCallContext] Call socket disconnected");
    };

    const handleSocketConnectError = (error: any) => {
      console.error(
        "[GroupCallContext] Call socket connect_error event:",
        error,
      );
      console.error("[GroupCallContext] Error details:", {
        message: error?.message,
        code: error?.code,
        type: error?.type,
      });
    };

    socket.on("connect", handleSocketConnect);
    socket.on("disconnect", handleSocketDisconnect);
    socket.on("error", handleSocketError);
    socket.on("connect_error", handleSocketConnectError);

    // Ensure connection state is set properly if already connected
    if (socket.connected) {
      // Socket already connected
    }

    // Listen to incoming group call
    const handleIncomingGroupCall = (data: GroupIncomingCallData) => {
      setIncomingCall(data);
    };
    socket.on("groupcall:incoming", handleIncomingGroupCall);

    // Listen to participant joined
    const handleParticipantJoined = async (
      data: GroupParticipantJoinedData,
    ) => {
      if (data.callId !== currentCallIdRef.current) return;
      if (data.userId === userId) return;

      console.log(`[GroupCallContext] Participant joined: ${data.userId}`);

      const participantName = data.userName || `User ${data.userId}`;

      // Tạo peer connection cho participant mới
      try {
        const peerConnection = await createPeerForParticipant(
          data.userId,
          participantName,
          false,
        );

        // Tạo offer và gửi
        const offer = await createOfferForParticipant(data.userId);
        if (offer) {
          const socket = callSocketRef.current;
          if (socket) {
            socket.emit("groupcall:offer", {
              callId: data.callId,
              targetUserId: data.userId,
              offer,
            });
          }
        }
      } catch (error) {
        console.error(
          `[GroupCallContext] Error creating peer for ${data.userId}:`,
          error,
        );
      }

      // Thêm participant vào state
      setCallState((prev) => {
        if (prev.participants.some((p) => p.id === data.userId)) {
          return prev;
        }
        return {
          ...prev,
          participants: [
            ...prev.participants,
            {
              id: data.userId,
              name: participantName,
              avatar: data.userAvatar,
              isVideoEnabled: true,
              isAudioEnabled: true,
              isHost: data.isHost,
            },
          ],
        };
      });
    };
    socket.on("groupcall:participant-joined", handleParticipantJoined);

    // Listen to participant left
    const handleParticipantLeft = (data: GroupParticipantLeftData) => {
      if (data.callId !== currentCallIdRef.current) return;

      console.log(`[GroupCallContext] Participant left: ${data.userId}`);
      removeParticipant(data.userId);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== data.userId),
      }));
    };
    socket.on("groupcall:participant-left", handleParticipantLeft);

    // Listen to group call offer
    const handleGroupCallOffer = async (data: GroupCallOfferData) => {
      if (data.callId !== currentCallIdRef.current) return;

      console.log(`[GroupCallContext] Received offer from ${data.callerId}`);

      try {
        // Tạo peer connection nếu chưa có
        if (!getAllParticipantIds().includes(data.callerId)) {
          await createPeerForParticipant(
            data.callerId,
            `User ${data.callerId}`,
            false,
          );
        }

        // Xử lý offer
        const answer = await handleOfferFromParticipant(
          data.callerId,
          data.offer,
        );

        if (answer) {
          socket.emit("groupcall:answer", {
            callId: data.callId,
            responderId: userId,
            targetUserId: data.callerId,
            answer,
          });
        }
      } catch (error) {
        console.error(
          "[GroupCallContext] Error handling group call offer:",
          error,
        );
      }
    };
    socket.on("groupcall:offer", handleGroupCallOffer);

    // Listen to group call answer
    const handleGroupCallAnswer = async (data: GroupCallAnswerData) => {
      try {
        console.log(
          `[GroupCallContext] Received answer from ${data.responderId}`,
        );
        await handleAnswerFromParticipant(data.responderId, data.answer);
      } catch (error) {
        console.error(
          "[GroupCallContext] Error handling group call answer:",
          error,
        );
      }
    };
    socket.on("groupcall:answer", handleGroupCallAnswer);

    // Listen to ICE candidates
    const handleGroupCallIceCandidate = async (
      data: GroupCallIceCandidateData,
    ) => {
      try {
        await addIceCandidateForParticipant(data.fromUserId, data.candidate);
      } catch (error) {
        console.error("[GroupCallContext] Error adding ICE candidate:", error);
      }
    };
    socket.on("groupcall:ice-candidate", handleGroupCallIceCandidate);
    const handleGroupCallMediaToggled = (data: {
      callId: string;
      userId: string;
      mediaType: "audio" | "video";
      enabled: boolean;
    }) => {
      if (data.callId !== currentCallIdRef.current) return;

      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((participant) => {
          if (participant.id !== data.userId) {
            return participant;
          }

          if (data.mediaType === "video") {
            return { ...participant, isVideoEnabled: data.enabled };
          }

          return { ...participant, isAudioEnabled: data.enabled };
        }),
      }));
    };
    socket.on("groupcall:media-toggled", handleGroupCallMediaToggled);

    // Listen to group call ended
    const handleGroupCallEnded = () => {
      void persistGroupCallHistory("ended");
      setCallState((prev) => ({ ...prev, status: "ended" }));
      setTimeout(() => {
        cleanupCallRef.current();
      }, 250);
    };
    socket.on("groupcall:ended", handleGroupCallEnded);

    // Listen to errors
    const handleGroupCallError = (error: {
      message: string;
      code?: string;
    }) => {
      console.error("[GroupCallContext] Group call error:", error);
      void persistGroupCallHistory("failed");
      setCallState((prev) => ({
        ...prev,
        error: error.message,
        status: "failed",
      }));
      setTimeout(() => {
        cleanupCallRef.current();
      }, 3000);
    };
    socket.on("groupcall:error", handleGroupCallError);

    return () => {
      socket.off("connect", handleSocketConnect);
      socket.off("disconnect", handleSocketDisconnect);
      socket.off("error", handleSocketError);
      socket.off("connect_error", handleSocketConnectError);
      socket.off("groupcall:incoming", handleIncomingGroupCall);
      socket.off("groupcall:participant-joined", handleParticipantJoined);
      socket.off("groupcall:participant-left", handleParticipantLeft);
      socket.off("groupcall:offer", handleGroupCallOffer);
      socket.off("groupcall:answer", handleGroupCallAnswer);
      socket.off("groupcall:ice-candidate", handleGroupCallIceCandidate);
      socket.off("groupcall:media-toggled", handleGroupCallMediaToggled);
      socket.off("groupcall:ended", handleGroupCallEnded);
      socket.off("groupcall:error", handleGroupCallError);
    };
  }, [
    userId,
    createPeerForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    removeParticipant,
    getAllParticipantIds,
    persistGroupCallHistory,
  ]);

  // Initiate group call
  const initiateGroupCall = useCallback(
    async (
      conversationId: string,
      participantIds: string[],
      callType: CallType,
      participantNames?: Record<string, string>, // Map of userId -> userName
    ) => {
      const socket = callSocketRef.current;
      if (!socket) {
        throw new Error("Socket not connected");
      }

      try {
        console.log("[GroupCallContext] initiateGroupCall called with:", {
          conversationId,
          participantIds,
          callType,
        });

        setCallState((prev) => ({
          ...prev,
          conversationId,
          callType,
          status: "calling",
          isInitiator: true,
          isCaller: true,
          isHost: true,
        }));
        hasPersistedCallHistoryRef.current = false;

        // Lấy local stream
        console.log("[GroupCallContext] Getting local stream...");
        const stream = await getLocalStream(callType === "video", true);
        console.log("[GroupCallContext] Got local stream:", stream?.id);
        setCallState((prev) => ({ ...prev, localStream: stream }));

        // Phát sự kiện khởi tạo group call và chờ xác nhận
        return new Promise<void>((resolve, reject) => {
          const currentSocket = callSocketRef.current;
          if (!currentSocket) {
            reject(
              new Error("Socket not initialized - cannot initiate group call"),
            );
            return;
          }

          // Define handler BEFORE setting up listener
          const handleInitiated = async (data: {
            callId: string;
            participants: {
              id: string;
              name: string;
              avatar?: string;
              isHost: boolean;
            }[];
          }) => {
            console.log(
              "[GroupCallContext] Received groupcall:initiated from server:",
              data,
            );
            clearTimeout(timeout);
            try {
              currentCallIdRef.current = data.callId;
              const remoteParticipants = data.participants.filter(
                (p) => p.id !== userId,
              );
              setCallState((prev) => ({
                ...prev,
                callId: data.callId,
                participants: remoteParticipants.map((p) => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar,
                  isVideoEnabled: true,
                  isAudioEnabled: true,
                  isHost: p.isHost,
                })),
                status: "connected",
                startTime: Date.now(),
              }));

              console.log("[GroupCallContext] Creating peer connections...");

              // Tạo peer connections cho tất cả participants
              for (const participant of data.participants) {
                if (participant.id === userId) {
                  continue;
                }
                try {
                  await createPeerForParticipant(
                    participant.id,
                    participant.name,
                    true,
                  );
                } catch (error) {
                  console.error(
                    `[GroupCallContext] Error creating peer for ${participant.id}:`,
                    error,
                  );
                }
              }

              console.log(
                "[GroupCallContext] Resolving initiateGroupCall promise",
              );
              resolve();
            } catch (error) {
              reject(error);
            }
          };

          // Set timeout for server response
          const timeout = setTimeout(() => {
            console.error(
              "[GroupCallContext] Group call initiation TIMEOUT - no response from server",
            );
            currentSocket.off("groupcall:initiated", handleInitiated);
            reject(
              new Error(
                "Group call initiation timeout - server did not respond",
              ),
            );
          }, 15000); // 15 second timeout

          // Set up listener BEFORE emitting
          console.log(
            "[GroupCallContext] Setting up listener for groupcall:initiated",
          );
          currentSocket.once("groupcall:initiated", handleInitiated);

          console.log(
            "[GroupCallContext] Emitting groupcall:initiate event...",
          );

          // Phát sự kiện - include participant names if provided
          currentSocket.emit("groupcall:initiate", {
            conversationId,
            participantIds,
            participantNames: participantNames || {}, // Map of userId -> name
            callType,
            initiatorName: userName,
          });
        });
      } catch (error) {
        console.error("[GroupCallContext] Error initiating group call:", error);
        void persistGroupCallHistory("failed");
        setCallState((prev) => ({
          ...prev,
          error: "Failed to start group call",
          status: "failed",
        }));
        cleanupCall();
        throw error;
      }
    },
    [
      getLocalStream,
      createPeerForParticipant,
      userName,
      cleanupCall,
      persistGroupCallHistory,
    ],
  );

  // Join group call
  const joinGroupCall = useCallback(
    async (callId: string, conversationId: string) => {
      const socket = callSocketRef.current;
      if (!socket || !incomingCall) return;

      try {
        currentCallIdRef.current = callId;
        const initialParticipants = (incomingCall.participants || [])
          .filter((participant) => participant.id !== userId)
          .map((participant) => ({
            id: participant.id,
            name: participant.name,
            avatar: undefined,
            isVideoEnabled: true,
            isAudioEnabled: true,
            isHost: participant.isHost,
          }));

        setCallState((prev) => ({
          ...prev,
          callId,
          conversationId,
          status: "ringing",
          isInitiator: false,
          isCaller: false,
          participants: initialParticipants,
        }));

        // Lấy local stream
        const stream = await getLocalStream(
          incomingCall.callType === "video",
          true,
        );
        setCallState((prev) => ({ ...prev, localStream: stream }));

        // Phát sự kiện tham gia group call
        const currentSocket = callSocketRef.current;
        if (!currentSocket) {
          throw new Error("Socket not initialized");
        }

        console.log("[GroupCallContext] Emitting groupcall:join...");
        currentSocket.emit("groupcall:join", {
          callId,
          userId,
          userName,
        });

        // Tạo peer connections cho các participant hiện tại
        if (incomingCall.participants) {
          for (const participant of incomingCall.participants) {
            if (participant.id !== userId) {
              try {
                await createPeerForParticipant(
                  participant.id,
                  participant.name,
                  false,
                );
              } catch (error) {
                console.error(
                  `[GroupCallContext] Error creating peer for ${participant.id}:`,
                  error,
                );
              }
            }
          }
        }

        setIncomingCall(null);
      } catch (error) {
        console.error("[GroupCallContext] Error joining group call:", error);
        setCallState((prev) => ({
          ...prev,
          error: "Failed to join group call",
          status: "failed",
        }));
      }
    },
    [userId, userName, incomingCall, getLocalStream, createPeerForParticipant],
  );

  // Accept group call (compatibility with 1-1 interface)
  const acceptGroupCall = useCallback(async () => {
    if (!incomingCall) return;
    await joinGroupCall(incomingCall.callId, incomingCall.conversationId);
  }, [incomingCall, joinGroupCall]);

  // Reject group call
  const rejectGroupCall = useCallback(() => {
    if (!incomingCall) return;

    const socket = callSocketRef.current;
    if (!socket) return;

    socket.emit("groupcall:reject", {
      callId: incomingCall.callId,
      userId,
    });

    setIncomingCall(null);
  }, [incomingCall, userId]);

  // Leave group call
  const leaveGroupCall = useCallback(() => {
    const socket = callSocketRef.current;
    if (!socket || !callState.callId) return;

    if (callState.isInitiator) {
      void persistGroupCallHistory("ended");
    }

    // If initiator, end call for everyone; otherwise just leave
    if (callState.isInitiator) {
      socket.emit("groupcall:end", {
        callId: callState.callId,
      });
    } else {
      socket.emit("groupcall:leave", {
        callId: callState.callId,
      });
    }

    cleanupCall();
  }, [
    callState.callId,
    callState.isInitiator,
    cleanupCall,
    persistGroupCallHistory,
  ]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    const newState = !callState.isAudioEnabled;
    await toggleLocalAudio(newState);
    toggleMediaForAll("audio", newState);
    setCallState((prev) => ({ ...prev, isAudioEnabled: newState }));

    const socket = callSocketRef.current;
    if (socket && callState.callId) {
      socket.emit("groupcall:toggle-media", {
        callId: callState.callId,
        userId,
        mediaType: "audio",
        enabled: newState,
      });
    }
  }, [
    callState.isAudioEnabled,
    callState.callId,
    userId,
    toggleMediaForAll,
    toggleLocalAudio,
  ]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const newState = !callState.isVideoEnabled;

    let updatedStream: MediaStream | null = null;

    try {
      updatedStream = await toggleLocalVideo(newState);
    } catch (error) {
      console.warn("[GroupCallContext] toggleVideo failed", error);
    }
    toggleMediaForAll("video", newState);
    setCallState((prev) => ({
      ...prev,
      isVideoEnabled: newState,
      localStream: updatedStream || prev.localStream,
    }));

    const socket = callSocketRef.current;
    if (socket && callState.callId) {
      socket.emit("groupcall:toggle-media", {
        callId: callState.callId,
        userId,
        mediaType: "video",
        enabled: newState,
      });
    }
  }, [
    callState.isVideoEnabled,
    callState.callId,
    userId,
    toggleMediaForAll,
    toggleLocalVideo,
  ]);

  // Toggle audio for specific participant
  const toggleAudioForParticipant = useCallback(
    (participantId: string, enabled: boolean) => {
      toggleAudioForPeer(participantId, enabled);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, isAudioEnabled: enabled } : p,
        ),
      }));
    },
    [toggleAudioForPeer],
  );

  // Toggle video for specific participant
  const toggleVideoForParticipant = useCallback(
    (participantId: string, enabled: boolean) => {
      toggleVideoForPeer(participantId, enabled);
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === participantId ? { ...p, isVideoEnabled: enabled } : p,
        ),
      }));
    },
    [toggleVideoForPeer],
  );

  // Set active participant for speaker view
  const setActiveParticipant = useCallback((userId: string) => {
    setCallState((prev) => ({
      ...prev,
      activeParticipantId: userId,
    }));
  }, []);

  const value: GroupCallContextValue = {
    ...callState,
    initiateGroupCall,
    joinGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    leaveGroupCall,
    toggleAudio,
    toggleVideo,
    toggleAudioForParticipant,
    toggleVideoForParticipant,
    setActiveParticipant,
    incomingCall,
  };

  return (
    <GroupCallContext.Provider value={value}>
      {children}
    </GroupCallContext.Provider>
  );
};
