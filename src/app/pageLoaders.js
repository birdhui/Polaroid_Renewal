import { ROUTES } from '@/app/routes.js';

/**
 * 서브페이지 코드를 필요할 때 따로 불러오는 함수 모음 (공통 파일).
 * - router.jsx 가 route.lazy 로 쓴다 → 메인(Landing)에 들어올 때 다른 페이지 코드·이미지를 함께 받지 않아 첫 로딩이 빨라진다.
 * - SiteHeader 가 메뉴에 마우스를 올리거나, 페이지가 한가해지면 미리 불러 둔다 → 메뉴를 누르면 바로 넘어간다.
 * 같은 import() 는 브라우저가 한 번만 받으므로 여러 번 불러도 괜찮다.
 */
export const PAGE_LOADERS = {
  [ROUTES.history]: () => import('@/pages/History/HistoryPage.jsx'),
  [ROUTES.cameras]: () => import('@/pages/Cameras/CamerasPage.jsx'),
  [ROUTES.camerasNow]: () => import('@/pages/Cameras/Now/CameraNowPage.jsx'),
  [ROUTES.compare]: () => import('@/pages/Compare/ComparePage.jsx'),
  [ROUTES.film]: () => import('@/pages/Film/FilmPage.jsx'),
};

/** route.lazy 용: 페이지 모듈의 default export 를 Component 로 넘긴다 */
export const lazyPage = (path) => async () => {
  const mod = await PAGE_LOADERS[path]();
  return { Component: mod.default };
};

/** 미리 불러오기 (실패해도 조용히 넘어감 — 실제로 이동할 때 다시 시도된다) */
export function preloadPage(path) {
  PAGE_LOADERS[path]?.().catch(() => {});
}

export function preloadAllPages() {
  Object.keys(PAGE_LOADERS).forEach(preloadPage);
  preloadLanding();
}

/**
 * 메인(Landing)으로 돌아올 때 버벅이지 않게, 서브페이지에 있는 동안 3D 장면 준비물을 미리 받아 둔다
 * (모델 파일 받기 · Draco 워커 준비 · 플래시·그레인 텍스처를 잘게 나눠 미리 그리기 — 화면을 멈추지 않음)
 */
export function preloadLanding() {
  import('@/features/landing-camera/engine/polaroidScene.js')
    .then((m) => m.preloadPolaroidScene())
    .catch(() => {});
}
