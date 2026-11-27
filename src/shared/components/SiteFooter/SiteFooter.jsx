import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import logo from '@/assets/shared/images/footer-logo.svg';
import wordmark from '@/assets/shared/images/footer-wordmark.svg';
import signature from '@/assets/shared/images/edwin-land-signature.webp';
import { SIGNATURE_SIZE, SIGNATURE_STROKE_WIDTH, SIGNATURE_STROKES } from './signatureStrokes.js';
import styles from './SiteFooter.module.css';

/**
 * 공통 Footer (Figma 2158:1056, Cameras Now 시안과 같은 1920×1080 화면) — 메인(Landing)을 뺀 모든 서브페이지에 쓴다.
 * (공통 파일, 담당: 정준혁)
 * - 왼쪽 위 로고 · 소개 문구 · 저작권, 왼쪽 아래 큰 워드마크, 오른쪽 아래 링크 3열, 오른쪽 에드윈 랜드 서명
 * - 서명: 푸터가 화면에 들어오면 Edwin Land 철자 순서대로 펜으로 쓰듯 써지고, 잠시 머문 뒤 사라졌다가 다시 써지기를 반복한다.
 *   화면에서 벗어나면 멈추고, 움직임 줄이기 설정이면 완성된 서명을 그대로 보여 준다.
 */

const TAGLINE = ['지나간 순간을, 손에 남는 한 장으로.', '89년을 지나온 폴라로이드는 오늘도 당신이 간직하고 싶은 순간을 한 장의 사진에 담습니다.'];
const COPYRIGHT = '© 2026 Polaroid. Made by four';

// 링크가 정해진 항목만 이동한다. 나머지(SNS·약관)는 주소가 확정되면 href 를 채운다
const COLUMNS = [
  {
    title: 'QUICK LINKS',
    x: 1382.5,
    items: [
      { label: 'Brand', to: ROUTES.landing },
      { label: 'History', to: ROUTES.history },
      { label: 'Cameras', to: ROUTES.cameras },
      { label: 'Film', to: ROUTES.film },
      { label: 'Compare', to: ROUTES.compare },
    ],
  },
  { title: 'SOCIALS', x: 1529, items: [{ label: 'Instagram' }, { label: 'Linkedin' }, { label: 'YouTube' }] },
  { title: 'LEGAL', x: 1675, items: [{ label: 'Terms of Service' }, { label: 'Privacy Policy' }, { label: 'Imprint' }] },
];

/* 서명 쓰기 타이밍 (ms) */
const WRITE_MS = 1300; // 서명 전체를 쓰는 시간 — 실제 서명처럼 빠르게 (획 길이에 비례해 나눔)
const RETRACE_SPEED = 5; // 이미 쓴 선을 되짚는 구간은 이만큼 빨리 지나간다 (멈칫해 보이지 않게)
const LIFT_MS = 70; // 글자 안에서 펜을 잠깐 뗄 때
const WORD_GAP_MS = 220; // Edwin 과 Land 사이에 펜을 떼는 시간
const HOLD_MS = 2600; // 다 쓴 뒤 머무는 시간
const FADE_MS = 700; // 사라지는 시간
const REST_MS = 500; // 다시 쓰기 전 쉬는 시간

function useSignatureLoop(svgRef) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const paths = [...svg.querySelectorAll('[data-stroke]')];
    const full = svg.querySelector('[data-full]');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = SIGNATURE_STROKES.reduce((sum, s) => sum + (s.fast ? s.len / RETRACE_SPEED : s.len), 0);
    let anims = [];
    let timer = 0;
    let running = false;

    const clear = () => {
      window.clearTimeout(timer);
      anims.forEach((a) => a.cancel());
      anims = [];
    };
    const showComplete = () => {
      clear();
      paths.forEach((p) => (p.style.strokeDashoffset = '0'));
      full.style.opacity = '1';
      svg.style.opacity = '1';
    };

    const cycle = () => {
      clear();
      svg.style.opacity = '1';
      full.style.opacity = '0';
      let t = 0;
      SIGNATURE_STROKES.forEach((s, i) => {
        if (i > 0 && SIGNATURE_STROKES[i - 1].word !== s.word) t += WORD_GAP_MS;
        else if (s.lift) t += LIFT_MS;
        // 이어진 획은 같은 속도로 끊김 없이 이어 쓴다 (획마다 속도를 바꾸면 이음매에서 펜이 멈칫해 보임)
        const dur = Math.max(16, (WRITE_MS * (s.fast ? s.len / RETRACE_SPEED : s.len)) / total);
        anims.push(
          paths[i].animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
            duration: dur,
            delay: t,
            easing: 'linear',
            fill: 'both',
          }),
        );
        t += dur;
      });
      // 다 쓴 순간 원본 서명을 겹쳐, 획이 덮지 못한 작은 부분까지 깔끔하게 채운다
      anims.push(full.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: t, fill: 'both' }));
      anims.push(svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, delay: t + HOLD_MS, fill: 'both', easing: 'ease' }));
      timer = window.setTimeout(() => running && cycle(), t + HOLD_MS + FADE_MS + REST_MS);
    };

    if (reduce) {
      showComplete();
      return undefined;
    }

    // 처음에는 비어 있다가, 화면에 들어오면 처음부터 쓰기 시작한다
    paths.forEach((p) => (p.style.strokeDashoffset = '1'));
    full.style.opacity = '0';
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          cycle();
        } else if (!entry.isIntersecting && running) {
          running = false;
          clear();
          paths.forEach((p) => (p.style.strokeDashoffset = '1'));
          full.style.opacity = '0';
        }
      },
      { threshold: 0.6 },
    );
    io.observe(svg);
    return () => {
      running = false;
      io.disconnect();
      clear();
    };
  }, [svgRef]);
}

export default function SiteFooter() {
  const svgRef = useRef(null);
  const maskId = `sig-${useId().replace(/:/g, '')}`;
  useSignatureLoop(svgRef);

  return (
    <footer className={styles.footer}>
      {/* 푸터 글꼴: Outfit (ExtraLight·Medium). React 19 가 <head> 로 올리고 한 번만 불러온다 */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;500&display=swap" precedence="default" />
      <div className={styles.stage}>
        <Link to={ROUTES.landing} className={styles.logo} aria-label="Polaroid 홈으로 이동">
          <img src={logo} alt="" width="102" height="28" loading="lazy" />
        </Link>
        <p className={styles.tagline}>
          {TAGLINE.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <p className={styles.copyright}>{COPYRIGHT}</p>

        <svg
          ref={svgRef}
          className={styles.signature}
          viewBox={`0 0 ${SIGNATURE_SIZE.w} ${SIGNATURE_SIZE.h}`}
          role="img"
          aria-label="Edwin Land 서명"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={SIGNATURE_SIZE.w} height={SIGNATURE_SIZE.h}>
              {SIGNATURE_STROKES.map((s) => (
                <path
                  key={s.d}
                  data-stroke=""
                  d={s.d}
                  pathLength="1"
                  className={styles.maskStroke}
                  strokeWidth={SIGNATURE_STROKE_WIDTH}
                />
              ))}
            </mask>
          </defs>
          <image href={signature} width={SIGNATURE_SIZE.w} height={SIGNATURE_SIZE.h} preserveAspectRatio="none" mask={`url(#${maskId})`} />
          <image data-full="" href={signature} width={SIGNATURE_SIZE.w} height={SIGNATURE_SIZE.h} preserveAspectRatio="none" />
        </svg>

        <img className={styles.wordmark} src={wordmark} alt="" aria-hidden="true" loading="lazy" />

        <nav className={styles.columns} aria-label="푸터 메뉴">
          {COLUMNS.map((column) => (
            <div key={column.title} className={styles.column} style={{ '--x': column.x }}>
              <p className={styles.heading}>{column.title}</p>
              <ul>
                {column.items.map((item) => (
                  <li key={item.label} className={styles.item}>
                    {item.to ? (
                      <Link to={item.to} className={styles.link}>
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
