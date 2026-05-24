import { useCallback, useRef, useEffect, useState } from "react";
import { GroupCallPeerManager } from "../services/groupCallPeerManager";
import { useWebRTC } from "./useWebRTC";
import type {
  GroupCallState,
  GroupCallParticipant,
  CallType,
} from "../types/call";

const getIceConfiguration = (): RTCConfiguration => {
  const turnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env
    .VITE_TURN_CREDENTIAL as string | undefined;
  const forceRelayEnv =
    (import.meta.env.VITE_FORCE_TURN_RELAY as string | undefined) === "true";
  const isLocalhost =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const forceRelay = forceRelayEnv && !isLocalhost;

  const iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  if (turnUrls && turnUsername && turnCredential) {
    const parsedTurnUrls = turnUrls
      .split(",")
      .map((url) => url.trim())
      .filter(
        (url) =>
          Boolean(url) && (url.startsWith("turn:") || url.startsWith("turns:")),
      );

    if (parsedTurnUrls.length > 0) {
      iceServers.push({
        urls: parsedTurnUrls,
        username: turnUsername,
        credential: turnCredential,
      });
    }
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: forceRelay ? "relay" : "all",
  };
};

interface UseGroupCallProps {
  onParticipantStream: (userId: string, stream: MediaStream) => void;
  onParticipantLeft: (userId: string) => void;
  onIceCandidate?: (userId: string, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (userId: string, state: RTCPeerConnectionState) => void;
}

export const useGroupCall = ({
  onParticipantStream,
  onParticipantLeft,
  onIceCandidate,
  onConnectionStateChange,
}: UseGroupCallProps) => {
  const peerManagerRef = useRef<GroupCallPeerManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<
    Map<string, RTCIceCandidateInit[]>
  >(new Map());

  const [groupCallState, setGroupCallState] = useState<Partial<GroupCallState>>({
    participants: [],
  });

  // Initialize peer manager on mount
  useEffect(() => {
    if (!peerManagerRef.current) {
      peerManagerRef.current = new GroupCallPeerManager(
        getIceConfiguration(),
      );
    }
  }, []);

  /**
   * Lấy local stream cho group call
   */
  const getLocalStream = useCallback(
    async (
      enableVideo: boolean = true,
      enableAudio: boolean = true,
    ): Promise<MediaStream> => {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: enableVideo
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : false,
          audio: enableAudio,
        });

        localStreamRef.current = stream;
        return stream;
      } catch (error) {
        console.error("[useGroupCall] Error getting local stream:", error);
        throw error;
      }
    },
    [],
  );

  /**
   * Khởi tạo peer connection cho một participant
   */
  const createPeerForParticipant = useCallback(
    async (
      userId: string,
      userName: string,
      isInitiator: boolean = false,
    ): Promise<RTCPeerConnection> => {
      const peerManager = peerManagerRef.current;
      if (!peerManager) {
        throw new Error("Peer manager not initialized");
      }

      const peerConnection = peerManager.createPeerConnection(
        userId,
        userName,
        isInitiator,
        (event: RTCTrackEvent) => {
          console.log(`[useGroupCall] Received track from ${userName}`);
          if (event.streams && event.streams[0]) {
            peerManager.setParticipantStream(userId, event.streams[0]);
            onParticipantStream(userId, event.streams[0]);
          }
        },
        (candidate: RTCIceCandidate) => {
          onIceCandidate?.(userId, candidate);
        },
        (state: RTCPeerConnectionState) => {
          console.log(
            `[useGroupCall] Connection state with ${userName}: ${state}`,
          );

          if (
            state === "disconnected" ||
            state === "failed" ||
            state === "closed"
          ) {
            console.log(`[useGroupCall] Participant ${userId} disconnected`);
            peerManager.closePeerConnection(userId);
            onParticipantLeft(userId);
          }

          onConnectionStateChange?.(userId, state);
        },
      );

      // Thêm local stream vào peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current!);
        });
      } else if (typeof peerConnection.addTransceiver === "function") {
        peerConnection.addTransceiver("audio", { direction: "recvonly" });
        peerConnection.addTransceiver("video", { direction: "recvonly" });
      }

      // Xử lý pending ICE candidates
      const pendingCandidates = pendingIceCandidatesRef.current.get(userId);
      if (pendingCandidates) {
        for (const candidate of pendingCandidates) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (error) {
            console.error("[useGroupCall] Error adding pending ICE candidate:", error);
          }
        }
        pendingIceCandidatesRef.current.delete(userId);
      }

      return peerConnection;
    },
    [onParticipantStream, onParticipantLeft, onIceCandidate, onConnectionStateChange],
  );

  /**
   * Tạo offer cho participant
   */
  const createOfferForParticipant = useCallback(
    async (userId: string): Promise<RTCSessionDescriptionInit | null> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        console.error(
          `[useGroupCall] No peer connection found for ${userId}`,
        );
        return null;
      }

      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.setLocalDescription(offer);
        return offer;
      } catch (error) {
        console.error("[useGroupCall] Error creating offer:", error);
        return null;
      }
    },
    [],
  );

  /**
   * Xử lý offer từ participant
   */
  const handleOfferFromParticipant = useCallback(
    async (
      userId: string,
      offer: RTCSessionDescriptionInit,
    ): Promise<RTCSessionDescriptionInit | null> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        console.error(
          `[useGroupCall] No peer connection found for ${userId}`,
        );
        return null;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        return answer;
      } catch (error) {
        console.error("[useGroupCall] Error handling offer:", error);
        return null;
      }
    },
    [],
  );

  /**
   * Xử lý answer từ participant
   */
  const handleAnswerFromParticipant = useCallback(
    async (userId: string, answer: RTCSessionDescriptionInit): Promise<void> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);
      if (!peerConnection) {
        console.error(
          `[useGroupCall] No peer connection found for ${userId}`,
        );
        return;
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      } catch (error) {
        console.error("[useGroupCall] Error handling answer:", error);
      }
    },
    [],
  );

  /**
   * Thêm ICE candidate
   */
  const addIceCandidateForParticipant = useCallback(
    async (
      userId: string,
      candidate: RTCIceCandidateInit,
    ): Promise<void> => {
      const peerConnection = peerManagerRef.current?.getPeerConnection(userId);

      if (!peerConnection) {
        // Lưu candidate lại nếu peer connection chưa được tạo
        if (!pendingIceCandidatesRef.current.has(userId)) {
          pendingIceCandidatesRef.current.set(userId, []);
        }
        pendingIceCandidatesRef.current.get(userId)?.push(candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("[useGroupCall] Error adding ICE candidate:", error);
      }
    },
    [],
  );

  /**
   * Toggle audio cho một participant
   */
  const toggleAudioForParticipant = useCallback((userId: string, enabled: boolean): boolean => {
    return peerManagerRef.current?.toggleAudio(userId, enabled) ?? false;
  }, []);

  /**
   * Toggle video cho một participant
   */
  const toggleVideoForParticipant = useCallback((userId: string, enabled: boolean): boolean => {
    return peerManagerRef.current?.toggleVideo(userId, enabled) ?? false;
  }, []);

  /**
   * Toggle media cho tất cả
   */
  const toggleMediaForAll = useCallback(
    (mediaType: "audio" | "video", enabled: boolean): void => {
      peerManagerRef.current?.toggleMediaForAll(mediaType, enabled);
    },
    [],
  );

  /**
   * Xóa participant khỏi call
   */
  const removeParticipant = useCallback((userId: string): void => {
    peerManagerRef.current?.closePeerConnection(userId);
    pendingIceCandidatesRef.current.delete(userId);
  }, []);

  /**
   * Bật/tắt camera local cho group call (có thay track nếu track cũ đã kết thúc)
   */
  const toggleLocalVideo = useCallback(
    async (enabled: boolean): Promise<MediaStream | null> => {
      const stream = localStreamRef.current;
      if (!stream) {
        return null;
      }

      if (!enabled) {
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
        return stream;
      }

      const videoTracks = stream.getVideoTracks();
      const shouldRecreate =
        videoTracks.length === 0 || videoTracks[0].readyState === "ended";

      if (!shouldRecreate) {
        videoTracks.forEach((track) => {
          track.enabled = true;
        });
        return stream;
      }

      try {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        const newVideoTrack = newVideoStream.getVideoTracks()[0];
        const audioTracks = stream.getAudioTracks();
        const rebuiltStream = new MediaStream([
          ...audioTracks,
          newVideoTrack,
        ]);
        if (!newVideoTrack) {
          return stream;
        }

        await peerManagerRef.current?.replaceVideoTrackForAll(
          newVideoTrack,
          rebuiltStream,
        );

        // thay track trong local stream để preview đồng bộ
        videoTracks.forEach((track) => {
          stream.removeTrack(track);
          track.stop();
        });
        stream.addTrack(newVideoTrack);
        localStreamRef.current = rebuiltStream;
        return rebuiltStream;
      } catch (error) {
        console.error("[useGroupCall] Error re-enabling video:", error);
      }
      return stream;
    },
    [],
  );

  /**
   * Bật/tắt micro local, có thay track khi track cũ đã kết thúc
   */
  const toggleLocalAudio = useCallback(
    async (enabled: boolean): Promise<void> => {
      const stream = localStreamRef.current;
      if (!stream) {
        return;
      }

      if (!enabled) {
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        toggleMediaForAll("audio", false);
        return;
      }

      const audioTracks = stream.getAudioTracks();
      const shouldRecreate =
        audioTracks.length === 0 || audioTracks[0].readyState === "ended";

      if (!shouldRecreate) {
        audioTracks.forEach((track) => {
          track.enabled = true;
        });
        toggleMediaForAll("audio", true);
        return;
      }

      try {
        const newAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });

        const newAudioTrack = newAudioStream.getAudioTracks()[0];
        if (!newAudioTrack) {
          return;
        }

        await peerManagerRef.current?.replaceAudioTrackForAll(
          newAudioTrack,
          stream,
        );

        audioTracks.forEach((track) => {
          stream.removeTrack(track);
          track.stop();
        });
        stream.addTrack(newAudioTrack);
      } catch (error) {
        console.error("[useGroupCall] Error re-enabling audio:", error);
      }
    },
    [],
  );

  /**
   * Cleanup all peer connections
   */
  const cleanup = useCallback((): void => {
    peerManagerRef.current?.closeAllPeerConnections();
    pendingIceCandidatesRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    console.log("[useGroupCall] Cleaned up all peer connections and streams");
  }, []);

  /**
   * Lấy danh sách tất cả participant IDs
   */
  const getAllParticipantIds = useCallback((): string[] => {
    return peerManagerRef.current?.getAllParticipantIds() ?? [];
  }, []);

  /**
   * Lấy stream của participant
   */
  const getParticipantStream = useCallback(
    (userId: string): MediaStream | undefined => {
      return peerManagerRef.current?.getParticipantStream(userId);
    },
    [],
  );

  return {
    getLocalStream,
    createPeerForParticipant,
    createOfferForParticipant,
    handleOfferFromParticipant,
    handleAnswerFromParticipant,
    addIceCandidateForParticipant,
    toggleAudioForParticipant,
    toggleVideoForParticipant,
    toggleMediaForAll,
    toggleLocalVideo,
    toggleLocalAudio,
    removeParticipant,
    cleanup,
    getAllParticipantIds,
    getParticipantStream,
    localStream: localStreamRef.current,
    peerManager: peerManagerRef.current,
  };
};
