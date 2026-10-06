import { Link } from 'react-router';
import { paths } from '../../routes';

import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {

    return (
        <section className={styles.page}>
            <h1>404</h1>
            <p>This scene doesn't exist.</p>
            <Link to ={paths.catalog} className={styles.link}>Back to catalog</Link>
        </section>
    )
}