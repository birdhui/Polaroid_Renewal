import { useEffect, useRef, useState } from 'react';
import choosePrint from '@/assets/film/film-choose-print.png';
import birthdayPrint from '@/assets/film/film-story-birthday.png';
import cameraPrint from '@/assets/film/loader-prints/camera.png';
import cakePrint from '@/assets/film/loader-prints/cake.png';
import friendsPrint from '@/assets/film/loader-prints/friends.png';
import familyPrint from '@/assets/film/loader-prints/family.png';
import pizzaPrint from '@/assets/film/loader-prints/pizza.png';
import brothersPrint from '@/assets/film/loader-prints/brothers.png';
import boardGamePrint from '@/assets/film/loader-prints/board-game.png';
import puppyPrint from '@/assets/film/loader-prints/puppy.png';
import FilmFaqSection from './components/FilmFaqSection.jsx';
import FilmGoSection from './components/FilmGoSection.jsx';
import FilmITypeSection from './components/FilmITypeSection.jsx';
import FilmNovemberRecapSection from './components/FilmNovemberRecapSection.jsx';
import styles from './FilmPage.module.css';

import titlePrint from '@/assets/film/film-intro-black-print.png';
import titleHandwriting from '@/assets/film/film-intro-handwriting.png';
import titleDate from '@/assets/film/film-intro-handwritten-date.png';

const loaderPrints = [cameraPrint, pizzaPrint, boardGamePrint, cakePrint, familyPrint, puppyPrint, brothersPrint, friendsPrint];

function IntroPrintArtwork() {
  return (
    <>
      <img className={styles.printArtwork} src={titlePrint} alt="" width={363} height={453} decoding="async" />
      <img className={styles.printHandwriting} src={titleHandwriting} alt="" width={77} height={32} />
      <img className={styles.printDate} src={titleDate} alt="" width={81} height={27} />
    </>
  );
}

function FilmIntroReveal({ started, onComplete }) {
  return (
    <div className={styles.introReveal} data-started={started} style={{ '--frame-count': loaderPrints.length }}>
      <div className={styles.loaderCopy}>
        <p className={styles.loaderHeading} lang="en">Choose ur Film.</p>
        <p className={styles.loaderDescription} lang="ko">
          <span>같은 장면도 어떤 필름에 담느냐에 따라 달라집니다.</span>
          <span>일상에 어울리는 당신만의 프레임을 찾아보세요.</span>
        </p>
      </div>
      <h1 className={styles.filmTitle} lang="en">
        <span className={styles.revealWord}>Polaroid</span>
        <span className={styles.brackets} aria-hidden="true">
          <span className={styles.bracketGlyph}>(</span>
          <span className={styles.bracketGlyph}>)</span>
          <span className={styles.recapFlash}>
            {loaderPrints.map((print, index) => (
              <img key={print} className={styles.recapFrame} src={print} alt="" width={414} height={519} style={{ '--frame-index': index }} />
            ))}
          </span>
          <span className={styles.loaderStar}><span /></span>
          <span className={styles.loaderProgress} />
        </span>
        <span className={styles.revealWord}>Film</span>
      </h1>
      <div className={styles.introPrint} data-story-source onAnimationEnd={onComplete} role="img" aria-label="서로 안고 웃는 두 아이와 손글씨가 담긴 검은 폴라로이드 인화 사진"><IntroPrintArtwork /></div>
    </div>
  );
}

const storyLines = [
  ['We take pictures to remember how it felt'],
  ['to be there', 'children', 'with the people we love.'],
  ['On Polaroid film, these moments', 'birthday', 'live on'],
  ['in prints we can hold, share, and return to.'],
].map(line => line.flatMap(part => part.split(' ')));

const clampProgress = value => Math.min(1, Math.max(0, value));

function introScrollDistance(stage) {
  return Math.round(stage.clientHeight * 0.65);
}

function FilmStory({ stockSequenceRef }) {
  const [introStarted, setIntroStarted] = useState(false);
  const introComplete = useRef(false);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const slotRef = useRef(null);
  const movingRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const source = stage.querySelector('[data-story-source]');
    const slot = slotRef.current;
    const moving = movingRef.current;
    let frame = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function isLocked() {
      return !introComplete.current && !reducedMotion.matches &&
        section.getBoundingClientRect().top <= 1;
    }

    function preventScroll(event) {
      if (isLocked()) event.preventDefault();
    }

    function preventScrollKey(event) {
      if ([' ', 'PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        preventScroll(event);
      }
    }

    function update() {
      frame = null;
      if (isLocked()) {
        const top = section.getBoundingClientRect().top;
        if (Math.abs(top) > 1) window.scrollTo({ top: window.scrollY + top, behavior: 'instant' });
        setIntroStarted(true);
        return;
      }
      const introDistance = reducedMotion.matches ? 0 : introScrollDistance(stage);
      const scrollDistance = -section.getBoundingClientRect().top;
      if (introDistance > 0) {
        stage.style.setProperty('--intro-open', clampProgress(scrollDistance / introDistance));
      }
      const distance = scrollDistance - introDistance;
      const storyDistance = stage.clientHeight * 4.85;
      const transitionDistance = Math.max(1, section.offsetHeight - stage.offsetHeight - storyDistance - introDistance);
      const progress = clampProgress(distance / Math.max(1, storyDistance));
      const transition = clampProgress((distance - storyDistance) / transitionDistance);
      stage.style.setProperty('--stock-transition', transition);
      const goReveal = clampProgress((transition - 0.58) / 0.3);
      stockSequenceRef.current?.style.setProperty('--go-reveal', goReveal);
      const travelStart = 0.2054;
      const travelEnd = 0.3397;
      const wordsResume = 0.3543;
      const travel = clampProgress((progress - travelStart) / (travelEnd - travelStart));
      const showOpening = progress >= 0.107;
      stage.dataset.showOpening = showOpening;
      const remainingProgress = clampProgress((progress - wordsResume) / (1 - wordsResume));
      stage.style.setProperty('--story-word-progress', 13.5 + remainingProgress * 25.5);
      stage.style.setProperty('--story-opening-shift', showOpening ? 1 - travel : 0);
      const eased = travel * travel * (3 - 2 * travel);
      stage.style.setProperty('--story-progress', progress);
      stage.style.setProperty('--print-travel', travel);
      stage.style.setProperty('--story-source-visibility', travel > 0 ? 'hidden' : 'visible');
      moving.hidden = travel === 0 || travel === 1;
      if (moving.hidden) return;

      const stageRect = stage.getBoundingClientRect();
      const sourceParent = source.offsetParent.getBoundingClientRect();
      const target = slot.getBoundingClientRect();
      const startX = sourceParent.left + source.offsetLeft;
      const startY = sourceParent.top + source.offsetTop;
      moving.style.left = startX - stageRect.left + (target.left - startX) * eased + 'px';
      const width = source.offsetWidth + (target.width - source.offsetWidth) * eased;
      const fullHeight = width * source.offsetHeight / source.offsetWidth;
      const crop = clampProgress((travel - 0.42) / 0.58);
      const cropEase = crop * crop * (3 - 2 * crop);
      moving.style.setProperty('--print-crop', cropEase);
      const height = fullHeight + (width * target.height / target.width - fullHeight) * cropEase;
      const startCenter = startY + source.offsetHeight / 2;
      const targetCenter = target.top + target.height / 2;
      const center = startCenter + (targetCenter - startCenter) * eased;
      moving.style.top = center - stageRect.top - height / 2 + 'px';
      moving.style.width = width + 'px';
      moving.style.height = height + 'px';
    }

    function schedule() {
      if (frame === null) frame = requestAnimationFrame(update);
    }

    const anchor = document.getElementById(window.location.hash.slice(1));
    if (anchor && anchor !== section && anchor.closest('main') === section.closest('main')) {
      introComplete.current = true;
      stage.dataset.introSettled = 'true';
    }
    update();
    document.fonts.ready.then(() => {
      if (section.isConnected) schedule();
    });
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventScrollKey);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', preventScrollKey);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  function finishIntro() {
    if (introComplete.current) return;
    introComplete.current = true;
    const stage = stageRef.current;
    stage.style.setProperty('--intro-open', 1);
    stage.dataset.introSettled = 'true';
    window.scrollTo({ top: window.scrollY + introScrollDistance(stage), behavior: 'instant' });
  }

  let wordIndex = 0;
  return (
    <section className={styles.intro} id="film-intro-title" aria-label="Polaroid Film" ref={sectionRef}>
      <div className={styles.storyStage} ref={stageRef}>
        <div className={styles.stockTransition} aria-hidden="true" />
        <div className={styles.layout}>
          <FilmIntroReveal started={introStarted} onComplete={finishIntro} />
        </div>
        <div className={styles.storyText} lang="en">
          {storyLines.map(line => (
            <p className={styles.storyLine} key={line.join(' ')}>
              {line.map((word, index) => {
                const order = wordIndex++;
                const photo = word === 'children' || word === 'birthday';
                return (
                  <span className={styles.storyToken} key={index}>{index > 0 && ' '}
                    {photo ? (
                      <span
                        className={styles.storyPhoto}
                        data-photo={word}
                        ref={word === 'children' ? slotRef : undefined}
                        style={{ '--word-index': order }}
                      >
                        <img src={word === 'children' ? choosePrint : birthdayPrint} alt="" />
                      </span>
                    ) : <span className={styles.storyWord} data-opening={order < 11 || undefined} style={{ '--word-index': order }}>{word}</span>}
                  </span>
                );
              })}
            </p>
          ))}
        </div>
        <div className={styles.movingPrint} ref={movingRef} aria-hidden="true" hidden>
          <div className={styles.movingFull}><IntroPrintArtwork /></div>
        </div>
      </div>
    </section>
  );
}

export default function FilmPage() {
  const stockSequenceRef = useRef(null);

  return (
    <>
      <FilmStory stockSequenceRef={stockSequenceRef} />
      <div className={styles.stockSequence} ref={stockSequenceRef}>
        <div className={styles.stockBackdrop} aria-hidden="true" />
        <FilmGoSection />
        <FilmITypeSection />
        <FilmNovemberRecapSection />
        <FilmFaqSection />
      </div>
    </>
  );
}
