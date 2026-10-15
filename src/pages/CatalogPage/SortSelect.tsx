/**
 * The catalog's "Sort by" menu, shown on the same line as the heading.
 * Holds no state: the sort comes from the URL via props, changes are reported up.
 */

import type { SortOption } from "../../types/tmdb";
import styles from "./SortSelect.module.css";

const SORT_CHOICES: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popularity" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Release date" },
];

type Props = {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

/**
 * A controlled select that only reports real sort names: the option's text is
 * looked up in SORT_CHOICES, so a value that isn't a SortOption is never
 * passed on (no `as` cast needed).
 * @param props.sort - The selected sort.
 * @param props.onSortChange - Called with the new sort.
 */
export default function SortSelect({ sort, onSortChange }: Props) {
  return (
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
  );
}
