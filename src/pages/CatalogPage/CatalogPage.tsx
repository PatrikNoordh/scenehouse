import { paths } from "../../routes";

import { useMovies } from "../../hooks/useMovies";

import Loader from "../../components/Loader/Loader";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";
import EmptyState from "../../components/EmptyState/EmptyState";
import MovieCard from "../../components/MovieCard/MovieCard";

import styles from "./CatalogPage.module.css";

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
