import useInView from '../../hooks/useInView.js';
import styles from './BestSellerGrid.module.css';

/** 베스트셀러 카드: 이미지 → 모델 표시 → 상품명 + 가격 → 한 줄 설명 → 스펙 칩 2개 */
function ProductCard({ product }) {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <li ref={ref} className={`${styles.card} ${inView ? styles.isIn : ''}`}>
      <a className={styles.link} href={product.href} target="_blank" rel="noopener noreferrer">
        <div className={styles.media}>
          <img src={product.image.src} alt={product.image.alt} loading="lazy" decoding="async" />
        </div>
        <p className={styles.rank}>{product.model} · BEST</p>
        <div className={styles.top}>
          <h3 className={styles.name}>{product.name}</h3>
          <span className={styles.price}>{product.price}</span>
        </div>
        <p className={styles.tagline}>{product.tagline}</p>
      </a>
      <ul className={styles.chips} role="list">
        <li className={styles.chip}>
          필름 <strong>{product.film}</strong>
        </li>
        <li className={styles.chip}>
          무게 <strong>{product.weight}</strong>
        </li>
      </ul>
    </li>
  );
}

export default function BestSellerGrid({ label, products }) {
  return (
    <section className={styles.section} aria-label={label}>
      <ul className={styles.grid} role="list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ul>
    </section>
  );
}
