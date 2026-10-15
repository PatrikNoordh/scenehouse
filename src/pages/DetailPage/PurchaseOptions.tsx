/**
 * The two ways to get a movie — rent for 48 hours or buy — with their prices.
 */

import type { Movie } from "../../types/tmdb";
import type { CartItemType } from "../../features/cart/cartSlice";
import { formatPrice, getBuyPrice, getRentPrice } from "../../utils/pricing";
import styles from "./PurchaseOptions.module.css";

type Props = {
  movie: Movie;
  inCart: CartItemType | null;
  onAdd: (type: CartItemType) => void;
  onRemove: () => void;
};

const OPTIONS: {
  type: CartItemType;
  label: string;
  hint: string;
  action: string;
}[] = [
  {
    type: "rent",
    label: "Rent 48 h",
    hint: "Starts when you press play",
    action: "Rent",
  },
  {
    type: "buy",
    label: "Buy",
    hint: "Yours forever in your library",
    action: "Buy",
  },
];

/**
 * "Choose how to watch": one row per option with a hint and its price.
 * The option in the cart shows "✓ In cart" and Remove; the other one's button
 * replaces it. Never touches Redux: it receives what's in the cart and reports clicks.
 * @param props.movie - The movie to price.
 * @param props.inCart - The option in the cart for this movie, or null.
 * @param props.onAdd - Called with "rent" or "buy" when that button is clicked.
 * @param props.onRemove - Called when Remove is clicked.
 */
export default function PurchaseOptions({
  movie,
  inCart,
  onAdd,
  onRemove,
}: Props) {
  const prices: Record<CartItemType, number> = {
    rent: getRentPrice(movie),
    buy: getBuyPrice(movie),
  };

  return (
    <section className={styles.options} aria-labelledby="purchase-title">
      <h2 id="purchase-title" className={styles.heading}>
        Choose how to watch
      </h2>

      <ul className={styles.choices}>
        {OPTIONS.map((option) => {
          const isInCart = inCart === option.type;

          return (
            <li
              key={option.type}
              className={
                isInCart ? `${styles.choice} ${styles.selected}` : styles.choice
              }
            >
              <div className={styles.text}>
                <span className={styles.label}>{option.label}</span>
                <span className={styles.hint}>{option.hint}</span>
              </div>

              <span className={styles.price}>
                {formatPrice(prices[option.type])}
              </span>

              {isInCart ? (
                <div className={styles.cartActions}>
                  <span className={styles.inCart}>
                    <span aria-hidden="true">✓</span> In cart
                  </span>
                  <button
                    type="button"
                    className={styles.remove}
                    onClick={onRemove}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={
                    option.type === "rent" ? styles.primary : styles.secondary
                  }
                  onClick={() => onAdd(option.type)}
                >
                  {option.action}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
