import { useEffect, useRef } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import nowColorsImage from '@/assets/cameras/now/now-colors.webp';
import nowAutofocusVideo from '@/assets/cameras/now/now-autofocus.mp4';
import NowCutaway from './sections/NowCutaway.jsx';
import NowResults from './sections/NowResults.jsx';
import NowFilters from './sections/NowFilters.jsx';
import NowStore from './sections/NowStore.jsx';
import styles from './CameraNowPage.module.css';

/**
 * Polaroid Now 상세페이지 (담당: 정준혁) — 경로: /cameras/now
 * 구성: Hero → 제품 디자인 → 기능 3카드 → 내부 구조(3D) → 결과물(사진 26장) → 필터 → 앱 연동 → 스토어 이동
 * 헤더·푸터는 RootLayout 의 공통 SiteHeader·SiteFooter 를 사용한다.
 * 사진은 polaroid.com(Sanity CDN)·Flickr 이미지를 직접 불러온다.
 */

/** 시안과 같은 글꼴. 이 페이지에 들어올 때만 불러오고, 실패해도 기본 글꼴로 표시된다. */
const FONT_GOOGLE =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&family=Reenie+Beanie&family=Playfair+Display:ital,wght@1,400;1,500&display=swap';
const FONT_PRETENDARD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

const SANITY = 'https://cdn.sanity.io/images/ieogcuy1/production';
const PRINT_PARTY = `${SANITY}/1228092e3ce76ea6edaaf862626bc42aca3311ee-4107x5000.jpg?w=500&fm=webp&q=85`;

export default function CameraNowPage() {
  const pageRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  // 화면에 들어온 요소(.rv)를 차례로 나타낸다.
  useEffect(() => {
    const els = pageRef.current?.querySelectorAll(`.${styles.rv}`) ?? [];
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add(styles.in));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.in);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reducedMotion]);

  // 기능 영상: 화면 안에서만 재생한다. 동작 줄이기 설정이면 멈춘 상태로 둔다.
  useEffect(() => {
    const vids = pageRef.current?.querySelectorAll('video') ?? [];
    if (reducedMotion) {
      vids.forEach((v) => v.pause());
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.play().catch(() => {});
          else e.target.pause();
        }),
      { threshold: 0.2 },
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [reducedMotion]);

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

      {/* 3. 기능 소개 (3열 카드) */}
      <section className={styles.features} aria-labelledby="now-feat-title">
        <header className={`${styles.featIntro} ${rv}`}>
          <span className={styles.eyebrow}>Polaroid Now function</span>
          <h2 id="now-feat-title">
            Three ways to make
            <br />
            every moment count
          </h2>
        </header>
        <ul className={styles.featCards} role="list">
          <li className={`${styles.fcard} ${rv}`}>
            <video
              src={nowAutofocusVideo}
              autoPlay={!reducedMotion}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="렌즈가 거리에 맞춰 전환되는 2렌즈 오토포커스 클로즈업"
            />
            <div className={styles.fcardText}>
              <span>Two-lens autofocus</span>
              <h3>
                가까운 얼굴도, 먼 풍경도
                <br />
                알아서 또렷하게
              </h3>
            </div>
          </li>
          <li className={`${styles.fcard} ${rv}`}>
            <img
              src={`${SANITY}/317d602c786057784868bb6ad46aa830fa6ef3f2-2010x1850.jpg?w=1400&fm=webp&q=85`}
              alt="네온사인과 인물이 한 장에 겹쳐 찍힌 이중노출 Polaroid 사진"
              loading="lazy"
              decoding="async"
            />
            <div className={styles.fcardText}>
              <span>Double exposure mode</span>
              <h3>
                두 번 찍으면
                <br />
                두 장면이 한 장에
              </h3>
            </div>
          </li>
          <li className={`${styles.fcard} ${rv}`}>
            <img
              src={`${SANITY}/0f023bd8b78f5d9cc579dcf94ec2bb089d762e6e-4096x4096.png?rect=3014,1504,805,826&w=1000&fm=webp&q=90`}
              alt="햇빛 아래 난간에 앉은 두 사람을 올려다본 Polaroid Now Gen 3 인화 사진"
              loading="lazy"
              decoding="async"
            />
            <div className={styles.fcardText}>
              <span>Bright light exposure</span>
              <h3>
                강한 햇빛 아래서도
                <br />
                더 선명하게
              </h3>
            </div>
          </li>
        </ul>
      </section>

      {/* 3-2. 내부 구조 (three.js 3D) + 설명 문구 + Watch 영상 카드 */}
      <NowCutaway reducedMotion={reducedMotion} />

      {/* 4. 결과물 (사진 26장이 하나씩 떠오름) */}
      <NowResults reducedMotion={reducedMotion} />

      {/* 5. 필터 캐러셀 */}
      <NowFilters />

      {/* 6. 앱 연동 */}
      <section className={styles.app} aria-labelledby="now-app-title">
        <div className={rv}>
          <span className={styles.eyebrow}>Polaroid App</span>
          <h2 id="now-app-title">Scan and share your photos in the Polaroid App.</h2>
          <p className={styles.appLinks}>
            <span>DOWNLOAD APP</span>
            <span className={styles.u}>IOS</span>
            <span className={styles.sep} aria-hidden="true">
              |
            </span>
            <span className={styles.u}>ANDROID</span>
          </p>
        </div>

        <div className={styles.phone} role="img" aria-label="Polaroid 앱으로 인화 사진을 스캔하고 공유하는 화면이 반복 재생되는 휴대폰">
          <div className={styles.screen}>
            {/* story */}
            <div className={`${styles.s} ${styles.sStory}`}>
              <div className={styles.storyBg} />
              <div className={styles.status}>
                <span>9:41</span>
                <i />
              </div>
              <div className={styles.storyBar}>
                <i />
              </div>
              <div className={styles.storyHead}>
                <span className={styles.avatar} />
                <b>Polaroid</b>
                <span className={styles.dot} />
                <span className={styles.dots}>···</span>
                <span className={styles.x}>×</span>
              </div>
              <img className={styles.storyPrint} src={PRINT_PARTY} alt="" loading="lazy" />
              <div className={styles.storyFoot}>
                <span className={styles.msg}>Send message</span>
                <svg className={styles.ic} viewBox="0 0 24 24">
                  <rect x="5" y="4" width="14" height="16" rx="2" />
                </svg>
                <svg className={`${styles.ic} ${styles.heart}`} viewBox="0 0 24 24">
                  <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
                </svg>
                <svg className={styles.ic} viewBox="0 0 24 24">
                  <path d="M21 4 3 11l7 2 2 7z" />
                </svg>
              </div>
              <svg className={styles.popHeart} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
            </div>
            {/* scan */}
            <div className={`${styles.s} ${styles.sScan}`}>
              <span className={styles.hold}>Hold still, please!</span>
              <div className={styles.scanFrame}>
                <img className={styles.scanPrint} src={PRINT_PARTY} alt="" loading="lazy" />
                <i className={`${styles.c} ${styles.tl}`} />
                <i className={`${styles.c} ${styles.tr}`} />
                <i className={`${styles.c} ${styles.bl}`} />
                <i className={`${styles.c} ${styles.br}`} />
                <span className={`${styles.count} ${styles.n3}`}>3</span>
                <span className={`${styles.count} ${styles.n2}`}>2</span>
                <span className={`${styles.count} ${styles.n1}`}>1</span>
              </div>
              <span className={styles.shutter} />
            </div>
            {/* share */}
            <div className={`${styles.s} ${styles.sShare}`}>
              <div className={styles.status}>
                <span>9:41</span>
                <i />
              </div>
              <span className={styles.x}>×</span>
              <p className={styles.shareTitle}>Select a sharing format</p>
              <div className={styles.shareCards}>
                <img src={PRINT_PARTY} alt="" loading="lazy" />
                <span className={styles.peek} />
              </div>
              <ul className={styles.shareApps} role="list">
                <li>
                  <i style={{ background: 'conic-gradient(#f5c33b,#f2763a,#e2457f,#8c5bd6,#3d8fe0,#4cc36a,#f5c33b)' }} />
                  Photos
                </li>
                <li>
                  <i style={{ background: '#34c759' }} />
                  Messages
                </li>
                <li>
                  <i style={{ background: 'linear-gradient(45deg,#f7b733,#e1306c,#833ab4)' }} />
                  Stories
                </li>
                <li>
                  <i className={styles.more} />
                  More
                </li>
              </ul>
            </div>
          </div>
          <span className={styles.island} aria-hidden="true" />
        </div>
      </section>

      {/* 7. 스토어 이동 */}
      <NowStore />
    </div>
  );
}
