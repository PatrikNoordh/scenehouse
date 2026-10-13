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

const OPTIONS: { type: CartItemType; label: string; action: string }[] = [
  { type: "rent", label: "Rent 48 h", action: "Rent" },
  { type: "buy", label: "Buy", action: "Buy" },
];

/**
 * Shows both options with their prices ( via formatPrice).
 *  The option in the cart gets a frame, "In cart ✓" and a Remove
 * button; the other keeps its normal button, which replaces the choice.
 * Never touches Redux: it receives what's in the cart and reports clicks.
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
    <section className={styles.options}>
      <h2 className={styles.heading}>Rent or buy</h2>
      <div className={styles.choices}>
        {OPTIONS.map((option) => {
          const isInCart = inCart === option.type;

          return (
            <div
              key={option.type}
              className={
                isInCart ? `${styles.choice} ${styles.selected}` : styles.choice
              }
            >
              <span className={styles.label}>{option.label}</span>
              <span className={styles.price}>
                {formatPrice(prices[option.type])}
              </span>

              {isInCart ? (
                <>
                  <span className={styles.inCart}>
                    In cart <span aria-hidden="true">✓</span>
                  </span>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={onRemove}
                  >
                    Remove
                  </button>
                </>
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
