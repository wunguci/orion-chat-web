import { io, Socket } from "socket.io-client";

const RAW_SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

const normalizeSocketBaseUrl = (url: string) =>
  url.replace(/\/$/, "").replace(/\/call$/, "");

const SOCKET_BASE_URL = normalizeSocketBaseUrl(RAW_SOCKET_URL);
const CALL_NAMESPACE_URL = `${SOCKET_BASE_URL}/call`;

class SocketService {
  private socket: Socket | null = null;
  private callSocket: Socket | null = null;
  private currentUserId: string | null = null; // Track userId hiện tại

  // connect main socket
  connect(userId: string, token?: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_BASE_URL, {
      query: { userId },
      auth: { token }, // nếu có authentication
      transports: ["websocket"],
    });

    this.socket.on("connect", () => {
      console.log("Main socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Main socket disconnected");
    });

    return this.socket;
  }

  // kết nối call socket (namespace /call)
  connectCall(userId: string, token?: string) {
    // nếu userId thay đổi, ngắt kết nối socket cũ.
    if (this.currentUserId && this.currentUserId !== userId) {
      console.log(`[SocketService] UserId changed from ${this.currentUserId} to ${userId}, reconnecting...`);
      this.disconnectCall();
    }

    // nếu đã kết nối với cùng userId, trả về socket hiện có.
    if (this.callSocket?.connected && this.currentUserId === userId) {
      console.log(`[SocketService] Already connected as ${userId}`);
      return this.callSocket;
    }

    // ngắt kết nối nếu tồn tại nhưng chưa được kết nối.
    if (this.callSocket && !this.callSocket.connected) {
      this.callSocket.disconnect();
      this.callSocket = null;
    }

    console.log(
      `[SocketService] Connecting call socket for userId: ${userId} via ${CALL_NAMESPACE_URL}`,
    );
    this.currentUserId = userId;

    this.callSocket = io(CALL_NAMESPACE_URL, {
      query: { userId },
      auth: { token },
      forceNew: true, // buộc kết nối mới
      transports: ["websocket"],
    });

    this.callSocket.on("connect", () => {
      console.log(`[SocketService] Call socket connected: ${this.callSocket?.id} (userId: ${userId})`);
    });

    this.callSocket.on("disconnect", (reason) => {
      console.log(`[SocketService] Call socket disconnected. Reason: ${reason}`);
    });

    this.callSocket.on("connect_error", (error) => {
      console.error("[SocketService] Call socket connection error:", error);
    });

    return this.callSocket;
  }

  // get main socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // get call socket instance
  getCallSocket(): Socket | null {
    return this.callSocket;
  }

  // disconnect all sockets
  disconnect() {
    console.log('[SocketService] Disconnecting all sockets');
    this.socket?.disconnect();
    this.callSocket?.disconnect();
    this.socket = null;
    this.callSocket = null;
    this.currentUserId = null;
  }

  // disconnect only call socket
  disconnectCall() {
    console.log('[SocketService] Disconnecting call socket');
    this.callSocket?.disconnect();
    this.callSocket = null;
    this.currentUserId = null;
  }
}

export const socketService = new SocketService();
export default socketService;
