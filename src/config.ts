/**
 * App-wide settings. Change a value here — never hard-code a language,
 * currency or country anywhere else in the app.
 */

// Language for TMDb responses (titles, overviews).
export const TMDB_LANGUAGE = 'en-US';

// All prices are stored and calculated as whole numbers in this currency.
export const BASE_CURRENCY = 'SEK';

// How prices are written (number format and symbol): 'sv-SE' gives "49 kr".
export const PRICE_LOCALE = 'sv-SE';

// Which country's age rating to show (ISO 3166-1 code).
export const RATING_REGION = 'SE';

// Used when the main country has no rating for a movie.
export const FALLBACK_RATING_REGION = 'US';