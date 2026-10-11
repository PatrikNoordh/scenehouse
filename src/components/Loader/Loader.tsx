import styles from "./Loader.module.css";

type Props = {
  label?: string;
};

export default function Loader({ label = "Loading..." }: Props) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
