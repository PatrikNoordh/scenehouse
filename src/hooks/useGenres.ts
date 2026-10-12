/**
 * Loads the movie genre list once, for the catalog's genre filter.
 */

import { useEffect, useState } from "react";
import type { Genre } from "../types/tmdb";
import { getGenres } from "../api/tmdb";

// genres is [] while loading and after an error. hasError is a flag, not a
// message: the dropdown only needs to know whether to disable itself.
export type UseGenresResult = {
  genres: Genre[];
  isLoading: boolean;
  hasError: boolean;
};

/**
 * Fetches the genres when the component mounts (empty dependency list → once).
 * tmdb.ts caches the answer, so later visits are instant. There is no retry:
 * the catalog works without genres, so a failure only disables the dropdown.
 * The request is aborted on unmount, and no state is set after cleanup.
 * @returns The genres plus loading/error flags.
 */
export function useGenres(): UseGenresResult {
  const [genres, setGenres] = useState<Genre[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getGenres(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;

        setGenres(result);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;

        if (controller.signal.aborted) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { genres, isLoading, hasError };
}
