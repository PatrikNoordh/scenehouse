/**
 * TMDb errors: the TmdbError class and every message it can carry.
 *
 * Imports nothing from the rest of the API layer, so both the client and the
 * normalizers can throw it without creating a circular import.
 */

/**
 * An Error that also carries the HTTP status, so a page can tell "not found"
 * (404) apart from "network down" (null) by number instead of by message text.
 */
export class TmdbError extends Error {
  status: number | null;

  /**
   * @param message - A readable message, safe to show (never contains the URL or key).
   * @param status - The HTTP status (401, 404, 429, 5xx…), or null if there was no response.
   */
  constructor(message: string, status: number | null) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

// Messages for failures without an HTTP status.
export const MISSING_KEY_MESSAGE =
  "The TMDb API key is missing. Add VITE_TMDB_KEY to your .env file.";
export const NETWORK_ERROR_MESSAGE =
  "Could not reach TMDb. Check your internet connection.";
export const UNEXPECTED_RESPONSE_MESSAGE = "TMDb sent an unexpected response.";

/**
 * Turns an HTTP status code into a message a person can understand.
 * @param status - The HTTP status of a failed response.
 */
export function messageForStatus(status: number): string {
  if (status === 401) return "The TMDb API key is invalid.";
  if (status === 404) return "The requested movie could not be found.";
  if (status === 429)
    return "Too many requests to TMDb. Wait a moment and try again.";
  if (status >= 500)
    return "TMDb is having problems right now. Try again later.";
  return `The TMDb request failed (status ${status}).`;
}
