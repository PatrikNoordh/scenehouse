/* Safe readers for data from outside the app (APIs, localStorage, LLM answers).
 Outside data is `unknown` until one of these functions has checked it.
 Each reader returns a value of the promised type — or a safe default — so one
 missing or wrong field never crashes the app. Real failures are thrown elsewhere.
*/

// Type guard: true for a plain object like { title: 'Up' } — false for null, arrays,
// strings and numbers. `typeof null` is 'object' in JS, so null is excluded by hand.
export function isRecord(value: unknown): value is Record<string,unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Text that should always exist (title, name). Missing or wrong type → ''.
export function readString(obj: Record<string, unknown>, key: string): string {
    const value = obj[key];
    return typeof value === 'string' ? value : '';
}

// Optional text like image paths. Missing, null or '' → null ("no value").
export function readNullableString(obj: Record<string, unknown>, key: string): string | null {
    const value = obj[key];
    return typeof value === 'string' && value !== '' ? value : null;
}

// Numbers (id, vote average). Missing, wrong type, NaN or Infinity → 0.
export function readNumber(obj: Record<string, unknown>, key: string): number {
    const value = obj[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

// True/false flags (e.g. video.official). Missing or wrong type → false.
export function readBoolean(obj: Record<string, unknown>, key: string): boolean {
  const value = obj[key];
  return typeof value === 'boolean' ? value : false;
}

// Nested objects like TMDb's "credits": { cast: [...] }. Not an object → {} (empty but safe to read).
export function readRecord(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = obj[key];
  return isRecord(value) ? value : {}; 
}

// Lists. Not an array → []. Items stay `unknown`: whoever reads them must check each one.
export function readArray(obj: Record<string, unknown>, key: string): unknown[] {
  const value = obj[key];
  return Array.isArray(value) ? value : [];
}