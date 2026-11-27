import { Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import RootLayout from '@/shared/components/RootLayout/RootLayout.jsx';
import SiteHeader from '@/shared/components/SiteHeader/SiteHeader.jsx';
import SiteFooter from '@/shared/components/SiteFooter/SiteFooter.jsx';
import { lazyPage } from '@/app/pageLoaders.js';
import LandingPage from '@/pages/Landing/LandingPage.jsx';
import NotFoundPage from '@/pages/NotFound/NotFoundPage.jsx';

/**
 * Cameras 메인(/cameras) 전용 레이아웃: RootLayout 의 바깥 틀(RootLayout.module.css) 없이 공통 헤더·푸터와 페이지만 둔다.
 * (요청: 정준혁 · 공통 GNB·푸터는 PM 요청으로 추가)
 */
function BareLayout() {
  return (
    <>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </>
  );
}

/**
 * 페이지는 RootLayout(공통 헤더 + <Outlet /> + 푸터) 안에서 렌더링된다.
 * 예외: Cameras 메인(/cameras)은 BareLayout(바깥 틀 없이 헤더·푸터만)에서 렌더링된다.
 * 서브페이지는 route.lazy 로 따로 불러온다 (pageLoaders.js) — 메인 첫 로딩에 다른 페이지 코드가 섞이지 않게.
 */
const router = createBrowserRouter([
  {
    element: <BareLayout />,
    HydrateFallback: () => null, // 첫 화면에서 페이지 코드를 받는 동안 아무것도 그리지 않음
    children: [{ path: ROUTES.cameras, lazy: lazyPage(ROUTES.cameras) }],
  },
  {
    path: ROUTES.landing,
    element: <RootLayout />,
    HydrateFallback: () => null,
    children: [
      { index: true, element: <LandingPage /> },
      { path: ROUTES.history, lazy: lazyPage(ROUTES.history) },
      { path: ROUTES.camerasNow, lazy: lazyPage(ROUTES.camerasNow) },
      { path: ROUTES.compare, lazy: lazyPage(ROUTES.compare) },
      { path: ROUTES.film, lazy: lazyPage(ROUTES.film) },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
