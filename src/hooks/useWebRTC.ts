import { useRef, useCallback, useEffect } from "react";

// STUN servers config
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    // Thêm TURN server nếu cần (khoảng 10-15% users cần TURN)
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password',
    // },
  ],
};

interface UseWebRTCProps {
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export const useWebRTC = ({
  onRemoteStream,
  onIceCandidate,
  onConnectionStateChange,
}: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // khởi tạo peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // xử lý ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`New ICE candidate:`, event.candidate);
        onIceCandidate(event.candidate);
      }
    };

    // xử lý luồng từ xa
    peerConnection.ontrack = (event) => {
      console.log("Received remote track:", event.track.kind);
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    // xử lý thay đổi trạng thái kết nối
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
      onConnectionStateChange(peerConnection.connectionState);
    };

    // xử lý trạng thái kết nối ICE
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state:`, peerConnection.iceConnectionState);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [onRemoteStream, onIceCandidate, onConnectionStateChange]);

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
          console.warn('Peer connection not initialized yet when adding tracks');
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

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        return answer;
      } catch (error) {
        console.log("Error handling offer:", error);
        throw error;
      }
    },
    [initializePeerConnection],
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
      } catch (error) {
        console.log("Error handling answer:", error);
        throw error;
      }
    },
    [],
  );

  // thêm trạng thái ICE
  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        console.warn("Peer connection not ready for ICE candidate");
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
      console.warn('No local stream to toggle video');
      return;
    }

    if (enabled) {
      // Check if video tracks exist and are stopped
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
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
            const videoSender = senders.find(s => s.track?.kind === 'video');
            if (videoSender) {
              await videoSender.replaceTrack(newVideoTrack);
            } else {
              peerConnection.addTrack(newVideoTrack, stream);
            }
          }
          
          // Replace track in local stream
          videoTracks.forEach(track => {
            stream.removeTrack(track);
            track.stop();
          });
          stream.addTrack(newVideoTrack);
          
          console.log('Video track re-enabled with new stream');
        } catch (error) {
          console.error('Error re-enabling video:', error);
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
  };
};
