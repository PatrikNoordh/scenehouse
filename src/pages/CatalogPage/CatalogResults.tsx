/**
 * The catalog's results for one set of filters: loading, error, empty or the
 * grid, plus "Load more".
 */

import { paths } from "../../routes";
import { useMovies } from "../../hooks/useMovies";
import type { CatalogFilters } from "../../types/tmdb";

import Loader from "../../components/Loader/Loader";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";
import EmptyState from "../../components/EmptyState/EmptyState";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./CatalogResults.module.css";

type Props = {
  filters: CatalogFilters;
};

/**
 * Rendered by the page with key={filtersKey(filters)}: when the filters
 * change, React mounts a fresh instance — pagination resets, the old request
 * is aborted and stale answers can't reach the screen. From inside, the
 * filters therefore never change.
 *
 * - No movies yet: exactly one of Loader, ErrorMessage or EmptyState. The
 *   empty text names the search: `No movies match "xyz".`
 * - Some movies: the grid always stays; a failed "Load more" shows its error
 *   below it, otherwise "Load more" shows while there are more pages.
 *
 * @param props.filters - Search text, genre and sort to show results for.
 */
export default function CatalogResults({ filters }: Props) {
  const { movies, isLoading, error, hasMore, loadMore, reload } =
    useMovies(filters);

  const hasMovies = movies.length > 0;

  const emptyMessage = filters.query
    ? `No movies match "${filters.query}".`
    : "No movies to show right now.";

  return (
    <div className={styles.results}>
      {!hasMovies && isLoading && <Loader label="Loading movies…" />}
      {!hasMovies && error && <ErrorMessage message={error} onRetry={reload} />}
      {!hasMovies && !isLoading && !error && (
        <EmptyState message={emptyMessage} />
      )}

      {hasMovies && (
        <>
          <ul className={styles.grid}>
            {movies.map((movie) => (
              <li key={movie.id}>
                <MovieCard movie={movie} to={paths.movie(movie.id)} />
              </li>
            ))}
          </ul>

          {error && <ErrorMessage message={error} onRetry={reload} />}

          {hasMore && !error && (
            <div className={styles.more}>
              <button
                type="button"
                className={styles.loadMore}
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
