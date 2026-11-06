import type { User } from "../types";
const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
export async function request<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language":
      typeof document !== "undefined" ? document.documentElement.lang : "uz",
  };
  if (method !== "GET") {
    const csrf = await fetch(base + "/auth/csrf/", {
      credentials: "include",
      cache: "no-store",
    });
    let token: { csrfToken?: string; detail?: string };
    try {
      token = await csrf.json();
    } catch {
      throw new Error("Autentifikatsiya serveri javob bermadi.");
    }
    if (!csrf.ok || !token.csrfToken)
      throw new Error(token.detail || "Autentifikatsiya xizmati sozlanmagan.");
    headers["X-CSRFToken"] = token.csrfToken;
  }
  let response: Response;
  try {
    response = await fetch(base + path, {
      method,
      headers,
      credentials: "include",
      cache: "no-store",
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new Error("Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.");
  }
  let result: T & { detail?: string };
  try {
    result = await response.json();
  } catch {
    throw new Error("Server javobi noto‘g‘ri.");
  }
  if (!response.ok) throw new Error(result.detail || "So‘rov bajarilmadi.");
  return result;
}
export const authApi = {
  me: () => request<{ user: User }>("/auth/me/"),
  login: (username: string, password: string, remember: boolean) =>
    request<{ user: User }>("/auth/login/", "POST", {
      username,
      password,
      remember,
    }),
  logout: () => request("/auth/logout/", "POST"),
  requestCode: (email: string, purpose: "register" | "reset" = "register") =>
    request<{ detail: string; expiresIn: number }>(
      "/auth/request-code/",
      "POST",
      { email, purpose },
    ),
  register: (data: Record<string, unknown>) =>
    request<{ user: User }>("/auth/register/", "POST", data),
  resetPassword: (email: string, code: string, password: string) =>
    request<{ detail: string }>("/auth/reset-password/", "POST", {
      email,
      code,
      password,
    }),
  profile: (data: { firstName: string; lastName: string; phone: string }) =>
    request<{ user: User }>("/auth/profile/", "PATCH", data),
  users: () => request<{ users: User[] }>("/admin/users/"),
  setActive: (id: string, active: boolean) =>
    request<{ user: User }>(
      `/admin/users/${encodeURIComponent(id)}/`,
      "PATCH",
      { active },
    ),
  deleteUser: (id: string) =>
    request(`/admin/users/${encodeURIComponent(id)}/`, "DELETE"),
};
