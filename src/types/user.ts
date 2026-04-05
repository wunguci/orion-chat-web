export interface User {
  email: string;
  userId: string; // uuid
  phoneNumber?: string;

  passwordHash: string;
  fullName: string;

  birthDate?: string; // ISO string (timestamp)
  gender?: string;

  avatarUrl?: string;
  coverImage?: string;

  isOnline: boolean;
  showOnlineStatus: boolean;
  isActive: boolean;

  currentSessionToken?: string;

  lastLoginAt?: string; // timestamp
  lastActivityAt?: number; // bigint (epoch ms hoặc seconds tùy backend)

  createdAt: string; // timestamp

  fileUserFileId?: string; // uuid
}
