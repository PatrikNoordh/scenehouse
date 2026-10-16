/**
 * The TMDb HTTP client: builds request URLs, adds the API key, keeps the
 * in-memory cache and turns failures into readable TmdbErrors.
 * Answers leave this file as `unknown` — tmdbNormalize.ts checks them.
 */

import { TMDB_LANGUAGE } from "../config";
import {
  MISSING_KEY_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  TmdbError,
  messageForStatus,
} from "./tmdbError";

const API_BASE_URL = "https://api.themoviedb.org/3";

// Extra query parameters, e.g. { page: 2, query: 'batman' }.
export type QueryParams = Record<string, string | number>;

// In-memory cache: request (path + params) → parsed JSON. Lives until the page
// reloads. Never written to localStorage (stale data; TMDb's terms forbid it).
// Private to this file: others can only read it, through readCache().
const cache = new Map<string, unknown>();

/**
 * The cache key for a request: path + query, without the API key.
 * Used both to store (tmdbFetch) and to look up (readCache), so the two can
 * never disagree about what a key looks like.
 * @param path - The endpoint, e.g. '/movie/550'.
 * @param params - Extra query parameters; language is always added first.
 * @returns e.g. "/movie/550?language=en-US&append_to_response=…"
 */
function buildCacheKey(path: string, params: QueryParams): string {
  const query = new URLSearchParams({ language: TMDB_LANGUAGE });
  for (const [name, value] of Object.entries(params)) {
    query.set(name, String(value));
  }
  return `${path}?${query.toString()}`;
}

/**
 * Reads a cached answer without fetching — for showing a movie seen before
 * instantly.
 * @param path - The endpoint, e.g. '/movie/550'.
 * @param params - The same parameters the request was made with.
 * @returns The cached JSON, or undefined if it hasn't been fetched yet.
 */
export function readCache(path: string, params: QueryParams = {}): unknown {
  return cache.get(buildCacheKey(path, params));
}

/**
 * The ONE function that calls TMDb — every public request goes through it.
 *
 * - The cache key is built BEFORE the API key is added, so the key is never stored.
 * - Only successful answers are cached, so "Try again" really calls TMDb again.
 * - fetch does not throw on 404/500, so response.ok is checked explicitly.
 * - A cancelled request (AbortError) is passed on unchanged so the hook can ignore it.
 * - Never log the request URL — it contains the API key.
 *
 * @param path - The endpoint, e.g. '/movie/popular'.
 * @param params - Extra query parameters (language and api_key are added here).
 * @param signal - Lets a hook cancel the request when the user leaves the page.
 * @returns The parsed JSON, still `unknown` — the normalize functions check it.
 * @throws {TmdbError} Missing or invalid key, HTTP error, or network failure.
 */
export async function tmdbFetch(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const apiKey = import.meta.env.VITE_TMDB_KEY;
  if (!apiKey) throw new TmdbError(MISSING_KEY_MESSAGE, null);

  const cacheKey = buildCacheKey(path, params);

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const url = `${API_BASE_URL}${cacheKey}&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new TmdbError(messageForStatus(response.status), response.status);
    }

    const data: unknown = await response.json();

    cache.set(cacheKey, data);
    return data;
  } catch (err: unknown) {
    if (err instanceof TmdbError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") throw err;

    throw new TmdbError(NETWORK_ERROR_MESSAGE, null);
  }
}
