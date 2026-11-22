import { useEffect, useRef, useState } from 'react';
import introPhoto from '@/assets/film/film-intro-photo.png';
import styles from './FilmPage.module.css';

export default function FilmPage() {
  const titleRef = useRef(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasEnteredView(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });

    observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.intro} aria-labelledby="film-title">
      <div className={styles.stage}>
        <div className={styles.layout}>
          <div className={styles.copy}>
            <h1
              className={styles.title}
              data-focus={hasEnteredView || undefined}
              id="film-title"
              ref={titleRef}
            >
              <span className={styles.titleLine}>순간을 담는 방식,</span>{' '}
              <span className={styles.brand} lang="en">Polaroid Film.</span>
            </h1>
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
  );
}
