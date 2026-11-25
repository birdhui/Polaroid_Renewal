import { useRef } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import useDetailPageMotion from '../hooks/useDetailPageMotion.js';
import { FONT_GOOGLE, FONT_PRETENDARD, SANITY } from './detailShared.js';
import nowColorsImage from '@/assets/cameras/now/now-colors.webp';
import nowAutofocusVideo from '@/assets/cameras/now/now-autofocus.mp4';
import NowApp from './sections/NowApp.jsx';
import NowCutaway from './sections/NowCutaway.jsx';
import NowFeatures from './sections/NowFeatures.jsx';
import NowFilm from './sections/NowFilm.jsx';
import NowFilters from './sections/NowFilters.jsx';
import NowStore from './sections/NowStore.jsx';
import styles from './CameraNowPage.module.css';

/**
 * Polaroid Now 상세페이지 (담당: 정준혁) — 경로: /cameras/now
 * 구성: Hero → 제품 디자인 → 기능 3가지(좌우 분할) → 내부 구조(3D) → Polaroid NOW Film(인화 사진 확대) → 필터 → 앱 연동 → 스토어 이동
 * 헤더·푸터는 RootLayout 의 공통 SiteHeader·SiteFooter 를 사용한다.
 * 사진은 polaroid.com(Sanity CDN) 이미지를 직접 불러온다.
 */

/**
 * 3번 기능 섹션 데이터. side 는 설명(사진+글)이 놓이는 쪽이고, 반대쪽은 큰 이미지 자리다.
 */
const FEATURES = [
  {
    id: 'autofocus',
    side: 'left',
    name: 'Two-lens autofocus',
    video: nowAutofocusVideo,
    alt: '렌즈가 거리에 맞춰 전환되는 2렌즈 오토포커스 클로즈업',
    title: ['가까운 얼굴도, 먼 풍경도', '알아서 또렷하게'],
    desc: '피사체와의 거리에 맞춰 근접 렌즈와 표준 렌즈가 자동으로 바뀌어요. 셀피부터 풍경까지 초점 걱정 없이 셔터만 누르면 돼요.',
  },
  {
    id: 'double',
    side: 'right',
    name: 'Double exposure mode',
    img: `${SANITY}/317d602c786057784868bb6ad46aa830fa6ef3f2-2010x1850.jpg?w=1000&fm=webp&q=85`,
    alt: '네온사인과 인물이 한 장에 겹쳐 찍힌 이중노출 Polaroid 사진',
    title: ['두 번 찍으면', '두 장면이 한 장에'],
    desc: '한 장의 필름에 두 번 노출해 두 장면을 겹쳐요. 인물 실루엣 위에 풍경을 얹으면 꿈처럼 몽환적인 사진이 남아요.',
  },
  {
    id: 'bright',
    side: 'left',
    name: 'Bright light exposure',
    img: `${SANITY}/0f023bd8b78f5d9cc579dcf94ec2bb089d762e6e-4096x4096.png?rect=3014,1504,805,826&w=1000&fm=webp&q=90`,
    alt: '햇빛 아래 난간에 앉은 두 사람을 올려다본 Polaroid Now Gen 3 인화 사진',
    title: ['강한 햇빛 아래서도', '더 선명하게'],
    desc: '밝은 빛에 맞춰 노출을 다듬어, 한낮의 야외에서도 하얗게 날아가지 않고 또렷한 사진으로 남겨요.',
  },
];

export default function CameraNowPage() {
  const pageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useDetailPageMotion(pageRef, reducedMotion, styles.rv, styles.in);

  const rv = styles.rv;

  return (
    <div ref={pageRef} className={styles.page}>
      <link rel="stylesheet" href={FONT_GOOGLE} />
      <link rel="stylesheet" href={FONT_PRETENDARD} />

      {/* 1. HERO */}
      <section className={styles.hero} aria-labelledby="now-hero-title">
        <span className={styles.heroPh} aria-hidden="true">
          사진추가예정
        </span>
        <div className={styles.heroCopy}>
          <h1 id="now-hero-title" className={`${styles.tTitle} ${rv}`}>
            Polaroid Now :<br />
            누구나 쉽게 쓰는 즉석카메라
          </h1>
          <p className={`${styles.tBody} ${rv}`}>
            2렌즈 오토포커스와 이중노출·셀프타이머로, 일상의 순간을 풀사이즈 Polaroid 필름에 바로 남겨요.
          </p>
        </div>
      </section>

      {/* 2. 제품 디자인 */}
      <section className={styles.design} aria-labelledby="now-design-title">
        <span className={`${styles.eyebrow} ${rv}`}>Iconic Polaroid design</span>
        <h2 id="now-design-title" className={rv}>
          일상의 모든 순간.
          <br />
          모두 Polaroid Now로.
        </h2>
        <img className={`${styles.designImg} ${rv}`} src={nowColorsImage} alt="핑크와 틸 컬러의 Polaroid Now 두 대" loading="lazy" decoding="async" />
        <p className={rv}>
          생일, 여행, 평범한 저녁 식탁까지. 찍는 순간 바로 인화해 손에 쥐여 주는 일상 기록용 카메라예요.
          <br />
          전원을 켜고 셔터만 누르면 끝. 즉석카메라가 처음이어도 바로 찍을 수 있어요.
        </p>
      </section>

      {/* 3. 기능 소개 (기능마다 한 화면, 좌우 분할 에디토리얼) */}
      <NowFeatures
        idPrefix="now"
        model="Polaroid Now"
        eyebrow="Polaroid Now function"
        title={['Three ways to make', 'every moment count']}
        items={FEATURES}
        reducedMotion={reducedMotion}
      />

      {/* 3-2. 내부 구조 (three.js 3D) + 설명 문구 + Watch 영상 카드 */}
      <NowCutaway reducedMotion={reducedMotion} />

      {/* 4. Polaroid NOW Film (인화 사진이 다가와 화면을 채움) */}
      <NowFilm reducedMotion={reducedMotion} />

      {/* 5. 필터 캐러셀 */}
      <NowFilters />

      {/* 6. 앱 연동 */}
      <NowApp idPrefix="now" />

      {/* 7. 스토어 이동 */}
      <NowStore />
    </div>
  );
}
