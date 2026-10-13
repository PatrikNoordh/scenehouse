/**
 * The app shell around every page: header with logo, navigation and cart
 * button, the current page, the footer, and the cart drawer.
 */

import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removeItem,
  selectCartCount,
  selectCartItems,
  selectCartTotalPrice,
} from "../../features/cart/cartSlice";
import { paths } from "../../routes";
import CartDrawer from "../CartDrawer/CartDrawer";
import styles from "./Layout.module.css";

/**
 * Class names for a nav link; the link matching the current URL also gets the active style.
 * @param state.isActive - True when the link's route is the current one.
 */
const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

/**
 * The route element wrapping every page, so it also decides for the parts
 * every page shares: it reads the cart from Redux and owns whether the drawer
 * is open. The drawer itself only receives props and reports back.
 * - Reading the cart through selectors re-renders the header whenever the cart
 *   changes, so the badge updates the moment an item is added or removed.
 * - The badge only renders when count > 0. 
 * - The cart button's aria-label ("Cart, 2 items") gives screen readers the
 *   count the badge only shows visually.
 * - Whether the drawer is open is UI state, so it lives in useState, not Redux.
 */
export default function Layout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const total = useAppSelector(selectCartTotalPrice);
  const dispatch = useAppDispatch();

  const cartLabel = count === 1 ? "Cart, 1 item" : `Cart, ${count} items`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={paths.catalog} className={styles.logo}>
          <span aria-hidden="true">🎬</span>
          <span>Scene</span>
          <span className={styles.logoAccent}>House</span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <NavLink to={paths.catalog} end className={navClass}>
            Catalog
          </NavLink>
          <button
            type="button"
            className={styles.cartButton}
            onClick={() => setIsCartOpen(true)}
            aria-label={cartLabel}
            aria-haspopup="dialog"
          >
            <span>Cart</span>
            {count > 0 && <span className={styles.badge}>{count}</span>}
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        total={total}
        onRemove={(key) => dispatch(removeItem(key))}
        cartPath={paths.cart}
        catalogPath={paths.catalog}
      />
    </div>
  );
}
