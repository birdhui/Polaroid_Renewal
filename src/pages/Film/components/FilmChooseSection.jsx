import accordionPlayer from '@/assets/film/film-choose-accordion-player.png';
import FocusTitle from './FocusTitle.jsx';
import styles from './FilmChooseSection.module.css';

export default function FilmChooseSection() {
  return (
    <section className={styles.section} aria-labelledby="film-choose-title" lang="en">
      <div className={styles.composition}>
        <div className={styles.scene}>
          <h2 className={styles.title} id="film-choose-title">
            <span className={styles.lead}>Choose your</span>{' '}
            <FocusTitle as="span" className={styles.text}>
              <span className={styles.line}>
                <span>Polaroid</span>{' '}
                <span className={styles.brackets} aria-hidden="true">
                  <span>(</span>
                  <span>)</span>
                </span>{' '}
                <span>Film</span>
              </span>
            </FocusTitle>
          </h2>
          <img
            className={styles.photo}
            src={accordionPlayer}
            alt="거리에서 아코디언을 연주하는 사람이 담긴 흑백 폴라로이드 사진"
            lang="ko"
            width={2468}
            height={2740}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
