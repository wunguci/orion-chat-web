export interface CallUser {
    id: string;
    name: string;
    avatar?: string;
}

export type CallType = 'video' | 'audio';

export type CallStatus = 
    | 'idle'
    | 'calling'
    | 'ringing'
    | 'connected'
    | 'ended'
    | 'rejected'
    | 'failed';

export interface CallState {
  callId: string | null;
  conversationId: string | null;
  callType: CallType;
  status: CallStatus;
  isInitiator: boolean;
  isCaller: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  otherUser: CallUser | null;
  error: string | null;
  startTime: number | null;
  wasAnswered?: boolean; // Theo dõi xem cuộc gọi đã được trả lời/chấp nhận hay chưa.
  wasRejected?: boolean; // Theo dõi xem cuộc gọi đã được từ chối hay chưa.
}

export interface IncomingCallData {
    callId: string;
    callerId: string;
    conversationId: string;
    callType: CallType;
    callerName?: string;
    callerAvatar?: string;
}

export interface CallOfferData {
    callId: string;
    offer: RTCSessionDescriptionInit;
    callerId: string;
}

export interface CallAnswerData {
    callId: string;
    answer: RTCSessionDescriptionInit;
    receiverId: string;
}

export interface IceCandidateData {
    callId: string;
    candidate: RTCIceCandidateInit;
    fromUserId: string;
}