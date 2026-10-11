import type {
  CastMember,
  CrewMember,
  DiscoverFilters,
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
const PLACEHOLDER_IMAGE_URL = "/placeholder.svg";

const IMAGE_WIDTHS: Record<ImageSize, string> = {
  profile: "w185",
  poster: "w500",
  backdrop: "w1280",
};

export function getImageUrl(path: string | null, size: ImageSize): string {
  if (!path) return PLACEHOLDER_IMAGE_URL;
  return `${IMAGE_BASE_URL}/${IMAGE_WIDTHS[size]}${path}`;
}

// ================ Errors ================

export class TmdbError extends Error {
  status: number | null;

  constructor(message: string, status: number | null) {
    super(message);
    this.name = "TmdbError";
    this.status = status;
  }
}

const MISSING_KEY_MESSAGE =
  "The TMDb API key is missing. Add VITE_TMDB_KEY to your .env file.";
const NETWORK_ERROR_MESSAGE =
  "Could not reach TMDb. Check your internet connection.";

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

type QueryParams = Record<string, string | number>;

const cache = new Map<string, unknown>();

// The ONE function that calls TMDb. Every public function below goes through it.
// - path:   the endpoint, e.g. '/movie/popular'
// - params: extra query parameters (optional, defaults to none)
// - signal: lets a hook cancel the request when the user leaves the page (optional)
// Returns the parsed JSON, still `unknown` — the normalize functions check it.
// Throws a TmdbError with a readable message if anything goes wrong
async function tmdbFetch(
  path: string,
  params: QueryParams = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const apiKey = import.meta.env.VITE_TMDB_KEY;
  if (!apiKey) throw new TmdbError(MISSING_KEY_MESSAGE, null);

  const query = new URLSearchParams({ language: TMDB_LANGUAGE });
  for (const [name, value] of Object.entries(params)) {
    query.set(name, String(value));
  }

  const cacheKey = `${path}?${query.toString()}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  query.set("api_key", apiKey);
  const url = `${API_BASE_URL}${path}?${query.toString()}`;

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
// TMDb's JSON is `unknown` until these functions have checked it.
// Each one reads every field through guards.ts, so a missing or wrong field
// becomes a safe default ('' / null / 0 / []) instead of crashing the app.
// TMDb's snake_case names (poster_path) become our camelCase names (posterPath) here.

const UNEXPECTED_RESPONSE_MESSAGE = "TMDb sent an unexpected response.";

function toRecord(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) throw new TmdbError(UNEXPECTED_RESPONSE_MESSAGE, null);
  return raw;
}

function normalizeList<T>(
  obj: Record<string, unknown>,
  key: string,
  normalize: (item: Record<string, unknown>) => T,
): T[] {
  return readArray(obj, key).filter(isRecord).map(normalize);
}

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

function normalizeGenre(raw: Record<string, unknown>): Genre {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
  };
}

function normalizeCastMember(raw: Record<string, unknown>): CastMember {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
    character: readString(raw, "character"),
    profilePath: readNullableString(raw, "profile_path"),
  };
}

function normalizeCrewMember(raw: Record<string, unknown>): CrewMember {
  return {
    id: readNumber(raw, "id"),
    name: readString(raw, "name"),
    job: readString(raw, "job"),
    profilePath: readNullableString(raw, "profile_path"),
  };
}

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

const SORT_PARAMS: Record<SortOption, string> = {
  popular: "popularity.desc",
  rating: "vote_average.desc",
  newest: "release_date.desc",
  title: "original_title.asc",
};

export async function getPopularMovies(
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const raw = await tmdbFetch("/movie/popular", { page }, signal);
  return normalizePage(raw, normalizeMovie);
}

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

export async function getGenres(signal?: AbortSignal): Promise<Genre[]> {
  const raw = await tmdbFetch("/genre/movie/list", {}, signal);
  return normalizeList(toRecord(raw), "genres", normalizeGenre);
}

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

  const raw = await tmdbFetch("/discover/movie", params, signal);
  return normalizePage(raw, normalizeMovie);
}

export async function getMovieDetails(
  id: number,
  signal?: AbortSignal,
): Promise<MovieDetails> {
  const raw = await tmdbFetch(
    `/movie/${id}`,
    { append_to_response: "credits,videos,release_dates,recommendations" },
    signal,
  );
  return normalizeMovieDetails(raw);
}

export async function getRecommendations(
  id: number,
  page = 1,
  signal?: AbortSignal,
): Promise<PagedResponse<Movie>> {
  const raw = await tmdbFetch(`/movie/${id}/recommendations`, { page }, signal);
  return normalizePage(raw, normalizeMovie);
}

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
