import aquaPhoto from '@/assets/film/film-aqua-tide-photo.png';
import { useEffect, useRef } from 'react';
import accordionPlayer from '@/assets/film/film-choose-accordion-player.png';
import midnightPhoto from '@/assets/film/film-midnight-black-photo.png';
import sunflowerPhoto from '@/assets/film/film-sunflower-yellow-photo.png';
import FocusTitle from './FocusTitle.jsx';
import styles from './FilmClassicWhiteSection.module.css';

const frames = [
  { name: ['Classic', 'White'] },
  {
    name: ['Midnight', 'Black'],
    color: '#19171B',
    photo: {
      src: midnightPhoto,
      alt: '빗물 맺힌 자동차 앞유리에 하트와 글씨가 그려진 사진',
      width: 2782,
      height: 2782,
      crop: { left: '-29.1%', top: '-18.35%', width: '158.2%', height: '154.6%' },
    },
  },
  {
    name: ['Sunflower', 'Yellow'],
    color: '#E9B83E',
    photo: {
      src: sunflowerPhoto,
      alt: '카페에서 책을 든 사람과 커피, 크루아상',
      width: 2632,
      height: 2832,
      crop: { left: '-31.62%', top: '-18.58%', width: '151.88%', height: '152.09%' },
    },
  },
  {
    name: ['Aqua', 'Tide'],
    color: 'linear-gradient(to top right, #E9B83E, #A6C181, #5AA8B8)',
    photo: {
      src: aquaPhoto,
      alt: '해 질 무렵 호숫가 나무 데크에 서 있는 두 사람과 반려견',
      width: 2744,
      height: 2774,
      crop: { left: '-29.67%', top: '-19.90%', width: '159.63%', height: '161.37%' },
    },
  },
];

export default function FilmClassicWhiteSection() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    let frame = null;

    function update() {
      frame = null;
      const distance = section.offsetHeight - stage.offsetHeight;
      const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / Math.max(1, distance)));
      stage.style.setProperty('--frame-position', progress * (frames.length + 1) - 1);
    }

    function scheduleUpdate() {
      if (frame === null) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className={styles.section} id="film-frame-colors" ref={sectionRef} aria-labelledby="film-classic-white-title">
      <h2 className={styles.visuallyHidden} id="film-classic-white-title" lang="en">Choose your Polaroid Film</h2>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.composition}>
          <div className={styles.scene}>
            <div className={styles.photo}>
              <img
                className={styles.print}
                src={accordionPlayer}
                alt="아코디언을 연주하는 사람이 담긴 흑백 사진"
                width={2468}
                height={2740}
              />
              {frames.map(({ name, photo }, index) => photo && (
                <div className={styles.photoLayer} key={name[0]} data-final={index === frames.length - 1 || undefined} style={{ '--frame-index': index }}>
                  <div className={styles.photoWindow}>
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      style={photo.crop}
                    />
                  </div>
                </div>
              ))}
              {frames.slice(1).map(({ name, color }, index) => (
                <div
                  aria-hidden="true"
                  className={styles.tint}
                  key={name[0]}
                  style={{ '--frame-index': index + 1, '--frame-color': color }}
                >
                  <div className={styles.paper} />
                </div>
              ))}
            </div>
            <ul className={styles.labels} lang="en">
              {[{ name: ['Polaroid', 'Film'] }, ...frames].map(({ name }, index) => {
                const title = (
                  <>
                    {index === 0 && <span className={styles.lead}>Choose your </span>}
                    <span className={styles.leftWord}>{name[0]}</span>{' '}
                    <span className={styles.openBracket} aria-hidden="true">(</span>
                    <span className={styles.closeBracket} aria-hidden="true">)</span>{' '}
                    <span className={styles.rightWord}>{name[1]}</span>
                  </>
                );

                return (
                  <li className={styles.label} key={name[0]} style={{ '--frame-index': index - 1 }}>
                    {index === 0 ? (
                      <FocusTitle as="div" className={styles.introFocus}>
                        <span>{title}</span>
                      </FocusTitle>
                    ) : title}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
