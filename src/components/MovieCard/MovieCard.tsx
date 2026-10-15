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
  inCart?: boolean;
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
export default function MovieCard({ movie, to, inCart = false }: Props) {
  const year = movie.releaseDate.slice(0, 4);
  const rating = movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;

  return (
    <Link to={to} className={styles.card}>
      <div className={styles.media}>
        <img
          className={styles.poster}
          src={getImageUrl(movie.posterPath, "poster")}
          alt=""
          loading="lazy"
        />
        {inCart && (
          <span className={styles.badge}>
            <span aria-hidden="true">✓</span> In cart
          </span>
        )}
        <span className={styles.hoverLabel} aria-hidden="true">
          View details
        </span>
      </div>

      <div className={styles.body}>
        <h2 className={styles.title}>{movie.title}</h2>
        {year && <p className={styles.year}>{year}</p>}
        <p className={styles.row}>
          {rating && (
            <span className={styles.rating}>
              <span className={styles.star} aria-hidden="true">
                ★
              </span>{" "}
              {rating}
            </span>
          )}{" "}
          <span className={styles.price}>
            <span className={styles.from}>from</span>{" "}
            {formatPrice(getRentPrice(movie))}
          </span>
        </p>
      </div>
    </Link>
  );
}
