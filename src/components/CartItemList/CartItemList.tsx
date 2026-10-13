/**
 * The cart's rows and total. Shared by the cart drawer and the cart page, so
 * both always show the cart the same way.
 */

import { getImageUrl } from "../../api/tmdb";
import type { CartItem, CartItemType } from "../../features/cart/cartSlice";

import { formatPrice } from "../../utils/pricing";
import styles from "./CartItemList.module.css";

type Props = {
  items: CartItem[];
  total: number;
  onRemove: (key: string) => void;
};

// What each cart item type is called in the UI. Record fails the build if a
// type is added without a label.
const TYPE_LABELS: Record<CartItemType, string> = {
  rent: "Rent 48 h",
  buy: "Buy",
};

/**
 * Lists every cart item (poster, title, Rent 48 h / Buy, price, Remove) with
 * the total below. Never touches Redux: it receives the items and the total,
 * and reports Remove clicks.
 * - The poster has alt="" because the title next to it already names it;
 *   a screen reader would otherwise read the title twice.
 * - Each Remove button's accessible name includes the title,
 *  so the buttons can be told apart without seeing the row.
 * - Assumes items is not empty; the parent shows the empty state instead.
 * @param props.items - The cart items, in the order they were added.
 * @param props.total - The sum of all prices in whole SEK, from the cart's total selector.
 * @param props.onRemove - Called with an item's key when its Remove button is clicked.
 */
export default function CartItemList({ items, total, onRemove }: Props) {
  return (
    <div className={styles.cart}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key} className={styles.item}>
            <img
              className={styles.poster}
              src={getImageUrl(item.posterPath, "poster")}
              alt=""
              loading="lazy"
            />

            <div className={styles.info}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.type}>{TYPE_LABELS[item.type]}</span>
            </div>

            <span className={styles.price}>{formatPrice(item.price)}</span>

            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemove(item.key)}
              aria-label={`Remove ${item.title}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <p className={styles.total}>
        <span>Total</span>
        <span className={styles.totalPrice}>{formatPrice(total)}</span>
      </p>
    </div>
  );
}
