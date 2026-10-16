/**
 * TMDb API — the entry point for everything the app asks TMDb.
 *
 * Every function here goes tmdbFetch (tmdbClient.ts) → normalize
 * (tmdbNormalize.ts) → the app's own types, throws a TmdbError on failure,
 * and takes an optional AbortSignal last so a hook can cancel the request.
 * Nothing outside src/api/ ever sees TMDb's original response format.
 */

import type {
  DiscoverFilters,
  DiscoverQuery,
  Genre,
  Movie,
  MovieDetails,
  PagedResponse,
  Person,
  SortOption,
} from "../types/tmdb";
import { readCache, tmdbFetch } from "./tmdbClient";
import type { QueryParams } from "./tmdbClient";
import {
  normalizeGenreList,
  normalizeMovie,
  normalizeMovieDetails,
  normalizePage,
  normalizePerson,
} from "./tmdbNormalize";

// Re-exported so the rest of the app keeps importing everything from "api/tmdb".
export { TmdbError } from "./tmdbError";
export { getImageUrl } from "./tmdbImages";

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
  return normalizeGenreList(raw);
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
  const raw = readCache(`/movie/${id}`, DETAIL_PARAMS);

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
