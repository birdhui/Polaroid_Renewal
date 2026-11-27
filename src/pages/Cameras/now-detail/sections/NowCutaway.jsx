import { useEffect, useRef, useState } from 'react';
import modelUrl from '@/assets/cameras/now/now-graphite.glb';
import posterImage from '@/assets/cameras/now/now-cutaway-poster.webp';
import { createCutaway } from '../cutaway/createCutaway.js';
import styles from '../CameraNowPage.module.css';

/**
 * 3-2. 내부 구조 연출 (polaroid.com Now 'Easy-to-use, completely analog camera.' 애니메이션 + i2 마무리 구성)
 * three.js 실시간 3D. 스크롤할수록 몸체가 잘려 열리고 → 렌즈로 스펙트럼이 천천히 들어와 거울을 거쳐 필름에 닿고
 * → 롤러로 사진이 배출·현상 → 몸체가 다시 닫힌다. 사진 아래(사진이 길어진 만큼 아래)에 설명 문구와 영상 카드가 나타난다.
 * WebGL·모델을 쓸 수 없으면 정지 이미지(now-cutaway-poster.webp)를 보여 준다.
 */
const PRINT_PHOTO =
  'https://cdn.sanity.io/images/ieogcuy1/production/1228092e3ce76ea6edaaf862626bc42aca3311ee-4107x5000.jpg?w=1600&fm=jpg&q=90';
const WATCH_YOUTUBE_ID = 'FgUqS0QTaeA';
const WATCH_TITLE = 'How to use the Polaroid NOW';

/** 영상 모달: 열 때 YouTube 플레이어를 넣고, 닫으면 지워 소리를 멈춘다. 닫으면 연 버튼으로 포커스를 돌려준다. */
function VideoModal({ open, onClose, returnFocus }) {
  const ref = useRef(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const q = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', modestbranding: '1' });

  return (
    <dialog
      ref={ref}
      className={styles.videoModal}
      aria-label={`${WATCH_TITLE} 영상`}
      onClose={() => {
        onClose();
        returnFocus.current?.focus();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // 바깥(배경) 클릭
      }}
    >
      <button className={styles.videoModalClose} type="button" aria-label="영상 닫기" onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className={styles.videoModalFrame}>
        {open && (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${WATCH_YOUTUBE_ID}?${q.toString()}`}
            title={WATCH_TITLE}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
    </dialog>
  );
}

function WatchThumb() {
  const [src, setSrc] = useState(`https://i.ytimg.com/vi/${WATCH_YOUTUBE_ID}/maxresdefault.jpg`);
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.watchThumb}>
      <img
        src={src}
        alt=""
        loading="lazy"
        style={failed ? { visibility: 'hidden' } : undefined}
        onError={() => {
          if (!src.includes('mqdefault')) setSrc(`https://i.ytimg.com/vi/${WATCH_YOUTUBE_ID}/mqdefault.jpg`);
          else setFailed(true); // 깨진 이미지 아이콘 대신 빈 칸
        }}
      />
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 7v10l8-5z" />
      </svg>
    </span>
  );
}

export default function NowCutaway({ reducedMotion }) {
  const secRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const copyRef = useRef(null);
  const glowLRef = useRef(null);
  const glowRRef = useRef(null);
  const watchRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    setReady(false);
    setFallback(false);
    const cut = createCutaway({
      section: secRef.current,
      stage: stageRef.current,
      canvas: canvasRef.current,
      copy: copyRef.current,
      glowL: glowLRef.current,
      glowR: glowRRef.current,
      modelUrl,
      printUrl: PRINT_PHOTO,
      reduce: reducedMotion,
      onReady: () => setReady(true),
      onFail: () => setFallback(true),
    });
    return () => cut.destroy();
  }, [reducedMotion]);

  return (
    <section ref={secRef} className={`${styles.cutaway} ${fallback ? styles.isFallback : ''}`} aria-labelledby="now-cutaway-text">
      <div ref={stageRef} className={styles.cutawayStage}>
        <div ref={glowLRef} className={`${styles.cutawayGlow} ${styles.cutawayGlowL}`} aria-hidden="true" />
        <div ref={glowRRef} className={`${styles.cutawayGlow} ${styles.cutawayGlowR}`} aria-hidden="true" />
        {fallback && <img className={styles.cutawayPoster} src={posterImage} alt="배출구로 인화 사진이 나온 그래파이트 Polaroid Now" />}
        {/* key: 3D 를 다시 만들 때(동작 줄이기 설정 변경) 새 캔버스로 WebGL 을 연다 */}
        <canvas
          key={reducedMotion ? 'still' : 'motion'}
          ref={canvasRef}
          className={`${styles.cutawayCanvas} ${ready ? styles.isReady : ''}`}
          role="img"
          aria-label="Polaroid Now 내부: 몸체가 열리고 렌즈로 들어온 스펙트럼이 거울을 거쳐 필름에 닿은 뒤, 롤러를 지나 사진이 배출되어 현상되는 과정"
        />
        <div ref={copyRef} className={styles.cutawayCopy}>
          <p id="now-cutaway-text" className={styles.cutawayText}>
            The classic analog instant camera. With self-timer and double-exposure modes, an upgraded two-lens autofocusing
            system and made with 40% recycled materials in different colors. All so you can capture real life on iconic,
            full-sized Polaroid film.
          </p>
          <button ref={watchRef} className={styles.watchCard} type="button" aria-haspopup="dialog" onClick={() => setVideoOpen(true)}>
            <WatchThumb />
            <span className={styles.watchText}>
              <span className={styles.watchLabel}>Watch</span>
              <span className={styles.watchTitle}>{WATCH_TITLE}</span>
            </span>
          </button>
        </div>
      </div>
      <VideoModal open={videoOpen} onClose={() => setVideoOpen(false)} returnFocus={watchRef} />
    </section>
  );
}
