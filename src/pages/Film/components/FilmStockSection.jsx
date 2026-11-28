import { useEffect, useRef, useState } from 'react';
import arrowDown from '@/assets/film/go/arrow-down.svg';
import arrowLeft from '@/assets/film/go/arrow-left.svg';
import arrowRight from '@/assets/film/go/arrow-right.svg';
import arrowUp from '@/assets/film/go/arrow-up.svg';
import FilmStockLettering from './FilmStockLettering.jsx';
import FocusTitle from './FocusTitle.jsx';
import styles from './FilmStockSection.module.css';

function DimensionMark({ asset: [src, width, height] }) {
  return (
    <img
      src={src}
      alt=""
      style={{
        width: `calc(var(--film-unit) * ${width})`,
        height: `calc(var(--film-unit) * ${height})`,
      }}
    />
  );
}

export function Dimensions({ dimensions, vertical = false }) {
  const listRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.IntersectionObserver) {
      setVisible(true);
      return;
    }

    const entryThreshold = 0.25;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        setVisible(false);
      } else if (entry.intersectionRatio >= entryThreshold) {
        setVisible(true);
      }
    }, { threshold: [0, entryThreshold] });

    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, []);

  const start = vertical ? [arrowUp, 10, 8] : [arrowLeft, 8, 10];
  const end = vertical ? [arrowDown, 10, 8] : [arrowRight, 8, 10];

  return (
    <ul className={vertical ? styles.vertical : styles.horizontal} ref={listRef} data-dimensions-visible={visible}>
      {dimensions.map(({ value, label, size, before, after }) => (
        <li className={styles.dimension} key={value} aria-label={`${label} ${value}`}>
          <div className={styles.mark} style={{ '--line-length': before }}>
            <DimensionMark asset={start} />
            <span className={styles.track} />
          </div>
          <span className={styles.valueSlot} style={{ inlineSize: `${size / 16}em` }}>
            <span className={styles.value}>{value}</span>
          </span>
          <div className={styles.mark} style={{ '--line-length': after }}>
            <span className={styles.track} />
            <DimensionMark asset={end} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function FilmStockSection({ stock }) {
  const { id, name, selection, lettering, photo, caption, cameras, kind, vertical, horizontal } = stock;
  const [captionLead, captionEmphasis, captionPunctuation] = caption;
  const titleId = `film-${id}-title`;

  return (
    <section className={styles.section} data-film-stock={id} aria-labelledby={titleId}>
      <div className={styles.stage}>
        <figure className={styles.artwork}>
          <FilmStockLettering stockId={id} lettering={lettering} />
          <div className={styles.photo}>
            <img {...photo} loading="lazy" decoding="async" />
          </div>
          <Dimensions dimensions={vertical} vertical />
          <Dimensions dimensions={horizontal} />
          <figcaption className={styles.caption}>
            {captionLead}<br />
            <strong>{captionEmphasis}</strong>{captionPunctuation}
          </figcaption>
        </figure>
        <div className={styles.details}>
          <span className={styles.selection} lang="en">{selection}</span>
          <FocusTitle as="h2" className={styles.title} id={titleId} lang="en">
            <span>Polaroid Film</span>{' '}
            <span>{name}</span>
          </FocusTitle>
          <dl className={styles.specs}>
            <div className={styles.spec}>
              <dt>호환 카메라</dt>
              <dd lang="en">
                <ul>
                  {cameras.map(camera => <li key={camera}>{camera}</li>)}
                </ul>
              </dd>
            </div>
            <div className={styles.spec}>
              <dt>종류</dt>
              <dd lang="en">{kind}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
