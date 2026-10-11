/**
 * Rental (48 h) and purchase prices, in whole SEK.
 *
 * Rules — a movie's price depends only on its release date and rating:
 *
 *   Age                                    Rent   Buy
 *   Released within 1 year / unreleased      49   149
 *   1–5 years old                            39    99
 *   Older than 5 years                       29    79
 *   No release date                          39    99
 *
 *   Rated 8.0 or higher: rent +10, buy +50.
 *
 * - Range: rent 29–59, buy 79–199, so rent is always cheaper than buy.
 * - Deterministic: the same movie on the same day always gets the same price.
 * - Every price shown in the UI goes through formatPrice() — no "kr" strings
 *   anywhere else, so the currency can be changed in one place.
 */

import type { Movie } from "../types/tmdb";
import { BASE_CURRENCY, PRICE_LOCALE } from "../config";

// Only the fields a price depends on — any Movie or MovieDetails fits.
type PricedMovie = Pick<Movie, "releaseDate" | "voteAverage">;

type AgeTier = "new" | "recent" | "older" | "unknown";

// Base prices per age tier. Record<AgeTier, number> fails the build if a tier
// has no price, so a movie can never end up with an undefined price.
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

// voteAverage is 0–10; this rating and above adds the bonus below.
const TOP_RATED_THRESHOLD = 8;
const RENT_TOP_RATED_BONUS = 10;
const BUY_TOP_RATED_BONUS = 50;

// Dates are compared in milliseconds; 365.25 days covers leap years.
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Sorts a movie into an age tier.
 * A missing or invalid date gives 'unknown' (new Date('') is an Invalid Date,
 * whose getTime() is NaN). A future date gives a negative age, so a movie that
 * isn't released yet counts as 'new'.
 * @param releaseDate - 'YYYY-MM-DD', or '' if TMDb has no date.
 * @param today - The date to measure the movie's age from.
 */
function getAgeTier(releaseDate: string, today: Date): AgeTier {
  const released = new Date(releaseDate);
  if (Number.isNaN(released.getTime())) return "unknown";

  const ageInYears = (today.getTime() - released.getTime()) / MS_PER_YEAR;

  if (ageInYears < 1) return "new";

  if (ageInYears <= 5) return "recent";

  return "older";
}

/**
 * True when a movie is rated high enough for the bonus.
 * An unrated movie has voteAverage 0, so it never gets the bonus.
 * @param movie - Any movie with a voteAverage.
 */
function isTopRated(movie: PricedMovie): boolean {
  return movie.voteAverage >= TOP_RATED_THRESHOLD;
}

/**
 * The 48-hour rental price: the base price for the movie's age tier, plus the
 * top-rated bonus.
 * @param movie - Any movie with a releaseDate and voteAverage.
 * @param today - Defaults to now. Pass a fixed date in tests so the result never changes.
 * @returns The price in whole SEK (29–59).
 */
export function getRentPrice(
  movie: PricedMovie,
  today: Date = new Date(),
): number {
  const base = RENT_PRICES[getAgeTier(movie.releaseDate, today)];

  return isTopRated(movie) ? base + RENT_TOP_RATED_BONUS : base;
}

/**
 * The purchase price: the base price for the movie's age tier, plus the
 * top-rated bonus.
 * @param movie - Any movie with a releaseDate and voteAverage.
 * @param today - Defaults to now. Pass a fixed date in tests so the result never changes.
 * @returns The price in whole SEK (79–199).
 */
export function getBuyPrice(
  movie: PricedMovie,
  today: Date = new Date(),
): number {
  const base = BUY_PRICES[getAgeTier(movie.releaseDate, today)];

  return isTopRated(movie) ? base + BUY_TOP_RATED_BONUS : base;
}

// Created once and reused 
const priceFormatter = new Intl.NumberFormat(PRICE_LOCALE, {
  style: "currency",
  currency: BASE_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats a price for display, e.g. 49 → "49 kr".
 * The only place a currency symbol is produced. Intl puts a non-breaking space
 * (U+00A0) between the number and "kr", so they never wrap onto separate lines.
 * @param amount - A price in whole SEK.
 */
export function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}
