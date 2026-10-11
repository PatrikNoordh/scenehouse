import { useEffect, useState } from "react";
import type { Genre } from "../types/tmdb";
import { getGenres } from "../api/tmdb";

export type UseGenresResult = {
  genres: Genre[];
  isLoading: boolean;
  hasError: boolean;
};

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
