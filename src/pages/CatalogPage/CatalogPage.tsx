/**
 * The catalog page ("/"): search, genre filter and sorting above the results.
 * The filters live in the URL (?q=&genre=&sort=), so links, reloads and the
 * Back button all restore the same results.
 */

import { useSearchParams } from "react-router";

import type { CatalogFilters } from "../../types/tmdb";
import { useGenres } from "../../hooks/useGenres";
import {
  DEFAULT_FILTERS,
  filtersKey,
  hasActiveFilters,
  parseCatalogFilters,
  toSearchParams,
} from "../../utils/catalogFilters";

import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import CatalogResults from "./CatalogResults";

import styles from "./CatalogPage.module.css";

/**
 * Reads the filters from the URL, writes them back on every change, and
 * composes the search bar, filter bar and results. It keeps no filter state.
 *
 * - Each change goes through updateFilters → a new URL → a new history entry,
 *   which is what makes Back restore the previous search.
 * - CatalogResults gets key={filtersKey(filters)}, so any filter change mounts
 *   fresh results (page 1, old request aborted). The search bar and filters
 *   sit outside that key, so they keep focus while the user types.
 * - Genres are loaded here, outside the keyed results, so they load once.
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = parseCatalogFilters(searchParams);

  const {
    genres,
    isLoading: genresLoading,
    hasError: genresFailed,
  } = useGenres();

  function updateFilters(changes: Partial<CatalogFilters>) {
    setSearchParams(toSearchParams({ ...filters, ...changes }));
  }

  const heading = filters.query
    ? `Results for "${filters.query}"`
    : hasActiveFilters(filters)
      ? "Movies"
      : "Popular movies";

  return (
    <section className={styles.page}>
      <h1 className={styles.heading}>{heading}</h1>

      <div className={styles.controls}>
        <SearchBar
          query={filters.query}
          onSearch={(query) => updateFilters({ query })}
        />
        <FilterBar
          genreId={filters.genreId}
          sort={filters.sort}
          genres={genres}
          genresDisabled={genresLoading || genresFailed}
          showClear={hasActiveFilters(filters)}
          onGenreChange={(genreId) => updateFilters({ genreId })}
          onSortChange={(sort) => updateFilters({ sort })}
          onClear={() => setSearchParams(toSearchParams(DEFAULT_FILTERS))}
        />
      </div>

      <CatalogResults key={filtersKey(filters)} filters={filters} />
    </section>
  );
}
