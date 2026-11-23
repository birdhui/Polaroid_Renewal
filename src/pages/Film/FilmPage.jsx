import recapBackdrop from '@/assets/film/film-recap-background.png';
import faqBackdrop from '@/assets/film/faq-background.png';
import FilmChooseSection from './components/FilmChooseSection.jsx';
import FilmClassicWhiteSection from './components/FilmClassicWhiteSection.jsx';
import FilmNovemberRecapSection from './components/FilmNovemberRecapSection.jsx';
import introPhoto from '@/assets/film/film-intro-photo.png';
import heroPhoto from '@/assets/film/film-hero.png';
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
        <img
          className={styles.heroPhoto}
          src={heroPhoto}
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
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
            <img
              className={styles.photo}
              src={introPhoto}
              alt="노란 테이프로 붙인 흑백 거리 사진과 다른 프레임으로 보는 같은 순간이라는 손글씨"
              width={1084}
              height={1451}
              decoding="async"
              loading="lazy"
            />
          </div>
        </div>
      </section>
      <FilmGoSection />
      <FilmITypeSection />
      <FilmChooseSection />
      <div className={styles.recapSequence}>
        <div className={styles.recapBackdropFrame} aria-hidden="true">
          <div className={styles.recapBackdrop}>
            <img src={recapBackdrop} alt="" width={1920} height={1080} loading="lazy" />
            <img className={styles.faqBackdrop} src={faqBackdrop} alt="" width={1920} height={1080} loading="lazy" />
          </div>
        </div>
        <FilmClassicWhiteSection />
        <FilmNovemberRecapSection />
        <FilmFaqSection />
      </div>
    </>
  );
}
