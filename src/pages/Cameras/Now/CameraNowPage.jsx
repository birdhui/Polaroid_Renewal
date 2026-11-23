import FeatureShowcase from './components/FeatureShowcase.jsx';
import {
  hero,
  intro,
  featuresHeading,
  features,
  filterShowcase,
  appPromo,
  purchaseCta,
  discoverMore,
} from './data/sections.js';
import styles from './CameraNowPage.module.css';

/**
 * Cameras › Polaroid Now 상세 페이지 (담당: 임희지 · 브랜치: feat/cameras-now)
 * Figma "Cameras-detail Page" > "Cameras - NOW" 프레임을 기준으로 한 정적 구현.
 * 각 섹션은 Figma 프레임과 같은 1920×1080 비율(.screen)로 고정한다.
 * 이미지는 같은 Figma 레이어를 export_node_as_image로 내려받은 실제 에셋이다.
 */
export default function CameraNowPage() {
  return (
    <article className={styles.page} aria-labelledby="camera-now-title">
      <section className={`${styles.hero} ${styles.screen}`}>
        <img className={styles.heroImage} src={hero.image} alt="" />
        <div className={styles.heroCopy}>
          <h1 id="camera-now-title" className={styles.heroTitle}>
            {hero.title}
          </h1>
          <p className={styles.heroDescription}>{hero.description}</p>
        </div>
      </section>

      <section className={`${styles.intro} ${styles.screen}`}>
        <p className={styles.eyebrow}>{intro.eyebrow}</p>
        <h2 className={styles.introHeading}>
          {intro.heading.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p className={styles.wordmark}>{intro.wordmark}</p>
        <img className={styles.introImage} src={intro.image} alt="Polaroid Now 제품 이미지" />
        <h3 className={styles.sectionHeading}>{featuresHeading}</h3>
      </section>

      <FeatureShowcase heading={featuresHeading} features={features} />

      <section className={`${styles.filters} ${styles.screen} ${styles.darkSection}`}>
        <p className={styles.eyebrow}>{filterShowcase.eyebrow}</p>
        <h3 className={styles.sectionHeading}>{filterShowcase.heading}</h3>
        <img
          className={styles.filterPreview}
          src={filterShowcase.previewImage}
          alt="필터 적용 예시 사진"
        />
        <ul className={styles.filterList}>
          {filterShowcase.items.map((item) => (
            <li key={item.id} className={styles.filterItem}>
              <span
                className={`${styles.filterDisc} ${item.featured ? styles.filterDiscFeatured : ''}`}
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className={styles.filterLabel}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.appPromo} ${styles.screen} ${styles.darkSection}`}>
        <div className={styles.appPromoInner}>
          <div className={styles.appCopy}>
            <p className={styles.eyebrow}>{appPromo.eyebrow}</p>
            <h3 className={styles.sectionHeading}>{appPromo.heading}</h3>
            <p className={styles.appDescription}>{appPromo.description}</p>
          </div>
          <img className={styles.appPhone} src={appPromo.image} alt="Polaroid 앱 스토리 화면" />
        </div>
      </section>

      <section className={`${styles.purchase} ${styles.screen} ${styles.purchaseBg}`}>
        <h3 className={styles.purchaseHeading}>{purchaseCta.heading}</h3>
        <p className={styles.wordmark}>{purchaseCta.wordmark}</p>
        <div className={styles.purchaseGallery}>
          {purchaseCta.images.map((src, index) => (
            <img key={src} src={src} alt={`Polaroid Now 제품컷 ${index + 1}`} />
          ))}
        </div>
        <button type="button" className={styles.purchaseButton}>
          {purchaseCta.ctaLabel}
        </button>
      </section>

      <section className={`${styles.discover} ${styles.screen} ${styles.darkSection}`}>
        <h3 className={styles.discoverHeading}>
          {discoverMore.heading.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h3>
        <p className={styles.discoverDescription}>{discoverMore.description}</p>
        <ul className={styles.discoverGrid}>
          {discoverMore.products.map((product) => (
            <li key={product.id} className={styles.discoverCard}>
              <img src={product.image} alt={`${product.label} 제품 이미지`} />
              <span className={styles.discoverLabel}>{product.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
