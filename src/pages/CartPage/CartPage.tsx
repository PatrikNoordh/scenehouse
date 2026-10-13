/**
 * The cart page ("/cart"): every item in the cart, the total, and a way to
 * remove one item or clear the whole cart.
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
import CartItemList from "../../components/CartItemList/CartItemList";
import EmptyState from "../../components/EmptyState/EmptyState";
import styles from "./CartPage.module.css";

/**
 * Reads the cart with the same selectors and renders it with the same list
 * component as the cart drawer, so the page and the drawer always show the
 * same items and the same total.
 * - An empty cart shows "Your cart is empty." with a link back to the catalog.
 * - The cart has no loading or error state: it is local Redux data, available
 *   immediately.
 * - clearCart() is called with parentheses: the action creator returns the
 *   action to dispatch. dispatch(clearCart) would be taken for a thunk and
 *   silently do nothing.
 */
export default function CartPage() {
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotalPrice);
  const dispatch = useAppDispatch();

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>Your cart</h1>
      {items.length === 0 ? (
        <EmptyState message="Your cart is empty.">
          <Link to={paths.catalog}>Browse movies</Link>
        </EmptyState>
      ) : (
        <>
          <CartItemList
            items={items}
            total={total}
            onRemove={(key) => dispatch(removeItem(key))}
          />
          <button
            type="button"
            className={styles.clear}
            onClick={() => dispatch(clearCart())}
          >
            Clear cart
          </button>
        </>
      )}
    </section>
  );
}
