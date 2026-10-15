/**
 * The site's search box, shown in the navbar on every page: updates on every
 * keystroke, but only reports the search after the user stops typing (debounce).
 */

import { useEffect, useState } from "react";
import styles from "./SearchBar.module.css";

// How long typing must pause before searching — skips in-between words.
const DEBOUNCE_MS = 400;

type Props = {
  query: string;
  onSearch: (query: string) => void;
};

/**
 * A search input with two speeds: local `text` changes on every keystroke;
 * onSearch is called only when typing pauses for DEBOUNCE_MS (the effect's
 * cleanup clears the previous timer on each keystroke), or at once on Enter.
 *
 * Sync with the URL: when `query` changes from outside (Back, or opening a page
 * without a search), the box is updated during render by comparing with the last query seen —
 * React's "adjusting state when a prop changes" pattern. This avoids setState
 * in an effect, and avoids a key remount, which would lose focus while typing.
 * The box is only overwritten when the new query differs from what's typed,
 * so a trailing space the user just typed isn't removed mid-word.
 *
 * @param props.query - The current search from the URL.
 * @param props.onSearch - Called with the trimmed text when the search should run.
 */
export default function SearchBar({ query, onSearch }: Props) {
  const [text, setText] = useState(query);

  const [syncedQuery, setSyncedQuery] = useState(query);

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    if (query !== text.trim()) setText(query);
  }

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === query) return;

    const timer = setTimeout(() => onSearch(trimmed), DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, query, onSearch]);

  return (
    <form
      role="search"
      className={styles.search}
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <label htmlFor="movie-search" className={styles.label}>
        Search movies
      </label>

      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4.35-4.35" />
      </svg>

      <input
        id="movie-search"
        type="search"
        className={styles.input}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search movies..."
        autoComplete="off"
      />
    </form>
  );
}
