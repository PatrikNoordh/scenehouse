/**
 * The catalog's "Featured this week" hero: backdrop, title, overview, rating,
 * year, and Rent / Buy / View details. Presentational — it never reads the
 * cart, never dispatches and never builds its own link URL.
 */

import { Link } from "react-router";

import type { Movie } from "../../types/tmdb";
import type { CartItemType } from "../../features/cart/cartSlice";
import { getImageUrl } from "../../api/tmdb";
import { formatPrice, getBuyPrice, getRentPrice } from "../../utils/pricing";
import styles from "./FeaturedHero.module.css";

type Props = {
  movie: Movie;
  detailsPath: string;
  inCart: CartItemType | null;
  onAdd: (type: CartItemType) => void;
};

// The two buttons, in order; rent first because it is the primary (yellow) one.
const OPTIONS: { type: CartItemType; label: string }[] = [
  { type: "rent", label: "Rent" },
  { type: "buy", label: "Buy" },
];

/**
 * - The option already in the cart shows "✓ In cart" and is disabled; the other
 *   one stays clickable and replaces it (the cart keeps one item per movie).
 * - Both images and the ★ are decoration (empty alt / aria-hidden): the title,
 *   rating number and year are there as text.
 * - The section is named by the title (aria-labelledby), so screen readers
 *   announce it as a region with the movie's name.
 * @param props.movie - The movie to feature.
 * @param props.detailsPath - Where "View details" leads.
 * @param props.inCart - The option in the cart for this movie, or null.
 * @param props.onAdd - Called with "rent" or "buy" when that button is clicked.
 */
export default function FeaturedHero({
  movie,
  detailsPath,
  inCart,
  onAdd,
}: Props) {
  const year = movie.releaseDate.slice(0, 4);
  const rating = movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;

  const prices: Record<CartItemType, number> = {
    rent: getRentPrice(movie),
    buy: getBuyPrice(movie),
  };

  return (
    <section className={styles.hero} aria-labelledby="featured-title">
      <img
        className={styles.backdrop}
        src={getImageUrl(movie.backdropPath, "backdrop")}
        alt=""
      />

      <div className={styles.content}>
        <p className={styles.eyebrow}>Featured this week</p>
        <h2 id="featured-title" className={styles.title}>
          {movie.title}
        </h2>
        {movie.overview && <p className={styles.overview}>{movie.overview}</p>}

        <p className={styles.meta}>
          {rating && (
            <span>
              <span className={styles.star} aria-hidden="true">
                ★
              </span>{" "}
              {rating}
            </span>
          )}
          {year && <span>{year}</span>}
        </p>

        <div className={styles.actions}>
          {OPTIONS.map((option) => {
            const isInCart = inCart === option.type;
            return (
              <button
                key={option.type}
                type="button"
                className={
                  option.type === "rent" ? styles.primary : styles.secondary
                }
                onClick={() => onAdd(option.type)}
                disabled={isInCart}
              >
                {isInCart
                  ? "✓ In cart"
                  : `${option.label} ${formatPrice(prices[option.type])}`}
              </button>
            );
          })}
          <Link to={detailsPath} className={styles.details}>
            View details
          </Link>
        </div>
      </div>
    </section>
  );
}
