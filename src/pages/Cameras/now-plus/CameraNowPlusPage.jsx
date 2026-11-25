import { useRef } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import useDetailPageMotion from '../hooks/useDetailPageMotion.js';
import { FONT_GOOGLE, FONT_PRETENDARD, SANITY, SANITY_FILES } from '../now-detail/detailShared.js';
import NowApp from '../now-detail/sections/NowApp.jsx';
import NowFeatures from '../now-detail/sections/NowFeatures.jsx';
import NowFilm from '../now-detail/sections/NowFilm.jsx';
import NowFilters from '../now-detail/sections/NowFilters.jsx';
import NowStore from '../now-detail/sections/NowStore.jsx';
import NowPlusDraw from './sections/NowPlusDraw.jsx';
import blueImage from '@/assets/cameras/now-plus/now-plus-blue.webp';
import coralImage from '@/assets/cameras/now-plus/now-plus-coral.webp';
import filmPrintImage from '@/assets/cameras/now-plus/now-plus-film-print.webp';
import base from '../now-detail/CameraNowPage.module.css';
import styles from './CameraNowPlusPage.module.css';

/**
 * Polaroid Now+ 상세페이지 (담당: 정준혁) — 경로: /cameras/now-plus
 * Now 상세페이지와 같은 틀을 쓰고 내용만 Now+ 것으로 바꿨다.
 * 구성: Hero → 제품 디자인(카메라 2대) → 기능 3가지(좌우 분할) → 드로잉→채색 연출 → Polaroid NOW+ Film
 *       → 앱 크리에이티브 모드 캐러셀 → 앱 연동 → 스토어 이동
 * 사진·영상은 polaroid.com Now+ (Gen 3 · Gen 2) 상품 페이지의 이미지를 Sanity CDN 에서 직접 불러온다.
 * 카메라 사진(코랄·블루)·정면 사진·Film 인화 사진은 사용자 제공 이미지다.
 */

/**
 * 2. 제품 디자인: 카메라 2대(코랄 · 아크틱 블루)를 Now 페이지 디자인 이미지처럼 겹쳐 배치한다.
 * 왼쪽 코랄은 뒤에서 기울어 있고, 오른쪽 블루가 살짝 겹쳐 앞에 선다. x·y·폭은 상자(2000:965, Now 이미지와 같은 비율) 기준 %.
 */
const DUO = [
  { key: 'coral', src: coralImage, x: 6, y: 4, w: 45, r: -14 },
  { key: 'blue', src: blueImage, x: 41, y: 9, w: 50, r: 7 },
];

/** 3. 기능 3가지 — polaroid.com Now+ 페이지 순서대로. side 는 설명이 놓이는 쪽(반대쪽은 이미지 자리) */
const FEATURES = [
  {
    id: 'app',
    side: 'left',
    name: 'App-connected for extra creative firepower',
    img: `${SANITY}/c109e91f853eb6570aa2464b083387400fc7a053-4096x4096.png?w=1000&fm=webp&q=85`,
    alt: 'Polaroid 앱이 켜진 휴대폰과 나란히 놓인 Polaroid Now+',
    title: ['앱과 연결하면', '표현의 폭이 넓어져요'],
    desc: 'Polaroid 앱과 블루투스로 연결하면 조리개 우선, 수동 모드, 원격 촬영, 셀프타이머까지 쓸 수 있어요. 카메라만으로는 만들 수 없던 사진에 도전해 보세요.',
  },
  {
    id: 'double',
    side: 'right',
    name: 'Make it surreal with double exposure mode',
    img: `${SANITY}/f78fde2cb69a8daa976b64caa67ae2d24a1a477e-4096x4096.png?w=1000&fm=webp&q=85`,
    alt: '자신의 얼굴이 두 번 겹쳐 찍힌 이중노출 인화 사진을 든 인물',
    title: ['두 장면을 한 장에,', '초현실적인 이중노출'],
    desc: '한 장의 필름에 두 번 노출해 서로 다른 장면을 겹쳐요. 인물과 풍경, 빛과 그림자를 포개 꿈속 같은 사진을 만들어 보세요.',
  },
  {
    id: 'autofocus',
    side: 'left',
    name: 'Two-lens autofocus = twice the clarity',
    video: `${SANITY_FILES}/a714aa4e651e00a9cfdcdad4e418d4515efa5be7.mp4`,
    alt: '피사체 거리에 따라 렌즈가 바뀌는 Polaroid Now+ 2렌즈 오토포커스',
    title: ['두 개의 렌즈로', '두 배 더 선명하게'],
    desc: '가까운 피사체와 먼 풍경을 구분해 렌즈를 자동으로 바꿔요. 최적화된 노출 덕분에 밝은 햇빛 아래에서도 더 선명하게 찍혀요.',
  },
];

/** 4. Film: 인화지(866×1054) 안 사진 영역 — 이미지 분석값 (x 59~814, y 61~836) */
const FILM_BOX = { top: 61 / 1054, left: 59 / 866, w: 756 / 866, h: 776 / 1054 };
const FILM_TEXT =
  'Shot in double exposure mode on Color i-Type film, a quiet profile drifts over a river of city lights: two moments, one frame. Plan it in the app, layer it, paint it with light, then watch it slowly come to life inside that iconic white frame.';

/** 5. 앱 크리에이티브 모드 아이콘 (원판 안) */
const icon = (children) => (
  <svg className={styles.modeIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

/** 5. 앱 크리에이티브 모드 — 고르면 그 모드에 맞는 사진과 설명으로 바뀐다 */
const MODES = [
  {
    key: 'manual',
    name: 'Manual Mode',
    color: '#F6C243',
    disc: styles.modeDisc,
    icon: icon(
      <>
        <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
      </>,
    ),
    src: `${SANITY}/247bf495e925974b102c12030a4a903f7e9d043f-2010x1850.jpg?rect=80,0,1850,1850&w=900&fm=webp&q=85`,
    alt: '삼각대에 Now+를 세우고 앉아 촬영을 준비하는 인물',
    desc: '조리개, 셔터 속도, 플래시 세기를 앱에서 직접 정해요. 렌즈와 사진이 나오는 시점까지 고를 수 있어, 원하는 분위기를 내 손으로 만들 수 있어요.',
  },
  {
    key: 'aperture',
    name: 'Aperture Priority',
    color: '#FF8200',
    disc: styles.modeDisc,
    icon: icon(
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 3.5 15 12M20.5 12 12 15M12 20.5 9 12M3.5 12 12 9" />
      </>,
    ),
    src: `${SANITY}/685cf75152494ee9705406d75e91abeae84cad42-4096x4096.png?w=900&fm=webp&q=85`,
    alt: '타일 벽 앞에서 Now+를 손에 든 인물',
    desc: '원하는 f값만 고르면 카메라가 알맞은 노출 시간을 찾아요. 배경은 부드럽게 흐리고, 인물은 또렷하게 담아 보세요.',
  },
  {
    key: 'light-painting',
    name: 'Light Painting',
    color: '#E3412B',
    disc: styles.modeDisc,
    icon: icon(
      <>
        <path d="M3.5 17c3-6 5 4 8-2s5 3 8-3" />
        <path d="M18.5 3.5v4M16.5 5.5h4" />
      </>,
    ),
    src: `${SANITY}/6add87f19a56e2b3c7ec7e686c94b5a8eeaaa36e-4107x5000.jpg?rect=280,290,3585,3585&w=900&fm=webp&q=85`,
    alt: '어둠 속 인물 주위로 분홍빛 선이 그려진 라이트 페인팅 인화 사진',
    desc: '셔터를 열어 둔 채 휴대폰 손전등이나 불꽃으로 허공에 그림을 그려요. 빛이 지나간 자리가 그대로 사진에 남아요.',
  },
  {
    key: 'remote',
    name: 'Remote Control',
    color: '#74B544',
    disc: styles.modeDisc,
    icon: icon(
      <>
        <rect x="7.5" y="3" width="9" height="18" rx="2" />
        <path d="M11 17.5h2" />
      </>,
    ),
    src: `${SANITY}/427bd5fc795e498956edb9f80ad5bbca815c9b19-4096x4096.png?w=900&fm=webp&q=85`,
    alt: '삼각대에 세운 Now+ 옆에서 떨어져 앉아 촬영하는 인물',
    desc: '휴대폰으로 셔터를 눌러요. 카메라를 삼각대에 세워 두고, 떨어진 곳에서 단체 사진이나 셀피를 흔들림 없이 찍을 수 있어요.',
  },
  {
    key: 'double',
    name: 'Double Exposure',
    color: '#1D92D2',
    disc: styles.modeDisc,
    icon: icon(
      <>
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
      </>,
    ),
    src: `${SANITY}/6862e4dddb307c93a3e11e5d8cd21745e092dbd9-2010x1850.jpg?rect=80,0,1850,1850&w=900&fm=webp&q=85`,
    alt: '두 장면이 한 장에 겹쳐 찍힌 이중노출 인화 사진',
    desc: '한 장의 필름에 셔터를 두 번 눌러 두 장면을 포개요. 앱에서 모드를 켜고 찍기만 하면 돼요.',
  },
];

const STORE_URL = 'https://www.polaroid.com/en_us/products/now-plus-polaroid-camera';
const APP_PRINT = `${SANITY}/6add87f19a56e2b3c7ec7e686c94b5a8eeaaa36e-4107x5000.jpg?w=500&fm=webp&q=85`;

export default function CameraNowPlusPage() {
  const pageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  useDetailPageMotion(pageRef, reducedMotion, base.rv, base.in);
  const rv = base.rv;

  return (
    <div ref={pageRef} className={base.page}>
      <link rel="stylesheet" href={FONT_GOOGLE} />
      <link rel="stylesheet" href={FONT_PRETENDARD} />

      {/* 1. HERO (사진 추가 예정 — 회색 상자) */}
      <section className={base.hero} aria-labelledby="nowplus-hero-title">
        <span className={base.heroPh} aria-hidden="true">
          사진추가예정
        </span>
        <div className={base.heroCopy}>
          <h1 id="nowplus-hero-title" className={`${base.tTitle} ${rv}`}>
            Polaroid NOW+ :<br />
            표현하지 못했던 상상을 사진 속에 담아보세요
          </h1>
        </div>
      </section>

      {/* 2. 제품 디자인 (카메라 2대 — Now 페이지와 같은 구성) */}
      <section className={base.design} aria-labelledby="nowplus-design-title">
        <span className={`${base.eyebrow} ${rv}`}>Iconic Polaroid design</span>
        <h2 id="nowplus-design-title" className={rv}>
          일상의 순간을, 나만의 시선으로.
          <br />
          더 자유롭게 표현하는 Polaroid Now+.
        </h2>
        <div className={`${styles.duo} ${rv}`} role="img" aria-label="코랄과 아크틱 블루 컬러 Polaroid Now+ 두 대">
          {DUO.map((c) => (
            <img
              key={c.key}
              className={styles.duoCam}
              src={c.src}
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
              style={{ '--x': `${c.x}%`, '--y': `${c.y}%`, '--w': `${c.w}%`, '--r': `${c.r}deg` }}
            />
          ))}
        </div>
        <p className={rv}>
          Polaroid 앱과 연결해 조리개 우선, 수동 모드, 원격 촬영 등 다양한 기능을 경험해 보세요.
          <br />
          익숙한 즉석사진에 새로운 창의성을 더할 수 있어요.
        </p>
      </section>

      {/* 3. 기능 소개 */}
      <NowFeatures
        idPrefix="nowplus"
        model="Polaroid Now+"
        items={FEATURES}
        reducedMotion={reducedMotion}
      />

      {/* 3-2. 드로잉 → 채색 연출 + 설명 */}
      <NowPlusDraw reducedMotion={reducedMotion} />

      {/* 4. Polaroid NOW+ Film */}
      <NowFilm
        reducedMotion={reducedMotion}
        idPrefix="nowplus"
        eyebrow="Polaroid NOW+ Film"
        titleLines={['Dream it up.', 'Watch it develop.']}
        image={filmPrintImage}
        imageAlt="Polaroid Now+로 찍은 이중노출 인화 사진: 인물의 옆얼굴 위로 도시의 불빛 궤적이 겹쳐진 장면"
        box={FILM_BOX}
        text={FILM_TEXT}
      />

      {/* 5. 앱 크리에이티브 모드 캐러셀 (Now 필터 캐러셀 틀) */}
      <NowFilters
        idPrefix="mode"
        eyebrow="Polaroid NOW+ App modes"
        title={['One camera,', 'five creative modes.']}
        items={MODES}
        tabsLabel="앱 크리에이티브 모드 선택"
        altSuffix="모드"
      />

      {/* 6. 앱 연동 */}
      <NowApp idPrefix="nowplus" printSrc={APP_PRINT} />

      {/* 7. 스토어 이동 */}
      <NowStore idPrefix="nowplus" url={STORE_URL} modelName="Now+" />
    </div>
  );
}
