import filmBackdrop from '@/assets/film/film-section-background.png';
import FilmClassicWhiteSection from './components/FilmClassicWhiteSection.jsx';
import FilmNovemberRecapSection from './components/FilmNovemberRecapSection.jsx';
import introLettering from '@/assets/film/film-intro-lettering.png';
import introPrint from '@/assets/film/film-intro-print.png';
import heroPoster from '@/assets/film/film-hero.png';
import heroVideo from '@/assets/film/film-hero.mp4';
import heroWordmark from '@/assets/film/film-hero-wordmark.svg';
import FocusTitle from './components/FocusTitle.jsx';
import FilmFaqSection from './components/FilmFaqSection.jsx';
import FilmGoSection from './components/FilmGoSection.jsx';
import FilmITypeSection from './components/FilmITypeSection.jsx';
import styles from './FilmPage.module.css';

export default function FilmPage() {
  return (
    <>
      <section className={styles.hero} aria-labelledby="film-title">
        <video
          className={styles.heroMedia}
          src={heroVideo}
          poster={heroPoster}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className={styles.heroIdentity}>
          <img
            className={styles.heroWordmark}
            src={heroWordmark}
            alt="Polaroid"
            width={464}
            height={127}
          />
          <h1 className={styles.heroTitle} id="film-title" lang="en">Instant Film</h1>
        </div>
      </section>
      <div className={styles.filmSequence}>
        <div className={styles.backdropFrame} aria-hidden="true">
          <img className={styles.backdrop} src={filmBackdrop} alt="" width={1920} height={1081} loading="lazy" />
        </div>
        <section className={styles.intro} aria-labelledby="film-intro-title">
          <div className={styles.stage}>
            <div className={styles.layout}>
              <div className={styles.copy}>
                <FocusTitle as="h2" className={styles.title} id="film-intro-title">
                  <span>순간을 담는 방식,</span>{' '}
                  <span className={styles.brand} lang="en">Polaroid Film.</span>
                </FocusTitle>
                <p className={styles.description}>
                  <span>같은 장면도 어떤 필름에 담느냐에 따라 달라집니다.</span>
                  <span>일상에 어울리는 당신만의 프레임을 찾아보세요.</span>
                </p>
              </div>
              <div className={styles.introArtwork}>
                <img src={introLettering} alt="" width={1085} height={1450} loading="lazy" decoding="async" />
                <img
                  className={styles.introPrint}
                  src={introPrint}
                  alt="노란 테이프로 붙인 흑백 거리 사진"
                  width={1192}
                  height={1320}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </section>
        <FilmGoSection />
        <FilmITypeSection />
        <FilmClassicWhiteSection />
        <FilmNovemberRecapSection />
        <FilmFaqSection />
      </div>
    </>
  );
}
