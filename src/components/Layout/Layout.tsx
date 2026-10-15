/**
 * The app shell around every page: header with logo, search, navigation and
 * cart button, the current page, the footer, and the cart drawer.
 */

import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removeItem,
  selectCartCount,
  selectCartItems,
  selectCartTotalPrice,
} from "../../features/cart/cartSlice";
import { paths } from "../../routes";
import {
  DEFAULT_FILTERS,
  parseCatalogFilters,
  toSearchParams,
} from "../../utils/catalogFilters";
import CartDrawer from "../CartDrawer/CartDrawer";
import SearchBar from "../SearchBar/SearchBar";
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
 * - Search: the URL is the only place the search lives. On the catalog the box
 *   shows the URL's ?q=; on other pages it starts empty (DEFAULT_FILTERS).
 *   handleSearch always goes to the catalog and keeps the current genre and
 *   sort when already there.
 */
export default function Layout() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const total = useAppSelector(selectCartTotalPrice);
  const dispatch = useAppDispatch();

  const [searchParams] = useSearchParams();

  const location = useLocation();
  const navigate = useNavigate();

  const isCatalog = location.pathname === paths.catalog;
  const filters = isCatalog
    ? parseCatalogFilters(searchParams)
    : DEFAULT_FILTERS;

  function handleSearch(query: string) {
    navigate({
      pathname: paths.catalog,
      search: toSearchParams({ ...filters, query }).toString(),
    });
  }

  const cartLabel = count === 1 ? "Cart, 1 item" : `Cart, ${count} items`;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={paths.catalog} className={styles.logo}>
          <span aria-hidden="true">🎬</span>
          <span>Scene</span>
          <span className={styles.logoAccent}>House</span>
        </Link>

        <div className={styles.search}>
          <SearchBar query={filters.query} onSearch={handleSearch} />
        </div>

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
            <span className={styles.cartIcon}>
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H6" />
              </svg>
              {count > 0 && <span className={styles.badge}>{count}</span>}
            </span>
            <span className={styles.cartText}>Cart</span>
          </button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerLogo}>
          <span aria-hidden="true">🎬</span>
          <span>Scene</span>
          <span className={styles.logoAccent}>House</span>
        </p>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer"
          className={styles.tmdbLink}
        >
          <img
            src="/tmdb-logo.svg"
            alt="The Movie Database (TMDB)"
            width={273}
            height={36}
            className={styles.tmdbLogo}
          />
        </a>
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
        <p className={styles.credits}>
          Movie data from TMDB · School project, 2026
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
