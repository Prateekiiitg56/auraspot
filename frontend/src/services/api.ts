export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Get the correct image URL - handles both Cloudinary URLs and legacy local paths
 * @param image - Image path or full URL
 * @returns Full image URL or placeholder
 */
export const getImageUrl = (image: string | undefined | null): string => {
  // Debug log to verify function is being used
  console.log("[getImageUrl] Input:", image);
  
  if (!image) {
    return "https://via.placeholder.com/300x200?text=No+Image";
  }
  
  // If it's already a full URL (Cloudinary, http, https), return as-is
  if (image.startsWith("http://") || image.startsWith("https://")) {
    console.log("[getImageUrl] Returning Cloudinary URL as-is:", image);
    return image;
  }
  
  // Legacy local path - won't work on Vercel but keeping for local dev
  const legacyUrl = `${API}/uploads/${image}`;
  console.log("[getImageUrl] Legacy URL:", legacyUrl);
  return legacyUrl;
};
