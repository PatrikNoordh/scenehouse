/**
 * The detail page ("/movie/:id"): checks the id from the URL, offers a Back
 * button, and renders the movie's content.
 */

import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { paths } from "../../routes";
import EmptyState from "../../components/EmptyState/EmptyState";
import MovieDetails from "./MovieDetails";

import styles from "./DetailPage.module.css";

/**
 * Turns the URL's :id text into a movie id. useParams() gives a string, and
 * only a whole number above 0 can be a TMDb id.
 * @param id - The raw :id from the URL.
 * @returns The id, or null when the URL can't point to a movie.
 */
function parseMovieId(id: string | undefined): number | null {
  const value = Number(id);

  return Number.isInteger(value) && value > 0 ? value : null;
}

/**
 * - An invalid id shows "Movie not found." without asking TMDb at all.
 * - A valid id renders MovieDetails with key={movieId}: another movie mounts a
 *   fresh instance (new state, old request aborted).
 * - Back: React Router gives the first page of a visit the key "default".
 *   Arrived from inside the app "back button ->" navigate(-1), back to the catalog with its
 *   search intact. Opened directly (shared link, new tab) "back button -> " go to the catalog,
 *   because navigate(-1) would leave the site.
 * - Scrolls to the top when the id changes: the router swaps pages without
 *   scrolling, so a new movie would otherwise open halfway down.
 */
export default function DetailPage() {
  const { id } = useParams();

  const movieId = parseMovieId(id);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [movieId]);

  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(paths.catalog);
    }
  }

  return (
    <section className={styles.page}>
      <button type="button" className={styles.back} onClick={goBack}>
        <span aria-hidden="true">←</span> Back
      </button>

      {movieId === null ? (
        <EmptyState message="Movie not found." />
      ) : (
        <MovieDetails key={movieId} id={movieId} />
      )}
    </section>
  );
}
