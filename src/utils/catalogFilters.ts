/**
 * Translates between the catalog URL (?q=&genre=&sort=) and CatalogFilters.
 *
 * The URL is untrusted text anyone can edit, so every value is checked and
 * anything invalid falls back to its default. Pure functions — no React.
 */

import type { CatalogFilters, SortOption } from "../types/tmdb";

export const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  genreId: null,
  sort: "popular",
};

const SORT_OPTIONS: SortOption[] = ["popular", "rating", "newest", "title"];

/**
 * Type guard: true if the text is one of the allowed sort names.
 * Uses .some(===) instead of .includes(): includes on a SortOption[] would
 * only accept a SortOption, and the value is still a plain string here.
 * @param value - Text from the URL.
 */
function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

/**
 * Reads the filters from the URL. Search text is trimmed; a genre must be a
 * whole number above 0; an unknown sort becomes the default.
 * Example: "?q= batman &genre=abc&sort=banana" → { query: "batman", genreId: null, sort: "popular" }.
 * @param params - The URL's search params (from useSearchParams).
 * @returns A valid CatalogFilters.
 */
export function parseCatalogFilters(params: URLSearchParams): CatalogFilters {
  const query = (params.get("q") ?? "").trim();

  const genre = Number(params.get("genre"));

  const sort = params.get("sort") ?? "";

  return {
    query,
    genreId: Number.isInteger(genre) && genre > 0 ? genre : null,
    sort: isSortOption(sort) ? sort : DEFAULT_FILTERS.sort,
  };
}

/**
 * Builds the URL search params for a set of filters. Default values are left
 * out, so the plain catalog stays "/" and shared links stay short.
 * @param filters - The filters to write.
 * @returns e.g. "q=batman&sort=rating"
 */
export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);

  if (filters.genreId !== null) params.set("genre", String(filters.genreId));

  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);

  return params;
}

/**
 * True when at least one filter differs from its default — decides whether
 * "Clear filters" is shown.
 * @param filters - The current filters.
 */
export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.query !== DEFAULT_FILTERS.query ||
    filters.genreId !== DEFAULT_FILTERS.genreId ||
    filters.sort !== DEFAULT_FILTERS.sort
  );
}

/**
 * One string per combination of filters, used as the results component's
 * React key: a new key mounts a fresh component, which resets pagination and
 * aborts the previous request. The | separators keep values from merging
 * ("a" + 12 vs "a1" + 2).
 * @param filters - The current filters.
 * @returns e.g. "batman|28|rating"
 */
export function filtersKey(filters: CatalogFilters): string {
  return `${filters.query}|${filters.genreId ?? ""}|${filters.sort}`;
}
