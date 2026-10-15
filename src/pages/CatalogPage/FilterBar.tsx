/**
 * The catalog's genre chips: "All" plus one chip per genre, in one row.
 * Holds no state: the genre comes from the URL via props, changes are reported up.
 */

import type { Genre } from "../../types/tmdb";
import ScrollContainer from "react-indiana-drag-scroll";
import styles from "./FilterBar.module.css";

type Props = {
  genreId: number | null;
  genres: Genre[];
  onGenreChange: (genreId: number | null) => void;
};

/**
 * Toggle buttons with aria-pressed, so screen readers announce which genre is
 * chosen, and the CSS styles the chosen chip from that same attribute.
 * - "All" reports null and is how a genre is cleared.
 * - While genres load, or after they failed, `genres` is empty and only "All"
 *   shows — the catalog keeps working without them.
 * - The row scrolls sideways inside ScrollContainer (react-indiana-drag-scroll),
 *   so the mouse can drag it.
 * - hideScrollbars={false}: the library's own hiding sets overflow: hidden,
 *   which would block trackpad and touch scrolling; the CSS hides the bar instead.
 * - role and aria-label sit on the inner div, because ScrollContainer's props
 *   don't accept them.
 * @param props.genreId - The selected genre, or null for all genres.
 * @param props.genres - The genres to offer.
 * @param props.onGenreChange - Called with the new genre id, or null.
 */
export default function FilterBar({ genreId, genres, onGenreChange }: Props) {
  return (
    <ScrollContainer
      className={styles.scroller}
      vertical={false}
      hideScrollbars={false}
    >
      <div className={styles.chips} role="group" aria-label="Genre">
        <button
          type="button"
          className={styles.chip}
          aria-pressed={genreId === null}
          onClick={() => onGenreChange(null)}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            className={styles.chip}
            aria-pressed={genreId === genre.id}
            onClick={() => onGenreChange(genre.id)}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </ScrollContainer>
  );
}
