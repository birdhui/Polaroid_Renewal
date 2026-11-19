import { useEffect, useRef, useState } from 'react';
import filmPrintImage from '@/assets/cameras/now/now-film-print.webp';
import styles from '../CameraNowPage.module.css';

/**
 * 4. Polaroid NOW Film (i-2 'Get the best out of our unique chemistry' 구성)
 * 섹션이 화면에 고정된 동안 스크롤할수록 인화 사진이 아래에서 올라와 → 똑바로 서며 현상되고(흐린 회색 → 색)
 * → 가까워지며 화면을 가득 채운다. 고정이 풀리면 사진 아래에 Now 필름(Color i-Type) 설명이 이어진다.
 * 사진: 사용자 제공 이미지를 Now 인화 사진처럼 보정(now-film-print.webp, 88×107 비율, 이미지 79×79)
 */
const TITLE_LINES = ['Snap it now,', 'hold it forever!'];
/** 인화지(88×107) 안에서 사진(이미지 영역)의 위치를 비율로: 위 6/107, 왼쪽 4.5/88, 크기 79×79 */
const NOW_BOX = { top: 6 / 107, left: 4.5 / 88, w: 79 / 88, h: 79 / 107 };
const NOW_TEXT =
  'Every Now photo comes out on Color i-Type film: soft, dreamy and a little unpredictable, with colors no filter can copy. It starts out blank, then slowly comes to life in 10–15 minutes inside that iconic white frame. Made at the last Polaroid film factory in the world.';

/** 문구를 단어·글자 단위로 쪼갠다. 글자마다 등장 지연(--d)을 0~0.6초로 나눠 준다. */
function BounceTitle({ id, className, lines }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const total = lines.join('').replace(/\s/g, '').length;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0;
  return (
    <h2 id={id} ref={ref} className={`${className} ${inView ? styles.isIn : ''}`} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span key={line} aria-hidden="true">
          {li > 0 && <br />}
          {line.split(' ').map((word, wi) => (
            <span key={`${word}-${wi}`}>
              {wi > 0 && ' '}
              <span className={styles.btWord}>
                {[...word].map((ch, ci) => {
                  const d = (0.6 * n) / Math.max(1, total - 1);
                  n += 1;
                  return (
                    <span key={ci} className={styles.btChar} style={{ '--d': `${d.toFixed(3)}s` }}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.reducedMotion
 * @param {string} [props.idPrefix]   id 접두어
 * @param {string} [props.eyebrow]    주황색 라벨
 * @param {string[]} [props.titleLines] 큰 영문 제목 (줄 단위)
 * @param {string} [props.image]      인화 사진 (88×107 비율)
 * @param {string} [props.imageAlt]
 * @param {{top:number,left:number,w:number,h:number}} [props.box] 인화지 안 사진 영역(비율)
 * @param {string} [props.text]       고정이 풀린 뒤 사진 아래 설명
 */
export default function NowFilm({
  reducedMotion,
  idPrefix = 'now',
  eyebrow = 'Polaroid NOW Film',
  titleLines = TITLE_LINES,
  image = filmPrintImage,
  imageAlt = 'Polaroid Now로 찍은 인화 사진: 잔잔한 물 위로 알록달록한 집들이 그대로 비친 풍경',
  box = NOW_BOX,
  text = NOW_TEXT,
}) {
  const IMG = { cy: box.top + box.h / 2, w: box.w };
  const pinRef = useRef(null);
  const printRef = useRef(null);
  const undevRef = useRef(null);

  useEffect(() => {
    const pin = pinRef.current;
    const print = printRef.current;
    const undev = undevRef.current;
    if (!pin || !print) return undefined;
    if (reducedMotion) {
      print.style.cssText = '';
      if (undev) undev.style.opacity = '';
      return undefined;
    }
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const seg = (p, a, b) => clamp((p - a) / (b - a));
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const lerp = (a, b, t) => a + (b - a) * t;
    let raf = 0;
    let visible = false;

    const draw = () => {
      raf = 0;
      const W = pin.clientWidth;
      const H = window.innerHeight;
      const r = pin.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, pin.offsetHeight - H));
      // 처음 크기: 화면 폭 26% (화면 높이 안에 들어오게)
      const B = Math.min(W * 0.26, H * 0.62 * (88 / 107));
      const Hb = B * (107 / 88);
      // 마지막 크기: 사진(이미지 영역)이 화면 전체를 덮는다
      const sEnd = (Math.max(W, H) * 1.03) / (B * IMG.w);
      const rise = ease(seg(p, 0, 0.42));
      const zoom = ease(seg(p, 0.3, 0.86));
      const startY = H * 0.7 + IMG.cy * Hb; // 인화지 윗변이 화면 70% 지점에서 살짝 보인다
      const midY = H * 0.5;
      const cy = lerp(startY, midY, rise);
      const s = lerp(1, sEnd, zoom);
      const rot = lerp(-3, 0, ease(seg(p, 0.08, 0.6)));
      print.style.width = `${B}px`;
      print.style.left = `${W / 2 - B / 2}px`;
      print.style.top = '0px';
      print.style.transformOrigin = `50% ${IMG.cy * 100}%`;
      print.style.transform = `translate3d(0, ${(cy - IMG.cy * Hb).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      if (undev) undev.style.opacity = (1 - seg(p, 0.12, 0.55)).toFixed(3); // 현상: 흐린 회색 → 색
      if (visible) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(pin);
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', onResize);
    draw();
    return () => {
      visible = false;
      io.disconnect();
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion, IMG.cy, IMG.w]);

  return (
    <section className={styles.film} aria-labelledby={`${idPrefix}-film-title`}>
      <div ref={pinRef} className={styles.filmPin}>
        <div className={styles.filmStage}>
          <div className={styles.filmHead}>
            <p className={styles.filmEyebrow}>{eyebrow}</p>
            <BounceTitle id={`${idPrefix}-film-title`} className={styles.filmTitle} lines={titleLines} />
          </div>
          <div ref={printRef} className={styles.filmPrint}>
            <img src={image} alt={imageAlt} decoding="async" />
            <span
              ref={undevRef}
              className={styles.filmUndev}
              style={{ top: `${box.top * 100}%`, left: `${box.left * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div className={styles.filmCopy}>
        <p className={styles.filmText}>{text}</p>
      </div>
    </section>
  );
}
