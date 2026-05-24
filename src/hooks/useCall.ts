import { useContext } from "react";
import { CallContext } from "../contexts/CallContext";
import type { CallContextValue } from "../contexts/CallContext";

const FALLBACK_CALL_CONTEXT: CallContextValue = {
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
  isRemoteVideoEnabled: true,
  isRemoteAudioEnabled: true,
  otherUser: null,
  error: null,
  startTime: null,
  incomingCall: null,
  initiateCall: async () => undefined,
  acceptCall: async () => undefined,
  rejectCall: () => undefined,
  endCall: () => undefined,
  toggleAudio: () => undefined,
  toggleVideo: () => undefined,
  incomingVideoUpgradeRequest: false,
  isRequestingVideoUpgrade: false,
  requestVideoUpgrade: () => undefined,
  respondVideoUpgradeRequest: () => undefined,
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    console.warn("[useCall] CallContext is unavailable. Returning no-op fallback.");
    return FALLBACK_CALL_CONTEXT;
  }
  return context;
};
