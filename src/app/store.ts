/**
 * The Redux store — app-wide state, used for the cart only. 
 */

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../features/cart/cartSlice";

/**
 * The app's single store, built from one reducer per slice.
 *
 * - `reducer: { cart: cartReducer }` puts the cart's state under `state.cart`,
 *   and only cartReducer may change it — that key is why every selector reads
 *   `state.cart.items`.
 * - configureStore also connects the Redux DevTools browser extension, which
 *   shows every action and the state before and after it.
 */
export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
});

// Derived from the store itself, so they stay correct when a slice changes.
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
