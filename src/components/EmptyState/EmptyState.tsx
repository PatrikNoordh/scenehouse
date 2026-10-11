import styles from "./EmptyState.module.css";

type Props = {
  message: string;
};

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
