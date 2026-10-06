import { Link, NavLink, Outlet } from "react-router";
import { paths } from "../../routes";
import styles from "./Layout.module.css";

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

export default function Layout() {
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
          <NavLink to={paths.cart} className={navClass}>
            Cart
          </NavLink>
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
    </div>
  );
}
