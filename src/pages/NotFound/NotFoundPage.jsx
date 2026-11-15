import { Link } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import styles from './NotFoundPage.module.css';

/** 정의되지 않은 경로 */
export default function NotFoundPage() {
  return (
    <section className={styles.page} aria-labelledby="not-found-title">
      <h1 id="not-found-title">404</h1>
      <p>
        페이지를 찾을 수 없습니다. <Link to={ROUTES.landing}>Landing으로 이동</Link>
      </p>
    </section>
  );
}
