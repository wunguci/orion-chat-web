import type {
    SendOtpResponse,
    VerifyOtpResponse,
    RegisterResponse,
    LoginResponse,
    ErrorResponse,
} from '../types/auth.types';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// send OTP to phone number

export async function sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'web',
        },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Gửi OTP thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Step 2: Verify OTP
export async function verifyOtp(
    phoneNumber: string,
    otp: string,
): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'web',
        },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber, otp }),
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Xác minh OTP thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Step 3: Complete Registration

export async function completeRegister(formData: {
    phoneNumber: string;
    password: string;
    fullName: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
}): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/complete-register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'web',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Đăng ký thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// login

export async function login(
    phoneNumber: string,
    password: string,
): Promise<LoginResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'web',
            },
            credentials: 'include',
            body: JSON.stringify({ phoneNumber, password, platform: 'web' }),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData: ErrorResponse = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch {
                // Nếu không parse được JSON, sử dụng statusText
                errorMessage = response.statusText || 'Đăng nhập thất bại';
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        if (
            error instanceof TypeError &&
            error.message.includes('Failed to fetch')
        ) {
            throw new Error(
                `Không thể kết nối tới server. Vui lòng kiểm tra backend đang chạy trên http://localhost:3000`,
            );
        }
        throw error;
    }
}

// Logout user
export async function logout(token: string): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'web',
                Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ platform: 'web' }),
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData: ErrorResponse = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch {
                errorMessage = response.statusText || 'Đăng xuất thất bại';
            }
            throw new Error(errorMessage);
        }

        return response.json();
    } catch (error) {
        console.error('[authService] Logout error:', error);
        throw error;
    }
}

export function validatePhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length >= 10;
}

export function validatePassword(password: string): boolean {
    return password.length >= 8;
}

export function validateOtp(otp: string): boolean {
    return /^\d{6}$/.test(otp);
}

export function validateDateFormat(date: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function validateRegistrationForm(formData: {
    phoneNumber: string;
    password: string;
    fullName: string;
    birthDate: string;
    gender: string;
}): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!validatePhoneNumber(formData.phoneNumber)) {
        errors.push('Số điện thoại phải có ít nhất 10 ký tự');
    }

    if (!validatePassword(formData.password)) {
        errors.push('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!formData.fullName.trim()) {
        errors.push('Họ và tên không được để trống');
    }

    if (!validateDateFormat(formData.birthDate)) {
        errors.push('Ngày sinh phải có định dạng YYYY-MM-DD');
    }

    if (!['male', 'female', 'other'].includes(formData.gender)) {
        errors.push('Giới tính phải là male, female hoặc other');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
// quên mật khẩu

// Step 1: gửi OTP
export async function sendOtpForgetPassword(
    phoneNumber: string,
): Promise<SendOtpResponse> {
    const response = await fetch(
        `${API_BASE_URL}/auth/send-otp-forget-password`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'web',
            },
            credentials: 'include',
            body: JSON.stringify({ phoneNumber }),
        },
    );

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Gửi OTP thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Step 2: xác minh OTP
export async function verifyOtpForgetPassword(
    phoneNumber: string,
    otp: string,
): Promise<VerifyOtpResponse> {
    const response = await fetch(
        `${API_BASE_URL}/auth/verify-otp-forget-password`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Platform': 'web',
            },
            credentials: 'include',
            body: JSON.stringify({ phoneNumber, otp }),
        },
    );

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Xác minh OTP thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

// Step 3: Đặt lại mật khẩu
export async function resetPassword(formData: {
    phoneNumber: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Platform': 'web',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
    });

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorData: ErrorResponse = await response.json();
            if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = response.statusText || 'Đặt lại mật khẩu thất bại';
        }
        throw new Error(errorMessage);
    }

    return response.json();
}
