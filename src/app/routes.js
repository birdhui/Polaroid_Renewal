/**
 * 사이트 경로 정의 — 라우터와 내비게이션이 함께 참조하는 단일 기준.
 * 페이지를 추가·변경할 때는 이 파일과 router.jsx 를 함께 수정한다. (공통 파일)
 */
export const ROUTES = {
  landing: '/',
  history: '/history',
  cameras: '/cameras',
  camerasNow: '/cameras/now',
  camerasNowPlus: '/cameras/now-plus',
  compare: '/compare',
  film: '/film',
};

/**
 * 공통 내비게이션(서브페이지) 표시 순서.
 * Landing 은 메뉴에 두지 않고, 헤더의 타이틀 로고로 이동한다.
 */
export const NAV_ITEMS = [
  { label: 'History', path: ROUTES.history },
  { label: 'Cameras', path: ROUTES.cameras },
  { label: 'Compare', path: ROUTES.compare },
  { label: 'Film', path: ROUTES.film },
];
