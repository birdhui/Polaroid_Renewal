import { Outlet, ScrollRestoration, useLocation, useMatches } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import SiteHeader from '@/shared/components/SiteHeader/SiteHeader.jsx';
import SiteFooter from '@/shared/components/SiteFooter/SiteFooter.jsx';
import styles from './RootLayout.module.css';

/**
 * 모든 페이지가 공유하는 레이아웃. (공통 파일 — 수정 전 PM 협의)
 * Header·Footer 는 여기서 한 번만 렌더링한다. 페이지에서 다시 만들지 않는다.
 * route 의 `handle.headerOverlay` 가 true 이면 헤더를 페이지 첫 화면 위에 겹쳐 보여 준다.
 * route 의 `handle.hideHeader` 가 true 이면 그 페이지에서는 헤더를 렌더링하지 않는다.
 */
export default function RootLayout() {
  const matches = useMatches();
  const overlay = matches.some((match) => match.handle?.headerOverlay);
  const hideHeader = matches.some((match) => match.handle?.hideHeader);
  // 메인(Landing)은 마지막 장면이 따로 있어 공통 푸터를 붙이지 않는다
  const isLanding = useLocation().pathname === ROUTES.landing;

  return (
    <div className={styles.layout}>
      {hideHeader ? null : <SiteHeader overlay={overlay} />}
      <main className={styles.main}>
        <Outlet />
      </main>
      {isLanding ? null : <SiteFooter />}
      <ScrollRestoration />
    </div>
  );
}
