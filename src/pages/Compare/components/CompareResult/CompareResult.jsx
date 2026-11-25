import { forwardRef, useState } from 'react';
import { Link } from 'react-router';
import getRecommendations from '@/pages/Compare/utils/getRecommendations.js';
import styles from './CompareResult.module.css';

/** 추천 카드 1개 — 컬러칩을 누르면 해당 색의 제품 이미지로 바뀐다. */
function ProductCard({ rank, product }) {
  const [colorId, setColorId] = useState(product.defaultColor);
  const selectedColor = product.colors.find((color) => color.id === colorId);
  const currentImage = selectedColor?.image ?? product.image;

  return (
    <article className={styles.product} data-product={product.id} aria-label={`${rank}순위 ${product.name}`}>
      <div className={styles.imageSlot}>
        {currentImage ? (
          <img
            className={styles.image}
            src={currentImage}
            alt=""
            style={{ '--w': product.imageSize.width, '--h': product.imageSize.height }}
            draggable="false"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={styles.imageEmpty} role="img" aria-label={`${product.name} 제품 이미지 준비 중`}>
            이미지 준비 중
          </div>
        )}
      </div>

      <div className={styles.summary}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>
            {product.name}
            {product.generation ? <span className={styles.srOnly}> {product.generation}</span> : null}
          </h3>
          <p className={product.price ? styles.price : `${styles.price} ${styles.pricePending}`}>
            {product.price ?? '₩ 국내 판매가 확인'}
          </p>
        </div>
        <p className={styles.description}>{product.summary}</p>
      </div>

      <ul className={styles.colors} aria-label={product.colors.length ? `선택 가능한 색상 ${product.colors.length}가지` : '색상 정보 확인 중'}>
        {product.colors.map((color) => (
          <li key={color.id}>
            {color.image ? (
              <button
                type="button"
                className={`${styles.color} ${styles.colorButton} ${color.id === colorId ? styles.colorActive : ''}`}
                style={{ backgroundColor: color.hex }}
                onClick={() => setColorId(color.id)}
                aria-pressed={color.id === colorId}
                aria-label={`${product.name} ${color.id} 색상 보기`}
              />
            ) : (
              <span className={styles.color} style={{ backgroundColor: color.hex }} />
            )}
          </li>
        ))}
      </ul>

      <div className={styles.details}>
        <dl className={styles.specs}>
          <div className={styles.spec}>
            <dt>호환 필름</dt>
            <dd className={styles.film}>{product.film}</dd>
          </div>
          <div className={styles.spec}>
            <dt>촬영 특징</dt>
            <dd>{product.feature}</dd>
          </div>
          <div className={styles.spec}>
            <dt>무게 (g)</dt>
            <dd>{product.weight}</dd>
          </div>
          <div className={styles.spec}>
            <dt>추천 이유</dt>
            <dd className={styles.reason}>{product.recommendReason}</dd>
          </div>
        </dl>
        {product.detailPath ? (
          <Link to={product.detailPath} className={styles.compare}>
            제품 보러가기
            <span className={styles.srOnly}> — {product.name}</span>
          </Link>
        ) : (
          <button type="button" className={`${styles.compare} ${styles.compareDisabled}`} aria-disabled="true" title="제품 상세페이지 연결 예정">
            제품 보러가기
            <span className={styles.srOnly}> — {product.name} (상세페이지 연결 전)</span>
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * 추천 결과 — STEP 1~3 을 모두 마친 뒤 나타난다.
 * 추천 카메라 3개를 규칙표 순서대로 보여 준다.
 * 순위는 규칙표(data/compareRecommendations.js)를 그대로 따르며, 공식 폴라로이드 추천이 아닌 프로젝트의 초기 추천안이다.
 * 제품 상세페이지가 정해지지 않은 카메라(detailPath 가 null)의 버튼은 연결 전 상태로 둔다.
 */
const CompareResult = forwardRef(function CompareResult({ selection }, ref) {
  const recommendations = getRecommendations(selection);

  return (
    <section ref={ref} className={styles.result} aria-label="카메라 추천 결과" tabIndex={-1}>
      <div className={styles.inner}>
        {recommendations.map(({ rank, product }) => (
          <ProductCard key={product.id} rank={rank} product={product} />
        ))}
      </div>
    </section>
  );
});

export default CompareResult;
