import { useEffect, useRef } from 'react';
import { mountPolaroidScene } from '@/features/landing-camera/engine/polaroidScene.js';
import { mountLandingUi, LANDING_UI_GLOBALS } from './experience/landingUi.js';
import { LANDING_MARKUP } from './landingMarkup.js';
import landingCss from './landing.css?inline';
import styles from './LandingPage.module.css';

/** 랜딩이 <html> 에 다는 상태 값 — 떠날 때 모두 지운다 */
const HTML_DATASET_KEYS = ['page', 'model', 'title', 'phase', 'skipIntro', 'loader', 'toc'];
const HTML_STYLE_VARS = ['--hero-o', '--flash', '--mfs'];
/** 첫 화면부터 최종 서체로 (Kinoria·Leica 방식): CSS 를 거치지 않고 글꼴 파일을 바로 받아 둠. @font-face 는 landing.css (font-display: block) */
const FONT_PRELOADS = [
  // Outfit 200 800
  'https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2',
  // Noto Sans KR 400 500 — 랜딩에 쓰인 글자만 담은 작은 파일. 랜딩 한글 문구가 바뀌면 이 파일(과 landing.css 의 unicode-range)도 다시 만들어야 함
  'https://fonts.gstatic.com/l/font?kit=PbykFmXiEBPT4ITbgNA5Cgm202xZ6XikOY2DSsjByV5yd5yTxQpP2L7wB6QsXFZ-sHb5Nfs9duDo1JVtTcTfm87C25uVHYhp2wFtLOgBtmtBzy1Q58g-6xfqg87YlxQT8uHgExFrMbL-qeDO2181lsAh_HK7eFynyRLWJqNiYCwsRt9Slwn3eg3U_LnyT2H3Ae2NjHdRgtUoSZWAjuOIOU_EeNRbwe1pcBxbW5R3obeifW93OwO6_1T1J_klG5JopqbfgYKe_A&skey=87e7ee645936e2c7&v=v40',
  // Noto Sans KR 600 — 랜딩에 쓰인 글자만 담은 작은 파일. 랜딩 한글 문구가 바뀌면 이 파일(과 landing.css 의 unicode-range)도 다시 만들어야 함
  'https://fonts.gstatic.com/l/font?kit=PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzjQ1eLHyWH7B4WEZ5NapM812QDgdrBqaGZlZdoCDxPIGUI61loeo-tX_LMoD50QDLbBzrzU99W4v-Yh-8VGqmIqcqURc94asBncmAM6WvJ6g_idZv4xD2TbbdBnG7FK3P-EDb3BTdY8umVmLdVyp19WAUA-FEoX9hwsngpVfddT3tr__HRGzcIwv2YEjW0gWZcE6nufvRz0kHG7f9DWLPpBbBvoWh8OhqOXg1EjNENjOsRiL3ryy5UCApKUMLHw7K9wGNx9EL93BG3w7ufl_1bI1YXKeyuceDTgZnuZhibDefoqFUC9j1SCzyyBO2AqLpXzYL88DRXc9ohS5O_ml475cxjW0d3GaTg1XPLrzXaeCiQTtldUBEbBseZHZr7ywPIUw58lZMreRYUiK_-Y1AesZHxSqqJJD9CYPIvxwjKm8DSs5h3gwEVm8zwoEkkxgac-h1gqaF3mdKTNLt_emnZcoEOAQ2rBCG9xnU3WEPWhlRzAwku6oCZ88SHUIaHjVrNGL3Xq4oqjxnqr4DHlQnY1POyl9cNr2aO2ZjMKU1BXrcAsAMQplIH1y8mb1rJTqpF6Ji7ZumHJmD_oqEOvl8ZdmpOssgL6zesXwehFU2c2raWFocHRxqyEOpP8_NVYNkcum6L5SfYEzIlJ9OSeQgDIFoOvZudxs-P2u0VNKLkbkKLH6zi6QRPUgt2gMtEFXRz8SbbMb8R_eXNZNC5-3cRUHVyWzbqOtuWVwRmWx8BS613Yl_n_qpReQg6jDEUDFPHbID3L2XhQcWp80ysyMIGBBuR64n8SdXOWaw0lXSayKG2J7rBD2jlOBBhGkY47dOm1AQLRT355_qhGCzK5Ff1fhbY1ekcFU7CoSAUBmZMBcVL76TNh2m9ZYky2A6JATjGcMskidTw05hQSz2nCf8pPoz9p6pthIwhl2jSrjbCFKioUB360tWJ3ZsNhP8xA0p3C_FLUZtXUyYtd-Tq2Ws12iRdxi5c2zX8KJYt1TJTD1X1ejqpk0seAW75aLnc-yXgoOt4wgCo4keBixJBAwn_dxbDRCryFnQrHgUfCReVqZsj2-KGM809BuWuMVtqCjeI8jvrW2FI8pFDPQWzmJyYW-NpS7360fSv9PYlVpyr6dWFwB1lU4NVc5d1sblyegPjGSerOtHXh4-aDfQ9bcySXJ5ktARvN55TXcEb2IQME-wDHCRvA3MXTQOygl7j_ik7022G_lpZxn4R4DiGQeeoJ-ht2KF_UJrWYFYnfO_riGhsyRckLKc6ZSbhWBiSxgPe3eQUHbASolM6jvdyRoll_bns0tR4x0pjNxA3yq9iC7wSjx3QIpGg3na8_4KTpiOf2tHRI6qhBw_GzBm59TB6d3xypve90xOBT8GyETlMQ_ZepyMUAvmNqlhm5ajWHl8TvwOF82mhxC_O5EvYyh7Ey1PUY&skey=87e7ee645936e2c7&v=v40',
  // Noto Sans KR 300 — 랜딩에 쓰인 글자만 담은 작은 파일. 랜딩 한글 문구가 바뀌면 이 파일(과 landing.css 의 unicode-range)도 다시 만들어야 함
  'https://fonts.gstatic.com/l/font?kit=PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzrQyeLHyGXfK1WAS0NWiB8p9dC0WmAyRLYlSQIiI894NZpO-pJ2jx8D0EdcI2XIJKpt5qCA38W4l9bd0_HSglYGWpFNdxb6tNEMnNtqXlpCh1BdYkpxC_SLaUzzHy2a2J9MCd11SaYsvhlmKaWWoyvmBTAWEDo38ljMmiL1ZS9XxiZL5JT-1SJgp4pElbWwQUc08q8fpciMiNmTZ3Q2MKaFcEO8Rnu-mscfnz3TKDcTJrBiMwoG1-kSHu78LM0w8N9wBKyJDDcTGOXU8nOd48JMyRFqZ__sZNhUfn8NnhL7YabKDRj9lxDS12glIyS6NtFvePfo&skey=87e7ee645936e2c7&v=v40',
];

/**
 * Landing — 브랜드 첫 진입 화면 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)을 옮긴 이식본 (3차: 아티팩트 최신본 전체).
 * 시작 로딩 화면 → 히어로(책상 위 카메라) → 플래시·사진 출력 → 문구 → 역사 도면(1937~2026) → NOW 실물 → 8가지 컬러 →
 * ZERO MINUTES → 부품 목록 → Make a Moment Last · 필름 사진 → NOW → 사용자 경험 설계(SHOT) → Your Style, Your Film →
 * 타임라인 갤러리(1990~2026). 왼쪽 목차 링으로 섹션 이동.
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
    // 시작 신호(intro:done)는 화면 UI 엔진이 두 엔진이 붙은 다음 틱에 보낸다 (시작 로딩 화면이 있으면 그 뒤에서 히어로가 먼저 그려짐)

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
