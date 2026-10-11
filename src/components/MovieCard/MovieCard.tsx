/**
 * One movie in a grid: poster, title, year, rating and a "from" price.
 * Presentational — it never fetches and never builds its own link URL.
 */

import { Link } from "react-router";
import type { Movie } from "../../types/tmdb";
import { getImageUrl } from "../../api/tmdb";
import { formatPrice, getRentPrice } from "../../utils/pricing";
import styles from "./MovieCard.module.css";

type Props = {
  movie: Movie;
  to: string;
};

/**
 * A movie card where the whole card is one link.
 *
 * - The poster has an empty alt on purpose: the title is right below it inside
 *   the same link, so a non-empty alt would make screen readers read it twice.
 * - Year and rating are only shown when known; rating is null (not 0) when
 *   unrated, because React would render a stray "0" for `0 && …`.
 * - "from" shows the rent price — always the cheapest way to watch.
 *
 * @param props.movie - The movie to show.
 * @param props.to - The link destination.
 */
export default function MovieCard({ movie, to }: Props) {
  const year = movie.releaseDate.slice(0, 4);
  const rating = movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;

  return (
    <Link to={to} className={styles.card}>
      <img
        className={styles.poster}
        src={getImageUrl(movie.posterPath, "poster")}
        alt=""
        loading="lazy"
      />
      <div className={styles.body}>
        <h2 className={styles.title}>{movie.title}</h2>
        <p className={styles.meta}>
          {year && <span>{year}</span>}
          {rating && (
            <span>
              <span aria-hidden="true">★</span> {rating}
            </span>
          )}
        </p>
        <p className={styles.price}>from {formatPrice(getRentPrice(movie))}</p>
      </div>
    </Link>
  );
}
