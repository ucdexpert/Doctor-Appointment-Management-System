// Authentication utility functions

import { User } from "@/types";

/**
 * Save JWT token to localStorage
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

/**
 * Save user data to localStorage
 */
export function saveUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 */
export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Remove user data from localStorage
 */
export function removeUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

/**
 * Decode JWT token to get user info (without verification)
 * Note: This only decodes the payload, doesn't verify the token
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const exp = decoded.exp as number | undefined;
  if (!exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return exp < currentTime;
}

/**
 * Clear all auth data (token + user)
 */
export function clearAuth(): void {
  removeToken();
  removeUser();
}
