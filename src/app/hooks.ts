/**
 * Typed versions of react-redux's hooks. Components use these instead of
 * useDispatch / useSelector, so the store's state and actions are fully typed
 * everywhere without repeating the types.
 */

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

// dispatch(...) only accepts this store's actions.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

// Selectors receive a fully typed RootState.
export const useAppSelector = useSelector.withTypes<RootState>();
