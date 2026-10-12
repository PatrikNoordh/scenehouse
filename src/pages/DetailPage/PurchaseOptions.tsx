/**
 * The two ways to get a movie — rent for 48 hours or buy — with their prices.
 */

import type { Movie } from "../../types/tmdb";
import { formatPrice, getBuyPrice, getRentPrice } from "../../utils/pricing";
import styles from "./PurchaseOptions.module.css";

type Props = {
  movie: Movie;
};

/**
 * Prices come from the pricing model and are shown via formatPrice.
 * Takes a Movie.
 * The buttons are not connected to the cart yet.
 * @param props.movie - The movie to price.
 */
export default function PurchaseOptions({ movie }: Props) {
  const rentPrice = getRentPrice(movie);
  const buyPrice = getBuyPrice(movie);

  return (
    <section className={styles.options}>
      <h2 className={styles.heading}>Rent or buy</h2>
      <div className={styles.choices}>
        <div className={styles.choice}>
          <span className={styles.label}>Rent 48 h</span>
          <span className={styles.price}>{formatPrice(rentPrice)}</span>
          <button type="button" className={styles.primary}>
            Rent
          </button>
        </div>

        <div className={styles.choice}>
          <span className={styles.label}>Buy</span>
          <span className={styles.price}>{formatPrice(buyPrice)}</span>
          <button type="button" className={styles.secondary}>
            Buy
          </button>
        </div>
      </div>
    </section>
  );
}
