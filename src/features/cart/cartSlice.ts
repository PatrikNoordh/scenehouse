/**
 * The cart's Redux slice: the item type, the reducers that are the only way to
 * change the cart, the actions, and the selectors components read it with.
 *
 * Business rule: a movie is in the cart at most once — rented or bought, never
 * both. addItem enforces it, so no component can break it.
 */

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Movie } from "../../types/tmdb";
import { getBuyPrice, getRentPrice, sumPrices } from "../../utils/pricing";

// Type-only import: erased at build time, so store.ts importing this file's
// reducer doesn't create a runtime import cycle.
import type { RootState } from "../../app/store";

export type CartItemType = "rent" | "buy";

export type CartItem = {
  key: string;
  movieId: number;
  title: string;
  posterPath: string | null;
  type: CartItemType;
  price: number;
};

export type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

/**
 * Builds a cart item's key, so every key has the same format.
 * @param movieId - The TMDb movie id.
 * @param type - Rent or buy.
 * @returns e.g. "550-rent"
 */
export function cartItemKey(movieId: number, type: CartItemType): string {
  return `${movieId}-${type}`;
}

/**
 * Builds the cart item for a movie — the one place this is done, so every
 * "Rent" and "Buy" button stores the same fields and the same price.
 * The price is fixed at the moment of adding: the cart shows what the user agreed to.
 * @param movie - The movie (a MovieDetails works too — it is a Movie plus more).
 * @param type - Rent or buy.
 * @returns e.g. { key: "550-rent", movieId: 550, …, price: 39 }
 */
export function createCartItem(movie: Movie, type: CartItemType): CartItem {
  return {
    key: cartItemKey(movie.id, type),
    movieId: movie.id,
    title: movie.title,
    posterPath: movie.posterPath,
    type,
    price: type === "rent" ? getRentPrice(movie) : getBuyPrice(movie),
  };
}

/**
 * The slice. Its name prefixes every action type ("cart/addItem"), which is
 * what Redux DevTools shows.
 *
 * - addItem: first removes any item for the same movie, then adds the new one.
 *   Adding the same option again leaves one item; switching rent ↔ buy
 *   replaces the item instead of adding a second.
 * - removeItem: removes the item with the given key.
 * - clearCart: empties the cart.
 */
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      state.items = state.items.filter(
        (item) => item.movieId !== action.payload.movieId,
      );
      state.items.push(action.payload);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.key !== action.payload);
    },

    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;

export default cartSlice.reducer;

// ==== Selectors — the only way components read the cart ====

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = (state: RootState) => state.cart.items.length;

export const selectCartTotalPrice = (state: RootState) =>
  sumPrices(state.cart.items);

/**
 * A selector factory: returns a selector for one movie. Needed because
 * useAppSelector only passes the state, so the movie id is built in first —
 * usage: useAppSelector(selectCartItemForMovie(550)).
 * @param movieId - The TMDb movie id.
 * @returns A selector giving that movie's cart item, or null if it isn't in the cart.
 */
export function selectCartItemForMovie(movieId: number) {
  return (state: RootState): CartItem | null =>
    state.cart.items.find((item) => item.movieId === movieId) ?? null;
}
