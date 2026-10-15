/**
 * "You might also like": a grid of movie cards from the movie's recommendations.
 */

import type { Movie } from "../../types/tmdb";
import { paths } from "../../routes";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./Recommendations.module.css";

type Props = {
  movies: Movie[];
};

/**
 * Draws the movies it is given — the parent decides how many.
 * @param props.movies - The recommended movies.
 */
export default function Recommendations({ movies }: Props) {
  return (
    <section className={styles.section} aria-labelledby="recommendations-title">
      <h2 id="recommendations-title" className={styles.heading}>
        You might also like
      </h2>
      <ul className={styles.grid}>
        {movies.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={movie} to={paths.movie(movie.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
