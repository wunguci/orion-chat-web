import { getToken } from "../utils/token";

interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  avatarUrl?: string;
  coverImage?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3000";

/**
 * User info cache to avoid repeated API calls
 */
const userInfoCache = new Map<
  string,
  { fullName: string; avatarUrl?: string }
>();

/**
 * Get user information by userId or phone number
 * Uses cache to avoid repeated API calls
 */
export async function getUserInfo(
  userIdOrPhone: string,
): Promise<{ fullName: string; avatarUrl?: string } | null> {
  if (!userIdOrPhone) return null;

  // Check cache first
  if (userInfoCache.has(userIdOrPhone)) {
    return userInfoCache.get(userIdOrPhone) || null;
  }

  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/users/${userIdOrPhone}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.warn(
        `[getUserInfo] Failed to fetch user info for ${userIdOrPhone}: ${response.statusText}`,
      );
      // Cache null result to avoid repeated failed requests
      userInfoCache.set(userIdOrPhone, { fullName: userIdOrPhone });
      return null;
    }

    const data = await response.json();
    const userInfo = {
      fullName: data?.fullName || data?.name || userIdOrPhone,
      avatarUrl: data?.avatarUrl,
    };

    // Cache the result
    userInfoCache.set(userIdOrPhone, userInfo);
    return userInfo;
  } catch (error) {
    console.error(`[getUserInfo] Error fetching user info:`, error);
    // Cache the phone/userId as fallback
    userInfoCache.set(userIdOrPhone, { fullName: userIdOrPhone });
    return null;
  }
}

export async function updateUserProfile(
  updateData: UpdateProfileDto,
  files?: {
    avatar?: File;
    cover?: File;
  },
) {
  // console.log('[updateUserProfile] CALLED - updateData:', updateData);
  // console.log('[updateUserProfile] Files provided:', files);

  const token = getToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  const formData = new FormData();

  // Add form fields
  if (updateData.fullName) {
    formData.append("fullName", updateData.fullName);
  }
  if (updateData.email) {
    formData.append("email", updateData.email);
  }
  if (updateData.phoneNumber) {
    formData.append("phoneNumber", updateData.phoneNumber);
  }
  if (updateData.birthDate) {
    formData.append("birthDate", updateData.birthDate);
  }
  if (updateData.gender) {
    formData.append("gender", updateData.gender);
  }

  // Add files if provided
  if (files?.avatar) {
    formData.append("avatar", files.avatar);
  }
  if (files?.cover) {
    formData.append("cover", files.cover);
  }

  const endpoint = `${API_BASE_URL}/users/profile`;
  //console.log("[updateUserProfile] About to fetch:", endpoint);

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  // Try to get response body
  let responseBody: unknown = null;
  try {
    responseBody = await response.clone().json();
  } catch {
    const text = await response.text();
    responseBody = text;
  }

  if (!response.ok) {
    let errorMessage = `Failed to update profile: ${response.statusText} (${response.status})`;
    if (
      responseBody &&
      typeof responseBody === "object" &&
      "message" in responseBody &&
      typeof responseBody.message === "string"
    ) {
      errorMessage = responseBody.message;
    }
    throw new Error(errorMessage);
  }

  return responseBody;
}
