import SectionHead from '../SectionHead/SectionHead.jsx';
import useInView from '../../hooks/useInView.js';
import styles from './CollabCards.module.css';

/**
 * 콜라보 카드 4열: 세로 이미지(3:4) → 굵은 제목 → 한 줄 설명 → 밑줄 CTA.
 * 이미지가 없으면 콜라보 이름이 들어간 자리표시 박스를 보여준다.
 */
function CollabCard({ item }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const { placeholder } = item;

  return (
    <li ref={ref} className={`${styles.card} ${inView ? styles.isIn : ''}`}>
      <a
        className={styles.media}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        style={{ '--ph-bg': placeholder.bg, '--ph-fg': placeholder.fg }}
      >
        {item.image?.src ? (
          <img src={item.image.src} alt="" loading="lazy" decoding="async" />
        ) : (
          <>
            <span className={styles.phTag}>IMAGE</span>
            <span className={styles.phLabel}>
              {placeholder.label.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </>
        )}
      </a>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.title}</h3>
        <p className={styles.desc}>{item.desc}</p>
        <a className={styles.cta} href={item.href} target="_blank" rel="noopener noreferrer">
          지금 구매하기<span className={styles.srOnly}> — {item.title}</span>
        </a>
      </div>
    </li>
  );
}

export default function CollabCards({ id, head, items }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <SectionHead id={id} title={head.title} desc={head.desc} />
      <ul className={styles.grid} role="list">
        {items.map((item) => (
          <CollabCard key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
