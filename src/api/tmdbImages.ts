/**
 * TMDb image URLs — the only place they are built.
 */

import type { ImageSize } from "../types/tmdb";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Served from public/ — shown whenever TMDb has no image.
const PLACEHOLDER_IMAGE_URL = "/placeholder.svg";

// What an image is FOR → TMDb's size code. Record<ImageSize, string> fails the
// build if a new ImageSize is added without an entry here.
const IMAGE_WIDTHS: Record<ImageSize, string> = {
  profile: "w185",
  poster: "w500",
  backdrop: "w1280",
};

/**
 * Builds a TMDb image URL.
 * @param path - The image path from TMDb (starts with "/"), or null if there is none.
 * @param size - What the image is for; mapped to TMDb's size code.
 * @returns The full image URL, or the placeholder when path is null or empty.
 */
export function getImageUrl(path: string | null, size: ImageSize): string {
  if (!path) return PLACEHOLDER_IMAGE_URL;
  return `${IMAGE_BASE_URL}/${IMAGE_WIDTHS[size]}${path}`;
}
