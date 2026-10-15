/**
 * Everything about one movie: the loading/error/not-found states, then the
 * hero (backdrop, poster, facts, genres), prices, overview, director and cast.
 */

import { getImageUrl } from "../../api/tmdb";
import { useMovieDetails } from "../../hooks/useMovieDetails";
import { getCertification } from "../../utils/certification";
import { FALLBACK_RATING_REGION, RATING_REGION } from "../../config";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addItem,
  createCartItem,
  removeItem,
  selectCartItemForMovie,
} from "../../features/cart/cartSlice";
import type { CartItemType } from "../../features/cart/cartSlice";

import Loader from "../../components/Loader/Loader";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage";
import EmptyState from "../../components/EmptyState/EmptyState";
import CastList from "./CastList";
import Recommendations from "./Recommendations";
import PurchaseOptions from "./PurchaseOptions";

import styles from "./MovieDetails.module.css";

type Props = {
  id: number;
};


const CAST_LIMIT = 8;

const RECOMMENDATION_LIMIT = 6;

/**
 * Formats a runtime: 139 → "2 h 19 min", 45 → "45 min".
 * @param minutes - The runtime in minutes.
 */
function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}

/**
 * - States are early returns: Loader, "Movie not found." (404, no retry),
 *   ErrorMessage with "Try again".
 * - Each fact (year, runtime, rating, age rating) is shown only when known.
 * - Age rating: RATING_REGION, else FALLBACK_RATING_REGION, else no badge.
 * - Both images have an empty alt: the backdrop is decoration, and the poster
 *   repeats the title shown in the heading next to it.
 * - Cart: reads this movie's cart item with selectCartItemForMovie and passes
 *   only its type to PurchaseOptions. The click handlers build the CartItem —
 *   key, movie info and the price at that moment — and dispatch addItem or
 *   removeItem; the slice enforces "one item per movie".
 * - The two Redux hooks are called before the early returns
 * @param props.id - A valid TMDb movie id.
 */
export default function MovieDetails({ id }: Props) {
  const { movie, isLoading, error, notFound, reload } = useMovieDetails(id);

  const cartItem = useAppSelector(selectCartItemForMovie(id));

  const dispatch = useAppDispatch();

  if (isLoading) return <Loader label="Loading movie…" />;

  if (notFound) return <EmptyState message="Movie not found." />;

  if (error) return <ErrorMessage message={error} onRetry={reload} />;

  if (movie === null) return null;

  const handleAdd = (type: CartItemType) => {
    dispatch(addItem(createCartItem(movie, type)));
  };

  const handleRemove = () => {
    if (cartItem) dispatch(removeItem(cartItem.key));
  };

  const topRecommendations = movie.recommendations.slice(
    0,
    RECOMMENDATION_LIMIT,
  );

  const year = movie.releaseDate.slice(0, 4);

  const certification = getCertification(
    movie.releaseCertifications,
    RATING_REGION,
    FALLBACK_RATING_REGION,
  );

  const directors = movie.crew
    .filter((person) => person.job === "Director")
    .map((person) => person.name);

  const topCast = movie.cast.slice(0, CAST_LIMIT);

  return (
    <article className={styles.details}>
      <div className={styles.hero}>
        <img
          className={styles.backdrop}
          src={getImageUrl(movie.backdropPath, "backdrop")}
          alt=""
        />
        <div className={styles.heroContent}>
          <img
            className={styles.poster}
            src={getImageUrl(movie.posterPath, "poster")}
            alt=""
          />

          <div className={styles.info}>
            <h1 className={styles.title}>{movie.title}</h1>
            {movie.tagline && <p className={styles.tagline}>{movie.tagline}</p>}

            <ul className={styles.facts}>
              {year && <li>{year}</li>}
              {movie.runtime !== null && (
                <li>{formatRuntime(movie.runtime)}</li>
              )}
              {movie.voteAverage > 0 && (
                <li>
                  <span className={styles.star} aria-hidden="true">
                    ★
                  </span>{" "}
                  {movie.voteAverage.toFixed(1)}
                </li>
              )}
              {certification && (
                <li
                  className={styles.certification}
                  aria-label={`Age rating ${certification}`}
                >
                  {certification}
                </li>
              )}
            </ul>

            {movie.genres.length > 0 && (
              <ul className={styles.genres}>
                {movie.genres.map((genre) => (
                  <li key={genre.id} className={styles.genre}>
                    {genre.name}
                  </li>
                ))}
              </ul>
            )}

            <p className={styles.overview}>
              {movie.overview || "No description available."}
            </p>
            {directors.length > 0 && (
              <p>
                <span className={styles.label}>Director:</span>{" "}
                {directors.join(", ")}
              </p>
            )}
          </div>

          <div className={styles.purchase}>
            <PurchaseOptions
              movie={movie}
              inCart={cartItem?.type ?? null}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </div>

      {topCast.length > 0 && <CastList cast={topCast} />}

      {topRecommendations.length > 0 && (
        <Recommendations movies={topRecommendations} />
      )}
    </article>
  );
}
