import { useEffect, useRef } from 'react';
import { mountPolaroidScene } from '@/features/landing-camera/engine/polaroidScene.js';
import { mountLandingUi } from './experience/landingUi.js';
import { LANDING_MARKUP } from './landingMarkup.js';
import landingCss from './landing.css?inline';
import styles from './LandingPage.module.css';

/** 랜딩이 <html> 에 다는 상태 값 — 떠날 때 모두 지운다 */
const HTML_DATASET_KEYS = ['page', 'model', 'title', 'phase', 'skipIntro'];
const HTML_STYLE_VARS = ['--hero-o', '--flash'];
const UI_GLOBALS = ['__tb', '__introDone', '__heroExit', '__heroWheel', '__storyIn', '__hist', '__colorIn', '__setSection'];

/**
 * Landing — 브랜드 첫 진입 화면 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)을 옮긴 1차 이식본.
 * 히어로 → 플래시·사진 출력 → 문구 → 역사 도면(1937~2026) → NOW 실물 → 8가지 컬러, 왼쪽 목차 링으로 섹션 이동.
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
      HTML_DATASET_KEYS.forEach((key) => delete html.dataset[key]);
      HTML_STYLE_VARS.forEach((name) => html.style.removeProperty(name));
      UI_GLOBALS.forEach((key) => delete window[key]);
      document.body.classList.remove('scrollable', 'ready');
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto';
    };
  }, []);

  return <div ref={hostRef} className={styles.page} />;
}
