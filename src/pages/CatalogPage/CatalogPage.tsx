/**
 * The catalog page ("/"): the featured hero, genre chips, the heading with the
 * sort menu, and the results. The filters live in the URL (?q=&genre=&sort=),
 * so links, reloads and the Back button all restore the same results. The
 * search box itself is in the navbar and writes ?q= from any page.
 */

import { useSearchParams } from "react-router";

import type { CatalogFilters } from "../../types/tmdb";
import { useGenres } from "../../hooks/useGenres";
import {
  filtersKey,
  hasActiveFilters,
  parseCatalogFilters,
  toSearchParams,
} from "../../utils/catalogFilters";

import FilterBar from "./FilterBar";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addItem,
  createCartItem,
  selectCartItems,
} from "../../features/cart/cartSlice";
import { useFeaturedMovie } from "../../hooks/useFeaturedMovie";
import { paths } from "../../routes";
import FeaturedHero from "./FeaturedHero";
import SortSelect from "./SortSelect";
import CatalogResults from "./CatalogResults";

import styles from "./CatalogPage.module.css";

/**
 * Reads the filters from the URL, writes them back on every change, and
 * composes the hero, chips, sort menu and results. It keeps no filter state.
 *
 * - Each change goes through updateFilters → a new URL → a new history entry,
 *   which is what makes Back restore the previous search.
 * - CatalogResults gets key={filtersKey(filters)}, so any filter change mounts
 *   fresh results (page 1, old request aborted). The chips and sort menu sit
 *   outside that key, so they keep focus.
 * - Genres are loaded here, outside the keyed results, so they load once.
 * - The hero only shows on the plain catalog (no search, genre or sort):
 * - The hero reports "rent" / "buy"; the page builds the item with
 *   createCartItem and dispatches it. featuredInCart is derived from the cart
 *   on every render, never stored. featuredMovie is a const, which is why
 *   TypeScript keeps it narrowed to a Movie inside the onAdd callback.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseCatalogFilters(searchParams);

  const { genres } = useGenres();

  const { movie: featuredMovie, isLoading: featuredLoading } =
    useFeaturedMovie();

  const cartItems = useAppSelector(selectCartItems);
  const dispatch = useAppDispatch();

  const featuredInCart =
    cartItems.find((item) => item.movieId === featuredMovie?.id)?.type ?? null;

  const showHero = !hasActiveFilters(filters);

  function updateFilters(changes: Partial<CatalogFilters>) {
    setSearchParams(toSearchParams({ ...filters, ...changes }));
  }

  const heading = filters.query
    ? `Results for "${filters.query}"`
    : hasActiveFilters(filters)
      ? "Movies"
      : "Popular right now";

  return (
    <section className={styles.page}>
      {showHero && featuredLoading && (
        <div className={styles.heroPlaceholder} aria-hidden="true" />
      )}
      {showHero && featuredMovie && (
        <FeaturedHero
          movie={featuredMovie}
          detailsPath={paths.movie(featuredMovie.id)}
          inCart={featuredInCart}
          onAdd={(type) =>
            dispatch(addItem(createCartItem(featuredMovie, type)))
          }
        />
      )}

      <FilterBar
        genreId={filters.genreId}
        genres={genres}
        onGenreChange={(genreId) => updateFilters({ genreId })}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.heading}>{heading}</h1>
        <SortSelect
          sort={filters.sort}
          onSortChange={(sort) => updateFilters({ sort })}
        />
      </div>

      <CatalogResults key={filtersKey(filters)} filters={filters} />
    </section>
  );
}
