/**
 * Loads one movie's full details for the detail page.
 */

import { useEffect, useState } from "react";
import type { MovieDetails } from "../types/tmdb";
import { getMovieDetails, peekMovieDetails, TmdbError } from "../api/tmdb";

const ERROR_MESSAGE = "Could not load the movie. Try again.";

export type UseMovieDetailsResult = {
  movie: MovieDetails | null;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  reload: () => void;
};

/**
 * Fetches the details for one movie and tracks loading, error and not-found.
 *
 * - The initial movie comes from peekMovieDetails, through a lazy useState
 *   initializer that runs only on the first render. A movie seen before is on
 *   screen from the very first render, with no spinner. The effect still calls
 *   getMovieDetails, which then answers from the cache without a request.
 * - isLoading starts true only when the cache had nothing, and reload() sets it
 *   again together with a new `attempt`. Setting it where a request starts —
 *   not at the top of the effect — renders the right state in one pass.
 * - `attempt` is never displayed: increasing it re-runs the effect, so reload()
 *   retries without repeating the fetch code.
 * - The AbortController cancels the request on unmount or when the effect
 *   re-runs. AbortError is ignored, and the `aborted` checks make sure no state
 *   is set after cleanup.
 * - A TmdbError with status 404 sets notFound instead of error: retrying can't
 *   help, so the page shows "Movie not found." without a retry button. Other
 *   failures set the error text, shown with "Try again".
 *
 * @param id - A valid TMDb movie id (the page has already checked the URL).
 * @returns The movie, loading/error/notFound state, and reload().
 */
export function useMovieDetails(id: number): UseMovieDetailsResult {
  const [movie, setMovie] = useState<MovieDetails | null>(() =>
    peekMovieDetails(id),
  );

  const [isLoading, setIsLoading] = useState(movie === null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getMovieDetails(id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setMovie(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (controller.signal.aborted) return;

        if (err instanceof TmdbError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(ERROR_MESSAGE);
        }
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  function reload() {
    setIsLoading(true);
    setError(null);
    setAttempt((current) => current + 1);
  }

  return { movie, isLoading, error, notFound, reload };
}
