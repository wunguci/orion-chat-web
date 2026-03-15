import { getAuthHeader, logout } from "../utils/token";

const API_BASE = "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));

    if (
      res.status === 401 &&
      typeof error.message === "string" &&
      error.message.toLowerCase().includes("token has expired")
    ) {
      logout();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    throw new Error(error.message || "API Error");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
