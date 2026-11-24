import useInView from '../hooks/useInView.js';
import { boxVars } from './layout.js';
import styles from './MomentsIntro.module.css';

/**
 * 3. Every Moment Has Its Camera — 소개 문구 + 기울어진 폴라로이드 사진 3장 (시안 높이 1095)
 * 제목은 흐리게(blur) 보이다가, 화면 아래쪽 20% 위로 올라와 다 보이면 선명해진다.
 * 사진은 화면에 들어오면 왼쪽 사진부터 차례로 아래에서 위로 떠오르며 나타난다.
 * 화면 밖으로 완전히 벗어났다가 다시 들어오면(위·아래 어느 쪽에서든) 모션이 다시 재생된다.
 */
const STAGE_TOP = 415;
const STAGGER_MS = 140;

export default function MomentsIntro({ moments, reducedMotion }) {
  const [stageRef, inView] = useInView({ threshold: 0.3, repeat: true });
  const [titleRef, titleIn] = useInView({ threshold: 1, rootMargin: '0px 0px -20% 0px', repeat: true });
  // 겹침 순서(z)는 데이터 순서 그대로 두고, 나타나는 순서만 왼쪽부터로 정한다
  const order = [...moments.photos].sort((a, b) => a.box[0] - b.box[0]);
  return (
    <section className={styles.section} aria-labelledby="cameras-moments-title">
      <h2
        ref={titleRef}
        id="cameras-moments-title"
        className={`${styles.title} ${titleIn || reducedMotion ? styles.titleClear : ''}`}
      >
        {moments.title}
      </h2>
      <p className={styles.body}>
        {moments.body.map((line, i) => (
          <span key={line}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </p>
      <div ref={stageRef} className={`${styles.stage} ${inView || reducedMotion ? styles.shown : ''}`}>
        {moments.photos.map((photo) => (
          <img
            key={photo.src}
            className={styles.photo}
            style={{ ...boxVars(photo.box, [0, STAGE_TOP]), '--delay': `${order.indexOf(photo) * STAGGER_MS}ms` }}
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
          />
        ))}
      </div>
    </section>
  );
}
