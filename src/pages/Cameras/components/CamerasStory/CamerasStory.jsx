import { useRef } from 'react';
import { Link } from 'react-router';
import BrandLockup from '../BrandLockup/BrandLockup.jsx';
import PhotoFrame from '../PhotoFrame/PhotoFrame.jsx';
import useInView from '../../hooks/useInView.js';
import useScrollProgress from '../../hooks/useScrollProgress.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import styles from './CamerasStory.module.css';

/**
 * Cameras 본문: 타이틀 → 흩어진 사진(패럴랙스) + 가운데 고정 본문 → 로크업 + CTA.
 * 패럴랙스는 '동작 줄이기' 설정 시 꺼진다.
 */
export default function CamerasStory({ id, story, lockup }) {
  const stageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const [titleRef, titleIn] = useInView({ threshold: 0.4 });
  const [endRef, endIn] = useInView({ threshold: 0.4 });

  useScrollProgress(stageRef, { disabled: reducedMotion });

  const { title, subtitle, body, photos, cta } = story;

  return (
    <section id={id} className={styles.story} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <header ref={titleRef} className={`${styles.titleBlock} ${titleIn ? styles.isIn : ''}`}>
        <h2 id={`${id}-title`} className={styles.title}>
          <span className={styles.enWord}>{title.lead}</span> <span className={styles.itWord}>{title.link}</span>{' '}
          <span className={styles.enWord}>{title.tail}</span>
        </h2>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <div ref={stageRef} className={styles.stage}>
        <ul className={styles.photos} role="list">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className={styles.photo}
              style={{
                '--x': photo.desktop.x,
                '--y': photo.desktop.y,
                '--w': photo.desktop.w,
                '--mx': photo.mobile.x,
                '--my': photo.mobile.y,
                '--mw': photo.mobile.w,
                '--depth': photo.depth,
              }}
            >
              <PhotoFrame src={photo.src} alt={photo.alt} ratio={photo.ratio} />
            </li>
          ))}
        </ul>

        <div className={styles.stickyRange}>
          <p className={styles.body}>
            {body.map((line) => (
              <span key={line} className={styles.bodyLine}>
                {line}
              </span>
            ))}
          </p>
        </div>
      </div>

      <footer ref={endRef} className={`${styles.end} ${endIn ? styles.isIn : ''}`}>
        <BrandLockup brand={lockup.brand} product={lockup.product} size="small" />
        <Link className={styles.cta} to={cta.to}>
          {cta.label}
        </Link>
      </footer>
    </section>
  );
}
