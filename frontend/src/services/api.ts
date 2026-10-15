import { auth } from "./firebase";

export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * fetch() wrapper for the AuraSpot API.
 * Accepts a full `${API}/...` URL or a path, and attaches the signed-in user's
 * Firebase ID token so the backend can identify the caller.
 */
export const apiFetch = async (url: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const token = await auth.currentUser?.getIdToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url.startsWith("http") ? url : `${API}${url}`, { ...init, headers });
};

/** JSON POST/PUT helper built on apiFetch. */
export const apiJson = (url: string, method: "POST" | "PUT" | "DELETE", body?: unknown) =>
  apiFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

/** Extracts a human-readable error message from a failed API response. */
export const readError = async (res: Response, fallback = "Something went wrong"): Promise<string> => {
  try {
    const data = await res.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
};

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e7e3d8"/><path d="M200 105l-60 46v64h40v-40h40v40h40v-64z" fill="#c9c2ad"/></svg>`
  );

/** Resolves Cloudinary URLs, legacy local upload paths, or a neutral placeholder. */
export const getImageUrl = (image: string | undefined | null): string => {
  if (!image) return PLACEHOLDER_IMAGE;
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("data:")) return image;
  return `${API}/uploads/${image}`;
};

/** First available image of a listing. */
export const getPropertyImage = (p?: { images?: string[]; image?: string | null } | null) =>
  getImageUrl(p?.images?.[0] || p?.image);

export const formatINR = (value: number | undefined | null) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;
