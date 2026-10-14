/**
 * Saves the cart to localStorage and loads it back on startup.
 *
 * Stored data is outside data: it may be missing, from an older format or
 * edited by hand. It is parsed as `unknown` and checked before use, and every
 * storage call is wrapped in try/catch, so bad or blocked storage means an
 * empty cart — never a crash.
 */

import type { CartItem, CartState } from "../features/cart/cartSlice";

import { isRecord } from "./guards";

// "v1" is the stored format's version. Bump it when CartItem changes shape, so
// data saved in the old format is never read as the new one.
const CART_STORAGE_KEY = "scenehouse:cart:v1";

/**
 * Type guard: true only if the value has every CartItem field with the right
 * type, and type is exactly "rent" or "buy".
 * @param value - Anything, typically one item from parsed JSON.
 */
export function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;

  return (
    typeof value.key === "string" &&
    typeof value.movieId === "number" &&
    typeof value.title === "string" &&
    (typeof value.posterPath === "string" || value.posterPath === null) &&
    (value.type === "rent" || value.type === "buy") &&
    typeof value.price === "number"
  );
}

/**
 * Reads the saved cart. All or nothing: if any item fails isCartItem, the
 * whole saved cart is ignored rather than loading part of it.
 * @returns The saved cart, or undefined when nothing is saved, storage is
 *   blocked, the JSON is broken or the shape is wrong.
 */
export function loadCartState(): CartState | undefined {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);

    if (raw === null) return undefined;

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed)) return undefined;

    const items = parsed.items;
    if (!Array.isArray(items) || !items.every(isCartItem)) return undefined;

    return { items };
  } catch {
    return undefined;
  }
}

/**
 * Writes the cart to localStorage.
 * @param state - The cart slice's state.
 * @returns true if saved; false if storage is full or blocked. The cart keeps
 *   working in memory either way, it just won't survive a reload.
 */
export function saveCartState(state: CartState): boolean {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));

    return true;
  } catch {
    return false;
  }
}
