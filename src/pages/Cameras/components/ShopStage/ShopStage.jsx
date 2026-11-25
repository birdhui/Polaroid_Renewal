import useInView from '../../hooks/useInView.js';
import styles from './ShopStage.module.css';

/**
 * 화면을 채우는 소개 무대: (배경 이미지) + eyebrow + 큰 영문 제목 + 한글 설명.
 * 이미지는 아직 없다. `image`가 들어오면 배경으로 깔리고 아래쪽이 어두워진다.
 * title 의 두 번째 줄부터는 톤을 낮춘다.
 */
export default function ShopStage({ id, label, eyebrow, title, desc, image, tone = 'dark' }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const style = image?.src ? { '--stage-img': `url(${image.src})` } : undefined;

  return (
    <section
      id={id}
      aria-label={label}
      className={`${styles.stage} ${styles[tone] ?? ''} ${image?.src ? styles.hasImage : ''}`}
      style={style}
    >
      <div ref={ref} className={`${styles.inner} ${inView ? styles.isIn : ''}`}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 className={styles.title}>
          {title.map((line, i) => (
            <span key={line} className={i > 0 ? styles.soft : undefined}>
              {line}
            </span>
          ))}
        </h2>
        {desc && (
          <p className={styles.desc}>
            {desc.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
