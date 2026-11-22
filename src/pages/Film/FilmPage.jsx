import FilmChooseSection from './components/FilmChooseSection.jsx';
import introPhoto from '@/assets/film/film-intro-photo.png';
import FocusTitle from './components/FocusTitle.jsx';
import FilmGoSection from './components/FilmGoSection.jsx';
import FilmITypeSection from './components/FilmITypeSection.jsx';
import styles from './FilmPage.module.css';

export default function FilmPage() {
  return (
    <>
      <section className={styles.intro} aria-labelledby="film-title">
        <div className={styles.stage}>
          <div className={styles.layout}>
            <div className={styles.copy}>
              <FocusTitle as="h1" className={styles.title} id="film-title" animateOnLoad>
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
              fetchPriority="high"
            />
          </div>
        </div>
      </section>
      <FilmGoSection />
      <FilmITypeSection />
      <FilmChooseSection />
    </>
  );
}
