/**
 * Empty view for any data view: the request succeeded but returned nothing.
 * Different from an error (nothing broke) — so there is no retry button.
 */

import styles from "./EmptyState.module.css";

type Props = {
  message: string;
};

/**
 * Shows a friendly "nothing here" message instead of a blank screen.
 * role="status" announces it politely; the emoji is decorative (aria-hidden).
 * @param props.message - The text to show.
 */
export default function EmptyState({ message }: Props) {
  return (
    <div className={styles.empty} role="status">
      <span className={styles.icon} aria-hidden="true">
        🎬
      </span>
      <p>{message}</p>
    </div>
  );
}
