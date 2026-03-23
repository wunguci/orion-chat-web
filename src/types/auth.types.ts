export interface SendOtpResponse {
    success: boolean;
    message: string;
    data: {
        phoneNumber: string;
        otpId: number;
        expiresIn: number;
    };
    timestamp: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    message: string;
    data: {
        phoneNumber: string;
        verified: boolean;
    };
    timestamp: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
        phoneNumber: string;
        fullName: string;
        birthDate: string;
        gender: 'male' | 'female' | 'other';
    };
    timestamp: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        phoneNumber: string;
        fullName: string;
        birthDate: string;
        gender: 'male' | 'female' | 'other';
        loginTime: string;
        userId?: string;
        email?: string;
        avatarUrl?: string;
        coverImage?: string;
        isOnline?: boolean;
        showOnlineStatus?: boolean;
        isActive?: boolean;
        isDeleted?: boolean;
        createdAt?: string;
        lastLoginAt?: string;
    };
    timestamp: string;
}

export interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
}

export interface SendOtpRequest {
    phoneNumber: string;
}

export interface VerifyOtpRequest {
    phoneNumber: string;
    otp: string;
}

export interface CompleteRegisterRequest {
    phoneNumber: string;
    password: string;
    fullName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
}

export interface LoginRequest {
    phoneNumber: string;
    password: string;
}

export interface RegistrationFormData {
    phoneNumber: string;
    otp: string;
    password: string;
    fullName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface User {
    id?: string;
    phoneNumber: string;
    fullName: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other';
    createdAt?: string;
    userId?: string;
    email?: string;
    avatarUrl?: string;
    coverImage?: string;
    isOnline?: boolean;
    showOnlineStatus?: boolean;
    isActive?: boolean;
    isDeleted?: boolean;
    loginTime?: string;
}

export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
}

export interface RegistrationState {
    step: 1 | 2 | 3;
    phoneNumber: string;
    otpVerified: boolean;
    loading: boolean;
    error: string | null;
    message: string | null;
}
