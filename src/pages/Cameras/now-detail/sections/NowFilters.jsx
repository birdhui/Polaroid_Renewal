import { useEffect, useRef, useState } from 'react';
import starburstImage from '@/assets/cameras/now/filters/now-filter-starburst.webp';
import redVignetteImage from '@/assets/cameras/now/filters/now-filter-red-vignette.webp';
import orangeImage from '@/assets/cameras/now/filters/now-filter-orange.webp';
import yellowImage from '@/assets/cameras/now/filters/now-filter-yellow.webp';
import blueImage from '@/assets/cameras/now/filters/now-filter-blue.webp';
import styles from '../CameraNowPage.module.css';

/**
 * 5. 모델 고유 기능 캐러셀 (상세페이지 공통 틀 — Now: 필터, Now+: 앱 크리에이티브 모드 …)
 * 원판(탭)을 누르면 인화 사진이 옆으로 넘어가며 그 항목 사진이 나온다. 누른 탭은 가운데로 온다.
 * 항목이 고리처럼 이어져 양 끝에서도 계속 넘어간다. ←/→·Home·End 키, 사진 좌우 끌기도 지원.
 * 기본값은 Now 필터 세트(polaroid.com Now & Now+ Filter Set)다.
 */
const FILTERS = [
  { key: 'starburst', name: 'Starburst', color: '#ECEEF0', disc: styles.filterDiscStarburst, src: starburstImage, alt: '기타를 치는 두 사람 사이로 빛줄기가 별 모양으로 퍼진' },
  { key: 'red-vignette', name: 'Red Vignette', color: '#EF5A4A', disc: styles.filterDiscRedVignette, src: redVignetteImage, alt: '야자수 아래 웃는 두 사람의 가장자리가 붉게 물든' },
  { key: 'orange', name: 'Orange', color: '#F59A3C', disc: styles.filterDiscOrange, src: orangeImage, alt: '주황빛 벽 앞에 선 인물이 온통 주황색으로 찍힌' },
  { key: 'yellow', name: 'Yellow', color: '#F2DC5D', disc: styles.filterDiscYellow, src: yellowImage, alt: '야자수 그림자 아래 춤추는 인물이 노랗게 찍힌' },
  { key: 'blue', name: 'Blue', color: '#6FA8DC', disc: styles.filterDiscBlue, src: blueImage, alt: '파란 하늘 아래 두 손을 머리에 올린 인물이 푸르게 찍힌' },
];
const NOW_TEXT =
  "The world is your laboratory and the filters are your test tubes. Pull up your sleeves and start experimenting with starburst, red vignette, orange, blue, and yellow effects with your Polaroid Now or Now+ Generation 3 camera. And when you're done protect your lens with included lens cap. See the world through different colored glasses. Not compatible with Polaroid Now Generation 1 or 2 Cameras.";

/**
 * @param {object} props
 * @param {Array<{key:string,name:string,color:string,disc?:string,icon?:import('react').ReactNode,src:string,alt:string,desc?:string}>} props.items
 *        icon 이 있으면 원판 안에 그린다. desc 가 있으면 사진 아래 문구가 고른 항목의 설명으로 바뀐다.
 * @param {string} props.idPrefix 탭·사진 id 접두어
 * @param {string} props.tabsLabel 탭 목록 이름(스크린리더)
 * @param {string} props.altSuffix 사진 대체 문구 앞말 (예: '필터')
 * @param {string} [props.text] desc 가 없을 때 사진 아래 고정 문구
 */
function FilterCarousel({ items, idPrefix, tabsLabel, altSuffix, text }) {
  const N = items.length;
  const HALF = Math.floor(N / 2);
  /** 가운데(선택) 기준 칸 수: -2 … 2 */
  const wrap = (d) => ((((d % N) + N + HALF) % N) - HALF);
  const [active, setActive] = useState(0);
  // 고리를 돌아 반대편으로 건너가는 칸: 애니메이션 없이 옮기고(jump), 잠시 투명하게 둔다(hidden)
  const [jump, setJump] = useState(() => new Set());
  const [hidden, setHidden] = useState(() => new Set());
  const tabRefs = useRef([]);
  const focusAfter = useRef(false);
  const drag = useRef(null);

  const select = (next, focus = false) => {
    const i = ((next % N) + N) % N;
    if (i === active) return;
    const step = wrap(i - active);
    const jumped = new Set();
    for (let k = 0; k < N; k += 1) {
      if (wrap(k - i) !== wrap(k - active) - step) jumped.add(k);
    }
    focusAfter.current = focus;
    setJump(jumped);
    setHidden(jumped);
    setActive(i);
  };

  // 건너간 칸은 다음 화면에서부터 다시 애니메이션 대상이 되고, 움직이던 칸이 지나간 뒤 나타난다.
  useEffect(() => {
    if (focusAfter.current) tabRefs.current[active]?.focus({ preventScroll: true });
    focusAfter.current = false;
    if (!jump.size) return undefined;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setJump(new Set())));
    const t = setTimeout(() => setHidden(new Set()), 520);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [active, jump]);

  const onKeyDown = (e) => {
    const map = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: N - 1 };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key], true);
    }
  };

  const onPointerDown = (e) => {
    drag.current = e.clientX;
  };
  const onPointerEnd = (e) => {
    if (drag.current == null) return;
    const dx = e.clientX - drag.current;
    drag.current = null;
    if (Math.abs(dx) > 40) select(active + (dx < 0 ? 1 : -1));
  };

  const itemStyle = (k, extra) => ({
    '--o': wrap(k - active),
    ...(hidden.has(k) ? { opacity: 0 } : null),
    ...extra,
  });
  const itemClass = (base, k) => [base, jump.has(k) ? styles.noAnim : '', Math.abs(wrap(k - active)) >= 2 ? styles.isFar : ''].filter(Boolean).join(' ');

  return (
    <div className={`${styles.filterViewer} ${styles.rv}`}>
      <div
        className={styles.filterWindow}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerEnd}
        onPointerLeave={onPointerEnd}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {items.map((f, k) => {
          const on = k === active;
          return (
            <figure
              key={f.key}
              id={`${idPrefix}-print-${f.key}`}
              className={itemClass(styles.filterPrint, k)}
              style={itemStyle(k)}
              role="tabpanel"
              aria-labelledby={`${idPrefix}-tab-${f.key}`}
              aria-hidden={on ? undefined : 'true'}
              inert={on ? undefined : true}
            >
              <img src={f.src} alt={`${f.name} ${altSuffix}: ${f.alt} Polaroid 사진`} loading={k < 2 ? undefined : 'lazy'} draggable="false" />
              <figcaption>{f.name.toUpperCase()}</figcaption>
            </figure>
          );
        })}
      </div>

      <div className={styles.filterTabs} role="tablist" aria-label={tabsLabel} onKeyDown={onKeyDown}>
        {items.map((f, k) => {
          const on = k === active;
          return (
            <button
              key={f.key}
              ref={(el) => {
                tabRefs.current[k] = el;
              }}
              id={`${idPrefix}-tab-${f.key}`}
              className={itemClass(styles.filterTab, k)}
              style={itemStyle(k, { '--c': f.color })}
              type="button"
              role="tab"
              aria-controls={`${idPrefix}-print-${f.key}`}
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => select(k)}
            >
              <span className={`${styles.filterDisc} ${f.disc ?? ''}`} aria-hidden="true">
                {f.icon}
              </span>
              <span className={styles.filterName}>{f.name}</span>
            </button>
          );
        })}
      </div>

      {items[active].desc ? (
        <p className={styles.filtersText} aria-live="polite">
          {items[active].desc}
        </p>
      ) : (
        <p className={styles.filtersText}>{text}</p>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.idPrefix]
 * @param {string} [props.eyebrow]  노란 라벨
 * @param {string[]} [props.title]  제목 두 줄
 * @param {Array} [props.items]     캐러셀 항목 (FilterCarousel 참고)
 * @param {string} [props.tabsLabel]
 * @param {string} [props.altSuffix]
 * @param {string} [props.text]
 */
export default function NowFilters({
  idPrefix = 'filter',
  eyebrow = 'Polaroid NOW filter',
  title = ['See the world through', 'different colored glasses.'],
  items = FILTERS,
  tabsLabel = '필터 선택',
  altSuffix = '필터',
  text = NOW_TEXT,
}) {
  return (
    <section className={styles.filters} aria-labelledby={`${idPrefix}-section-title`}>
      <div className={`${styles.filtersHead} ${styles.rv}`}>
        <p className={styles.filtersEyebrow}>{eyebrow}</p>
        <h2 id={`${idPrefix}-section-title`}>
          {title[0]}
          <br />
          {title[1]}
        </h2>
      </div>
      <FilterCarousel items={items} idPrefix={idPrefix} tabsLabel={tabsLabel} altSuffix={altSuffix} text={text} />
    </section>
  );
}
