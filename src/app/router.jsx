import { Outlet, ScrollRestoration, createBrowserRouter } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import RootLayout from '@/shared/components/RootLayout/RootLayout.jsx';
import LandingPage from '@/pages/Landing/LandingPage.jsx';
import HistoryPage from '@/pages/History/HistoryPage.jsx';
import CamerasPage from '@/pages/Cameras/CamerasPage.jsx';
import CameraNowPage from '@/pages/Cameras/now/CameraNowPage.jsx';
import CameraNowPlusPage from '@/pages/Cameras/now-plus/CameraNowPlusPage.jsx';
import ComparePage from '@/pages/Compare/ComparePage.jsx';
import FilmPage from '@/pages/Film/FilmPage.jsx';
import NotFoundPage from '@/pages/NotFound/NotFoundPage.jsx';

/**
 * 헤더·푸터 없이 페이지만 보여주는 레이아웃.
 * Cameras 메인은 Figma 시안에 헤더·푸터가 없어 이 레이아웃을 쓴다. (요청: 정준혁)
 */
function BareLayout() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </>
  );
}

/**
 * 페이지는 RootLayout(공통 헤더 + <Outlet /> + 푸터) 안에서 렌더링된다.
 * 예외: Cameras 메인(/cameras)은 BareLayout(헤더·푸터 없음)에서 렌더링된다.
 * Three.js 처럼 무거운 페이지는 필요해지면 route 의 `lazy` 로 분리할 수 있다.
 */
const router = createBrowserRouter([
  {
    element: <BareLayout />,
    children: [{ path: ROUTES.cameras, element: <CamerasPage /> }],
  },
  {
    path: ROUTES.landing,
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: ROUTES.history, element: <HistoryPage /> },
      { path: ROUTES.camerasNow, element: <CameraNowPage /> },
      { path: ROUTES.camerasNowPlus, element: <CameraNowPlusPage /> },
      { path: ROUTES.compare, element: <ComparePage /> },
      { path: ROUTES.film, element: <FilmPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
