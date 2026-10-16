/**
 * A compact movie card inside the MovieAI chat: poster, title, year and rating,
 * linking to the movie, plus a quick "Rent" button.
 */

import { Link } from "react-router";

import type { Movie } from "../../types/tmdb";
import { getImageUrl } from "../../api/tmdb";
import { formatPrice, getRentPrice } from "../../utils/pricing";
import styles from "./MiniMovieCard.module.css";

type Props = {
  movie: Movie;
  to: string;
  inCart: boolean;
  onRent: () => void;
  onOpen: () => void;
};

/**
 * Presentational: it never touches the cart and never builds its own URL.
 * The link and the Rent button are siblings, never nested, so each is its own
 * keyboard stop.
 * @param props.movie - The movie to show.
 * @param props.to - The link destination.
 * @param props.inCart - Shows "✓ In cart" instead of the Rent button.
 * @param props.onRent - Called when Rent is clicked.
 * @param props.onOpen - Called when the link is clicked (the chat closes).
 */
export default function MiniMovieCard({
  movie,
  to,
  inCart,
  onRent,
  onOpen,
}: Props) {
  const year = movie.releaseDate.slice(0, 4);
  const rating = movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;

  return (
    <li className={styles.card}>
      <Link to={to} className={styles.link} onClick={onOpen}>
        <img
          className={styles.poster}
          src={getImageUrl(movie.posterPath, "poster")}
          alt=""
          loading="lazy"
        />
        <span className={styles.title}>{movie.title}</span>
        <span className={styles.meta}>
          {year}
          {rating && (
            <>
              {" · "}
              <span className={styles.star} aria-hidden="true">
                ★
              </span>{" "}
              {rating}
            </>
          )}
        </span>
      </Link>

      {inCart ? (
        <span className={styles.inCart}>
          <span aria-hidden="true">✓</span> In cart
        </span>
      ) : (
        <button
          type="button"
          className={styles.rent}
          onClick={onRent}
          aria-label={`Rent ${movie.title}`}
        >
          Rent {formatPrice(getRentPrice(movie))}
        </button>
      )}
    </li>
  );
}
