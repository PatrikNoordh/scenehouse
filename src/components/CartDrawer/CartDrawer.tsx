/**
 * The cart drawer: a panel that slides in from the right over the current
 * page, showing the cart's items, total and a link to the cart page.
 */

import { useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import { Link } from "react-router";

import type { CartItem } from "../../features/cart/cartSlice";
import CartItemList from "../CartItemList/CartItemList";
import EmptyState from "../EmptyState/EmptyState";
import styles from "./CartDrawer.module.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onRemove: (key: string) => void;
  cartPath: string;
  catalogPath: string;
};

/**
 * A native <dialog> opened with showModal(): the browser handles Esc, the focus
 * trap and the ::backdrop overlay.
 * - An effect syncs isOpen to the dialog (showModal / close); the dialog's
 *   close event calls onClose, so isOpen follows Esc too.
 * - Overlay click: a backdrop click is reported on the <dialog> itself, so
 *   event.target === currentTarget means "outside the panel".
 * - Both links call onClose, so the drawer never stays open over a new page.
 * @param props.isOpen - Whether the drawer is showing.
 * @param props.onClose - Called on Esc, overlay click, the close button, and either link.
 * @param props.items - The cart items.
 * @param props.total - The cart total in whole SEK.
 * @param props.onRemove - Called with an item's key when its Remove button is clicked.
 * @param props.cartPath - Where "Go to cart" leads.
 * @param props.catalogPath - Where "Browse movies" leads when the cart is empty.
 */
export default function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  onRemove,
  cartPath,
  catalogPath,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();

    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby="cart-drawer-title"
      onClose={onClose}
      onClick={handleDialogClick}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id="cart-drawer-title" className={styles.title}>
            Your cart
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close cart"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState message="Your cart is empty.">
            <Link to={catalogPath} onClick={onClose}>
              Browse movies
            </Link>
          </EmptyState>
        ) : (
          <>
            <CartItemList items={items} total={total} onRemove={onRemove} />
            <Link to={cartPath} className={styles.goToCart} onClick={onClose}>
              Go to cart
            </Link>
          </>
        )}
      </div>
    </dialog>
  );
}
