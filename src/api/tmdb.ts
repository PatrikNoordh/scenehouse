/**
 * TMDb API client — the ONLY file in the app that talks to TMDb.
 *
 * Builds request URLs, adds the API key, caches answers in memory, turns
 * failures into readable TmdbErrors, and converts TMDb's raw JSON into the
 * app's own types (src/types/tmdb.ts). Nothing outside src/api/ ever sees
 * TMDb's original response format — if TMDb changes, only this file changes.
 *
 * Sections: Images · Errors · Fetch + cache · Normalize · Public API
 */

import type {
  CastMember,
  CrewMember,
  DiscoverFilters,
  DiscoverQuery,
  Genre,
  ImageSize,
  Movie,
  MovieDetails,
  PagedResponse,
  Person,
  ReleaseCertification,
  SortOption,
  Video,
} from "../types/tmdb";

import {
  isRecord,
  readArray,
  readBoolean,
  readNullableString,
  readNumber,
  readRecord,
  readString,
} from "../utils/guards";

import { TMDB_LANGUAGE } from "../config";

// ================ Images ================

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
 * Builds a TMDb image URL — the only place image URLs are made.
 * @param path - The image path from TMDb (starts with "/"), or null if there is none.
 * @param size - What the image is for; mapped to TMDb's size code.
 * @returns The full image URL, or the placeholder when path is null or empty.
 */
export function getImageUrl(path: string | null, size: ImageSize): string {
  if (!path) return PLACEHOLDER_IMAGE_URL;
  return `${IMAGE_BASE_URL}/${IMAGE_WIDTHS[size]}${path}`;
}

// ================ Errors ================

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
const MISSING_KEY_MESSAGE =
  "The TMDb API key is missing. Add VITE_TMDB_KEY to your .env file.";
const NETWORK_ERROR_MESSAGE =
  "Could not reach TMDb. Check your internet connection.";

/**
 * Turns an HTTP status code into a message a person can understand.
 * @param status - The HTTP status of a failed response.
 */
function messageForStatus(status: number): string {
  if (status === 401) return "The TMDb API key is invalid.";
  if (status === 404) return "The requested movie could not be found.";
  if (status === 429)
    return "Too many requests to TMDb. Wait a moment and try again.";
  if (status >= 500)
    return "TMDb is having problems right now. Try again later.";
  return `The TMDb request failed (status ${status}).`;
}

// ================ Fetch + cache ================

const API_BASE_URL = "https://api.themoviedb.org/3";

// Extra query parameters, e.g. { page: 2, query: 'batman' }.
type QueryParams = Record<string, string | number>;

// In-memory cache: request (path + params) → parsed JSON. Lives until the page
// reloads. Never written to localStorage (stale data; TMDb's terms forbid it).
const cache = new Map<string, unknown>();

/**
 * The cache key for a request: path + query, without the API key.
 * Shared by tmdbFetch (to store) and peekMovieDetails (to look up), so the two
 * can never disagree about what a key looks like.
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
 * The ONE function that calls TMDb — every public function goes through it.
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
async function tmdbFetch(
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

// ================ Normalize: raw TMDb JSON → app types ================
// TMDb's JSON is `unknown` until these functions have checked it. Every field is
// read through guards.ts, so a missing or wrong field becomes a safe default
// ('' / null / 0 / []) instead of crashing the app. TMDb's snake_case names
// (poster_path) become our camelCase names (posterPath) here.

const UNEXPECTED_RESPONSE_MESSAGE = "TMDb sent an unexpected response.";

/**
 * Checks that the top level of an answer is an object.
 * @param raw - The parsed JSON from tmdbFetch.
 * @throws {TmdbError} If it isn't an object — nothing could be read from it.
 */
function toRecord(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) throw new TmdbError(UNEXPECTED_RESPONSE_MESSAGE, null);
  return raw;
}

/**
 * Reads the list at obj[key], keeps only real objects (isRecord is a type
 * guard, so each item is narrowed) and normalizes each one.
 * T is inferred from `normalize`: pass normalizeMovie, get Movie[].
 * @param obj - The object that holds the list.
 * @param key - The name of the list, e.g. 'results' or 'cast'.
 * @param normalize - Turns one raw item into an app type.
 */
function normalizeList<T>(
  obj: Record<string, unknown>,
  key: string,
  normalize: (item: Record<string, unknown>) => T,
): T[] {
  return readArray(obj, key).filter(isRecord).map(normalize);
}

/**
 * One movie as it appears in lists (popular, search, discover, recommendations).
 * genreIds keeps only real numbers; TypeScript infers number[] from the
 * typeof check, so no `as` cast is needed. Exported for unit tests.
 * @param raw - One raw movie object from TMDb.
 */
export function normalizeMovie(raw: Record<string, unknown>): Movie {
  return {
    id: readNumber(raw, "id"),
    title: readString(raw, "title"),
    overview: readString(raw, "overview"),
    posterPath: readNullableString(raw, "poster_path"),
    backdropPath: readNullableString(raw, "backdrop_path"),
    releaseDate: readString(raw, "release_date"),
    voteAverage: readNumber(raw, "vote_average"),
    genreIds: readArray(raw, "genre_ids").filter(
      (id) => typeof id === "number",
    ),
  };
}

/** @param raw - One raw genre object from TMDb. */
function normalizeGenre(raw: Record<string, unknown>): Genre {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
  };
}

/** @param raw - One raw cast entry from a movie's credits. */
function normalizeCastMember(raw: Record<string, unknown>): CastMember {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
    character: readString(raw, "character"),
    profilePath: readNullableString(raw, "profile_path"),
  };
}

/** @param raw - One raw crew entry from a movie's credits. */
function normalizeCrewMember(raw: Record<string, unknown>): CrewMember {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
    job: readString(raw, "job"),
    profilePath: readNullableString(raw, "profile_path"),
  };
}

/** @param raw - One raw video entry (trailer, teaser, clip…). */
function normalizeVideo(raw: Record<string, unknown>): Video {
  return {
    id: readString(raw, "id"),
    key: readString(raw, "key"),
    name: readString(raw, "name"),
    site: readString(raw, "site"),
    type: readString(raw, "type"),
    official: readBoolean(raw, "official"),
  };
}

/**
 * One person from a person search. TMDb's known_for mixes movies and TV shows:
 * the RAW items are filtered on media_type first, then normalized — a
 * normalized Movie no longer has media_type, so the order matters.
 * @param raw - One raw person object from TMDb.
 */
function normalizePerson(raw: Record<string, unknown>): Person {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
    profilePath: readNullableString(raw, "profile_path"),
    knownForDepartment: readString(raw, "known_for_department"),
    knownFor: readArray(raw, "known_for")
      .filter(isRecord)
      .filter((item) => readString(item, "media_type") === "movie")
      .map(normalizeMovie),
  };
}

/**
 * Flattens TMDb's nested release_dates into
 * [{ country: 'SE', certification: '15' }, …], so the age rating is a simple lookup.
 * A country can have several releases; the first one with a rating is used, and
 * countries without any rating are left out.
 * @param releaseDates - The raw release_dates object from the detail answer.
 */
function normalizeCertification(
  releaseDates: Record<string, unknown>,
): ReleaseCertification[] {
  return readArray(releaseDates, "results")
    .filter(isRecord)
    .map((country) => ({
      country: readString(country, "iso_3166_1"),
      certification:
        readArray(country, "release_dates")
          .filter(isRecord)
          .map((release) => readString(release, "certification"))
          .find((certification) => certification !== "") ?? "",
    }))
    .filter((item) => item.certification !== "");
}

/**
 * One page of results from any paged endpoint. Exported for unit tests.
 * @param raw - The parsed JSON from tmdbFetch.
 * @param normalize - Turns one raw item into an app type (normalizeMovie, normalizePerson…).
 * @returns PagedResponse<T>, where T is whatever `normalize` returns.
 * @throws {TmdbError} If the answer isn't an object.
 */
export function normalizePage<T>(
  raw: unknown,
  normalize: (item: Record<string, unknown>) => T,
): PagedResponse<T> {
  const data = toRecord(raw);
  return {
    page: readNumber(data, "page"),
    totalPages: readNumber(data, "total_pages"),
    totalResults: readNumber(data, "total_results"),
    results: normalizeList(data, "results", normalize),
  };
}

/**
 * The full detail page — the answer to /movie/{id}?append_to_response=…
 *
 * - Each appended part arrives as its own nested object (data.credits, data.videos…).
 *   readRecord returns {} if a part is missing, so the list becomes [] instead of crashing.
 * - Starts from normalizeMovie, then overrides genreIds from the full "genres"
 *   objects (the detail answer has no genre_ids). The override must stay AFTER the spread.
 * - TMDb sends runtime 0 when unknown; `|| null` (not ??) turns 0 into null.
 *
 * Exported for unit tests.
 * @param raw - The parsed JSON from tmdbFetch.
 * @throws {TmdbError} If the answer isn't an object.
 */
export function normalizeMovieDetails(raw: unknown): MovieDetails {
  const data = toRecord(raw);
  const genres = normalizeList(data, "genres", normalizeGenre);
  const credits = readRecord(data, "credits");

  return {
    ...normalizeMovie(data),
    genreIds: genres.map((genre) => genre.id),
    tagline: readString(data, "tagline"),
    runtime: readNumber(data, "runtime") || null,
    genres,
    cast: normalizeList(credits, "cast", normalizeCastMember),
    crew: normalizeList(credits, "crew", normalizeCrewMember),
    videos: normalizeList(
      readRecord(data, "videos"),
      "results",
      normalizeVideo,
    ),
    releaseCertifications: normalizeCertification(
      readRecord(data, "release_dates"),
    ),
    recommendations: normalizeList(
      readRecord(data, "recommendations"),
      "results",
      normalizeMovie,
    ),
  };
}

// ================ Public API ================
// The only functions other files use: tmdbFetch → normalize → app types.
// Every one throws a TmdbError on failure (see tmdbFetch), and takes an optional
// AbortSignal last so a hook can cancel the request.

// Our sort names → TMDb's sort_by values, so pages and URLs never use TMDb's
// format. Record<SortOption, string> fails the build if a SortOption is unmapped.
const SORT_PARAMS: Record<SortOption, string> = {
  popular: "popularity.desc",
  rating: "vote_average.desc",
  newest: "release_date.desc",
  title: "original_title.asc",
};

/**
 * Popular movies right now — the catalog's default list.
 * @param page - Page number, starting at 1.
 * @param signal - Lets a hook cancel the request.
 */
export async function getPopularMovies(
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const raw = await tmdbFetch("/movie/popular", { page }, signal);
  return normalizePage(raw, normalizeMovie);
}

/**
 * Search movies by title. Adult titles are excluded explicitly (also TMDb's default).
 * @param query - The search text.
 * @param page - Page number, starting at 1.
 * @param signal - Lets a hook cancel the request.
 */
export async function searchMovies(
  query: string,
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const raw = await tmdbFetch(
    "/search/movie",
    { query, page, include_adult: "false" },
    signal,
  );
  return normalizePage(raw, normalizeMovie);
}

/**
 * All movie genres, for the genre filter. Not paged.
 * @param signal - Lets a hook cancel the request.
 */
export async function getGenres(signal?: AbortSignal): Promise<Genre[]> {
  const raw = await tmdbFetch("/genre/movie/list", {}, signal);
  return normalizeList(toRecord(raw), "genres", normalizeGenre);
}

/**
 * Browse movies by genre and sort order (no search text).
 * The "rating" sort requires at least 200 votes, so it isn't filled with
 * films that have a single 10/10 vote. The "newest" sort only includes movies
 * released up to today (UTC) with at least 20 votes, so unreleased and
 * almost-unknown titles don't fill the list.
 * @param filters - Genre (null = all genres) and our own sort name.
 * @param page - Page number, starting at 1.
 * @param signal - Lets a hook cancel the request.
 */
export async function discoverMovies(
  filters: DiscoverFilters,
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const params: QueryParams = {
    page,
    sort_by: SORT_PARAMS[filters.sort],
    include_adult: "false",
  };
  if (filters.genreId !== null) params.with_genres = filters.genreId;
  if (filters.sort === "rating") params["vote_count.gte"] = 200;

  if (filters.sort === "newest") {
    params["release_date.lte"] = new Date().toISOString().slice(0, 10);

    params["vote_count.gte"] = 20;
  }

  const raw = await tmdbFetch("/discover/movie", params, signal);
  return normalizePage(raw, normalizeMovie);
}

/**
 * Discover movies by MovieAI's criteria: several genres (AND), a year range,
 * a minimum rating, a director and an actor. Missing criteria are left out of the request.
 * At least 50 votes, so almost-unknown titles don't fill the answer.
 * @param query - The criteria, already as TMDb ids.
 * @param signal - Lets the caller cancel the request.
 */
export async function discoverByQuery(
  query: DiscoverQuery,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const params: QueryParams = {
    sort_by: SORT_PARAMS[query.sort],
    include_adult: "false",
    "vote_count.gte": 50,
  };

  if (query.genreIds.length > 0) params.with_genres = query.genreIds.join(",");

  if (query.yearFrom !== null)
    params["primary_release_date.gte"] = `${query.yearFrom}-01-01`;
  if (query.yearTo !== null)
    params["primary_release_date.lte"] = `${query.yearTo}-12-31`;

  if (query.minRating !== null) params["vote_average.gte"] = query.minRating;

  if (query.crewId !== null) params.with_crew = query.crewId;

  if (query.castId !== null) params.with_cast = query.castId;

  const raw = await tmdbFetch("/discover/movie", params, signal);

  return normalizePage(raw, normalizeMovie);
}

// The detail request's extra parameter, written once: getMovieDetails sends it
// and peekMovieDetails looks up with it, so their cache keys always match.
const DETAIL_PARAMS: QueryParams = {
  append_to_response: "credits,videos,release_dates,recommendations",
};

/**
 * Everything the detail page needs — details, credits, videos, age ratings
 * and recommendations — in ONE request.
 * @param id - The TMDb movie id (a number — convert useParams() first).
 * @param signal - Lets a hook cancel the request.
 * @throws {TmdbError} With status 404 if the movie doesn't exist.
 */
export async function getMovieDetails(
  id: number,
  signal?: AbortSignal,
): Promise<MovieDetails> {
  const raw = await tmdbFetch(`/movie/${id}`, DETAIL_PARAMS, signal);

  return normalizeMovieDetails(raw);
}

/**
 * A movie's details straight from the cache, without waiting — or null if it
 * hasn't been fetched yet. Synchronous, so a hook can use it as its initial
 * state: a movie seen before then shows on the first render, with no spinner
 * and no request. Never throws: if the cached answer can't be normalized it
 * returns null, and a normal fetch reports the problem instead.
 * @param id - The TMDb movie id.
 * @returns The cached MovieDetails, or null.
 */
export function peekMovieDetails(id: number): MovieDetails | null {
  const raw = cache.get(buildCacheKey(`/movie/${id}`, DETAIL_PARAMS));

  if (raw === undefined) return null;

  try {
    return normalizeMovieDetails(raw);
  } catch {
    return null;
  }
}

/**
 * More recommendations than the first page included in getMovieDetails.
 * @param id - The TMDb movie id.
 * @param page - Page number, starting at 1.
 * @param signal - Lets a hook cancel the request.
 */
export async function getRecommendations(
  id: number,
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const raw = await tmdbFetch(`/movie/${id}/recommendations`, { page }, signal);
  return normalizePage(raw, normalizeMovie);
}

/**
 * Search actors and directors by name.
 * Each person's knownFor contains movies only.
 * @param name - The name to search for.
 * @param page - Page number, starting at 1.
 * @param signal - Lets a hook cancel the request.
 */
export async function searchPerson(
  name: string,
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Person>> {
  const raw = await tmdbFetch(
    "/search/person",
    { query: name, page, include_adult: "false" },
    signal,
  );
  return normalizePage(raw, normalizePerson);
}
