import { useEffect, useRef } from 'react';
import { mountPolaroidScene } from '@/features/landing-camera/engine/polaroidScene.js';
import { mountLandingUi, LANDING_UI_GLOBALS } from './experience/landingUi.js';
import { LANDING_MARKUP } from './landingMarkup.js';
import landingCss from './landing.css?inline';
import styles from './LandingPage.module.css';

/** 랜딩이 <html> 에 다는 상태 값 — 떠날 때 모두 지운다 */
const HTML_DATASET_KEYS = ['page', 'model', 'title', 'phase', 'skipIntro'];
const HTML_STYLE_VARS = ['--hero-o', '--flash', '--mfs'];
/** 첫 화면부터 최종 서체로 (Kinoria·Leica 방식): CSS 를 거치지 않고 글꼴 파일을 바로 받아 둠. @font-face 는 landing.css (font-display: block) */
const FONT_PRELOADS = [
  'https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2',
  // 한글: 랜딩에 쓰인 47자만 담은 작은 파일 — 랜딩 한글 문구가 바뀌면 이 파일(과 landing.css 의 unicode-range)도 다시 만들어야 함
  'https://fonts.gstatic.com/l/font?kit=PbykFmXiEBPT4ITbgNA5Cgm202xl6XikOY2DSsjByV5yd5yX3QpA0L_KL6UVbFZ2vHbwFfszVuDp-ZVoUcTHj87Uw5uAMYhD_gFDNeg3lmt63ypM088b6xDNjsn1sxM8--bNIxZHGbLpj-Dc818ls8A-8HKpaVy0_RLHNqN1aiwkSN9Zuwn8ew3dybnNa2HIKO2wuHd0ptQ6fZSIkuKAPU7MbA&skey=87e7ee645936e2c7&v=v40',
];

/**
 * Landing — 브랜드 첫 진입 화면 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)을 옮긴 이식본 (2차: 아티팩트 최신본 전체).
 * 히어로 → 플래시·사진 출력 → 문구 → 역사 도면(1937~2026) → NOW 실물 → 8가지 컬러 → ZERO MINUTES →
 * 부품 목록 → Make a Moment Last · 필름 사진 → DEVELOPED, 왼쪽 목차 링으로 섹션 이동.
 *
 * - 3D 장면: @/features/landing-camera/engine/polaroidScene.js
 * - 화면 UI(타이포·도면·목차): ./experience/landingUi.js
 * - 두 엔진은 고정된 클래스·id 로 요소를 찾으므로 마크업(./landingMarkup.js)을 마운트할 때마다 새로 그리고,
 *   스타일(./landing.css)은 이 페이지가 떠 있는 동안에만 붙인다.
 */
export default function LandingPage() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const html = document.documentElement;
    const controller = new AbortController();

    const preloads = FONT_PRELOADS.map((href) => {
      const link = document.createElement('link');
      Object.assign(link, { rel: 'preload', as: 'font', type: 'font/woff2', href, crossOrigin: 'anonymous' });
      link.dataset.landing = '';
      document.head.appendChild(link);
      return link;
    });

    const style = document.createElement('style');
    style.dataset.landing = '';
    style.textContent = landingCss;
    document.head.appendChild(style);

    html.dataset.page = 'landing';
    host.innerHTML = LANDING_MARKUP;

    mountLandingUi(controller.signal);
    const disposeScene = mountPolaroidScene(controller.signal);
    // 프로토타입에서는 DOMContentLoaded 에 보내던 시작 신호 — 두 엔진이 붙은 뒤 보낸다
    window.dispatchEvent(new Event('intro:done'));

    return () => {
      controller.abort();
      disposeScene();
      host.innerHTML = '';
      style.remove();
      preloads.forEach((link) => link.remove());
      HTML_DATASET_KEYS.forEach((key) => delete html.dataset[key]);
      HTML_STYLE_VARS.forEach((name) => html.style.removeProperty(name));
      LANDING_UI_GLOBALS.forEach((key) => delete window[key]);
      document.body.classList.remove('scrollable', 'ready');
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto';
    };
  }, []);

  return <div ref={hostRef} className={styles.page} />;
}
