import { useEffect, useRef, useState } from 'react';
import styles from '../CameraNowPage.module.css';

/**
 * 4. 결과물 (instax mini13 'Colorful moment, feel so good!' 구성)
 * 섹션이 화면에 고정된 동안(1400px) 스크롤할수록 인화 사진 26장이 순서(k)대로 떠오른다.
 * 사진마다 opacity 0→1, 아래 60px→0, 0.92→1 배, 감속(quad out). 진행률은 부드럽게 따라간다(scrub).
 * 문구는 화면 아래 10% 지점에 닿을 때 글자마다 한 번 튀어 오른다.
 * 사진: Flickr LibraryTroll 'Polaroid Now (Gen 2)' 앨범 (x·y: 화면 %, w: vw, k: 나타나는 순서)
 */
const FLICKR_ALBUM = 'https://www.flickr.com/photos/130994751@N04/albums/72177720309162493';
const PRINTS = [
  { id: '52984219731', secret: 'aff9b3ca4c', x: 5, y: 12, w: 11.7, k: 6 },
  { id: '52984594680', secret: 'a172f6eb8e', x: 19, y: 9, w: 10.4, k: 17 },
  { id: '52984678368', secret: 'eae2a7fb1f', x: 33, y: 14, w: 13.0, k: 1 },
  { id: '52983618662', secret: '57f8765e8f', x: 49, y: 8, w: 11.1, k: 12 },
  { id: '52984594925', secret: '0140bde25e', x: 64, y: 13, w: 12.3, k: 23 },
  { id: '52984220146', secret: 'd12370ff18', x: 79, y: 9, w: 10.4, k: 4 },
  { id: '52983619497', secret: '4c54333bcb', x: 94, y: 13, w: 11.7, k: 19 },
  { id: '52984220751', secret: '9849eef6a5', x: 9, y: 38, w: 13.0, k: 10 },
  { id: '52984594325', secret: '9a8eefb015', x: 23, y: 35, w: 10.4, k: 25 },
  { id: '52983618267', secret: '01e30e35f9', x: 77, y: 36, w: 11.7, k: 0 },
  { id: '52984220951', secret: 'e8576a6fba', x: 92, y: 40, w: 11.1, k: 15 },
  { id: '52984221946', secret: 'b95e98f602', x: 6, y: 64, w: 11.1, k: 8 },
  { id: '52984596930', secret: '4428259c69', x: 21, y: 62, w: 13.0, k: 21 },
  { id: '52984680588', secret: '0f0c1c805b', x: 80, y: 63, w: 13.0, k: 3 },
  { id: '52984679673', secret: '02bc726817', x: 94, y: 66, w: 10.4, k: 13 },
  { id: '52984367629', secret: '3406d1e280', x: 4, y: 89, w: 11.7, k: 20 },
  { id: '52983620212', secret: 'e6bba45084', x: 18, y: 90, w: 10.4, k: 7 },
  { id: '53023177804', secret: 'd642c1991e', x: 33, y: 87, w: 12.3, k: 16 },
  { id: '53114190318', secret: '9320ab3bb4', x: 48, y: 92, w: 10.4, k: 24 },
  { id: '53114190008', secret: '38d145b5cc', x: 63, y: 88, w: 13.0, k: 2 },
  { id: '53113692426', secret: 'c9f092951e', x: 78, y: 91, w: 11.1, k: 11 },
  { id: '53113692346', secret: '327e8c7228', x: 93, y: 88, w: 11.7, k: 22 },
  { id: '53505277415', secret: 'fefcffe7e2', x: 35, y: 31, w: 9.1, k: 9 },
  { id: '53503967652', secret: 'e1dbc7fac4', x: 65, y: 30, w: 9.8, k: 18 },
  { id: '53980809093', secret: 'c74d3c2dd7', x: 37, y: 72, w: 9.8, k: 5 },
  { id: '53241811078', secret: 'af509f53d9', x: 62, y: 73, w: 9.1, k: 14 }
];
const TITLE_LINES = ['Snap it now,', 'hold it forever!'];

/** 문구를 단어·글자 단위로 쪼갠다. 글자마다 등장 지연(--d)을 0~0.6초로 나눠 준다. */
function BounceTitle({ id, className }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const total = TITLE_LINES.join('').replace(/\s/g, '').length;

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
    <h2 id={id} ref={ref} className={`${className} ${inView ? styles.isIn : ''}`} aria-label={TITLE_LINES.join(' ')}>
      {TITLE_LINES.map((line, li) => (
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

export default function NowResults({ reducedMotion }) {
  const secRef = useRef(null);
  const printRefs = useRef([]);

  useEffect(() => {
    const sec = secRef.current;
    const prints = printRefs.current.filter(Boolean);
    if (!sec) return undefined;
    if (reducedMotion) {
      prints.forEach((el) => {
        el.style.opacity = '';
        el.style.transform = '';
      });
      return undefined;
    }
    const step = 1 / (PRINTS.length + 3);
    const dur = step * 4;
    const outQuad = (t) => 1 - (1 - t) * (1 - t);
    let shown = 0;
    let raf = 0;
    let visible = false;

    const target = () => {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - window.innerHeight;
      return Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    };
    const draw = (p) =>
      prints.forEach((el, i) => {
        const t = outQuad(Math.min(1, Math.max(0, (p - PRINTS[i].k * step) / dur)));
        el.style.opacity = t.toFixed(3);
        el.style.transform = `translateY(${(60 * (1 - t)).toFixed(1)}px) scale(${(0.92 + 0.08 * t).toFixed(4)})`;
      });
    const loop = () => {
      raf = 0;
      const p = target();
      shown += (p - shown) * 0.14; // scrub: 살짝 늦게 따라간다
      if (Math.abs(p - shown) < 0.0005) shown = p;
      draw(shown);
      if (visible || shown !== p) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(sec);
    shown = target();
    draw(shown);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <section ref={secRef} className={styles.results} aria-labelledby="now-results-title">
      <div className={styles.resultsStage}>
        <BounceTitle id="now-results-title" className={styles.resultsTitle} />
        <div className={styles.prints} role="img" aria-label="Polaroid Now로 찍은 인화 사진 26장이 화면을 채운 모습">
          {PRINTS.map((p, i) => (
            <img
              key={p.id}
              ref={(el) => {
                printRefs.current[i] = el;
              }}
              className={styles.print}
              style={{ '--x': `${p.x}%`, '--y': `${p.y}%`, '--w': `${p.w}vw` }}
              src={`https://live.staticflickr.com/65535/${p.id}_${p.secret}_z.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
        <p className={styles.resultsCredit}>
          Photos:{' '}
          <a href={FLICKR_ALBUM} target="_blank" rel="noopener noreferrer">
            LibraryTroll / Flickr
          </a>
        </p>
      </div>
    </section>
  );
}
