import { Outlet, ScrollRestoration } from 'react-router';
import SiteHeader from '@/components/common/SiteHeader/SiteHeader.jsx';
import styles from './RootLayout.module.css';

/** 모든 페이지가 공유하는 레이아웃 (공통 파일) */
export default function RootLayout() {
  return (
    <div className={styles.layout}>
      <SiteHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
