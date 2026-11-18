import { useEffect, useRef, useState } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import nowColorsImage from '@/assets/cameras/now/now-colors.webp';
import nowAutofocusVideo from '@/assets/cameras/now/now-autofocus.mp4';
import styles from './CameraNowPage.module.css';

/**
 * Polaroid Now 상세페이지 (담당: 정준혁) — 경로: /cameras/now
 * polaroid-now 시안(../prototype/polaroid-now.html)과 같은 구성:
 *   Hero → 제품 디자인 → 기능 3카드 → 소개 영상 → 결과물(스크롤 연출) → 앱 연동 → 요약
 * 시안 자체 헤더·푸터 대신 RootLayout 의 공통 SiteHeader·SiteFooter 를 사용한다.
 * 인화 사진은 시안과 같이 polaroid.com(Sanity CDN) 이미지를 직접 불러온다.
 */

/** 시안과 같은 글꼴. 이 페이지에 들어올 때만 불러오고, 실패해도 기본 글꼴로 표시된다. */
const FONT_GOOGLE =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&family=Reenie+Beanie&display=swap';
const FONT_PRETENDARD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

const SANITY = 'https://cdn.sanity.io/images/ieogcuy1/production';
const PRINT_PARTY = `${SANITY}/1228092e3ce76ea6edaaf862626bc42aca3311ee-4107x5000.jpg?w=500&fm=webp&q=85`;

const FILM_YOUTUBE_ID = 'FgUqS0QTaeA';

/** 결과물 섹션 인화 사진: 위치(x·y), 기울기(r), 폭(w), 등장 시점(at: 스크롤 진행률) */
const PRINTS = [
  { id: 'party', x: '-34vw', y: '-22vh', r: '-7deg', w: 'clamp(130px,13vw,230px)', at: 0.04, src: PRINT_PARTY, alt: '파티 풍선 앞에서 찍은 두 사람의 Polaroid 사진' },
  { id: 'tube', x: '31vw', y: '-20vh', r: '6deg', w: 'clamp(140px,14vw,250px)', at: 0.1, src: `${SANITY}/446e34b4d8d769c52324847338ad0277ac327cd8-4096x4096.png?rect=2049,1091,1559,1900&w=500&fm=webp&q=85`, alt: '튜브를 든 두 사람이 웃고 있는 Polaroid 사진' },
  { id: 'neon', x: '-27vw', y: '18vh', r: '5deg', w: 'clamp(130px,13vw,230px)', at: 0.16, src: `${SANITY}/317d602c786057784868bb6ad46aa830fa6ef3f2-2010x1850.jpg?rect=820,372,885,1071&w=500&fm=webp&q=85`, alt: '네온사인과 인물이 겹친 이중노출 Polaroid 사진' },
  { id: 'rail', x: '26vw', y: '19vh', r: '-5deg', w: 'clamp(130px,13vw,230px)', at: 0.22, src: `${SANITY}/0f023bd8b78f5d9cc579dcf94ec2bb089d762e6e-4096x4096.png?rect=3029,1448,920,1113&w=500&fm=webp&q=85`, alt: '난간에 앉은 두 사람을 올려다본 Polaroid 사진' },
  { id: 'sun', x: '2vw', y: '-30vh', r: '-3deg', w: 'clamp(110px,11vw,190px)', at: 0.28, src: `${SANITY}/0f023bd8b78f5d9cc579dcf94ec2bb089d762e6e-4096x4096.png?rect=1937,1448,936,1113&w=500&fm=webp&q=85`, alt: '햇빛 아래 난간에 기댄 두 사람의 Polaroid 사진' },
];

/** 소개 영상: 썸네일을 누르면 YouTube 플레이어로 바뀐다. */
function FilmPlayer({ className }) {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState(`https://i.ytimg.com/vi/${FILM_YOUTUBE_ID}/maxresdefault.jpg`);

  const q = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', modestbranding: '1' });

  // 바깥 div 는 항상 같은 요소로 유지한다(나타남 효과 클래스가 지워지지 않도록).
  return (
    <div className={className}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${FILM_YOUTUBE_ID}?${q.toString()}`}
          title="How to use the Polaroid Now"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <PosterButton poster={poster} setPoster={setPoster} onPlay={() => setPlaying(true)} />
      )}
    </div>
  );
}

function PosterButton({ poster, setPoster, onPlay }) {
  return (
    <>
      <img
        className={styles.filmPoster}
        src={poster}
        alt=""
        loading="lazy"
        onError={() => {
          if (!poster.includes('hqdefault')) setPoster(`https://i.ytimg.com/vi/${FILM_YOUTUBE_ID}/hqdefault.jpg`);
        }}
      />
      <button className={styles.filmPlay} type="button" aria-label="How to use the Polaroid Now 영상 재생" onClick={onPlay}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 7v10l8-5z" />
        </svg>
      </button>
    </>
  );
}

export default function CameraNowPage() {
  const pageRef = useRef(null);
  const resultsRef = useRef(null);
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

  // 결과물: 스크롤에 따라 인화 사진이 하나씩 흩뿌려진다.
  useEffect(() => {
    const sec = resultsRef.current;
    if (!sec || reducedMotion) return undefined;
    const prints = [...sec.querySelectorAll(`.${styles.print}`)];
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight || 1;
      const p = Math.min(1, Math.max(0, -r.top / total));
      // 섹션 위쪽이 화면 35% 지점에 닿으면 시작, 스크롤 절반쯤에서 모두 놓인다.
      const enter = r.top < window.innerHeight * 0.35 ? p * 0.9 + 0.02 : -1;
      prints.forEach((el) => el.classList.toggle(styles.on, enter >= Number(el.dataset.at)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
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

      {/* 4. 소개 영상 */}
      <section className={styles.film} aria-labelledby="now-film-title">
        <div className={`${styles.filmTop} ${rv}`}>
          <h2 id="now-film-title">
            Learn it in a minute,
            <br />
            keep it for a lifetime
          </h2>
          <span className={styles.filmWith}>with</span>
          <span className={styles.filmSign} aria-hidden="true">
            Polaroid Now
          </span>
        </div>
        <FilmPlayer className={`${styles.filmPlayer} ${rv}`} />
        <blockquote className={`${styles.filmQuote} ${rv}`}>
          <span className={styles.qmark} aria-hidden="true">
            “
          </span>
          <p>Point. Shoot. Wait for the magic.</p>
          <p className={styles.ko}>셔터를 누르고, 사진이 떠오르길 기다리는 것. 그게 Now 사용법의 전부예요.</p>
          <footer>
            <strong>How to use the Polaroid Now,</strong> Polaroid
          </footer>
          <span className={`${styles.qmark} ${styles.qmarkEnd}`} aria-hidden="true">
            ”
          </span>
        </blockquote>
      </section>

      {/* 5. 결과물 */}
      <section ref={resultsRef} className={styles.results} aria-labelledby="now-results-title">
        <div className={styles.resultsStage}>
          <div className={styles.resultsTop}>
            <span className={styles.eyebrow}>Shot on Polaroid Now</span>
            <h2 id="now-results-title">Real life, developed.</h2>
            <p>Now로 찍고, 바로 손에 쥔 진짜 사진들</p>
          </div>
          <div className={styles.prints} aria-label="Polaroid Now로 찍은 인화 사진">
            {PRINTS.map((p) => (
              <img
                key={p.id}
                className={styles.print}
                data-at={p.at}
                style={{ '--x': p.x, '--y': p.y, '--r': p.r, '--w': p.w }}
                src={p.src}
                alt={p.alt}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </section>

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

      {/* 7. Now 정리 */}
      <section className={styles.summary} aria-labelledby="now-sum-title">
        <span id="now-sum-title" className={`${styles.eyebrow} ${rv}`}>
          The classic instant camera.
        </span>
        <p className={`${styles.sumText} ${rv}`}>
          The classic analog instant camera. With self-timer and double-exposure modes, an upgraded two-lens autofocusing
          system and made with 40% recycled materials in different colors. All so you can capture real life on iconic,
          full-sized Polaroid film.
        </p>
      </section>

      <span className={styles.concept}>CONCEPT · 비공식</span>
    </div>
  );
}
