import arrowDown from '@/assets/film/go/arrow-down.svg';
import arrowLeft from '@/assets/film/go/arrow-left.svg';
import arrowRight from '@/assets/film/go/arrow-right.svg';
import arrowUp from '@/assets/film/go/arrow-up.svg';
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

function Dimensions({ dimensions, vertical = false }) {
  const start = vertical ? [arrowUp, 10, 8] : [arrowLeft, 8, 10];
  const end = vertical ? [arrowDown, 10, 8] : [arrowRight, 8, 10];

  return (
    <ul className={vertical ? styles.vertical : styles.horizontal}>
      {dimensions.map(({ value, label, size, before, after }) => (
        <li className={styles.dimension} key={value} aria-label={`${label} ${value}`}>
          <div className={styles.mark}>
            <DimensionMark asset={start} />
            <span className={styles.track} style={{ '--line-length': before }} />
          </div>
          <span className={styles.valueSlot} style={{ inlineSize: `${size / 16}em` }}>
            <span className={styles.value}>{value}</span>
          </span>
          <div className={styles.mark}>
            <span className={styles.track} style={{ '--line-length': after }} />
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
          <div className={styles.lettering}>
            <img {...lettering} alt="" loading="lazy" decoding="async" />
          </div>
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
