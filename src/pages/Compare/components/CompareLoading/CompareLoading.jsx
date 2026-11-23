import { forwardRef, useEffect, useRef, useState } from 'react';
import { LOADING_PHOTOS } from '@/pages/Compare/data/compareLoadingPhotos.js';
import loadingBg from '@/assets/compare/loading/loading-bg.webp';
import styles from './CompareLoading.module.css';

/**
 * 모션 타이밍(ms) — 레퍼런스(refinerypro.framer.ai/sequence)를 측정한 값을 바탕으로 한 임시값이다.
 * 아래 숫자만 바꾸면 전체 속도가 바뀐다. 장면별 이동·크기 값은 CompareLoading.module.css 의 phase 규칙에 있다.
 *
 * 흐름: intro(한 줄 텍스트가 나타남) → split(텍스트가 위/아래로 갈라지며 가로 크롭이 열림)
 *       → square(정사각형으로 확장) → slide(텍스트가 좌우로 정렬) → 사진이 차례로 바뀜 → exit(닫히며 사라짐)
 */
const TIMING = {
  startFallback: 2000, // 화면에 보이지 않아도 이 시간이 지나면 시작한다
  split: 1300,
  square: 2500,
  slide: 3650,
  photoInterval: 900, // 사진 한 장이 보이는 시간
  holdMin: 1500, // 사진 수가 적어도 정렬된 상태로 최소한 머무는 시간
  exit: 1000, // 닫히며 사라지는 시간 (CSS 의 exit 전환 시간과 맞춘다)
  reducedMotionHold: 1500,
};

/**
 * 글자 하나하나가 시차를 두고 나타나고 사라지는 타이포 모션 (Framer 'AnimatedTextRotator' 의 기본 설정을 따른다:
 * blur 전환 · 글자 간격 0.06s · 나타남 0.45s easeOut · 사라짐은 간격 0.6배 · 순서는 앞에서부터).
 * 글자마다 --i(순번)만 넘기고, 실제 시간·곡선은 CompareLoading.module.css 의 .char 에 있다.
 */
function AnimatedText({ text }) {
  return Array.from(text).map((char, index) => (
    <span key={index} className={styles.char} style={{ '--i': index }}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
}

/**
 * 채팅 질문을 모두 마친 뒤, 추천 카메라가 나오기 전에 보이는 로딩 화면 (Figma 1583:303).
 * 화면에 보이면 모션이 시작되고, 끝나면 onDone 을 한 번 부른다.
 */
const CompareLoading = forwardRef(function CompareLoading({ onDone }, ref) {
  const rootRef = useRef(null);
  const [phase, setPhase] = useState('pre');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [started, setStarted] = useState(false);
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
    if (!started) return undefined;
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
    const hold = Math.max(TIMING.holdMin, count * TIMING.photoInterval);
    const exitAt = TIMING.slide + hold;

    at(30, () => setPhase('intro'));
    at(TIMING.split, () => setPhase('split'));
    at(TIMING.square, () => setPhase('square'));
    at(TIMING.slide, () => setPhase('slide'));
    for (let i = 1; i < count; i += 1) {
      at(TIMING.slide + i * TIMING.photoInterval, () => setPhotoIndex(i));
    }
    at(exitAt, () => setPhase('exit'));
    at(exitAt + TIMING.exit, () => doneRef.current?.());
    return () => timers.forEach(clearTimeout);
  }, [started]);

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
        <p className={`${styles.word} ${styles.word1}`}>
          <AnimatedText text="Finding your" />
        </p>
        <div className={styles.box}>
          {/* 가로 크롭: 처음 열릴 때만 보인다. wide 가 없으면 square 를 가로로 잘라 쓴다. */}
          <img
            className={styles.wide}
            src={LOADING_PHOTOS[0].wide ?? LOADING_PHOTOS[0].square}
            alt=""
            draggable="false"
          />
          {LOADING_PHOTOS.map((photo, index) => (
            <img
              key={photo.id}
              className={styles.square}
              data-active={index === photoIndex}
              src={photo.square}
              alt=""
              draggable="false"
            />
          ))}
        </div>
        <p className={`${styles.word} ${styles.word2}`}>
          <AnimatedText text="Polaroid..." />
        </p>
      </div>
    </section>
  );
});

export default CompareLoading;
