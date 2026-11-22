import backdrop from '@/assets/film/film-classic-white-background.png';
import accordionPlayer from '@/assets/film/film-choose-accordion-player.png';
import FocusTitle from './FocusTitle.jsx';
import styles from './FilmClassicWhiteSection.module.css';

export default function FilmClassicWhiteSection() {
  return (
    <section className={styles.section} aria-labelledby="film-classic-white-title">
      <img
        className={styles.backdrop}
        src={backdrop}
        alt=""
        width={1024}
        height={577}
        loading="lazy"
        decoding="async"
      />
      <div className={styles.composition}>
        <div className={styles.scene}>
          <div className={styles.photo}>
            <img
              src={accordionPlayer}
              alt="아코디언 연주 사진을 담은 클래식 화이트 폴라로이드 프레임"
              width={2468}
              height={2740}
              loading="lazy"
              decoding="async"
            />
          </div>
          <FocusTitle as="h2" className={styles.title} id="film-classic-white-title" lang="en">
            <span className={styles.line}>
              <span>Classic</span>{' '}
              <span>White</span>
            </span>
          </FocusTitle>
        </div>
      </div>
    </section>
  );
}
