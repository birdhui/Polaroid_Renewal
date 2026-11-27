import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router';
import { NAV_ITEMS, ROUTES } from '@/app/routes.js';
import { preloadAllPages, preloadLanding, preloadPage } from '@/app/pageLoaders.js';
import wordmark from '@/assets/shared/images/logo-polaroid-wordmark.svg';
import styles from './SiteHeader.module.css';

/**
 * 공통 헤더 (GNB) — History 페이지에서 만든 GNB(Figma 2442:2691)를 모든 페이지에 적용한다. (공통 파일, 담당: 모진아)
 * - 왼쪽 워드마크 로고 → Landing, 오른쪽 메뉴 4개 History · Cameras · Film · Compare
 * - 메뉴 호버: Figma 'GNB / Menu Item (Roll)' 2128:1214 — 같은 글자 3줄을 쌓아 두고 항상 위로만 굴린다.
 *   들어오면 한 줄 위, 나가면 한 줄 더 위로 굴린 뒤 처음 자리로 순간 복귀(보이는 글자는 같아 티 나지 않음).
 *   React 상태 없이 Web Animations 로 움직여 다시 그리기·끊김이 없다.
 * - 스크롤: 내리는 동안 위로 숨었다가, 스크롤이 멈추거나 위로 올리면 다시 내려온다. 맨 위에서는 항상 보인다.
 * - 색: 헤더 바로 아래 배경이 밝으면 검정, 어두우면 흰색으로 자동 전환한다.
 *   페이지가 헤더에 data-history-theme="light" | "dark" 를 달면 그 값을 우선한다 (History 가 사용).
 */

// Figma 메뉴 순서. 공통 routes.js 의 NAV_ITEMS 순서(…Compare·Film)는 그대로 두고 화면 순서만 정한다
const MENU_ORDER = ['History', 'Cameras', 'Film', 'Compare'];
const MENU = MENU_ORDER.map((label) => NAV_ITEMS.find((item) => item.label === label)).filter(Boolean);

const LINE = 17; // 메뉴 한 줄 높이 (px)
const ROLL_MS = 520; // 한 줄 굴리는 시간
const ROLL_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const HIDE_AFTER_PX = 80; // 맨 위에서 이만큼 내려오기 전에는 숨기지 않는다
const SHOW_IDLE_MS = 220; // 스크롤이 이만큼 멈춰 있으면 다시 보여 준다

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ── 메뉴 롤 ── */
function useRoll() {
  const ref = useRef(null);
  const anim = useRef(null);

  const currentY = () => {
    const el = ref.current;
    if (!el) return 0;
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return m.m42;
  };

  const rollTo = (to, { reset = false } = {}) => {
    const el = ref.current;
    if (!el) return;
    const from = currentY();
    anim.current?.cancel();
    const dist = Math.abs(to - from);
    if (dist < 0.5) return;
    const a = el.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${to}px)` }], {
      duration: ROLL_MS * Math.min(1.4, Math.max(0.5, dist / LINE)),
      easing: ROLL_EASE,
      fill: 'forwards',
    });
    anim.current = a;
    if (reset) {
      // 맨 아래 줄까지 굴렸으면 처음 자리로 순간 복귀 (세 줄이 같은 글자라 보이는 모습은 그대로)
      a.onfinish = () => {
        if (anim.current !== a) return;
        a.cancel();
        anim.current = null;
      };
    }
  };

  // 항상 위로만 굴린다: 처음 자리 쪽이면 한 줄 위(-17), 이미 나가는 중이면 끝(-34)까지 이어서 간 뒤 복귀
  const enter = () => {
    if (reducedMotion()) return;
    const y = currentY();
    if (y > -LINE + 0.5) rollTo(-LINE);
    else rollTo(-LINE * 2, { reset: true });
  };
  const leave = () => {
    if (reducedMotion()) return;
    if (currentY() > -0.5 && !anim.current) return;
    rollTo(-LINE * 2, { reset: true });
  };

  useEffect(() => () => anim.current?.cancel(), []);
  return { ref, enter, leave };
}

function RollLink({ label, path }) {
  const { ref, enter, leave } = useRoll();
  const onPointerEnter = (e) => {
    preloadPage(path); // 누르기 전에 페이지 코드를 미리 받아 두어 바로 넘어가게
    if (e.pointerType !== 'touch') enter();
  };
  const onPointerLeave = (e) => e.pointerType !== 'touch' && leave();

  return (
    // 링크가 위로 움직여도 판정이 흔들리지 않도록, 고정된 li 에서 들어오고 나감을 받는다
    <li className={styles.item} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
      <NavLink
        ref={ref}
        to={path}
        className={styles.link}
        data-text={label}
        onFocus={(e) => e.currentTarget.matches(':focus-visible') && enter()}
        onBlur={leave}
      >
        {label}
      </NavLink>
    </li>
  );
}

/* ── 스크롤 숨김 + 배경 밝기에 따른 색 ── */
function parseRgb(value) {
  const m = value && value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { r, g, b, a };
}

/** 헤더 바로 아래(로고·메뉴 높이)의 배경이 밝은지 — 투명하지 않은 첫 배경색을 찾는다. 사진·영상·캔버스는 어둡다고 본다 */
function isLightBehind(header) {
  const y = header.getBoundingClientRect().top + 30;
  const xs = [60, window.innerWidth / 2, window.innerWidth - 60];
  let light = 0;
  let votes = 0;
  for (const x of xs) {
    const stack = document.elementsFromPoint(x, Math.max(1, y));
    for (const el of stack) {
      if (header.contains(el)) continue;
      const tag = el.tagName;
      if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS' || tag === 'svg') {
        votes += 1;
        break;
      }
      const c = parseRgb(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.5) {
        votes += 1;
        if (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 150) light += 1;
        break;
      }
    }
  }
  if (!votes) {
    const c = parseRgb(getComputedStyle(document.body).backgroundColor);
    return c ? 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 150 : false;
  }
  return light * 2 > votes;
}

function useHeaderBehavior(headerRef) {
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;
    let lastY = window.scrollY;
    let idle = 0;
    let raf = 0;

    const setHidden = (hidden) => {
      if ((header.dataset.hidden === 'true') !== hidden) header.dataset.hidden = String(hidden);
    };
    const updateTone = () => {
      raf = 0;
      // 페이지가 직접 정한 색이 있으면 그걸 쓴다
      const forced = header.dataset.historyTheme;
      const tone = forced ? (forced === 'light' ? 'dark' : 'light') : isLightBehind(header) ? 'dark' : 'light';
      if (header.dataset.tone !== tone) header.dataset.tone = tone;
    };
    const requestTone = () => {
      if (!raf) raf = requestAnimationFrame(updateTone);
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (y <= HIDE_AFTER_PX) setHidden(false);
      else if (dy > 2) setHidden(true);
      else if (dy < -2) setHidden(false);
      // 스크롤이 멈추면 다시 내려온다
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setHidden(false), SHOW_IDLE_MS);
      requestTone();
    };

    // 페이지(History)가 색을 바꾸면 바로 반영
    const mo = new MutationObserver(requestTone);
    mo.observe(header, { attributes: true, attributeFilter: ['data-history-theme'] });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', requestTone);
    // 페이지 전환·이미지 로딩 뒤에도 한 번씩 다시 확인
    const tick = window.setInterval(requestTone, 800);
    requestTone();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', requestTone);
      window.clearTimeout(idle);
      window.clearInterval(tick);
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [headerRef]);
}

export default function SiteHeader() {
  const headerRef = useRef(null);
  useHeaderBehavior(headerRef);

  // 화면이 한가해지면 서브페이지 코드를 미리 받아 둔다 (메뉴를 누르면 기다림 없이 바로 넘어가게)
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((fn) => window.setTimeout(fn, 1));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    let id = 0;
    const t = window.setTimeout(() => {
      id = idle(preloadAllPages, { timeout: 4000 });
    }, 2500);
    return () => {
      window.clearTimeout(t);
      if (id) cancel(id);
    };
  }, []);

  return (
    <header ref={headerRef} className={styles.header} data-tone="light">
      {/* 메뉴 글꼴 Outfit Light (History GNB 와 같음). React 19 가 <head> 로 올리고 한 번만 불러온다 */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300&display=swap" precedence="default" />
      {/* 로고는 CSS mask 로 그려 글자색(흰색/검정)을 따라간다. 작은 SVG 는 Vite 가 data URL 로 넣는데,
          그 안에 따옴표·공백이 있어 url() 을 반드시 따옴표로 감싸야 한다 (안 감싸면 mask 가 깨져 흰 사각형만 보임) */}
      <Link
        to={ROUTES.landing}
        className={styles.logo}
        aria-label="Polaroid 홈으로 이동"
        style={{ '--logo': `url("${wordmark}")` }}
        onPointerEnter={preloadLanding}
      >
        Polaroid
      </Link>
      <nav aria-label="주요 메뉴">
        <ul className={styles.list}>
          {MENU.map(({ label, path }) => (
            <RollLink key={path} label={label} path={path} />
          ))}
        </ul>
      </nav>
    </header>
  );
}
