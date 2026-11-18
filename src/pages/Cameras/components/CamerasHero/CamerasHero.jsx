import { useEffect, useState } from 'react';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import styles from './CamerasHero.module.css';

/** YouTube 배경 영상 주소: 음소거 자동 재생 · 반복 · 컨트롤 숨김 */
function youtubeBgSrc(id) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
    disablekb: '1',
    iv_load_policy: '3',
    modestbranding: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

const RAINBOW = ['red', 'orange', 'yellow', 'green', 'blue'];

/**
 * Cameras 히어로 (polaroid-shop 시안 1번 섹션).
 * 전체 화면 배경(영상 → 이미지 → 단색 순) 위, 왼쪽 아래에 두 줄 제목(페이지 h1)과 무지개 바.
 * 오른쪽 아래 세로 SCROLL 안내는 주소에 해시를 남기지 않고 다음 섹션으로 스크롤한 뒤
 * 그 섹션으로 포커스를 옮긴다(키보드 사용자도 같은 위치에서 이어서 읽도록).
 */
export default function CamerasHero({ hero, nextId }) {
  const { image, video, title } = hero;
  const reducedMotion = usePrefersReducedMotion();
  const showVideo = Boolean(video?.youtubeId) && !reducedMotion;
  const [copyIn, setCopyIn] = useState(false);

  // 첫 화면이므로 마운트 직후 한 프레임 뒤에 나타나게 한다.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setCopyIn(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleScrollToNext = () => {
    const target = document.getElementById(nextId);
    if (!target) return;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <section className={styles.hero} aria-labelledby="cameras-title">
      {showVideo ? (
        <div className={styles.bg} aria-hidden="true">
          <iframe
            className={styles.video}
            src={youtubeBgSrc(video.youtubeId)}
            title="Cameras 히어로 배경 영상"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
          />
        </div>
      ) : image?.src ? (
        <img className={styles.bg} src={image.src} alt={image.alt} loading="eager" decoding="async" fetchPriority="high" />
      ) : null}
      <div className={styles.scrim} aria-hidden="true" />

      <div className={`${styles.copy} ${copyIn ? styles.isIn : ''}`}>
        <h1 id="cameras-title" className={styles.title}>
          {title.map((line, i) => (
            <span key={line} className={i > 0 ? styles.soft : undefined}>
              {line}
            </span>
          ))}
        </h1>
        <div className={styles.rainbow} aria-hidden="true">
          {RAINBOW.map((color) => (
            <i key={color} style={{ background: `var(--cam-${color})` }} />
          ))}
        </div>
      </div>

      <button type="button" className={styles.cue} onClick={handleScrollToNext} aria-controls={nextId}>
        <span aria-hidden="true">SCROLL</span>
        <span className={styles.visuallyHidden}>다음 섹션으로 이동</span>
      </button>
    </section>
  );
}
