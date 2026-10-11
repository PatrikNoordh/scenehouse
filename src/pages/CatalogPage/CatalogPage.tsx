/**
 * The catalog page ("/"): popular movies in a responsive grid with "Load more".
 */

import { paths } from "../../routes";

import { useMovies } from "../../hooks/useMovies";

import Loader from "../../components/Loader/Loader";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";
import EmptyState from "../../components/EmptyState/EmptyState";
import MovieCard from "../../components/MovieCard/MovieCard";

import styles from "./CatalogPage.module.css";

/**
 * Gets the data from useMovies and picks which state to show — it never fetches.
 *
 * - No movies yet: exactly one of Loader (loading), ErrorMessage (failed) or
 *   EmptyState (loaded, but zero results).
 * - Some movies: the grid is always shown. A failed "Load more" shows its error
 *   below the grid, so earlier pages never disappear; otherwise the
 *   "Load more" button shows while there are more pages.
 * - The page builds each card's link with paths.movie(id) — cards don't build URLs.
 */
export default function CatalogPage() {
  const { movies, isLoading, error, hasMore, loadMore, reload } = useMovies();

  const hasMovies = movies.length > 0;

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Popular movies</h1>

      {!hasMovies && isLoading && <Loader label="Loading movies…" />}
      {!hasMovies && error && <ErrorMessage message={error} onRetry={reload} />}
      {!hasMovies && !isLoading && !error && (
        <EmptyState message="No movies to show right now." />
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
    </section>
  );
}
