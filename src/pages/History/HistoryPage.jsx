import { useLayoutEffect, useRef } from 'react';
import styles from '@/pages/History/HistoryPage.module.css';
import landPortrait from '@/assets/history/edwin-land-lecture.webp';
import model95Sketch from '@/assets/history/model95-line-sketch.webp';
import { CURRENT_YEAR, HISTORY_YEARS } from '@/pages/History/data/historyYears';

/* Focus-ring geometry: one year per step, four fine ticks between years. */
const WHEEL_STEP_DEG = 12;
const MINOR_TICKS = 4;
const currentIndex = HISTORY_YEARS.indexOf(CURRENT_YEAR);
const wheelMarks = HISTORY_YEARS.flatMap((year, index) => {
  const angle = (index - currentIndex) * WHEEL_STEP_DEG;
  const yearMark = { key: `y${year}`, angle, year };
  if (index === HISTORY_YEARS.length - 1) return [yearMark];
  const minors = Array.from({ length: MINOR_TICKS }, (_, i) => ({
    key: `m${year}-${i}`,
    angle: angle + ((i + 1) * WHEEL_STEP_DEG) / (MINOR_TICKS + 1),
  }));
  return [yearMark, ...minors];
});

const clamp = (value) => Math.min(1, Math.max(0, value));

/**
 * Layered parallax after the Leica timeline reference:
 * copy drifts slower than the page, the portrait behind it rises faster,
 * and a lens focus-ring of years on the left turns with the page.
 */
function useHistoryParallax(pageRef) {
  useLayoutEffect(() => {
    const page = pageRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = null;

    const render = () => {
      frameId = null;
      const bounds = page.getBoundingClientRect();
      const scrolled = -bounds.top;
      const runway = Math.max(1, bounds.height - window.innerHeight);

      if (reducedMotion.matches) {
        page.style.setProperty('--copy-shift', '0px');
        page.style.setProperty('--portrait-shift', '0px');
        page.style.setProperty('--wheel-rot', '0deg');
        return;
      }

      // Only transform-based custom properties change, so scrolling never rerenders React.
      const travel = Math.max(0, scrolled);
      page.style.setProperty('--copy-shift', `${travel * 0.22}px`);
      page.style.setProperty('--portrait-shift', `${travel * -0.32}px`);
      // Turn the focus ring a little as the page scrolls, never past half a step.
      page.style.setProperty('--wheel-rot', `${clamp(scrolled / runway) * WHEEL_STEP_DEG * 0.45}deg`);
    };

    const schedule = () => {
      if (frameId === null) frameId = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reducedMotion.addEventListener('change', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      reducedMotion.removeEventListener('change', schedule);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [pageRef]);
}

export default function HistoryPage() {
  const pageRef = useRef(null);
  useHistoryParallax(pageRef);

  return (
    <section ref={pageRef} className={styles.page} aria-labelledby="history-title">
      {/* Viewport-pinned chrome: a lens focus-ring of years. */}
      <div className={styles.rail} aria-hidden="true">
        <div className={styles.railInner}>
          <div className={styles.wheel}>
            <div className={styles.wheelDrum}>
              {wheelMarks.map(({ key, angle, year }) => (
                <div
                  key={key}
                  className={year ? styles.wheelYear : styles.wheelTick}
                  data-current={year === CURRENT_YEAR || undefined}
                  style={{ '--mark-angle': `${angle}deg` }}
                >
                  {year && <span>{year}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Toned to the page gray and faded at the bottom so it melts into the background. */}
      <div className={styles.portrait}>
        <img
          src={landPortrait}
          width="1423"
          height="1105"
          alt="강연하는 에드윈 랜드"
          decoding="async"
        />
      </div>

      <div className={styles.copy}>
        <p className={styles.yearInline}>{CURRENT_YEAR}</p>
        <h1 id="history-title" className={styles.title} lang="en">
          <span>Why can’t we see</span>{' '}
          <span>the photo right away?</span>
        </h1>
        <p className={styles.description} lang="ko">
          “찍은 사진을 왜 바로 볼 수 없을까?” 딸의 질문에서 영감을 얻어,
          찍은 자리에서 사진을 볼 수 있는 즉석사진 기술을 개발한 에드윈 랜드.
          사진을 기다리던 시간을 바꾼 폴라로이드의 여정은 그렇게 시작됐습니다.
        </p>
        {/* Line sketch rides with the copy, over the portrait, like the reference's M drawing. */}
        <img
          className={styles.sketch}
          src={model95Sketch}
          width="1200"
          height="1353"
          alt="폴라로이드 랜드 카메라 모델 95 라인 드로잉"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
}
