/**
 * A grid of cast members: photo, name and character.
 */

import type { CastMember } from "../../types/tmdb";
import { getImageUrl } from "../../api/tmdb";
import styles from "./CastList.module.css";

type Props = {
  cast: CastMember[];
};

/**
 * Draws the cast it is given — the parent decides how many.
 * The key combines id and character: an actor can play two roles in one movie
 * and then appears twice with the same id. Photos have an empty alt because
 * the name is written right below.
 * @param props.cast - The cast members to show.
 */
export default function CastList({ cast }: Props) {
  return (
    <section className={styles.cast}>
      <h2 className={styles.heading}>Cast</h2>
      <ul className={styles.list}>
        {cast.map((person) => (
          <li
            key={`${person.id}-${person.character}`}
            className={styles.person}
          >
            <img
              className={styles.photo}
              src={getImageUrl(person.profilePath, "profile")}
              alt=""
              loading="lazy"
            />
            <span className={styles.name}>{person.name}</span>
            {person.character && (
              <span className={styles.character}>{person.character}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
