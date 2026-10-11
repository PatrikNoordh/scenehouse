import type { CatalogFilters, SortOption } from "../types/tmdb";

export const DEFAULT_FILTERS: CatalogFilters = {
  query: "",
  genreId: null,
  sort: "popular",
};

const SORT_OPTIONS: SortOption[] = ["popular", "rating", "newest", "title"];

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((option) => option === value);
}

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

export function toSearchParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);

  if (filters.genreId !== null) params.set("genre", String(filters.genreId));

  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);

  return params;
}

export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.query !== DEFAULT_FILTERS.query ||
    filters.genreId !== DEFAULT_FILTERS.genreId ||
    filters.sort !== DEFAULT_FILTERS.sort
  );
}

export function filtersKey(filters: CatalogFilters): string {
  return `${filters.query}|${filters.genreId ?? ""}|${filters.sort}`;
}
