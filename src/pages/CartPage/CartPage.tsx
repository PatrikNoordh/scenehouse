/**
 * The cart page ("/cart"): the items next to an order summary with rent and
 * buy subtotals, the total, a demo checkout and Clear cart.
 */

import { Link } from "react-router";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearCart,
  removeItem,
  selectCartItems,
  selectCartTotalPrice,
} from "../../features/cart/cartSlice";
import { paths } from "../../routes";
import { formatPrice, sumPrices } from "../../utils/pricing";

import CartItemList from "../../components/CartItemList/CartItemList";
import EmptyState from "../../components/EmptyState/EmptyState";
import styles from "./CartPage.module.css";

/** @param count - Number of movies. @returns "1 movie" or "3 movies". */
function movieCount(count: number): string {
  return count === 1 ? "1 movie" : `${count} movies`;
}

/**
 * Reads the cart with the same selectors and renders it with the same list
 * component as the cart drawer, so the page and the drawer always show the
 * same items and the same total.
 * - An empty cart shows "Your cart is empty." with a link back to the catalog.
 * - The cart has no loading or error state: it is local Redux data, available
 *   immediately.
 * - The subtotals are derived from the items on every render, never stored.
 * - clearCart() is called with parentheses: the action creator returns the
 *   action to dispatch. dispatch(clearCart) would be taken for a thunk and
 *   silently do nothing.
 */
export default function CartPage() {
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotalPrice);
  const dispatch = useAppDispatch();
  const rentItems = items.filter((item) => item.type === "rent");
  const buyItems = items.filter((item) => item.type === "buy");

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Your cart</h1>
        {items.length > 0 && (
          <p className={styles.count}>{movieCount(items.length)}</p>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState message="Your cart is empty.">
          <Link to={paths.catalog}>Browse movies</Link>
        </EmptyState>
      ) : (
        <div className={styles.layout}>
          <div className={styles.items}>
            <CartItemList
              items={items}
              onRemove={(key) => dispatch(removeItem(key))}
            />
            <p className={styles.saved}>Your cart is saved.</p>
          </div>

          <aside className={styles.summary} aria-labelledby="summary-title">
            <h2 id="summary-title" className={styles.summaryTitle}>
              Order summary
            </h2>

            {rentItems.length > 0 && (
              <p className={styles.row}>
                <span>Rent 48 h · {movieCount(rentItems.length)}</span>
                <span>{formatPrice(sumPrices(rentItems))}</span>
              </p>
            )}
            {buyItems.length > 0 && (
              <p className={styles.row}>
                <span>Buy · {movieCount(buyItems.length)}</span>
                <span>{formatPrice(sumPrices(buyItems))}</span>
              </p>
            )}

            <p className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.totalPrice}>{formatPrice(total)}</span>
            </p>

            <button type="button" className={styles.checkout} disabled>
              Checkout (demo)
            </button>
            <p className={styles.note}>Checkout is not part of this demo.</p>

            <button
              type="button"
              className={styles.clear}
              onClick={() => dispatch(clearCart())}
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
