import { forwardRef } from 'react';
import { COMPARE_PRODUCTS } from '@/pages/Compare/data/compareProducts.js';
import styles from './CompareResult.module.css';

/**
 * 카메라 3종 비교 — STEP 섹션 아래에 항상 이어지는 섹션이다. 마지막 스텝의 NEXT 로 이동한다.
 * 시안에 선택에 따른 추천 로직이 없어서 세 카메라를 모두 같은 형식으로 보여 준다.
 * "제품 보러가기" 버튼의 이동 동작은 시안에 정의돼 있지 않아 아직 연결하지 않았다.
 */
const CompareResult = forwardRef(function CompareResult(_props, ref) {
  return (
    <section ref={ref} className={styles.result} aria-label="카메라 비교" tabIndex={-1}>
      <div className={styles.inner}>
        {COMPARE_PRODUCTS.map((product) => (
          <article key={product.id} className={styles.product}>
            <div className={styles.imageSlot}>
              <img
                className={styles.image}
                src={product.image}
                alt=""
                style={{ '--w': product.imageSize.width, '--h': product.imageSize.height }}
                draggable="false"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className={styles.summary}>
              <div className={styles.titleRow}>
                <h3 className={styles.name}>{product.name}</h3>
                <p className={styles.price}>{product.price}</p>
              </div>
              <p className={styles.description}>{product.summary}</p>
            </div>

            <ul className={styles.colors} aria-label={`선택 가능한 색상 ${product.colors.length}가지`}>
              {product.colors.map((color) => (
                <li key={color} className={styles.color} style={{ backgroundColor: color }} />
              ))}
            </ul>

            <div className={styles.details}>
              <dl className={styles.specs}>
                <div className={styles.spec}>
                  <dt>호환 필름</dt>
                  <dd className={styles.film}>{product.film}</dd>
                </div>
                {product.specs.map((spec) => (
                  <div key={spec.label} className={styles.spec}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
              <button type="button" className={styles.compare}>
                제품 보러가기
                <span className={styles.srOnly}> — {product.name}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
});

export default CompareResult;
