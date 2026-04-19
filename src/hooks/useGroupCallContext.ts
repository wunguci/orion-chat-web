import { useContext } from "react";
import { GroupCallContext } from "../contexts/GroupCallContext";
import type { GroupCallContextValue } from "../contexts/GroupCallContext";

const FALLBACK_GROUP_CALL_CONTEXT: GroupCallContextValue = {
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
  incomingCall: null,
  activeParticipantId: undefined,
  initiateGroupCall: async () => undefined,
  joinGroupCall: async () => undefined,
  acceptGroupCall: async () => undefined,
  rejectGroupCall: () => undefined,
  leaveGroupCall: () => undefined,
  toggleAudio: () => undefined,
  toggleVideo: () => undefined,
  toggleAudioForParticipant: () => undefined,
  toggleVideoForParticipant: () => undefined,
  setActiveParticipant: () => undefined,
};

/**
 * useGroupCall Hook
 * Cung cấp quyền truy cập vào GroupCallContext
 */
export const useGroupCallContext = () => {
  const context = useContext(GroupCallContext);
  if (!context) {
    console.warn("[useGroupCallContext] GroupCallContext is unavailable. Returning no-op fallback.");
    return FALLBACK_GROUP_CALL_CONTEXT;
  }
  return context;
};
