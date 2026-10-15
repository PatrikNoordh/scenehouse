/**
 * Loads the movie for the catalog's "Featured this week" hero: the most
 * popular movie right now (the first movie of TMDb's popular list).
 */

import { useEffect, useState } from "react";
import type { Movie } from "../types/tmdb";
import { getPopularMovies } from "../api/tmdb";

// movie is null while loading, after an error and when the list is empty —
// in all three cases the page simply shows no hero.
export type UseFeaturedMovieResult = {
  movie: Movie | null;
  isLoading: boolean;
};

/**
 * Fetches popular page 1 once, when the component mounts, and keeps its first movie.
 * - isLoading starts as true, so the page can hold the hero's space at once;
 *   no state is set at the top of the effect.
 * - No retry and no error message: the hero is optional, and the grid below
 *   loads the same list and shows its own error with "Try again".
 * - `results[0] ?? null`: TypeScript assumes results[0] is a Movie, but an
 *   empty list gives undefined at runtime — ?? turns that into null.
 * - The request is aborted on unmount, and no state is set after cleanup.
 * @returns The featured movie (or null) and whether it is still loading.
 */
export function useFeaturedMovie(): UseFeaturedMovieResult {
  const [movie, setMovie] = useState<Movie | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    getPopularMovies(1, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setMovie(page.results[0] ?? null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;

        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { movie, isLoading };
}
