import { useEffect, useRef } from 'react';
import styles from './MainHero.module.css';

/**
 * 1. Hero — 전체 화면 배경 영상 + 왼쪽 아래 Polaroid 로고와 'Instant Cameras'
 * 영상은 소리 없이 반복 재생된다. 동작 줄이기 설정이면 재생하지 않고 첫 장면(poster)만 보여준다.
 */
export default function MainHero({ hero, reducedMotion }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reducedMotion) {
      v.pause();
      return;
    }
    // 자동 재생이 막힌 환경에서도 오류 없이 poster 를 보여준다
    v.play?.()?.catch?.(() => {});
  }, [reducedMotion]);

  return (
    <section className={styles.hero} aria-labelledby="cameras-hero-title">
      <video
        ref={videoRef}
        className={styles.video}
        src={hero.video.src}
        poster={hero.video.poster}
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <h1 id="cameras-hero-title" className={styles.title}>
        <img className={styles.logo} src={hero.logo.src} alt={hero.logo.alt} width="464" height="127" />
        <span className={styles.sub}>{hero.title}</span>
      </h1>
    </section>
  );
}
