import calendar from '@/assets/film/film-recap-calendar.png';
import windowPhoto from '@/assets/film/film-recap-photo.png';
import styles from './FilmNovemberRecapSection.module.css';

export default function FilmNovemberRecapSection() {
  return (
    <section className={styles.section} aria-labelledby="film-recap-title">
      <h2 className={styles.visuallyHidden} id="film-recap-title" lang="en">11 November Recap</h2>
      <div className={styles.stage}>
        <figure className={styles.calendar}>
          <div className={styles.headingCrop}>
            <img src={calendar} alt="" width={1920} height={1080} loading="lazy" decoding="async" />
          </div>
          <div className={styles.gridCrop}>
            <img
              src={calendar}
              alt="11월 달력 격자와 날짜별로 담긴 필름 사진 모음"
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
            />
          </div>
          <img
            className={styles.photo}
            src={windowPhoto}
            alt="달력 위에 겹쳐진 창문이 담긴 흑백 폴라로이드 사진"
            width={829}
            height={1002}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>
    </section>
  );
}
