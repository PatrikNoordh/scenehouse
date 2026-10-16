/**
 * The SceneHouse logo: the house-with-a-play-button mark plus the wordmark
 * "Scene" + "House".
 */

import styles from "./Logo.module.css";

type Props = {
  size?: "md" | "lg";
};

/**
 * Presentational and decorative — the parent decides whether it is a link and
 * gives that link its accessible name. The mark is an inline SVG drawn in
 * currentColor, so its colour comes from the CSS (yellow in the dark theme,
 * navy in the light theme) without a second file. aria-hidden, because the
 * visible "SceneHouse" text already says what it is.
 * @param props.size - "md" for the navbar and footer, "lg" for larger use. Defaults to "md".
 */
export default function Logo({ size = "md" }: Props) {
  return (
    <span className={`${styles.logo} ${styles[size]}`}>
      <svg
        className={styles.mark}
        viewBox="0 0 64 64"
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M42 15 V9 H48 V21" />
          <path d="M6 31 L32 8 L58 31" />
          <path d="M13 26 V55 H51 V26" />
        </g>
        <path
          d="M27 31 V47 L40.5 39 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.wordmark}>
        Scene<span className={styles.accent}>House</span>
      </span>
    </span>
  );
}
