import { forwardRef, useEffect, useRef, useState } from 'react';
import { LOADING_PHOTOS } from '@/pages/Compare/data/compareLoadingPhotos.js';
import loadingBg from '@/assets/compare/loading/loading-bg.webp';
import preloadLoadingImages from '@/pages/Compare/utils/preloadLoadingImages.js';
import styles from './CompareLoading.module.css';

/**
 * 모션 타이밍(ms) — 레퍼런스(refinerypro.framer.ai/sequence)를 직접 측정한 값이다.
 * 아래 숫자만 바꾸면 전체 속도가 바뀐다. 장면별 이동·크기 값은 CompareLoading.module.css 의 phase 규칙에 있다.
 *
 * 흐름: intro(양쪽에서 가운데로 모이며 한 줄이 됨) → split(왼쪽 글씨는 위로, 오른쪽 글씨는 아래로 갈라지며 가로 크롭이 열림)
 *       → square(정사각형으로 확장) → slide(위 글씨는 오른쪽으로, 아래 글씨는 왼쪽으로 살짝 이동)
 *       → 사진이 차례로 바뀜(옆에서 밀고 들어옴) → exit(닫히며 사라짐)
 */
const TIMING = {
  startFallback: 2000, // 화면에 보이지 않아도 이 시간이 지나면 시작한다
  split: 1000, // 한 줄 상태에서 갈라지기 시작 (레퍼런스 ≈1.2s 보다 빠르게)
  square: 1700, // 가로 크롭 → 정사각형 (레퍼런스 ≈2.1s 보다 빠르게)
  slide: 2650, // 글씨가 좌우로 살짝 이동 (레퍼런스 ≈3.35s 보다 빠르게)
  firstChange: 2900, // 첫 사진 전환 시작 (레퍼런스 ≈3.65s 보다 빠르게)
  photoInterval: 700, // 사진 전환 간격 (레퍼런스는 1.1s. 전환 자체는 CSS 의 --swap 600ms 이고 나머지는 멈춰 있는 시간)
  holdLast: 700, // 마지막 사진이 보이는 시간 (마지막 전환이 끝난 뒤 잠깐 멈춤)
  exit: 800, // 닫히며 사라지는 시간 (CSS 의 exit 전환 시간 750ms 와 맞춘다)
  reducedMotionHold: 1500,
};

/**
 * 채팅 질문을 모두 마친 뒤, 추천 카메라가 나오기 전에 보이는 로딩 화면 (Figma 1583:303).
 * 화면에 보이면 모션이 시작되고, 끝나면 onDone 을 한 번 부른다.
 */
const CompareLoading = forwardRef(function CompareLoading({ onDone }, ref) {
  const rootRef = useRef(null);
  const [phase, setPhase] = useState('pre');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(-1);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false); // 이미지가 준비됐는지 (채팅 단계에서 미리 불러와 대개 이미 준비돼 있다)
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  const setRefs = (node) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // 화면에 60% 이상 보이면 시작한다 (스크롤로 들어오는 중에 모션이 끝나 버리지 않도록).
  useEffect(() => {
    const node = rootRef.current;
    const fallback = setTimeout(() => setStarted(true), TIMING.startFallback);
    if (!node || typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return () => clearTimeout(fallback);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    preloadLoadingImages().then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!started || !ready) return undefined;
    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 모션 감소 설정: 움직임 없이 완성된 장면만 잠깐 보여 준다.
    if (reduce) {
      setPhase('rest');
      at(TIMING.reducedMotionHold, () => doneRef.current?.());
      return () => timers.forEach(clearTimeout);
    }

    const count = LOADING_PHOTOS.length;
    const lastChangeAt = TIMING.firstChange + Math.max(0, count - 2) * TIMING.photoInterval;
    const exitAt = (count > 1 ? lastChangeAt : TIMING.firstChange) + TIMING.holdLast;

    at(30, () => setPhase('intro'));
    at(TIMING.split, () => setPhase('split'));
    at(TIMING.square, () => setPhase('square'));
    at(TIMING.slide, () => setPhase('slide'));
    for (let i = 1; i < count; i += 1) {
      at(TIMING.firstChange + (i - 1) * TIMING.photoInterval, () => {
        setPrevIndex(i - 1);
        setPhotoIndex(i);
      });
    }
    at(exitAt, () => setPhase('exit'));
    at(exitAt + TIMING.exit, () => doneRef.current?.());
    return () => timers.forEach(clearTimeout);
  }, [started, ready]);

  return (
    <section
      ref={setRefs}
      className={styles.loading}
      data-phase={phase}
      role="status"
      aria-label="추천 카메라를 찾는 중"
    >
      <img className={styles.bg} src={loadingBg} alt="" aria-hidden="true" />
      <div className={styles.column} aria-hidden="true">
        {/* 글씨는 사진 상자의 높이에 맞춰 위·아래로 벌어진다. 레이아웃이 아니라 transform 으로 움직여 끊기지 않는다. */}
        <div className={`${styles.follow} ${styles.follow1}`}>
          <p className={`${styles.word} ${styles.word1}`}>Finding your</p>
        </div>
        <div className={styles.box}>
          {/* 가로 크롭: 처음 열릴 때만 보인다. wide 가 없으면 square 를 가로로 잘라 쓴다. */}
          <img
            className={styles.wide}
            src={LOADING_PHOTOS[0].wide ?? LOADING_PHOTOS[0].square}
            alt=""
            draggable="false"
          />
          {/* 사진 전환(레퍼런스와 같은 방식): 새 사진은 한쪽 가장자리에서 25%만 먼저 보이다가 안쪽으로 밀고 들어오고,
              이전 사진은 같은 쪽으로 75% 밀려나며 가려진다. 방향은 사진마다 번갈아 바뀐다. */}
          <div className={styles.slides}>
            {LOADING_PHOTOS.map((photo, index) => (
              <div
                key={photo.id}
                className={styles.slide}
                data-state={index === photoIndex ? 'active' : index === prevIndex ? 'prev' : 'idle'}
                data-dir={index % 2 === 0 ? 'from-right' : 'from-left'}
              >
                <img className={styles.square} src={photo.square} alt="" draggable="false" />
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.follow} ${styles.follow2}`}>
          <p className={`${styles.word} ${styles.word2}`}>Polaroid...</p>
        </div>
      </div>
    </section>
  );
});

export default CompareLoading;
