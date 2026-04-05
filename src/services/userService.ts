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

const API_BASE_URL = "http://localhost:3000";

export async function updateUserProfile(
  updateData: UpdateProfileDto,
  files?: {
    avatar?: File;
    cover?: File;
  },
) {
  console.log("[updateUserProfile] CALLED - updateData:", updateData);
  console.log("[updateUserProfile] Files provided:", files);

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
  console.log("[updateUserProfile] About to fetch:", endpoint);

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
