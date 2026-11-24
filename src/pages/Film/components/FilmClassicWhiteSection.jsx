import aquaPhoto from '@/assets/film/film-aqua-tide-photo.png';
import { useEffect, useRef, useState } from 'react';
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

const introName = ['Polaroid', 'Film'];
const scrambleDuration = 900;

function ScrambleWord({ word }) {
  const [step, setStep] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 18 : 0,
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const startedAt = performance.now();
    let animationFrame;

    function tick(now) {
      const nextStep = Math.min(18, Math.floor((now - startedAt) / (scrambleDuration / 18)));
      setStep(nextStep);
      if (nextStep < 18) animationFrame = requestAnimationFrame(tick);
    }

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const settledLength = Math.floor((step / 18) * word.length);
  const scrambled = [...word].map((letter, index) => {
    if (index < settledLength) return letter;

    // Keep capitalization and refresh the unsettled letters on each step.
    const offset = 1 + ((step * 11 + index * 7) % 25);
    const base = index === 0 ? 65 : 97;
    return String.fromCharCode(base + (letter.charCodeAt(0) - base + offset) % 26);
  }).join('');

  return (
    <span className={styles.scrambleWord}>
      <span className={styles.wordWidth} aria-hidden="true">{word}</span>
      <span className={styles.scrambleLetters} aria-hidden="true">{scrambled}</span>
    </span>
  );
}

export default function FilmClassicWhiteSection() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    let frame = null;

    function update() {
      frame = null;
      const distance = section.offsetHeight - stage.offsetHeight;
      const progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / Math.max(1, distance)));
      const position = progress * (frames.length + 1) - 1;
      stage.style.setProperty('--frame-position', position);
      setActiveIndex(Math.min(frames.length - 1, Math.floor(position + 0.02)));
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
                <div className={styles.photoLayer} key={name[0]} style={{ '--frame-index': index }}>
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
            <div className={styles.labels} lang="en">
              <span className={styles.visuallyHidden}>
                {activeIndex < 0 ? 'Choose your Polaroid Film' : frames[activeIndex].name.join(' ')}
              </span>
              <div className={styles.label} aria-hidden="true" key={activeIndex}>
                {activeIndex < 0 ? (
                  <FocusTitle as="div" className={styles.introFocus}>
                    <span>
                      <span className={styles.leftWord}>
                        <span className={styles.lead}>Choose your </span>
                        {introName[0]}
                      </span>
                      <span className={styles.rightWord}>{introName[1]}</span>
                    </span>
                  </FocusTitle>
                ) : (
                  <>
                    <span className={styles.leftWord}><ScrambleWord word={frames[activeIndex].name[0]} /></span>
                    <span className={styles.rightWord}><ScrambleWord word={frames[activeIndex].name[1]} /></span>
                  </>
                )}
              </div>
              <span className={styles.openBracket} aria-hidden="true">(</span>
              <span className={styles.closeBracket} aria-hidden="true">)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
