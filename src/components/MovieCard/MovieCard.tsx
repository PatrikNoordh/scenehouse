import { Link } from "react-router";
import type { Movie } from "../../types/tmdb";
import { getImageUrl } from "../../api/tmdb";
import { formatPrice, getRentPrice } from "../../utils/pricing";
import styles from "./MovieCard.module.css";

type Props = {
  movie: Movie;
  to: string;
};

export default function MovieCard({ movie, to }: Props) {
  const year = movie.releaseDate.slice(0, 4);
  const rating = movie.voteAverage > 0 ? movie.voteAverage.toFixed(1) : null;

  return (
    <Link to={to} className={styles.card}>
      <img
        className={styles.poster}
        src={getImageUrl(movie.posterPath, "poster")}
        alt=""
        loading="lazy"
      />
      <div className={styles.body}>
        <h2 className={styles.title}>{movie.title}</h2>
        <p className={styles.meta}>
          {year && <span>{year}</span>}
          {rating && (
            <span>
              <span aria-hidden="true">★</span> {rating}
            </span>
          )}
        </p>
        <p className={styles.price}>from {formatPrice(getRentPrice(movie))}</p>
      </div>
    </Link>
  );
}
