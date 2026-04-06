import type {
  SendOtpResponse,
  VerifyOtpResponse,
  RegisterResponse,
  LoginResponse,
  ErrorResponse,
} from "../types/auth.types";

const API_BASE_URL = "http://localhost:3000";

type NavigatorUADataLike = {
  brands?: Array<{ brand: string; version: string }>;
};

const getUaBrands = (): string[] => {
  if (typeof navigator === "undefined") return [];
  const nav = navigator as Navigator & { userAgentData?: NavigatorUADataLike };
  const brands = nav.userAgentData?.brands || [];
  return brands.map((item) => item.brand.toLowerCase());
};

function detectBrowserName(userAgent: string): string {
  const brands = getUaBrands();
  if (brands.some((brand) => /(coc coc|coccoc|coc_coc)/i.test(brand))) {
    return "Coc Coc";
  }

  if (/coc\s*coc/i.test(navigator.vendor || "")) {
    return "Coc Coc";
  }

  if (/(coc_coc_browser|coccoc|cocbrowser)/i.test(userAgent)) {
    return "Coc Coc";
  }
  if (/edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    return "Google Chrome";
  }
  if (/firefox\//i.test(userAgent)) return "Mozilla Firefox";
  if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    return "Safari";
  }
  return "Web Browser";
}

function detectOsName(userAgent: string): string {
  if (/windows nt/i.test(userAgent)) return "Windows";
  if (/mac os x/i.test(userAgent)) return "macOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/(iphone|ipad|ipod)/i.test(userAgent)) return "iOS";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown OS";
}

function detectOsVersion(userAgent: string): string {
  const windows = /windows nt\s*([\d.]+)/i.exec(userAgent);
  if (windows?.[1]) return windows[1];

  const mac = /mac os x\s*([\d_]+)/i.exec(userAgent);
  if (mac?.[1]) return mac[1].replace(/_/g, ".");

  const android = /android\s*([\d.]+)/i.exec(userAgent);
  if (android?.[1]) return android[1];

  const ios = /(?:iphone os|cpu (?:iphone )?os)\s*([\d_]+)/i.exec(userAgent);
  if (ios?.[1]) return ios[1].replace(/_/g, ".");

  return "unknown";
}

function buildDeviceMetadata() {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = detectBrowserName(userAgent);
  const os = detectOsName(userAgent);
  const osVersion = detectOsVersion(userAgent);

  return {
    deviceName: `${browser} on ${os}`,
    deviceType: "web",
    deviceModel: browser,
    osType: os,
    osVersion,
    appVersion: "web",
  };
}

// send OTP to phone number

export async function sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ phoneNumber }),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(
      errorData.message || `Failed to send OTP: ${response.statusText}`,
    );
  }

  return response.json();
}

// Step 2: Verify OTP
export async function verifyOtp(
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ phoneNumber, otp }),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(
      errorData.message || `Failed to verify OTP: ${response.statusText}`,
    );
  }

  return response.json();
}

// Step 3: Complete Registration

export async function completeRegister(formData: {
  phoneNumber: string;
  password: string;
  fullName: string;
  birthDate: string;
  gender: "male" | "female" | "other";
}): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/complete-register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(
      errorData.message || `Failed to register: ${response.statusText}`,
    );
  }

  return response.json();
}

// login

export async function login(
  phoneNumber: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const deviceMetadata = buildDeviceMetadata();
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ phoneNumber, password, ...deviceMetadata }),
    });

    if (!response.ok) {
      try {
        const errorData: ErrorResponse = await response.json();
        throw new Error(
          errorData.message || `Failed to login: ${response.statusText}`,
        );
      } catch {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    return response.json();
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
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
                Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
        });

        if (!response.ok) {
            try {
                const errorData: ErrorResponse = await response.json();
                throw new Error(
                    errorData.message ||
                        `Failed to logout: ${response.statusText}`,
                );
            } catch {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }
        }

        return response.json();
    } catch (error) {
        console.error('[authService] Logout error:', error);
        throw error;
    }
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleanPhone = phoneNumber.replace(/\D/g, "");
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
    errors.push("Số điện thoại phải có ít nhất 10 ký tự");
  }

  if (!validatePassword(formData.password)) {
    errors.push("Mật khẩu phải có ít nhất 8 ký tự");
  }

  if (!formData.fullName.trim()) {
    errors.push("Họ và tên không được để trống");
  }

  if (!validateDateFormat(formData.birthDate)) {
    errors.push("Ngày sinh phải có định dạng YYYY-MM-DD");
  }

  if (!["male", "female", "other"].includes(formData.gender)) {
    errors.push("Giới tính phải là male, female hoặc other");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
