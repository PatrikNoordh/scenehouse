import styles from "./ErrorMessage.module.css";

type Props = {
  message: string;
  onRetry: () => void;
};

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
