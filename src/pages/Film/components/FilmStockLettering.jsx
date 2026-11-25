import { useEffect, useId, useRef, useState } from 'react';
import styles from './FilmStockSection.module.css';

// Stroke centers use the coordinate system of each original lettering image.
const writingTimeScale = 0.8;

const strokesByStock = {
  go: [
    ['M1074 226 C1129 105 1105 88 984 157 C789 270 589 453 577 576 C557 684 748 596 892 501 C954 459 1010 414 987 420 C934 427 858 445 813 461', 58, 0, 990],
    ['M996 421 C973 459 876 536 879 570 C885 579 959 536 1061 475', 49, 920, 360],
    ['M1089 465 C1058 456 1010 505 1014 535 C1016 557 1070 526 1093 502 C1112 482 1105 462 1089 465 C1105 472 1102 509 1177 501 C1241 494 1311 460 1395 437', 47, 1210, 580],
  ],
  'i-type': [
    ['M269 522 C333 489 412 414 462 341 C423 395 379 463 414 477 C449 489 504 454 552 425', 51, 0, 330],
    ['M495 269 L526 243', 48, 340, 95],
    ['M613 380 Q671 372 725 366', 39, 450, 110],
    ['M766 257 C863 186 1121 127 1220 127 C1266 124 1274 142 1239 172', 57, 590, 410],
    ['M1052 151 C981 249 817 410 800 468 C772 536 936 421 1067 335 C1026 375 1005 416 1036 420 C1087 421 1146 369 1194 325 C1168 382 1072 516 924 613 C929 585 1013 516 1102 464 C1203 407 1311 364 1386 290', 59, 1000, 680],
    ['M1385 291 C1320 367 1237 494 1178 570 C1219 512 1290 401 1377 345 C1481 278 1475 365 1363 416 C1403 415 1493 379 1552 365', 58, 1680, 590],
    ['M1550 366 C1593 350 1648 321 1651 293 C1638 257 1552 307 1543 352 C1532 409 1606 403 1703 378 C1822 346 1908 315 1978 292', 49, 2240, 550],
  ],
};

export default function FilmStockLettering({ stockId, lettering }) {
  const { src, width, height } = lettering;
  const maskId = useId();
  const artworkRef = useRef(null);
  const [phase, setPhase] = useState('waiting');
  const strokes = strokesByStock[stockId];

  useEffect(() => {
    const artwork = artworkRef.current;

    if (!window.IntersectionObserver) {
      setPhase('complete');
      return;
    }

    const entryThreshold = 0.2;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setPhase('waiting');
      } else if (entry.intersectionRatio >= entryThreshold) {
        setPhase(current => current === 'waiting' ? 'writing' : current);
      }
    }, { threshold: [0, entryThreshold] });

    observer.observe(artwork);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.lettering} ref={artworkRef} data-writing={phase} aria-hidden="true">
      <svg className={styles.ink} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            {strokes.map(([path, thickness, delay, duration], index) => (
              <path
                className={styles.stroke}
                d={path}
                key={path}
                pathLength="1"
                strokeWidth={thickness}
                style={{ animationDelay: `${delay * writingTimeScale}ms`, animationDuration: `${duration * writingTimeScale}ms` }}
                onAnimationEnd={index === strokes.length - 1 ? () => setPhase('complete') : undefined}
              />
            ))}
          </mask>
        </defs>
        <image className={styles.maskedInk} href={src} width={width} height={height} mask={`url(#${maskId})`} />
        <image className={styles.finishedInk} href={src} width={width} height={height} />
      </svg>
    </div>
  );
}
