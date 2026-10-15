/**
 * The cart's rows. Shared by the cart drawer and the cart page, so both always
 * show the items the same way; each parent shows the total in its own place.
 */

import { Trash2 } from "lucide-react";

import { getImageUrl } from "../../api/tmdb";
import type { CartItem, CartItemType } from "../../features/cart/cartSlice";

import { formatPrice } from "../../utils/pricing";
import styles from "./CartItemList.module.css";

type Props = {
  items: CartItem[];
  onRemove: (key: string) => void;
};

// What each cart item type is called in the UI. Record fails the build if a
// type is added without a label.
const TYPE_LABELS: Record<CartItemType, string> = {
  rent: "Rent 48 h",
  buy: "Buy",
};

/**
 * Lists every cart item (poster, title, type pill, price, trash button).
 * Never touches Redux: it receives the items and reports Remove clicks.
 * - The poster has alt="" because the title next to it already names it.
 * - The trash button shows only an icon, so its aria-label ("Remove <title>")
 *   is its name.
 * - Assumes items is not empty; the parent shows the empty state instead.
 * @param props.items - The cart items, in the order they were added.
 * @param props.onRemove - Called with an item's key when its Remove button is clicked.
 */
export default function CartItemList({ items, onRemove }: Props) {
  return (
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
            <span
              className={
                item.type === "buy" ? `${styles.type} ${styles.buy}` : styles.type
              }
            >
              {TYPE_LABELS[item.type]}
            </span>
          </div>

          <span className={styles.price}>{formatPrice(item.price)}</span>

          <button
            type="button"
            className={styles.remove}
            onClick={() => onRemove(item.key)}
            aria-label={`Remove ${item.title}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
