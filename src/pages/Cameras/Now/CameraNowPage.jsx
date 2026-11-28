import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import styles from './CameraNowPage.module.css';

/**
 * Cameras › Polaroid Now Gen 3 상세 페이지 (담당: 임희지 · 브랜치: feat/cameras-now)
 * 디자인: Figma "Now Gen 3"(3472:5464). 좌표·글자 크기는 프레임 너비 1646 기준으로 두고 화면 너비에 비례해 변한다(--u).
 * 화면 동작(관성 스크롤, 로더, 줄 단위 문구 등장, 이미지 시차·등장)은 참고 사이트의 인터랙션을 따라 직접 구현했다.
 * 헤더는 이번 범위에서 제외. 이미지 자리는 색 블록이다(실제 이미지가 정해지면 .ph 안에 <img> 로 교체).
 */

const FONT_STYLESHEETS = [
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap',
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 로더: 0 → 100% 를 세고 패널이 위로 걷힌다. done 이 되면 본문이 움직이기 시작한다. */
function useLoader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setCount(100);
      setDone(true);
      setGone(true);
      return undefined;
    }
    document.documentElement.style.overflow = 'hidden';
    const duration = 1500;
    const start = performance.now();
    let frame = 0;
    let t1 = 0;
    let t2 = 0;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - (1 - p) ** 3) * 100));
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        t1 = window.setTimeout(() => {
          document.documentElement.style.overflow = '';
          setDone(true);
          t2 = window.setTimeout(() => setGone(true), 1100);
        }, 250);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      document.documentElement.style.overflow = '';
    };
  }, []);

  return { count, done, gone };
}

/* 관성 스크롤: 휠 입력을 목표값에 쌓고 현재 위치가 따라가게 한다(터치·키보드는 기본 동작). */
function useSmoothScroll(enabled) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return undefined;
    let target = window.scrollY;
    let current = target;
    let frame = 0;
    let running = false;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;

    const loop = () => {
      current += (target - current) * 0.1;
      if (Math.abs(target - current) < 0.5) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      if (running) frame = requestAnimationFrame(loop);
    };
    const onWheel = (event) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      target = Math.min(Math.max(target + delta, 0), max());
      if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    };
    const onScroll = () => {
      if (!running) {
        target = window.scrollY;
        current = target;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled]);
}

/* [data-reveal] 요소가 화면에 들어오면 data-in="true" 를 붙인다(한 번만). */
function useReveal(rootRef, enabled) {
  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root) return undefined;
    const targets = root.querySelectorAll('[data-reveal]');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((el) => {
        el.dataset.in = 'true';
      });
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.in = 'true';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef, enabled]);
}

/* 전체 폭 이미지 시차: 프레임이 화면을 지나가는 동안 안쪽 그림이 천천히 위로 올라간다. */
function useParallax(frameRef, innerRef) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = frameRef.current;
      const inner = innerRef.current;
      if (!box || !inner) return;
      const rect = box.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      const p = Math.min(Math.max((window.innerHeight - rect.top) / span, 0), 1);
      const extra = inner.offsetHeight - rect.height;
      inner.style.transform = `translate3d(0, ${(-extra * p).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [frameRef, innerRef]);
}

function Brackets({ position }) {
  return <span className={`${styles.bracket} ${styles[position]}`} aria-hidden="true" />;
}

function Subtitle({ index, label }) {
  return (
    <p className={styles.subtitle}>
      {index && <span className={styles.subtitleIndex}>{index}</span>}
      <span>{label}</span>
    </p>
  );
}

/* 한 줄씩 가려진 상태에서 올라오는 문구 */
function Line({ children, delay = 0, className = '' }) {
  return (
    <span className={`${styles.lineW} ${className}`} data-reveal style={{ '--d': `${delay}ms` }}>
      <span className={styles.line}>{children}</span>
    </span>
  );
}

const HIGHLIGHTS = [
  {
    id: 'autofocus',
    title: '(01) Two-Lens Autofocus',
    color: '#952c16',
    left: 'Now Gen 3에는 두 개의 렌즈가 있습니다. 하나는 가까운 인물을, 다른 하나는 먼 풍경을 위한 렌즈입니다.',
    right:
      '셔터를 누르면 카메라가 피사체와의 거리를 읽고 알맞은 렌즈로 찍습니다. 초점을 신경 쓰지 않아도 얼굴은 또렷하게, 풍경은 깊게 담깁니다.',
    tip: '가까이 찍을수록 뷰파인더로 본 구도와 실제 사진이 조금 달라질 수 있습니다.',
  },
  {
    id: 'double-exposure',
    title: '(02) Double Exposure',
    color: '#cacfcb',
    left: '한 장의 필름 위에 두 장면을 겹쳐 찍는 기능입니다. 첫 장면을 찍으면 사진이 바로 나오지 않고, 두 번째 셔터를 기다립니다.',
    right: '실루엣 위에 꽃을, 얼굴 위에 하늘을. 어두운 피사체와 밝은 배경을 조합하면 두 장면이 가장 선명하게 겹칩니다.',
    tip: '가까이 찍을수록 뷰파인더로 본 구도와 실제 사진이 조금 달라질 수 있습니다.',
  },
  {
    id: 'self-timer',
    title: '(03) Self-Timer',
    color: '#952c16',
    left: '셀프타이머를 켜고 셔터를 누르면 잠시 뒤 자동으로 촬영됩니다. 찍는 사람도 함께 사진 안에 들어갈 수 있습니다.',
    right: '바닥의 삼각대 마운트에 고정하면 단체 사진도, 여행지의 기념사진도 흔들림 없이 담깁니다.',
  },
  {
    id: 'usb-c-battery',
    title: '(04) USB-C Battery',
    color: '#cacfcb',
    left: 'USB-C로 충전하는 내장 배터리를 사용합니다. 한 번 충전하면 필름 최대 15팩까지 찍을 수 있습니다.',
    right: '여행 중에도 가지고 있는 USB-C 케이블로 바로 충전할 수 있어, 배터리 걱정 없이 오래 들고 다닐 수 있습니다.',
  },
];

export default function CameraNowPage() {
  const rootRef = useRef(null);
  const coverRef = useRef(null);
  const coverInnerRef = useRef(null);
  const { count, done, gone } = useLoader();

  useSmoothScroll(done);
  useReveal(rootRef, done);
  useParallax(coverRef, coverInnerRef);

  return (
    <main ref={rootRef} className={styles.page}>
      {FONT_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}

      {!gone && (
        <div className={`${styles.loader} ${done ? styles.loaderDone : ''}`} aria-hidden="true">
          <p className={styles.loaderTitle}>
            Polaroid
            <br />
            Now Gen 3
          </p>
          <p className={styles.loaderCount}>{count}%</p>
        </div>
      )}

      {/* 커버 */}
      <section className={styles.cover}>
        <h1 className={styles.coverHeading}>
          <span className={`${styles.lineW} ${styles.coverLine1}`} data-reveal>
            <span className={`${styles.line} ${styles.coverMuted}`}>가장 일상적인 폴라로이드는 네 가지로 완성됩니다.</span>
          </span>
          <span className={`${styles.lineW} ${styles.coverLine2}`} data-reveal style={{ '--d': '140ms' }}>
            <span className={`${styles.line} ${styles.coverStrong}`}>
              알아서 맞추는 초점, 두 장면을 겹치는 노출, 함께 찍는 셀프타이머<span className={styles.coverMuted}>, 그리고</span> 오래 가는
              배터리.
            </span>
          </span>
        </h1>
        <div ref={coverRef} className={styles.coverImage} data-reveal>
          <div ref={coverInnerRef} className={`${styles.ph} ${styles.coverPh}`} />
        </div>
      </section>

      {/* 01 About */}
      <section className={styles.about}>
        <Brackets position="topLeft" />
        <Brackets position="topRight" />
        <h2 className={styles.aboutTitle}>
          <Line>같은 순간은 두 번 오지 않으니까,</Line>
          <Line delay={120}>셔터를 누르는 일은 언제나 쉬워야 합니다.</Line>
        </h2>
        <div className={styles.aboutSubtitle}>
          <Subtitle index="01" label="About" />
        </div>
        <p className={styles.aboutText} data-reveal>
          Now Gen 3는 처음 폴라로이드를 손에 쥐는 사람을 위해 만들었습니다. 뷰파인더로 장면을 보고 셔터를 누르면, 초점과 노출은 카메라가 알아서
          맞춥니다. i-Type 필름과 600 필름을 모두 쓸 수 있어, 원하는 필름을 골라 바로 시작할 수 있습니다.
        </p>
        <div className={`${styles.aboutImage} ${styles.aboutImageLeft}`} data-reveal>
          <div className={styles.ph} style={{ background: '#d9dcd7' }} />
        </div>
        <div className={`${styles.aboutImage} ${styles.aboutImageRight}`} data-reveal style={{ '--d': '140ms' }}>
          <div className={styles.ph} style={{ background: '#2b2a28' }} />
        </div>
      </section>

      {/* 02 Highlights */}
      <section className={styles.stack}>
        <div className={styles.stackSubtitle}>
          <Subtitle index="02" label="Highlights" />
        </div>
        <h2 className={styles.stackTitle}>
          <Line>가볍게 들고, 쉽게 찍고,</Line>
          <Line delay={120}>오래 간직하세요.</Line>
        </h2>
        <p className={styles.stackText} data-reveal>
          복잡한 설정 없이 셔터 하나로 시작하는 카메라. 매일 들고 다니며 찍을수록, 손에 남는 기록도 함께 쌓입니다.
        </p>
        <div className={styles.rows}>
          {HIGHLIGHTS.map((item, i) => (
            <article key={item.id} className={`${styles.row} ${styles[`row${i + 1}`]}`} data-reveal>
              <h3 className={styles.rowTitle}>{item.title}</h3>
              <div className={styles.rowImage}>
                <div className={styles.ph} style={{ background: item.color }} />
              </div>
              <p className={`${styles.rowText} ${styles.rowTextLeft}`}>{item.left}</p>
              <p className={`${styles.rowText} ${styles.rowTextRight}`}>{item.right}</p>
              {item.tip && (
                <p className={styles.tip}>
                  <span className={styles.tipLabel}>Tip! </span>
                  {item.tip}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Now Gen 3 링크 */}
      <section className={styles.links}>
        <Brackets position="bottomLeft" />
        <Brackets position="bottomRight" />
        <div className={styles.linksSubtitle}>
          <Subtitle label="Now Gen 3" />
        </div>
        <div className={styles.linksList}>
          <Link className={styles.link} to={ROUTES.film} data-reveal>
            <span className={styles.linkTitle}>Compatible Film →</span>
            <span className={styles.linkText}>i-Type Film · 600 Film | 정사각형 사진 약 7.9×7.9cm | 한 팩 8장</span>
          </Link>
          <Link className={styles.link} to={ROUTES.compare} data-reveal style={{ '--d': '140ms' }}>
            <span className={styles.linkTitle}>Find &amp; Compare →</span>
            <span className={styles.linkText}>앱으로 직접 조작하고 싶다면 Now+, 더 강한 플래시가 필요하다면 Flip과 비교해 보세요.</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
