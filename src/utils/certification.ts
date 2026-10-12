/**
 * Picks the age rating to show for a movie. Pure — the countries are passed in
 * by the caller (from config.ts), so this file knows no country codes.
 */

import type { ReleaseCertification } from "../types/tmdb";

/**
 * The rating for the main country, otherwise the fallback country's,
 * otherwise null — so the UI hides the badge instead of showing an empty one.
 * Countries without a rating were already removed when the data was normalized.
 * Example: [{ US, "R" }, { SE, "15" }], "SE", "US" → "15".
 * @param certifications - The movie's ratings per country.
 * @param region - The preferred country, e.g. "SE".
 * @param fallbackRegion - Used when the preferred country has no rating, e.g. "US".
 * @returns The rating text, or null if neither country has one.
 */
export function getCertification (
    certifications: ReleaseCertification[],
    region: string,
    fallbackRegion: string,
): string | null {

    const ratingFor = (country: string) => 
        certifications.find((item) => item.country === country)?.certification

    return ratingFor(region) ?? ratingFor(fallbackRegion) ?? null;
}