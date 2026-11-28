import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '@/app/routes.js';
import styles from './CameraNowPage.module.css';

/**
 * Cameras › Polaroid Now Gen 3 상세 페이지 (담당: 임희지 · 브랜치: feat/cameras-now)
 * 디자인: Figma "Now Gen 3"(3472:5464). 좌표·글자 크기는 프레임 너비 1646 기준으로 두고 화면 너비에 비례해 변한다(--u).
 * 화면 동작은 참고 사이트(telhaclarke.com.au/process)의 스크롤·텍스트 인터랙션을 같은 수치로 직접 구현했다.
 *  - 관성 스크롤: 휠 1회마다 1.2s, easing 1-(1-t)^5
 *  - 문구: 줄 단위로 감싸 아래에서 올라옴(expo.out 1.2s). 제목 stagger 0.1s · 본문 0.08s, 요소 상단이 화면 90% 지점에 닿을 때 한 번 실행
 *  - 서브타이틀: 글자 단위 등장(0.02s stagger) 뒤 숫자가 옆에서 들어오며 글자가 제자리로 이동
 *  - 커버 이미지: 로더 뒤 가운데에서 열리며 등장 → 스크롤하면 좌우 여백이 사라지며 전체 폭으로 확장(scale 1.015→1)
 *  - 시차: 이미지 높이/5 만큼 위아래 이동 · 카드 목록: sticky 로 쌓이는 스택
 * 헤더는 이번 범위에서 제외. 이미지 자리는 색 블록이다(실제 이미지가 정해지면 .ph 안에 <img> 로 교체).
 */

const FONT_STYLESHEETS = [
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
];

const UNIT_BASE = 1646.29; // Figma 프레임 너비
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* 로더: 3s 동안 0→100% 를 세고, 70% 지점에서 글자가 위로 빠지며 패널이 걷힌다.
   카운터 숫자는 이 컴포넌트 안에서만 갱신해 페이지 전체가 매 프레임 다시 그려지지 않게 한다. */
function Loader({ onOut, onDone, onGone }) {
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('pre'); // pre → in → out

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const duration = 3000;
    const ease = (p) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      return p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2;
    };
    const timers = [];
    let frame = 0;
    let started = false;
    let shown = -1;
    const begin = performance.now() + 40;
    timers.push(window.setTimeout(() => setPhase('in'), 40));
    const tick = (now) => {
      const p = clamp((now - begin) / duration);
      const value = Math.round(ease(p) * 100);
      if (value !== shown) {
        shown = value;
        setCount(value);
      }
      if (!started && p >= 0.7) {
        started = true;
        setPhase('out');
        timers.push(
          window.setTimeout(() => {
            document.documentElement.style.overflow = '';
            onDone();
          }, 350),
        );
        timers.push(window.setTimeout(onGone, 1900));
      }
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
      document.documentElement.style.overflow = '';
    };
  }, [onOut, onDone, onGone]);

  return (
    <div className={`${styles.loader} ${phase === 'in' ? styles.loaderIn : ''} ${phase === 'out' ? styles.loaderOut : ''}`} aria-hidden="true">
      <div className={styles.loaderPanel} />
      <p className={styles.loaderTitle}>
        {['Polaroid', 'Now Gen 3'].map((line, i) => (
          <span key={line} className={styles.loaderLineW}>
            <span className={styles.loaderLine} style={{ '--i': i }}>
              {line}
            </span>
          </span>
        ))}
      </p>
      <p className={styles.loaderLabel}>
        <span className={styles.loaderLineW}>
          <span className={styles.loaderLine} style={{ '--i': 2 }}>
            Loading
          </span>
        </span>
      </p>
      <p className={styles.loaderCount}>
        <span className={styles.loaderLineW}>
          <span className={styles.loaderLine} style={{ '--i': 3 }}>
            {count}%
          </span>
        </span>
      </p>
    </div>
  );
}

/* 관성 스크롤: 입력(휠)이 목표 위치를 옮기고, 현재 위치가 시간 기반 감쇠로 따라간다(속도가 끊기지 않는다).
   위치를 옮긴 같은 프레임 안에서 스크롤 연동 효과를 바로 갱신해(fxRef) 고정된 행·시차가 한 프레임 늦지 않게 한다. */
function useSmoothScroll(enabled, fxRef) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return undefined;
    let current = window.scrollY;
    let target = current;
    let last = 0;
    let frame = 0;
    let running = false;
    const max = () => document.documentElement.scrollHeight - window.innerHeight;

    const loop = (now) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      current += (target - current) * (1 - Math.exp(-dt * 5.5));
      if (Math.abs(target - current) < 0.3) {
        current = target;
        running = false;
      }
      window.scrollTo(0, current);
      fxRef.current?.();
      if (running) frame = requestAnimationFrame(loop);
      else last = 0;
    };
    const onWheel = (event) => {
      if (event.ctrlKey) return;
      event.preventDefault();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      if (!running) current = window.scrollY;
      target = clamp((running ? target : current) + delta, 0, max());
      if (!running) {
        running = true;
        last = 0;
        frame = requestAnimationFrame(loop);
      }
    };
    const onScroll = () => {
      if (!running) {
        current = window.scrollY;
        target = current;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
    };
  }, [enabled, fxRef]);
}

/* [data-reveal] 요소의 상단이 화면 90% 지점에 닿으면 data-in="true" (한 번만). */
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
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef, enabled]);
}

/* 스크롤 연동 효과: 커버 이미지 확장·scale, 이미지 시차(높이/5), 카드 스택의 위치.
   위치·크기는 미리 재 두고(layout) 매 프레임에는 계산한 값을 쓰기만 해서 강제 레이아웃을 피한다. */
function useScrollEffects(rootRef, coverRef, coverInnerRef, rowsRef, appeared, fxRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;
    const wide = () => window.innerWidth >= 1200;
    let frame = 0;
    let items = [];
    let rowEls = [];
    let cover = null;
    let rows = null;
    let u = 1;
    let lastY = -1;

    const layout = () => {
      const scrollY = window.scrollY;
      u = root.clientWidth / UNIT_BASE;
      items = [...root.querySelectorAll('[data-parallax]')]
        .map((box) => {
          const el = box.querySelector('[data-parallax-el]');
          if (!el) return null;
          if (!wide()) {
            el.style.height = '';
            el.style.marginTop = '';
            el.style.transform = '';
            return null;
          }
          const h = box.offsetHeight;
          const travel = (h / 5) * (Math.min(window.innerWidth, 1440) / 1440);
          el.style.height = `calc(100% + ${travel}px)`;
          el.style.marginTop = `${-travel / 2}px`;
          const top = box.getBoundingClientRect().top + scrollY;
          return { el, travel, start: top < window.innerHeight ? 0 : top - window.innerHeight, end: top + h, last: null };
        })
        .filter(Boolean);

      const c = coverRef.current;
      cover = c
        ? { box: c, inner: coverInnerRef.current, top: c.getBoundingClientRect().top + scrollY, height: c.offsetHeight }
        : null;

      const r = rowsRef.current;
      if (r) {
        const rect = r.getBoundingClientRect();
        rows = { top: rect.top + scrollY, height: rect.height };
        rowEls = [...r.querySelectorAll('[data-row]')];
        if (!wide()) rowEls.forEach((el) => el.style.removeProperty('top'));
      }
      lastY = -1;
    };

    const update = () => {
      frame = 0;
      const scrollY = window.scrollY;
      if (scrollY === lastY) return;
      lastY = scrollY;
      const vh = window.innerHeight;

      items.forEach((it) => {
        const p = clamp((scrollY - it.start) / (it.end - it.start || 1));
        const y = Math.round((-it.travel / 2 + it.travel * p) * 10) / 10;
        if (y !== it.last) {
          it.last = y;
          it.el.style.transform = `translate3d(0, ${y}px, 0)`;
        }
      });

      if (cover && cover.inner && appeared.current && wide()) {
        const start = Math.max(cover.top - vh, 0);
        const end = cover.top + cover.height - vh;
        const p = clamp((scrollY - start) / (end - start || 1));
        cover.box.style.transition = 'none';
        cover.box.style.clipPath = `inset(0px ${((1 - p) * 22.865 * u).toFixed(2)}px)`;
        cover.inner.style.transition = 'none';
        cover.inner.style.transform = `scale(${(1.015 - 0.015 * p).toFixed(5)})`;
      }

      if (rows && wide()) {
        const rectTop = rows.top - scrollY;
        const rectBottom = rectTop + rows.height;
        // 카드가 화면에 걸쳐 있는 동안만 위치를 갱신한다
        if (rectBottom > -vh && rectTop < vh) {
          const scrollOffset = vh - ((96 + 128 * 3 + 504) * u);
          const finalOffset = vh * clamp((vh - rectBottom) / vh);
          const progress = scrollOffset < 0 ? clamp(-rectTop / (rows.height - vh || 1)) : 0;
          const shift = (scrollOffset < 0 ? scrollOffset : 0) * progress - finalOffset;
          rowEls.forEach((el, i) => {
            el.style.top = `${((96 + 128 * i) * u + shift).toFixed(2)}px`;
          });
        }
      }
    };

    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const relayout = () => {
      layout();
      request();
    };
    fxRef.current = update;
    layout();
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', relayout);
    window.addEventListener('load', relayout);
    const lateLayout = window.setTimeout(relayout, 600);
    document.fonts?.ready.then(relayout);
    return () => {
      fxRef.current = null;
      window.clearTimeout(lateLayout);
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', relayout);
      window.removeEventListener('load', relayout);
    };
  }, [rootRef, coverRef, coverInnerRef, rowsRef, appeared, fxRef]);
}

function Brackets({ position }) {
  return <span className={`${styles.bracket} ${styles[position]}`} aria-hidden="true" />;
}

/* 글자 단위로 감싼다(공백은 고정 공백). */
function Chars({ text, kind, baseDelay = 0, step = 20 }) {
  return [...text].map((ch, i) => (
    <span key={`${ch}-${i}`} className={`${styles.chW} ${styles[kind]}`}>
      <span className={styles.ch} style={{ '--cd': `${baseDelay + i * step}ms` }}>
        {ch === ' ' ? ' ' : ch}
      </span>
    </span>
  ));
}

/* 서브타이틀: 글자가 아래에서 올라오고, 숫자가 옆에서 들어오며 글자가 제자리로 밀려난다. */
function Subtitle({ index, label }) {
  const hostRef = useRef(null);
  const textRef = useRef(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    if (!index) return undefined;
    const measure = () => {
      const host = hostRef.current;
      const text = textRef.current;
      if (host && text) setShift(text.getBoundingClientRect().left - host.getBoundingClientRect().left);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [index]);

  return (
    <p ref={hostRef} className={styles.subtitle} data-reveal style={{ '--shift': `${shift}px` }}>
      {index && (
        <span className={styles.subtitleIndex}>
          <Chars text={index} kind="chNumber" baseDelay={630} step={100} />
        </span>
      )}
      <span ref={textRef} className={`${styles.subtitleText} ${index ? styles.subtitleShift : ''}`}>
        <Chars text={label} kind="chText" />
      </span>
    </p>
  );
}

/* 한 줄씩 가려진 상태에서 올라오는 문구(줄이 이미 나뉜 제목용). delay = stagger 순서 × 100ms */
function Line({ children, order = 0, className = '' }) {
  return (
    <span className={`${styles.lineW} ${className}`} data-reveal style={{ '--d': `${order * 100}ms` }}>
      <span className={styles.line}>{children}</span>
    </span>
  );
}

/* 문단을 실제 줄바꿈 위치에서 줄 단위로 나눠(숨김 복사본으로 측정) 줄마다 올라오게 한다. 본문 stagger 0.08s. */
function SplitText({ as: Tag = 'p', className = '', children }) {
  const text = children;
  const measureRef = useRef(null);
  const [lines, setLines] = useState(null);
  const [tick, setTick] = useState(0);
  const words = text.split(' ');

  useLayoutEffect(() => {
    const spans = measureRef.current?.children;
    if (!spans) return;
    const out = [];
    let lastTop = null;
    [...spans].forEach((span) => {
      const top = span.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        out.push([]);
        lastTop = top;
      }
      out[out.length - 1].push(span.textContent.trim());
    });
    const next = out.map((w) => w.join(' '));
    setLines((prev) => (prev && prev.join('|') === next.join('|') ? prev : next));
  }, [text, tick]);

  useEffect(() => {
    let timer = 0;
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setTick((t) => t + 1), 150);
    };
    document.fonts?.ready.then(() => setTick((t) => t + 1));
    window.addEventListener('resize', bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', bump);
    };
  }, []);

  return (
    <Tag className={`${styles.split} ${className}`} data-reveal aria-label={text}>
      <span className={styles.measure} aria-hidden="true" ref={measureRef}>
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>{`${word} `}</span>
        ))}
      </span>
      {lines
        ? lines.map((line, i) => (
            <span key={`${line}-${i}`} className={styles.lineW} aria-hidden="true">
              <span className={styles.line} style={{ '--d': `${i * 80}ms` }}>
                {line}
              </span>
            </span>
          ))
        : text}
    </Tag>
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
  const rowsRef = useRef(null);
  const appeared = useRef(false);
  const fxRef = useRef(null);
  const [done, setDone] = useState(() => prefersReducedMotion());
  const [gone, setGone] = useState(() => prefersReducedMotion());
  const handleOut = useCallback(() => {}, []);
  const handleDone = useCallback(() => setDone(true), []);
  const handleGone = useCallback(() => setGone(true), []);

  useSmoothScroll(done, fxRef);
  useReveal(rootRef, done);
  useScrollEffects(rootRef, coverRef, coverInnerRef, rowsRef, appeared, fxRef);

  /* 커버 이미지가 열리는 등장(1.35s)이 끝난 뒤부터 스크롤 값이 클립을 제어한다. */
  useEffect(() => {
    if (!done) return undefined;
    const timer = window.setTimeout(() => {
      appeared.current = true;
      window.dispatchEvent(new Event('scroll'));
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [done]);

  return (
    <main ref={rootRef} className={styles.page}>
      {FONT_STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}

      {!gone && <Loader onOut={handleOut} onDone={handleDone} onGone={handleGone} />}

      {/* 커버 */}
      <section className={styles.cover}>
        <h1 className={styles.coverHeading}>
          <span className={styles.lineW} data-reveal>
            <span className={`${styles.line} ${styles.coverMuted}`}>가장 일상적인 폴라로이드는 네 가지로 완성됩니다.</span>
          </span>
          <span className={styles.lineW} data-reveal style={{ '--d': '100ms' }}>
            <span className={`${styles.line} ${styles.coverStrong}`}>알아서 맞추는 초점, 두 장면을 겹치는 노출,</span>
          </span>
          <span className={styles.lineW} data-reveal style={{ '--d': '200ms' }}>
            <span className={`${styles.line} ${styles.coverStrong}`}>
              함께 찍는 셀프타이머<span className={styles.coverMuted}>, 그리고</span> 오래 가는 배터리.
            </span>
          </span>
        </h1>
        <div ref={coverRef} className={`${styles.coverImage} ${done ? styles.coverIn : ''}`}>
          <div ref={coverInnerRef} className={styles.coverInner}>
            <div className={styles.parBox} data-parallax>
              <div className={`${styles.ph} ${styles.parEl} ${styles.coverPh}`} data-parallax-el />
            </div>
          </div>
        </div>
      </section>

      {/* 01 About */}
      <section className={styles.about}>
        <Brackets position="topLeft" />
        <Brackets position="topRight" />
        <h2 className={styles.aboutTitle}>
          <Line>같은 순간은 두 번 오지 않으니까,</Line>
          <Line order={1}>셔터를 누르는 일은 언제나 쉬워야 합니다.</Line>
        </h2>
        <div className={styles.aboutSubtitle}>
          <Subtitle index="01" label="About" />
        </div>
        <SplitText className={styles.aboutText}>
          Now Gen 3는 처음 폴라로이드를 손에 쥐는 사람을 위해 만들었습니다. 뷰파인더로 장면을 보고 셔터를 누르면, 초점과 노출은 카메라가 알아서
          맞춥니다. i-Type 필름과 600 필름을 모두 쓸 수 있어, 원하는 필름을 골라 바로 시작할 수 있습니다.
        </SplitText>
        <div className={`${styles.aboutImage} ${styles.aboutImageLeft}`} data-reveal>
          <div className={styles.parBox} data-parallax>
            <div className={`${styles.ph} ${styles.parEl}`} data-parallax-el style={{ background: '#d9dcd7' }} />
          </div>
        </div>
        <div className={`${styles.aboutImage} ${styles.aboutImageRight}`} data-reveal style={{ '--d': '140ms' }}>
          <div className={styles.parBox} data-parallax>
            <div className={`${styles.ph} ${styles.parEl}`} data-parallax-el style={{ background: '#2b2a28' }} />
          </div>
        </div>
      </section>

      {/* 02 Highlights */}
      <section className={styles.stack}>
        <div className={styles.stackSubtitle}>
          <Subtitle index="02" label="Highlights" />
        </div>
        <h2 className={styles.stackTitle}>
          <Line>가볍게 들고, 쉽게 찍고,</Line>
          <Line order={1}>오래 간직하세요.</Line>
        </h2>
        <SplitText className={styles.stackText}>
          복잡한 설정 없이 셔터 하나로 시작하는 카메라. 매일 들고 다니며 찍을수록, 손에 남는 기록도 함께 쌓입니다.
        </SplitText>
        <div ref={rowsRef} className={styles.rows}>
          {HIGHLIGHTS.map((item, i) => (
            <div key={item.id} className={styles.card} style={{ '--card-h': `calc(${(HIGHLIGHTS.length - i) * 504} * var(--u))`, '--i': i }}>
              <article data-row className={`${styles.row} ${styles[`row${i + 1}`]}`}>
                <h3 className={styles.rowTitle}>
                  <Line>{item.title}</Line>
                </h3>
                <div className={styles.rowImage}>
                  <div className={styles.ph} style={{ background: item.color }} />
                </div>
                <SplitText className={`${styles.rowText} ${styles.rowTextLeft}`}>{item.left}</SplitText>
                <SplitText className={`${styles.rowText} ${styles.rowTextRight}`}>{item.right}</SplitText>
                {item.tip && (
                  <p className={styles.tip}>
                    <Line>
                      <span className={styles.tipLabel}>Tip! </span>
                      {item.tip}
                    </Line>
                  </p>
                )}
              </article>
            </div>
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
          <Link className={styles.link} to={ROUTES.film}>
            <span className={styles.linkTitle}>
              <Line>Compatible Film →</Line>
            </span>
            <SplitText as="span" className={styles.linkText}>
              i-Type Film · 600 Film | 정사각형 사진 약 7.9×7.9cm | 한 팩 8장
            </SplitText>
          </Link>
          <Link className={styles.link} to={ROUTES.compare}>
            <span className={styles.linkTitle}>
              <Line>Find &amp; Compare →</Line>
            </span>
            <SplitText as="span" className={styles.linkText}>
              앱으로 직접 조작하고 싶다면 Now+, 더 강한 플래시가 필요하다면 Flip과 비교해 보세요.
            </SplitText>
          </Link>
        </div>
      </section>
    </main>
  );
}
