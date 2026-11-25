import { Link, NavLink } from 'react-router';
import { NAV_ITEMS, ROUTES } from '@/app/routes.js';
import logo from '@/assets/shared/images/logo-polaroid-white.webp';
import styles from './SiteHeader.module.css';

/**
 * 공통 헤더: 타이틀 로고(→ Landing) + 서브페이지 메뉴.
 * `overlay` 이면 배경 없이 첫 화면 위에 겹쳐 올라오고, 흰색 로고·글자를 쓴다. (공통 파일)
 * 로고 이미지는 임시(시안을 PNG로 렌더한 것)다. 공식 로고 SVG 가 정해지면 교체한다.
 */
export default function SiteHeader({ overlay = false }) {
  return (
    <header className={overlay ? `${styles.header} ${styles.overlay}` : styles.header}>
      <Link to={ROUTES.landing} className={styles.logo} aria-label="Polaroid 홈으로 이동">
        {overlay ? <img className={styles.logoImage} src={logo} alt="" width="552" height="143" /> : 'Polaroid'}
      </Link>
      <nav aria-label="주요 메뉴">
        <ul className={styles.list}>
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
