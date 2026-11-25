import useInView from '../../hooks/useInView.js';
import styles from './SectionHead.module.css';

/** 샵 영역 섹션 제목 줄: 왼쪽 큰 영문 제목 + 오른쪽 짧은 설명 */
export default function SectionHead({ id, title, desc }) {
  const [ref, inView] = useInView({ threshold: 0.4 });

  return (
    <header ref={ref} className={`${styles.head} ${inView ? styles.isIn : ''}`}>
      <h2 id={id} className={styles.title}>
        {title}
      </h2>
      {desc && <p className={styles.desc}>{desc}</p>}
    </header>
  );
}
