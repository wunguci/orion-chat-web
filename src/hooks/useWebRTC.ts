import { useRef, useCallback, useEffect } from "react";

const getIceConfiguration = (): RTCConfiguration => {
  const turnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as
    | string
    | undefined;
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
      console.log("[WebRTC] TURN server enabled", {
        forceRelay,
        turnUrlCount: parsedTurnUrls.length,
      });
    }
  } else {
    console.warn(
      "[WebRTC] TURN server is not configured. Cross-network calls may fail on strict NAT/firewall.",
    );
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: forceRelay ? "relay" : "all",
  };
};

interface UseWebRTCProps {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceRestart?: (offer: RTCSessionDescriptionInit) => Promise<void>;
}

export const useWebRTC = ({
  onRemoteStream,
  onIceCandidate,
  onConnectionStateChange,
  onIceRestart,
}: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const iceRestartCountRef = useRef(0);

  // Dùng refs cho callbacks để tránh recreate PeerConnection khi callbacks thay đổi
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onIceCandidateRef = useRef(onIceCandidate);
  const onConnectionStateChangeRef = useRef(onConnectionStateChange);
  const onIceRestartRef = useRef(onIceRestart);

  useEffect(() => {
    onRemoteStreamRef.current = onRemoteStream;
  }, [onRemoteStream]);

  useEffect(() => {
    onIceCandidateRef.current = onIceCandidate;
  }, [onIceCandidate]);

  useEffect(() => {
    onConnectionStateChangeRef.current = onConnectionStateChange;
  }, [onConnectionStateChange]);

  useEffect(() => {
    onIceRestartRef.current = onIceRestart;
  }, [onIceRestart]);

  // ICE restart - tạo lại offer với iceRestart flag
  const restartIce = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection) return;

    if (!onIceRestartRef.current) {
      console.warn("[WebRTC] Skip ICE restart: signaling callback is missing");
      return;
    }

    try {
      const offer = await peerConnection.createOffer({ iceRestart: true });
      await peerConnection.setLocalDescription(offer);

      // Gửi offer ICE restart qua signaling để phía remote setRemoteDescription
      await onIceRestartRef.current(offer);
      console.log("[WebRTC] ICE restart offer created");
    } catch (error) {
      console.error("[WebRTC] ICE restart failed:", error);
    }
  }, []);

  const flushPendingIceCandidates = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;
    if (!peerConnection || !peerConnection.remoteDescription) {
      return;
    }

    if (pendingIceCandidatesRef.current.length === 0) {
      return;
    }

    const pending = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of pending) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error flushing queued ICE candidate:", error);
      }
    }
  }, []);

  // khởi tạo peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(getIceConfiguration());

    // xử lý ICE candidates - dùng ref để luôn dùng callback mới nhất
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`New ICE candidate:`, event.candidate);
        onIceCandidateRef.current(event.candidate);
      }
    };

    // xử lý luồng từ xa
    peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        onRemoteStreamRef.current(event.streams[0]);
      } else {
        const fallbackRemoteStream = new MediaStream([event.track]);
        onRemoteStreamRef.current(fallbackRemoteStream);
      }
    };

    // xử lý thay đổi trạng thái kết nối + ICE restart tự động
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      console.log("Connection state:", state);
      onConnectionStateChangeRef.current(state);

      // ICE restart khi bị "failed" (tối đa 3 lần)
      if (state === "failed" && iceRestartCountRef.current < 3) {
        iceRestartCountRef.current += 1;
        console.log(
          `[WebRTC] Connection failed, attempting ICE restart (${iceRestartCountRef.current}/3)`,
        );
        restartIce();
      }
    };

    // xử lý trạng thái kết nối ICE
    peerConnection.oniceconnectionstatechange = () => {
      const iceState = peerConnection.iceConnectionState;
      console.log(`ICE connection state:`, iceState);

      // ICE restart khi disconnected quá lâu
      if (iceState === "disconnected") {
        console.log("[WebRTC] ICE disconnected, waiting 3s before restart...");
        setTimeout(() => {
          if (
            peerConnectionRef.current &&
            peerConnectionRef.current.iceConnectionState === "disconnected"
          ) {
            console.log("[WebRTC] Still disconnected, restarting ICE...");
            restartIce();
          }
        }, 3000);
      }
    };

    peerConnection.onicecandidateerror = (event) => {
      const details = {
        url: event.url,
        errorCode: event.errorCode,
        errorText: event.errorText,
      };

      // 701 thường là lỗi DNS/STUN lookup tạm thời trên một ICE server,
      // không đồng nghĩa cuộc gọi thất bại nếu còn server ICE khác hoạt động.
      if (event.errorCode === 701) {
        console.warn("ICE candidate warning (non-fatal):", details);
        return;
      }

      console.error("ICE candidate error:", details);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [restartIce]); // Không phụ thuộc callbacks vì dùng refs

  // nhận luồng local media
  const getLocalStream = useCallback(
    async (videoEnabled: boolean = true, audioEnabled: boolean = true) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
          audio: audioEnabled
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            : false,
        });

        localStreamRef.current = stream;

        // add tracks to peer connection if peer connection exists
        const peerConnection = peerConnectionRef.current;
        if (peerConnection) {
          stream.getTracks().forEach((track) => {
            console.log(`Adding ${track.kind} track to peer connection`);
            peerConnection.addTrack(track, stream);
          });
        } else {
          console.warn(
            "Peer connection not initialized yet when adding tracks",
          );
        }

        return stream;
      } catch (error) {
        console.log("Error getting local stream: ", error);
        throw error;
      }
    },
    [],
  );

  // tạo  WebRTC offer
  const createOffer = useCallback(async () => {
    const peerConnection = initializePeerConnection();

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.log("Error creating offer:", error);
      throw error;
    }
  }, [initializePeerConnection]);

  // xử lý đề nghị nhận và tạo câu trả lời
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      const peerConnection = initializePeerConnection();

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        await flushPendingIceCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        return answer;
      } catch (error) {
        console.log("Error handling offer:", error);
        throw error;
      }
    },
    [flushPendingIceCandidates, initializePeerConnection],
  );

  // xử lý câu trả lời đã nhận
  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        throw new Error("Peer connection not initialized");
      }

      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        await flushPendingIceCandidates();
      } catch (error) {
        console.log("Error handling answer:", error);
        throw error;
      }
    },
    [flushPendingIceCandidates],
  );

  // thêm trạng thái ICE - queue nếu PC chưa sẵn sàng
  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const peerConnection = peerConnectionRef.current;

      // Nếu PC chưa tồn tại HOẶC chưa có remote description → queue lại
      if (!peerConnection || !peerConnection.remoteDescription) {
        console.log("[WebRTC] Queuing ICE candidate (PC not ready)");
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    },
    [],
  );

  // toggle video track
  const toggleVideo = useCallback(async (enabled: boolean) => {
    const stream = localStreamRef.current;
    const peerConnection = peerConnectionRef.current;

    if (!stream) {
      console.warn("No local stream to toggle video");
      return;
    }

    if (enabled) {
      // Check if video tracks exist and are stopped
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0 || videoTracks[0].readyState === "ended") {
        try {
          // Get new video stream
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          });

          const newVideoTrack = newStream.getVideoTracks()[0];

          // Replace track in peer connection
          if (peerConnection) {
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(
              (s) =>
                s.track?.kind === "video" ||
                (!s.track &&
                  s !== senders.find((ss) => ss.track?.kind === "audio")),
            );
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack);
            } else {
              peerConnection.addTrack(newVideoTrack, stream);
            }
          }

          // Replace track in local stream
          videoTracks.forEach((track) => {
            stream.removeTrack(track);
            track.stop();
          });
          stream.addTrack(newVideoTrack);

          console.log("Video track re-enabled with new stream");
        } catch (error) {
          console.error("Error re-enabling video:", error);
        }
      } else {
        // Just enable existing track
        videoTracks.forEach((track) => {
          track.enabled = true;
        });
      }
    } else {
      // Disable video track
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
    }
  }, []);

  // toggle audio track
  const toggleAudio = useCallback((enabled: boolean) => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }, []);

  // cleanup function
  const cleanup = useCallback(() => {
    // stop all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
  }, []);

  // cleanup o unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initializePeerConnection,
    getLocalStream,
    createOffer,
    handleOffer,
    handleAnswer,
    addIceCandidate,
    toggleVideo,
    toggleAudio,
    cleanup,
    restartIce,
  };
};
