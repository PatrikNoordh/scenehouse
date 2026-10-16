/**
 * Safe readers for data from outside the app (APIs, localStorage, LLM answers).
 *
 * Outside data is `unknown` until one of these functions has checked it. Each
 * reader returns a value of the promised type — or a safe default — so one
 * missing or wrong field never crashes the app. Real failures (no usable data
 * at all) are thrown by the caller, e.g. toRecord() in src/api/tmdb.ts.
 */

/**
 * Type guard: true for a plain object like { title: 'Up' }; false for null,
 * arrays, strings and numbers. `typeof null` is 'object' in JS, so null is
 * excluded by hand, and arrays are excluded because they are objects too.
 * @param value - Anything, typically parsed JSON.
 * @returns true if value can be read with the read* functions below.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads text that should always exist (title, name).
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The string, or '' if it is missing or not a string.
 */
export function readString(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === "string" ? value : "";
}

/**
 * Reads optional text like image paths, where "empty" and "missing" mean the same.
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The string, or null if it is missing, null, '' or not a string.
 */
export function readNullableString(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const value = obj[key];
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Reads a number (id, vote average). NaN and Infinity are rejected too,
 * because they are also typeof 'number'.
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The number, or 0 if it is missing, not a number, NaN or Infinity.
 */
export function readNumber(obj: Record<string, unknown>, key: string): number {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Reads a true/false flag (e.g. video.official).
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The boolean, or false if it is missing or not a boolean.
 */
export function readBoolean(
  obj: Record<string, unknown>,
  key: string,
): boolean {
  const value = obj[key];
  return typeof value === "boolean" ? value : false;
}

/**
 * Reads a nested object, like TMDb's "credits": { cast: [...] }.
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The object, or {} (empty but safe to read) if it is not a plain object.
 */
export function readRecord(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = obj[key];
  return isRecord(value) ? value : {};
}

/**
 * Reads a list. The items stay `unknown`: whoever reads them must check each
 * one, e.g. with .filter(isRecord).
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The array, or [] if it is missing or not an array.
 */
export function readArray(
  obj: Record<string, unknown>,
  key: string,
): unknown[] {
  const value = obj[key];
  return Array.isArray(value) ? value : [];
}

/**
 * Reads an optional number, where "missing" must not become 0 (a year or a rating).
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The number, or null if it is missing, not a number, NaN or Infinity.
 */
export function readNullableNumber(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const value = obj[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Reads a list of texts, dropping every item that isn't a string.
 * @param obj - A checked object (see isRecord).
 * @param key - The field to read.
 * @returns The strings, or [] if the field is missing or not an array.
 */
export function readStringArray(
  obj: Record<string, unknown>,
  key: string,
): string[] {
  return readArray(obj, key).filter(
    (item): item is string => typeof item === "string",
  );
}
