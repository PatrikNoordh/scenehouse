/**
 * Error view for any data view: a message and a "Try again" button.
 * It only reports the click — the parent decides what retrying means.
 */

import styles from "./ErrorMessage.module.css";

type Props = {
  message: string;
  onRetry: () => void;
};

/**
 * Shows an error with a retry button. role="alert" makes screen readers
 * announce it immediately, because an error is urgent.
 * @param props.message - The error text.
 * @param props.onRetry - What to do when the user clicks "Try again".
 */
export default function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className={styles.error} role="alert">
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.button} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
