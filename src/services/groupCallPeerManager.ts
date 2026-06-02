/**
 * GroupCallPeerManager
 * Quản lý multiple RTCPeerConnection cho group call
 * Mỗi participant trong group call có một peer connection riêng
 */

interface PeerConnectionContext {
  peerConnection: RTCPeerConnection;
  userId: string;
  userName: string;
  stream?: MediaStream;
  isInitiator: boolean;
  isAnswerer: boolean;
}

export class GroupCallPeerManager {
  private peerConnections: Map<string, PeerConnectionContext> = new Map();
  private iceConfiguration: RTCConfiguration;

  constructor(iceConfiguration: RTCConfiguration) {
    this.iceConfiguration = iceConfiguration;
  }

  /**
   * Tạo peer connection mới cho participant
   */
  createPeerConnection(
    userId: string,
    userName: string,
    isInitiator: boolean = false,
    onTrack?: (event: RTCTrackEvent) => void,
    onIceCandidate?: (candidate: RTCIceCandidate) => void,
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void,
  ): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.iceConfiguration);

    // Handle incoming tracks
    if (onTrack) {
      peerConnection.ontrack = onTrack;
    }

    // Handle ICE candidates
    if (onIceCandidate) {
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate(event.candidate);
        }
      };
    }

    // Handle connection state changes
    if (onConnectionStateChange) {
      peerConnection.onconnectionstatechange = () => {
        onConnectionStateChange(peerConnection.connectionState);
      };
    }

    const context: PeerConnectionContext = {
      peerConnection,
      userId,
      userName,
      isInitiator,
      isAnswerer: false,
    };

    this.peerConnections.set(userId, context);
    console.log(
      `[GroupCallPeerManager] Created peer connection for ${userName} (${userId})`,
    );

    return peerConnection;
  }

  /**
   * Thêm local stream đến tất cả peer connections
   */
  addLocalStreamToAll(localStream: MediaStream): void {
    this.peerConnections.forEach((context) => {
      localStream.getTracks().forEach((track) => {
        context.peerConnection.addTrack(track, localStream);
      });
      console.log(
        `[GroupCallPeerManager] Added local stream to ${context.userName}`,
      );
    });
  }

  /**
   * Lấy peer connection của participant
   */
  getPeerConnection(userId: string): RTCPeerConnection | undefined {
    return this.peerConnections.get(userId)?.peerConnection;
  }

  /**
   * Lấy stream của participant
   */
  getParticipantStream(userId: string): MediaStream | undefined {
    return this.peerConnections.get(userId)?.stream;
  }

  /**
   * Cập nhật stream của participant
   */
  setParticipantStream(userId: string, stream: MediaStream): void {
    const context = this.peerConnections.get(userId);
    if (context) {
      context.stream = stream;
    }
  }

  /**
   * Đóng peer connection với participant
   */
  closePeerConnection(userId: string): void {
    const context = this.peerConnections.get(userId);
    if (context) {
      context.peerConnection.close();
      this.peerConnections.delete(userId);
      console.log(
        `[GroupCallPeerManager] Closed peer connection with ${context.userName}`,
      );
    }
  }

  /**
   * Đóng tất cả peer connections
   */
  closeAllPeerConnections(): void {
    this.peerConnections.forEach((context) => {
      context.peerConnection.close();
    });
    this.peerConnections.clear();
    console.log(
      `[GroupCallPeerManager] Closed all peer connections`,
    );
  }

  /**
   * Lấy danh sách tất cả participant IDs
   */
  getAllParticipantIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  /**
   * Lấy số lượng peer connections hiện tại
   */
  getPeerConnectionCount(): number {
    return this.peerConnections.size;
  }

  /**
   * Toggle audio track cho một participant
   */
  toggleAudio(userId: string, enabled: boolean): boolean {
    const peerConnection = this.getPeerConnection(userId);
    if (!peerConnection) return false;

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track?.kind === "audio") {
        sender.track.enabled = enabled;
      }
    });
    return true;
  }

  /**
   * Toggle video track cho một participant
   */
  toggleVideo(userId: string, enabled: boolean): boolean {
    const peerConnection = this.getPeerConnection(userId);
    if (!peerConnection) return false;

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track?.kind === "video") {
        sender.track.enabled = enabled;
      }
    });
    return true;
  }

  /**
   * Toggle audio/video cho tất cả peer connections
   */
  toggleMediaForAll(mediaType: "audio" | "video", enabled: boolean): void {
    this.peerConnections.forEach((context, userId) => {
      if (mediaType === "audio") {
        this.toggleAudio(userId, enabled);
      } else {
        this.toggleVideo(userId, enabled);
      }
    });
  }

  /**
   * Lấy thông tin peer connection
   */
  getPeerConnectionStats(userId: string): PeerConnectionContext | undefined {
    return this.peerConnections.get(userId);
  }

  /**
   * Lấy tất cả peer connections (for debugging)
   */
  getAllPeerConnections(): Map<string, PeerConnectionContext> {
    return new Map(this.peerConnections);
  }
}
