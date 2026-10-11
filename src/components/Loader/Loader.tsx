/**
 * Loading indicator for any data view: a spinning ring and a short text.
 * Presentational only — no state, no fetching.
 */

import styles from "./Loader.module.css";

type Props = {
  label?: string;
};

/**
 * Shows a spinner with a label. role="status" + aria-live="polite" make screen
 * readers announce the label when it appears; the spinner itself is decorative
 * (aria-hidden).
 * @param props.label - Optional; defaults to "Loading...".
 */
export default function Loader({ label = "Loading..." }: Props) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
