import { Route, Routes } from "react-router";
import Layout from "./components/Layout/Layout";
import CatalogPage from "./pages/CatalogPage/CatalogPage";
import DetailPage from "./pages/DetailPage/DetailPage";
import CartPage from "./pages/CartPage/CartPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import { routes } from "./routes";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={routes.catalog} element={<CatalogPage />} />
        <Route path={routes.movie} element={<DetailPage />} />
        <Route path={routes.cart} element={<CartPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
