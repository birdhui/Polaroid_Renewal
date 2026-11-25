import styles from './BrandLockup.module.css';

/**
 * 브랜드 × 제품 로크업.
 * 로고 이미지가 확정되면(공통 에셋, 모진아) 텍스트 대신 이미지로 교체한다. 헤더 로고도 현재 텍스트다.
 * `as`로 제목 태그를 지정할 수 있다. (히어로에서는 페이지 h1 로 사용)
 */
export default function BrandLockup({ brand, product, as: Tag = 'p', size = 'large', className = '', id }) {
  return (
    <Tag id={id} className={`${styles.lockup} ${styles[size]} ${className}`.trim()} aria-label={`${brand} ${product}`}>
      <span className={styles.brand} aria-hidden="true">
        {brand}
      </span>
      <span className={styles.cross} aria-hidden="true">
        ×
      </span>
      <span className={styles.product} aria-hidden="true">
        {product}
      </span>
    </Tag>
  );
}
