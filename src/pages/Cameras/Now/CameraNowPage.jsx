import { useState } from 'react';
import FeatureShowcase from './components/FeatureShowcase.jsx';
import CornerBrackets from './components/CornerBrackets.jsx';
import {
  hero,
  intro,
  featuresHeading,
  features,
  filterShowcase,
  appPromo,
  purchaseCta,
  goFilm,
  discoverMore,
} from './data/sections.js';
import styles from './CameraNowPage.module.css';

/**
 * Cameras › Polaroid Now 상세 페이지 (담당: 임희지 · 브랜치: feat/cameras-now)
 * Figma "Cameras-detail Page" > "Cameras - NOW" (1827:3741) 프레임을 1920px 좌표 그대로 옮긴 구현.
 * 각 섹션(.screen)은 Figma와 같은 1920×1080 비율이고, 모든 좌표·크기·폰트는 화면 너비에 비례해 변한다.
 * 04~06 기능 3종은 FeatureShowcase 하나로 합쳤다(Figma 주석).
 */

/* Figma가 쓰는 폰트(Pretendard · Outfit · IBM Plex Mono · Archivo). 공통 폰트가 확정되기 전이라 이 페이지에서만 불러온다.
   React 19가 <link>를 <head>로 올려준다. */
const FONT_STYLESHEETS = [
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;800&family=IBM+Plex+Mono:wght@400;500&family=Archivo:wght@300;600;700&display=swap',
];

function Lines({ lines }) {
  return lines.map((line) => (
    <span key={line} className={styles.line}>
      {line}
    </span>
  ));
}

/** Figma 이미지 자리: 파일이 아직 없으면 점선 자리표시자를 보여준다 */
function FilmImage({ image, className, alt }) {
  if (image.src) return <img className={className} src={image.src} alt={alt} />;
  return (
    <span className={`${className} ${styles.imageSlot}`} role="img" aria-label={alt}>
      {image.file}
    </span>
  );
}

/** Figma "Section BG Photo" 좌표(x, y, 너비, 높이) */

export default function CameraNowPage() {
  const [selectedId, setSelectedId] = useState(
    () => filterShowcase.items.find((item) => item.selected).id,
  );
  const selectedFilter = filterShowcase.items.find((item) => item.id === selectedId);

  return (
    <article className={styles.page} aria-labelledby="camera-now-title">
      {FONT_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      {/* 01 Hero */}
      <section className={styles.screen}>
        <img className={styles.heroImage} src={hero.image} alt="" />
        <h1 id="camera-now-title" className={styles.heroTitle}>
          {hero.title}
        </h1>
        <p className={styles.heroDescription}>
          <Lines lines={hero.description} />
        </p>
      </section>

      {/* 02 Intro */}
      <section className={`${styles.screen} ${styles.intro}`}>
        <CornerBrackets className={styles.introBrackets} />
        <h2 className={styles.introHeading}>
          <Lines lines={intro.heading} />
        </h2>
        <p className={styles.introWordmark}>{intro.wordmark}</p>
        <p className={styles.introEyebrow}>{intro.eyebrow}</p>
        <img className={styles.introImage} src={intro.image} alt="Polaroid Now 제품 이미지" />
      </section>

      {/* 03 Features Heading */}
      <section className={`${styles.screen} ${styles.featuresHeading}`}>
        <h2 className={styles.featuresHeadingText}>
          <Lines lines={featuresHeading} />
        </h2>
      </section>

      {/* 04~06 Feature */}
      <FeatureShowcase
        heading={featuresHeading.join(' ')}
        features={features}
      />

      {/* 07~11: 하나의 갈색 그라데이션 배경으로 이어서 보이도록 묶는다 (ORYZO 참고) */}
      <div className={styles.darkZone}>
      {/* 07 Filter Showcase */}
      <section className={`${styles.screen} ${styles.filters}`}>
        <p className={styles.filterEyebrow}>{filterShowcase.eyebrow}</p>
        <h3 className={styles.filterHeading}>
          <Lines lines={filterShowcase.heading} />
        </h3>
        <p className={styles.filterDescription}>{filterShowcase.description}</p>
        <div className={styles.filterPrint} style={{ backgroundColor: selectedFilter.paper ?? selectedFilter.color }} />
        <img className={styles.filterPreview} src={filterShowcase.previewImage} alt="필터 적용 예시 사진" />
        <p className={styles.filterCardLabel}>{selectedFilter.label}</p>
        {filterShowcase.items.map((item) => {
          // 선택된 필터 원은 크게(60.7), 나머지는 46. 원의 중심은 그대로 둔다.
          const isSelected = item.id === selectedId;
          const size = isSelected ? filterShowcase.selectedSize : filterShowcase.size;
          return (
            <button
              key={item.id}
              type="button"
              className={styles.filterDisc}
              style={{
                '--x': item.cx - size / 2,
                '--y': filterShowcase.cy - size / 2,
                '--d': size,
                backgroundColor: item.color,
                opacity: isSelected ? 1 : item.opacity,
              }}
              onClick={() => setSelectedId(item.id)}
              aria-label={item.label}
              aria-pressed={isSelected}
              title={item.label}
            />
          );
        })}
        {filterShowcase.items.map((item) => (
          <p
            key={item.id}
            className={`${styles.filterDiscLabel} ${item.id === selectedId ? styles.filterDiscLabelOn : ''}`}
            style={{ '--x': item.cx }}
            aria-hidden="true"
          >
            {item.label}
          </p>
        ))}
      </section>

      {/* 08 App Promo */}
      <section className={`${styles.screen} ${styles.appPromo}`}>

        <p className={styles.appEyebrow}>{appPromo.eyebrow}</p>
        <h3 className={styles.appHeading}>
          <Lines lines={appPromo.heading} />
        </h3>
        <p className={styles.appDescription}>
          <Lines lines={appPromo.description} />
        </p>

        {/* TODO: Figma App Store / Play Store 아이콘 SVG(1827:3846·3847)로 교체. 지금은 근사한 모양이다. */}
        <span className={`${styles.storeIcon} ${styles.storeIconApple}`} aria-hidden="true">
          <svg className={styles.storeGlyph} viewBox="0 0 60 60" fill="none">
            <g stroke="#f0a137" strokeWidth="4.5" strokeLinecap="round">
              <path d="M30 14 L19 40" />
              <path d="M30 14 L41 40" />
              <path d="M22 33 H38" />
            </g>
          </svg>
        </span>
        <span className={`${styles.storeIcon} ${styles.storeIconGoogle}`} aria-hidden="true">
          <svg className={styles.storeGlyph} viewBox="0 0 60 60">
            <path d="M20 14 L44 30 L20 46 Z" fill="#34a853" />
            <path d="M20 14 L33 30 L20 46 Z" fill="#4285f4" />
            <path d="M33 30 L44 30 L38 24 Z" fill="#fbbc04" />
            <path d="M33 30 L44 30 L38 36 Z" fill="#ea4335" />
          </svg>
        </span>
        <p className={`${styles.storeLabel} ${styles.storeDownload}`}>{appPromo.downloadLabel}</p>
        <p className={`${styles.storeLabel} ${styles.storeIos}`}>{appPromo.stores[0]}</p>
        <p className={`${styles.storeLabel} ${styles.storeDivider}`}>|</p>
        <p className={`${styles.storeLabel} ${styles.storeAndroid}`}>{appPromo.stores[1]}</p>

        <div className={styles.phoneBody} />
        <div className={styles.phoneScreen} />
        <img className={styles.phoneStory} src={appPromo.image} alt="Polaroid 앱 스토리 화면" />
        <span className={styles.storyBar} />
        <span className={styles.storyProgress} />
        <span className={styles.avatar} />
        <p className={styles.profileName}>{appPromo.profileName}</p>
        <span className={styles.profileDot} />
        <p className={styles.storyMore} aria-hidden="true">
          ···
        </p>
        <p className={styles.storyClose} aria-hidden="true">
          ×
        </p>
        <span className={styles.island} />
        <span className={styles.messageBox} />
        <p className={styles.messageText}>{appPromo.messagePlaceholder}</p>
        {/* TODO: Figma 아이콘 SVG(1827:3838·3840·3842)로 교체. 지금은 근사한 모양이다. */}
        <svg className={styles.phoneIcon} style={{ '--x': 694.2 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3.5" y="3.5" width="13" height="13" rx="3" />
        </svg>
        <svg className={styles.phoneIcon} style={{ '--x': 723 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 16.5 C4 12.5 3 9.5 3 7.5 A3.6 3.6 0 0 1 10 6.2 A3.6 3.6 0 0 1 17 7.5 C17 9.5 16 12.5 10 16.5 Z" />
        </svg>
        <svg className={styles.phoneIcon} style={{ '--x': 751.8 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 3 L3 9 L9 11 L11 17 Z M17 3 L9 11" />
        </svg>
      </section>

      {/* 09 Purchase CTA */}
      <section className={`${styles.screen} ${styles.purchase}`}>
        <CornerBrackets className={styles.purchaseBrackets} />
        <p className={styles.purchaseWordmark}>{purchaseCta.wordmark}</p>
        <h3 className={styles.purchaseHeading}>{purchaseCta.heading}</h3>
        {purchaseCta.images.map((image, index) => (
          <img
            key={image.src}
            className={styles.purchaseShot}
            style={{ '--x': image.x, '--w': image.w }}
            src={image.src}
            alt={`Polaroid Now 제품컷 ${index + 1}`}
          />
        ))}
        <button type="button" className={styles.purchaseButton}>
          {purchaseCta.ctaLabel}
        </button>
      </section>

      {/* 10 Polaroid Go Film */}
      <section className={`${styles.screen} ${styles.goFilm}`}>
        <p className={styles.goFilmEyebrow}>{goFilm.eyebrow}</p>
        <h3 className={styles.goFilmTitle}>
          <Lines lines={goFilm.title} />
        </h3>
        <p className={styles.goFilmDescription}>
          {goFilm.description.map((line) => (
            <span key={line.map((part) => part.text).join('')} className={styles.line}>
              {line.map((part) => (part.bold ? <strong key={part.text}>{part.text}</strong> : part.text))}
            </span>
          ))}
        </p>
        <button type="button" className={styles.goFilmButton}>
          {goFilm.ctaLabel}
        </button>

        <p className={styles.goFilmTab}>{goFilm.tabLabel}</p>
        <div className={styles.goFilmPanel} />
        <FilmImage image={goFilm.images.pack} className={styles.goFilmPack} alt="Color Film Double Pack 제품 이미지" />
        <p className={styles.goFilmCaption}>{goFilm.caption}</p>

        <span className={styles.goFilmThumbTile} style={{ '--y': 377 }} aria-hidden="true" />
        <span className={styles.goFilmThumbTile} style={{ '--y': 521 }} aria-hidden="true" />
        <FilmImage image={goFilm.images.thumb1} className={styles.goFilmThumb1} alt="Color Film Double Pack 썸네일" />
        <CornerBrackets className={styles.goFilmThumbFrame} />
        <FilmImage image={goFilm.images.thumb2} className={styles.goFilmThumb2} alt="Color Film 썸네일" />
      </section>

      {/* 11 Discover More */}
      <section className={`${styles.screen} ${styles.discover}`}>
        <h3 className={styles.discoverHeading}>
          <Lines lines={discoverMore.heading} />
        </h3>
        <p className={styles.discoverDescription}>
          <Lines lines={discoverMore.description} />
        </p>
        <ul>
          {discoverMore.products.map((product) => (
            <li
              key={product.id}
              className={`${styles.discoverCard} ${product.active ? styles.discoverCardActive : ''}`}
              style={{ '--x': product.x, '--y': product.y }}
            >
              <CornerBrackets className={styles.cardFrame} />
              <img
                className={`${styles.cardPhoto} ${product.active ? styles.cardPhotoActive : ''}`}
                style={{
                  '--px': product.photo.x - product.x,
                  '--py': product.photo.y - product.y,
                  '--pw': product.photo.w,
                  '--ph': product.photo.h,
                }}
                src={product.image}
                alt={`${product.label} 제품 이미지`}
              />
              <span className={`${styles.cardLabel} ${product.active ? styles.cardLabelActive : ''}`}>
                {product.label}
              </span>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </article>
  );
}
