/**
 * The catalog's genre and sort dropdowns, plus "Clear filters".
 * Holds no state: values come from the URL via props, changes are reported up.
 */

import type { Genre, SortOption } from "../../types/tmdb";
import styles from "./FilterBar.module.css";

const SORT_CHOICES: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popularity" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Release date" },
];

type Props = {
  genreId: number | null;
  sort: SortOption;
  genres: Genre[];
  genresDisabled: boolean;
  showClear: boolean;
  onGenreChange: (genreId: number | null) => void;
  onSortChange: (sort: SortOption) => void;
  onClear: () => void;
};

/**
 * Controlled selects that report typed values: a genre option's text "28"
 * becomes the number 28 ("" = all genres = null), and a sort value is looked up
 * in SORT_CHOICES.
 * The genre select is disabled while genres load or after they failed —
 * the catalog keeps working without it.
 *
 * @param props.genreId - The selected genre, or null for all genres.
 * @param props.sort - The selected sort.
 * @param props.genres - The genres to offer.
 * @param props.genresDisabled - Disables the genre select.
 * @param props.showClear - Shows "Clear filters" when something is set.
 * @param props.onGenreChange - Called with the new genre id, or null.
 * @param props.onSortChange - Called with the new sort.
 * @param props.onClear - Called when "Clear filters" is clicked.
 */
export default function FilterBar({
  genreId,
  sort,
  genres,
  genresDisabled,
  showClear,
  onGenreChange,
  onSortChange,
  onClear,
}: Props) {
  return (
    <div className={styles.bar}>
      <label className={styles.field}>
        <span className={styles.labelText}>Genre</span>
        <select
          className={styles.select}
          value={genreId ?? ""}
          disabled={genresDisabled}
          onChange={(event) => {
            const value = event.target.value;
            onGenreChange(value === "" ? null : Number(value));
          }}
        >
          <option value="">All genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.labelText}>Sort by</span>
        <select
          className={styles.select}
          value={sort}
          onChange={(event) => {
            const choice = SORT_CHOICES.find(
              (option) => option.value === event.target.value,
            );
            if (choice) onSortChange(choice.value);
          }}
        >
          {SORT_CHOICES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {showClear && (
        <button type="button" className={styles.clear} onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
