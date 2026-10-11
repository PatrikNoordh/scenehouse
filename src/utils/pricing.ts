import type { Movie } from "../types/tmdb";
import { BASE_CURRENCY, PRICE_LOCALE } from "../config";

type PricedMovie = Pick<Movie, "releaseDate" | "voteAverage">;

type AgeTier = "new" | "recent" | "older" | "unknown";

const RENT_PRICES: Record<AgeTier, number> = {
  new: 49,
  recent: 39,
  older: 29,
  unknown: 39,
};

const BUY_PRICES: Record<AgeTier, number> = {
  new: 149,
  recent: 99,
  older: 79,
  unknown: 99,
};

const TOP_RATED_THRESHOLD = 8;
const RENT_TOP_RATED_BONUS = 10;
const BUY_TOP_RATED_BONUS = 50;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function getAgeTier(releaseDate: string, today: Date): AgeTier {
  const released = new Date(releaseDate);
  if (Number.isNaN(released.getTime())) return "unknown";

  const ageInYears = (today.getTime() - released.getTime()) / MS_PER_YEAR;

  if (ageInYears < 1) return "new";

  if (ageInYears <= 5) return "recent";

  return "older";
}

function isTopRated(movie: PricedMovie): boolean {
  return movie.voteAverage >= TOP_RATED_THRESHOLD;
}

export function getRentPrice(
  movie: PricedMovie,
  today: Date = new Date(),
): number {
  const base = RENT_PRICES[getAgeTier(movie.releaseDate, today)];

  return isTopRated(movie) ? base + RENT_TOP_RATED_BONUS : base;
}

export function getBuyPrice(
  movie: PricedMovie,
  today: Date = new Date(),
): number {
  const base = BUY_PRICES[getAgeTier(movie.releaseDate, today)];

  return isTopRated(movie) ? base + BUY_TOP_RATED_BONUS : base;
}

const priceFormatter = new Intl.NumberFormat(PRICE_LOCALE, {
  style: "currency",
  currency: BASE_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}
