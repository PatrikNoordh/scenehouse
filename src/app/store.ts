/**
 * The Redux store — app-wide state, used for the cart only. The cart is
 * loaded from localStorage at startup and saved again whenever it changes, so
 * it survives a page reload.
 */

import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../features/cart/cartSlice";
import { loadCartState, saveCartState } from "../utils/localStorage";

// Read once, before the store exists, so the first render already shows the
// saved cart. undefined = nothing usable saved.
const savedCart = loadCartState();

/**
 * The app's single store, built from one reducer per slice.
 *
 * - `reducer: { cart: cartReducer }` puts the cart's state under `state.cart`,
 *   and only cartReducer may change it — that key is why every selector reads
 *   `state.cart.items`.
 * - configureStore also connects the Redux DevTools browser extension, which
 *   shows every action and the state before and after it.
 * - preloadedState starts the cart as the saved one; without a saved cart the
 *   slice's own empty initialState is used.
 */
export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  preloadedState: savedCart ? { cart: savedCart } : undefined,
});


let lastSavedCart = store.getState().cart;

/**
 * Saves the cart after every action that changed it. 
 */
store.subscribe(() => {
  const cart = store.getState().cart;

  if (cart === lastSavedCart) return;

  lastSavedCart = cart;

  saveCartState(cart);
});

// Derived from the store itself, so they stay correct when a slice changes.
export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
