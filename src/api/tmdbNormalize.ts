/**
 * Normalize: TMDb's raw JSON → the app's own types (src/types/tmdb.ts).
 *
 * The only file that knows TMDb's original response format. The JSON is
 * `unknown` until these functions have checked it. Every field is read through
 * guards.ts, so a missing or wrong field becomes a safe default
 * ('' / null / 0 / []) instead of crashing the app. TMDb's snake_case names
 * (poster_path) become our camelCase names (posterPath) here.
 */

import type {
  CastMember,
  CrewMember,
  Genre,
  Movie,
  MovieDetails,
  PagedResponse,
  Person,
  ReleaseCertification,
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
import { TmdbError, UNEXPECTED_RESPONSE_MESSAGE } from "./tmdbError";

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
 * typeof check, so no `as` cast is needed.
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
export function normalizePerson(raw: Record<string, unknown>): Person {
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
 * The genre list answer: { genres: [...] }.
 * @param raw - The parsed JSON from tmdbFetch.
 * @throws {TmdbError} If the answer isn't an object.
 */
export function normalizeGenreList(raw: unknown): Genre[] {
  return normalizeList(toRecord(raw), "genres", normalizeGenre);
}

/**
 * One page of results from any paged endpoint.
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
