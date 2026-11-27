import { RouterProvider } from 'react-router';
import router from '@/app/router.jsx';
import SiteCursor from '@/shared/components/SiteCursor/SiteCursor.jsx';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      {/* 공통 커서: 페이지 밖에서 한 번만 그려 페이지를 옮겨도 이어진다 */}
      <SiteCursor />
    </>
  );
}
