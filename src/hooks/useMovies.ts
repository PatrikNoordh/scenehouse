/**
 * Loads the catalog's movies page by page for a set of filters — search,
 * genre/sort browsing, or the default popular list.
 *
 * Keeps the four view states in one place — loading, error, empty (no movies)
 * and success — so the page only decides what to show and never fetches itself.
 */

import { useEffect, useState } from "react";
import type { CatalogFilters, Movie, PagedResponse } from "../types/tmdb";
import { discoverMovies, getPopularMovies, searchMovies } from "../api/tmdb";

// TMDb refuses pages above 500, even when totalPages reports more.
const MAX_PAGES = 500;

// Standard catalog error copy. Never shown: err.message (it can be technical).
const ERROR_MESSAGE = "Could not load movies. Try again.";

// What the hook returns. movies.length === 0 with no error and not loading = empty state.
export type UseMoviesResult = {
  movies: Movie[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reload: () => void;
};

/**
 * Appends the next page to the list, skipping movies that are already in it.
 * TMDb's lists can shift between requests, so a movie may appear on
 * two pages — duplicates would also give React two items with the same key.
 * Returns a new array; React only notices state changes when it gets a new one.
 * @param current - The movies loaded so far.
 * @param next - The movies from the page that just arrived.
 * @returns current followed by every movie from next whose id isn't in current.
 */
function appendUnique(current: Movie[], next: Movie[]): Movie[] {
  const seen = new Set(current.map((movie) => movie.id));

  return [...current, ...next.filter((movie) => !seen.has(movie.id))];
}

/**
 * Picks the TMDb request for the filters. All three return one page of movies,
 * so the hook's paging, abort and retry logic is the same for every case.
 * - Search text → searchMovies (genre and sort are applied afterwards, in the
 *   browser — see applySearchFilters).
 * - No genre and the default sort → getPopularMovies (the default catalog).
 * - Otherwise → discoverMovies (TMDb filters and sorts across all pages).
 * @param filters - The catalog filters.
 * @param page - Page number, starting at 1.
 * @param signal - Cancels the request when the effect is cleaned up.
 */
function fetchMoviePage(
  filters: CatalogFilters,
  page: number,
  signal: AbortSignal,
): Promise<PagedResponse<Movie>> {
  if (filters.query) return searchMovies(filters.query, page, signal);

  if (filters.genreId === null && filters.sort === "popular") {
    return getPopularMovies(page, signal);
  }

  return discoverMovies(filters, page, signal);
}

/**
 * Applies genre and sort in the browser — only while searching.
 *
 * TMDb's /search/movie can't filter by genre or sort, so for a search the
 * loaded results are filtered on genreIds and sorted here. Limitation: only
 * pages loaded so far are filtered and sorted; "Load more" brings in more.
 * Fetching every page of a search first would be slow and hit TMDb's rate
 * limit. "popular" keeps TMDb's own order, which for a search is relevance.
 * Without search text the list is returned unchanged — discover already
 * filtered and sorted it on the server.
 *
 * The switch covers every SortOption, so adding one fails the build until it
 * is handled here. Sorting uses a copy: .sort() changes its array, and the
 * input may be the state array itself.
 * @param movies - All loaded movies.
 * @param filters - The catalog filters.
 * @returns The movies to show.
 */
function applySearchFilters(movies: Movie[], filters: CatalogFilters): Movie[] {
  if (!filters.query) return movies;

  const genreId = filters.genreId;

  const inGenre =
    genreId === null
      ? movies
      : movies.filter((movie) => movie.genreIds.includes(genreId));

  switch (filters.sort) {
    case "rating":
      return [...inGenre].sort((a, b) => b.voteAverage - a.voteAverage);

    case "newest":
      return [...inGenre].sort((a, b) =>
        b.releaseDate.localeCompare(a.releaseDate),
      );

    case "title":
      return [...inGenre].sort((a, b) => a.title.localeCompare(b.title));

    case "popular":
      return inGenre;
  }
}

/**
 * The catalog's movies for one set of filters, with "Load more" and "Try again".
 *
 * - When the filters change, the page remounts the results component with a
 *   new key, so this hook starts over from its initial state — no reset code.
 * - The filters are split into primitives (query, genreId, sort) for the
 *   dependency list: the page builds a new filters object on every render,
 *   and objects are never ===, so depending on the object would refetch.
 * - The effect fetches the current page whenever `page` or `attempt` changes.
 *   `attempt` is never displayed — increasing it re-runs the effect, so
 *   reload() retries without duplicating the fetch code.
 * - Loading is set where a request starts (initial state, loadMore, reload),
 *   not at the top of the effect: React then renders the right state in one
 *   pass, and the react-hooks/set-state-in-effect lint rule stays green.
 * - The AbortController cancels the request on unmount or when the effect
 *   re-runs. AbortError is ignored, and the `aborted` checks make sure no state
 *   is set after cleanup — also for cached answers, which resolve instantly.
 * - Page 1 replaces the list; later pages are appended without duplicates.
 * - The returned movies are the loaded ones after applySearchFilters — a
 *   derived value, recalculated each render, never stored in state.
 *
 * @param filters - Search text, genre and sort from the URL.
 * @returns The movies to show, loading/error state, and the loadMore/reload actions.
 */
export function useMovies(filters: CatalogFilters): UseMoviesResult {
  const { query, genreId, sort } = filters;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchMoviePage({ query, genreId, sort }, page, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setMovies((current) =>
          page === 1 ? result.results : appendUnique(current, result.results),
        );

        setTotalPages(Math.min(result.totalPages, MAX_PAGES));

        setIsLoading(false);
      })

      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;

        if (controller.signal.aborted) return;

        setError(ERROR_MESSAGE);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [query, genreId, sort, page, attempt]);

  const hasMore = page < totalPages;

  function loadMore() {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);
    setPage((current) => current + 1);
  }

  function reload() {
    setIsLoading(true);
    setError(null);
    setAttempt((current) => current + 1);
  }

  return {
    movies: applySearchFilters(movies, filters),
    isLoading,
    error,
    hasMore,
    loadMore,
    reload,
  };
}
