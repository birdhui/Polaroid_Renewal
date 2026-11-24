import { useEffect, useRef, useState } from 'react';
import CornerBrackets from './CornerBrackets.jsx';
import styles from './FeatureShowcase.module.css';

/**
 * Figma 주석("04, 05, 06 레이어는 하나의 화면")대로 기능 3종을 하나의 화면으로 구현한다.
 * 디자인은 Figma 그대로이고, 스크롤하면 화면이 고정(sticky)된 채 기능이 01→02→03으로 바뀐다(kinoria.studio 방식).
 * 흐린 문장을 누르면 그 기능 위치로 스크롤된다.
 */
export default function FeatureShowcase({ heading, features, background }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const count = features.length;
  const active = features[index];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 0.9999) : 0;
      setIndex(Math.floor(progress * count));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [count]);

  const goTo = (id) => {
    const track = trackRef.current;
    const target = features.findIndex((feature) => feature.id === id);
    if (!track || target < 0) return;
    const scrollable = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((target + 0.5) / count) * scrollable, behavior: 'smooth' });
  };
  const byId = (id) => features.find((feature) => feature.id === id);

  return (
    <div ref={trackRef} className={styles.track} style={{ '--count': count }}>
    <section
      className={styles.section}
      style={{ '--dy': active.textShift, '--fy': active.frameTop }}
      aria-label={heading}
    >
      <img className={styles.background} src={background} alt="" />

      <img
        key={active.id}
        className={`${styles.image} ${styles.fade}`}
        style={{ '--iy': active.imageTop, '--is': active.imageSize }}
        src={active.image}
        alt={active.headline}
      />
      <CornerBrackets className={styles.frame} />

      <span className={styles.tagPill} aria-hidden="true" />
      <p className={styles.tagCode}>{active.tag}</p>
      <p className={styles.tagLabel}>{active.tagLabel}</p>

      <h3 key={active.id} className={`${styles.headline} ${styles.fade}`}>{active.headline}</h3>
      <span className={`${styles.rule} ${styles.ruleTop}`} aria-hidden="true" />
      <span className={`${styles.rule} ${styles.ruleBottom}`} aria-hidden="true" />

      {active.ghosts.map((ghost, index) => {
        const target = byId(ghost.id);
        return (
          <button
            key={ghost.id}
            type="button"
            className={`${styles.ghost} ${index === 0 ? styles.ghostFirst : styles.ghostSecond}`}
            style={{ color: `rgba(21, 21, 21, ${ghost.opacity})` }}
            aria-label={target.headline}
            onClick={() => goTo(ghost.id)}
          >
            {target.headline}
          </button>
        );
      })}
    </section>
    </div>
  );
}
