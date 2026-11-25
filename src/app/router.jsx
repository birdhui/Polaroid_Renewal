import { createBrowserRouter } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import RootLayout from '@/shared/components/RootLayout/RootLayout.jsx';
import LandingPage from '@/pages/Landing/LandingPage.jsx';
import HistoryPage from '@/pages/History/HistoryPage.jsx';
import CamerasPage from '@/pages/Cameras/CamerasPage.jsx';
import CameraNowPage from '@/pages/Cameras/Now/CameraNowPage.jsx';
import ComparePage from '@/pages/Compare/ComparePage.jsx';
import FilmPage from '@/pages/Film/FilmPage.jsx';
import NotFoundPage from '@/pages/NotFound/NotFoundPage.jsx';

/**
 * 모든 페이지는 RootLayout(공통 헤더 + <Outlet />) 안에서 렌더링된다.
 * Three.js 처럼 무거운 페이지는 필요해지면 route 의 `lazy` 로 분리할 수 있다.
 */
const router = createBrowserRouter([
  {
    path: ROUTES.landing,
    element: <RootLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: ROUTES.history, element: <HistoryPage /> },
      { path: ROUTES.cameras, element: <CamerasPage /> },
      { path: ROUTES.camerasNow, element: <CameraNowPage /> },
      { path: ROUTES.compare, element: <ComparePage /> },
      { path: ROUTES.film, element: <FilmPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default router;
