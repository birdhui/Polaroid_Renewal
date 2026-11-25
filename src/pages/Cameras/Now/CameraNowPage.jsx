import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  transitionCamera,
  discoverMore,
  footer,
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
  'https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@500&family=Archivo:wght@300;600;700&display=swap',
];

function Lines({ lines }) {
  return lines.map((line) => (
    <span key={line} className={styles.line}>
      {line}
    </span>
  ));
}

/**
 * KINORIA(kinoria.studio/details)의 글자 등장 효과.
 * 글자는 opacity 0 · blur(10px) · 아래 1em에서 시작해, 화면에 들어오면 1.4s easeOutQuart
 * (cubic-bezier(.165,.84,.44,1))로 또렷해지며 제자리로 올라온다. 줄마다 0.1s씩 늦게 시작하고 4번째 줄에서 처음으로 돌아간다.
 * 화면을 벗어나면 다시 숨겨서, 다시 스크롤해 들어올 때마다 반복된다.
 */
const REVEAL_TARGETS = [
  'heroGradient',
  'heroTitle',
  'heroDescription',
  'introHeading',
  'introWordmark',
  'introEyebrow',
  'featuresHeadingText',
  'filterEyebrow',
  'filterHeading',
  'filterDescription',
  'appEyebrow',
  'appHeading',
  'appDescription',
  'purchaseWordmark',
  'purchaseHeading',
  'goFilmEyebrow',
  'goFilmTitle',
  'goFilmDescription',
  'discoverEyebrow',
  'discoverHeading',
  'discoverDescription',
];

// 작은 프레임이 0 → 원래 크기로 커지면서 그 안의 글자가 나온다 (02 Intro · 09 Purchase CTA)
const FRAME_REVEALS = [
  { frame: 'introBrackets', text: 'introHeading' },
  { frame: 'purchaseBrackets', text: 'purchaseWordmark' },
];
const FRAME_TEXT_DELAY = 0.35; // 프레임이 커지기 시작한 뒤 글자가 나오기까지(초)

function useTextReveal(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const perSection = new Map();
    const groups = [];
    REVEAL_TARGETS.forEach((name) => {
      // composes 를 쓰는 클래스는 "a b c" 문자열이라 첫 번째(자기 자신) 클래스만 선택자로 쓴다
      const className = styles[name]?.split(' ')[0];
      if (!className) return;
      root.querySelectorAll(`.${className}`).forEach((element) => {
        const lines = element.querySelectorAll(`:scope > .${styles.line}`);
        const units = lines.length ? [...lines] : [element];
        const section = element.closest('section');
        units.forEach((unit) => {
          const n = perSection.get(section) ?? 0;
          perSection.set(section, n + 1);
          unit.dataset.reveal = '';
          unit.style.setProperty('--rv-delay', `${(n % 4) * 0.1}s`);
        });
        groups.push({ element, units });
      });
    });
    // 프레임 연출: 프레임과 글자를 한 묶음으로 보고, 글자는 프레임이 커지는 동안 조금 늦게 나온다
    const frameUnits = [];
    FRAME_REVEALS.forEach(({ frame, text }) => {
      const frameClass = styles[frame]?.split(' ')[0];
      const textClass = styles[text]?.split(' ')[0];
      if (!frameClass || !textClass) return;
      const frameElement = root.querySelector(`.${frameClass}`);
      const textElement = root.querySelector(`.${textClass}`);
      const group = groups.find((item) => item.element === textElement);
      if (!frameElement || !group) return;
      frameElement.dataset.frame = '';
      group.units.forEach((unit, i) => {
        // 글자 상자 자체가 가운데 정렬 transform(translateX(-50%))을 쓰면 scale 속성이 그 이동까지 줄여서
        // 옆에서 커지는 것처럼 보인다 → transform 안에서 함께 처리한다(data-pop="self")
        unit.dataset.pop = unit === group.element || unit === textElement ? 'self' : '';
        unit.style.setProperty('--rv-delay', `${FRAME_TEXT_DELAY + i * 0.1}s`);
      });
      // 프레임이 화면에 들어올 때 프레임과 글자를 같이 켠다
      group.element = frameElement;
      frameUnits.push({ frameElement, units: group.units });
    });
    const byElement = new Map(groups.map((group) => [group.element, [...group.units, ...(group.element.hasAttribute('data-frame') ? [group.element] : [])]]));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          byElement.get(entry.target)?.forEach((unit) => {
            if (entry.isIntersecting) unit.dataset.in = '';
            else delete unit.dataset.in;
          });
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -8% 0px' },
    );
    groups.forEach(({ element }) => observer.observe(element));
    return () => {
      observer.disconnect();
      frameUnits.forEach(({ frameElement }) => {
        delete frameElement.dataset.frame;
        delete frameElement.dataset.in;
      });
      groups.forEach(({ units }) =>
        units.forEach((unit) => {
          delete unit.dataset.reveal;
          delete unit.dataset.pop;
          delete unit.dataset.in;
          unit.style.removeProperty('--rv-delay');
        }),
      );
    };
  }, [rootRef]);
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

// 09 photo list: 6장(573·573·622 ×2)과 간격 99px. 줄 끝이 화면 오른쪽 끝(1920)에 닿을 때까지 움직이는 거리
const PURCHASE_LIST_TRAVEL = (573 * 4 + 622 * 2) + 99 * 5 - 1920;

// 스크롤 진행도(0~1)에 맞춰 photo list 를 왼쪽으로 민다. 끝까지 다 보이면 그 다음부터 화면이 내려간다.
function usePurchaseScroll(trackRef) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let current = 0;
    const read = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const raw = scrollable > 0 ? -rect.top / scrollable : 0;
      // 앞뒤로 잠깐 멈춤: 처음 6% 는 그대로, 마지막 10% 는 다 보인 채로 머문다
      return Math.min(Math.max((raw - 0.06) / 0.84, 0), 1);
    };
    const tick = () => {
      const goal = read();
      current = reduceMotion ? goal : current + (goal - current) * 0.14;
      if (Math.abs(goal - current) < 0.0005) current = goal;
      track.style.setProperty('--p', current.toFixed(4));
      frame = Math.abs(goal - current) > 0 ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackRef]);
}


const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

/*
 * Transition-camera: 스크롤에 맞춰
 *  1) 카메라 사진이 사라지고
 *  2) 큰 외곽선 글자가 왼쪽으로 지나가면서 색이 왼쪽→오른쪽으로 채워지고(채워지는 동안 배경이 크림 → #151515 로 바뀌고)
 *  3) 다 채워지면 글자가 화면 가운데로 모이며 작아진다.
 * 값은 모두 track 의 CSS 변수(--tbg --tstroke --timg-o --timg-s --tx --ts --tfill)로 넘기고 CSS 가 그린다.
 */
function useTransitionScroll(trackRef, textRef) {
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let current = 0;
    const read = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      return scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
    };
    const apply = (p) => {
      const vw = window.innerWidth;
      const textWidth = textRef.current ? textRef.current.offsetWidth : vw * 2.4;
      // 배경 · 외곽선 색: 글자가 채워지는 구간에 맞춰 크림 → #151515
      const dark = smooth(0.2, 0.7, p);
      const bg = [mix(255, 21, dark), mix(249, 21, dark), mix(232, 21, dark)].map(Math.round).join(',');
      const stroke = [mix(21, 255, dark), mix(21, 249, dark), mix(21, 232, dark)].map(Math.round).join(',');
      // 카메라 사진: 처음 20% 동안 천천히 커지면서 사라진다
      const img = smooth(0.02, 0.2, p);
      // 글자 중심 위치(화면 가운데 기준 px): 왼쪽 끝이 화면 8% → 오른쪽 끝이 화면 92%
      const startX = vw * (58 / 1920) + textWidth / 2 - vw / 2; // Figma Transition-1: 글자 왼쪽 x=58
      const endX = vw * 0.92 - textWidth / 2 - vw / 2;
      const travel = smooth(0.2, 0.78, p);
      const settle = smooth(0.8, 1, p);
      const x = mix(mix(startX, endX, travel), 0, settle);
      const scale = mix(1, 100 / 900, settle); // Figma Transition-2: 100px / Transition-1: 900px
      const fill = smooth(0.26, 0.76, p);
      const s = track.style;
      s.setProperty('--tbg', 'rgb(' + bg + ')');
      s.setProperty('--tstroke', 'rgb(' + stroke + ')');
      s.setProperty('--timg-o', (1 - img).toFixed(3));
      s.setProperty('--timg-s', mix(1, 1.08, img).toFixed(3));
      s.setProperty('--tx', x.toFixed(1) + 'px');
      s.setProperty('--ts', scale.toFixed(4));
      s.setProperty('--tfill', ((1 - fill) * 100).toFixed(2) + '%');
      s.setProperty('--ttext-o', (p > 0.2 ? 1 : smooth(0.14, 0.2, p)).toFixed(3));
    };
    const tick = () => {
      const goal = read();
      current = reduceMotion ? goal : current + (goal - current) * 0.12;
      if (Math.abs(goal - current) < 0.0004) current = goal;
      apply(current);
      frame = current !== goal ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake);
    return () => {
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [trackRef, textRef]);
}

export default function CameraNowPage() {
  const pageRef = useRef(null);
  const purchaseTrackRef = useRef(null);
  useTextReveal(pageRef);
  usePurchaseScroll(purchaseTrackRef);
  // 글자별 자간(Figma, 900px 기준 px → em)
  const transitionLetters = [...transitionCamera.text].map((ch, i) => (
    <span key={i} style={{ letterSpacing: (transitionCamera.letterSpacing[i] ?? 0) / 900 + 'em' }}>{ch}</span>
  ));
  const transitionTrackRef = useRef(null);
  const transitionTextRef = useRef(null);
  useTransitionScroll(transitionTrackRef, transitionTextRef);
  const purchaseListTravel = PURCHASE_LIST_TRAVEL;
  const [selectedId, setSelectedId] = useState(
    () => filterShowcase.items.find((item) => item.selected).id,
  );
  const selectedFilter = filterShowcase.items.find((item) => item.id === selectedId);

  return (
    <article ref={pageRef} className={styles.page} aria-labelledby="camera-now-title">
      {FONT_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      {/* 01 Hero */}
      <section className={styles.screen}>
        <img className={styles.heroImage} src={hero.image} alt="" />
        <div className={styles.heroGradient} aria-hidden="true" />
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
          {/* Figma: '특별하게 남기는'만 Bold */}
          <span className={styles.line}>
            {featuresHeading[0].split('특별하게 남기는')[0]}
            <strong>특별하게 남기는</strong>
          </span>
          <span className={styles.line}>{featuresHeading[1]}</span>
        </h2>
      </section>

      {/* 04~06 Feature */}
      <FeatureShowcase
        heading={featuresHeading.join(' ')}
        features={features}
      />

      {/* Transition-camera — 06 Feature 와 07 Filter 사이: 사진이 사라지고, 큰 글자가 지나가며 색이 채워지고, 배경이 #151515 로 바뀐다 */}
      <div ref={transitionTrackRef} className={styles.transitionTrack}>
        <div className={styles.transitionSticky}>
          <div ref={transitionTextRef} className={styles.transitionText} aria-hidden="true">
            <span className={styles.transitionOutline}>{transitionLetters}</span>
            <span className={styles.transitionFill}>{transitionLetters}</span>
          </div>
          <p className={styles.srOnly}>{transitionCamera.text}</p>
        </div>
      </div>

      {/* 07~08, 10: 어두운 구간 (#151515 · Filter 는 #232323 → #151515 그라데이션) */}
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
        <div className={styles.phoneBody} />
        <div className={styles.phoneScreen} />
        <img className={styles.phoneStory} src={appPromo.image} alt="Polaroid 앱 스토리 화면" />
        <p className={styles.statusTime} aria-hidden="true">9:41</p>
        <span className={styles.battery} aria-hidden="true" />
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
        {/* TODO: Figma 아이콘 벡터(Icon Glyph)로 교체. 지금은 근사한 모양이다. */}
        <svg className={styles.phoneIcon} style={{ '--x': 523.5 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <rect x="3.5" y="3.5" width="13" height="13" rx="3" />
        </svg>
        <svg className={styles.phoneIcon} style={{ '--x': 551.8 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 16.5 C4 12.5 3 9.5 3 7.5 A3.6 3.6 0 0 1 10 6.2 A3.6 3.6 0 0 1 17 7.5 C17 9.5 16 12.5 10 16.5 Z" />
        </svg>
        <svg className={styles.phoneIcon} style={{ '--x': 580.2 }} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 3 L3 9 L9 11 L11 17 Z M17 3 L9 11" />
        </svg>

        <p className={styles.appEyebrow}>{appPromo.eyebrow}</p>
        <h3 className={styles.appHeading}>
          <Lines lines={appPromo.heading} />
        </h3>
        <p className={styles.appDescription}>
          <Lines lines={appPromo.description} />
        </p>

        {/* TODO: Figma App Store 아이콘 벡터(Vector 8~10)로 교체. 지금은 근사한 모양이다. */}
        <span className={`${styles.storeIcon} ${styles.storeIconApple}`} aria-hidden="true">
          <svg className={styles.storeGlyph} viewBox="0 0 60 60" fill="none">
            <g stroke="#c4c4c4" strokeWidth="4.5" strokeLinecap="round">
              <path d="M30 14 L19 40" />
              <path d="M30 14 L41 40" />
              <path d="M22 33 H38" />
            </g>
          </svg>
        </span>
        <span className={`${styles.storeIcon} ${styles.storeIconGoogle}`} aria-hidden="true">
          <svg className={styles.storeGlyphGoogle} viewBox="20 14 24 32">
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

        <span className={styles.goFilmTabLine} aria-hidden="true" />
        <p className={styles.goFilmTab}>{goFilm.tabLabel}</p>
        <div className={styles.goFilmPanel} />
        <FilmImage image={goFilm.images.pack} className={styles.goFilmPack} alt="Color Film Double Pack 제품 이미지" />
        <p className={styles.goFilmCaption}>{goFilm.caption}</p>

        <span className={styles.goFilmThumbTile} style={{ '--x': 1278 }} aria-hidden="true" />
        <span className={`${styles.goFilmThumbTile} ${styles.goFilmThumbTileDim}`} style={{ '--x': 1366.6 }} aria-hidden="true" />
        <FilmImage image={goFilm.images.thumb1} className={styles.goFilmThumb1} alt="Color Film Double Pack 썸네일" />
        <FilmImage image={goFilm.images.thumb2} className={styles.goFilmThumb2} alt="Color Film 썸네일" />
      </section>
      </div>

      {/* 09 Purchase CTA — 스크롤하면 photo list 가 먼저 가로로 끝까지 지나가고, 그 다음에 화면이 내려간다 */}
      <div ref={purchaseTrackRef} className={styles.purchaseTrack}>
        <div className={styles.purchaseSticky}>
          <section className={`${styles.screen} ${styles.purchase}`}>
            <CornerBrackets className={styles.purchaseBrackets} />
            <p className={styles.purchaseWordmark}>{purchaseCta.wordmark}</p>
            <h3 className={styles.purchaseHeading}>{purchaseCta.heading}</h3>
            <div className={styles.purchaseList} style={{ '--gap': purchaseCta.gap, '--travel': purchaseListTravel }}>
              {purchaseCta.images.map((image, index) => (
                <img
                  key={index}
                  className={styles.purchaseShot}
                  style={{ '--w': image.w }}
                  src={image.src}
                  alt={index < 3 ? `Polaroid Now 제품컷 ${index + 1}` : ''}
                  aria-hidden={index < 3 ? undefined : 'true'}
                />
              ))}
            </div>
            <button type="button" className={styles.purchaseButton}>
              {purchaseCta.ctaLabel}
            </button>
          </section>
        </div>
      </div>

      <div className={styles.darkZone}>
      {/* 11 Discover More */}
      <section className={`${styles.screen} ${styles.discover}`}>
        <p className={styles.discoverEyebrow}>{discoverMore.eyebrow}</p>
        <h3 className={styles.discoverHeading}>
          <Lines lines={discoverMore.heading} />
        </h3>
        <p className={styles.discoverDescription}>
          <Lines lines={discoverMore.description} />
        </p>
        <svg className={styles.cardFrame} viewBox="0 0 229 213" fill="none" aria-hidden="true">
          <path d="M48.1939 0.5H0.5V52.2529M179.643 0.5H228.5V52.2529M0.5 157.006V212.5H48.1939M228.5 157.006V212.5H179.643" stroke="#fff" />
        </svg>
        <ul className={styles.discoverList}>
          {discoverMore.products.map((product) => (
            <li key={product.id}>
              <img
                className={`${styles.cardPhoto} ${product.active ? styles.cardPhotoActive : ''}`}
                style={{ '--x': product.photo.x, '--y': product.photo.y, '--w': product.photo.w, '--h': product.photo.h }}
                src={product.image}
                alt={`${product.label} 제품 이미지`}
              />
              <span
                className={`${styles.cardLabel} ${product.active ? styles.cardLabelActive : ''}`}
                style={{ '--x': product.photo.x + product.photo.w / 2 }}
              >
                {product.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 12 Footer */}
      <footer className={`${styles.screen} ${styles.footer}`}>
        <img className={styles.footerLogo} src={footer.logo} alt="polaroid" />
        <p className={styles.footerTagline}>
          <Lines lines={footer.tagline} />
        </p>
        <p className={styles.footerCopyright}>{footer.copyright}</p>
        <img className={styles.footerWordmark} src={footer.wordmark} alt="" aria-hidden="true" />
        {footer.columns.map((column) => (
          <div key={column.title} className={styles.footerColumn} style={{ '--x': column.x }}>
            <p className={styles.footerHeading}>{column.title}</p>
            <ul>
              {column.items.map((item) => (
                <li key={item} className={styles.footerItem}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </footer>
      </div>
    </article>
  );
}
