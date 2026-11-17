import { Outlet, ScrollRestoration, useMatches } from 'react-router';
import SiteHeader from '@/shared/components/SiteHeader/SiteHeader.jsx';
import SiteFooter from '@/shared/components/SiteFooter/SiteFooter.jsx';
import styles from './RootLayout.module.css';

/**
 * 모든 페이지가 공유하는 레이아웃. (공통 파일 — 수정 전 PM 협의)
 * Header·Footer 는 여기서 한 번만 렌더링한다. 페이지에서 다시 만들지 않는다.
 * route 의 `handle.headerOverlay` 가 true 이면 헤더를 페이지 첫 화면 위에 겹쳐 보여 준다.
 */
export default function RootLayout() {
  const overlay = useMatches().some((match) => match.handle?.headerOverlay);

  return (
    <div className={styles.layout}>
      <SiteHeader overlay={overlay} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
