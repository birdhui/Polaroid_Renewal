import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import introImage from '@/assets/film/studio/intro-interior.png';
import filmPrint from '@/assets/film/studio/film-print.png';
import building from '@/assets/film/studio/guide-building.png';
import { go } from './components/FilmGoSection.jsx';
import { iType } from './components/FilmITypeSection.jsx';
import { Dimensions } from './components/FilmStockSection.jsx';
import FilmStockLettering from './components/FilmStockLettering.jsx';
import FilmFaqSection from './components/FilmFaqSection.jsx';
import styles from './FilmPage.module.css';

const films = [
  {
    name: 'i-Type',
    label: 'For Modern Cameras',
    description: 'i-Type 필름은 지금의 폴라로이드 카메라를 위해 만든 기본 필름입니다. 카메라에 배터리가 들어 있어 필름 팩에는 배터리를 넣지 않았고, 그만큼 600 필름보다 가격 부담이 적습니다. 감도 ISO 640으로 실내와 야외 어디서나 무난하고, 컬러는 10~15분, 흑백은 5~10분이면 현상이 끝납니다. 클래식 화이트 외에 블랙 프레임, 컬러 프레임 에디션도 고를 수 있습니다. Now, Now+, Flip, Mod를 쓴다면 가장 먼저 고르면 되는 필름입니다.',
    cameras: 'Now, Now+, Flip, Mod, I-2',
    kind: 'Color, B&W',
    url: 'https://www.polaroid.com/en_us/film/itype-film',
  },
  {
    name: '600',
    label: 'For 600 Cameras',
    description: '600 필름은 1981년 Polaroid 600 카메라와 함께 나온 필름입니다. 필름 팩 안에 작은 배터리가 들어 있어, 배터리가 없는 빈티지 600 카메라에 전원을 공급합니다. 지금의 폴라로이드 카메라에서도 그대로 쓸 수 있고, 감도와 사진 크기는 i-Type과 같습니다. 빈티지 카메라와 새 카메라를 함께 쓰거나, 라운드 프레임처럼 600으로만 나오는 에디션을 써 보고 싶을 때 고르세요.',
    cameras: 'Now, Now+, Flip, Mod, I-2',
    kind: 'Color, B&W',
    frames: 'White, Round',
    url: 'https://www.polaroid.com/en_us/film/600-film',
  },
  {
    name: 'SX-70',
    label: 'For SX-70 Cameras',
    description: 'SX-70 필름은 1972년 SX-70 카메라와 함께 태어난 폴라로이드의 첫 일체형 필름 규격입니다. 감도가 ISO 160으로 600 필름의 약 4분의 1이라, 더 밝은 빛이나 긴 노출이 필요합니다. 그래서 노출을 직접 다룰 수 있는 카메라에 잘 맞고, 우리 라인업에서는 셔터와 조리개를 직접 정하는 I-2만 쓸 수 있습니다. 햇빛이 충분한 야외나, 삼각대를 세운 긴 노출 촬영에서 써 보세요.',
    cameras: 'I-2',
    kind: 'Color, B&W',
    frames: 'White',
    url: 'https://www.polaroid.com/en_us/film',
  },
  {
    name: 'Go',
    label: 'For Go Cameras',
    description: 'Go 필름은 폴라로이드 필름을 손바닥 크기로 줄인 필름입니다. 사진 영역은 47×46mm로 가로세로 모두 i-Type의 60% 정도지만, 같은 ISO 640 감도와 10~15분의 현상 과정을 그대로 거칩니다. 작아서 지갑이나 휴대폰 케이스에 꽂아 다니기 좋고, 클래식 화이트와 블랙 프레임 에디션이 있습니다. Go 카메라 전용이라 다른 카메라에는 쓸 수 없습니다.',
    cameras: 'Go',
    kind: 'Color',
    frames: 'White, Black',
    url: 'https://www.polaroid.com/en_us/film',
  },
];

function RevealLine({ children, lang, delay = 0 }) {
  return (
    <span className={styles.revealLine} lang={lang}>
      <span style={{ '--reveal-delay': delay + 'ms' }}>{children}</span>
    </span>
  );
}

function RevealParagraph({ children, observe = true, delay = 0 }) {
  const sourceRef = useRef(null);
  const [lines, setLines] = useState([]);

  useLayoutEffect(() => {
    const source = sourceRef.current;
    const text = source.firstChild;
    const range = document.createRange();

    function measureLines() {
      if (!source.isConnected) return;
      const nextLines = [];
      let previousTop;
      let offset = 0;
      for (const character of children) {
        range.setStart(text, offset);
        offset += character.length;
        range.setEnd(text, offset);
        const top = range.getBoundingClientRect().top;
        if (top !== previousTop) nextLines.push('');
        nextLines[nextLines.length - 1] += character;
        previousTop = top;
      }
      setLines(current => current.join('\n') === nextLines.join('\n') ? current : nextLines);
    }

    measureLines();
    const observer = new ResizeObserver(measureLines);
    observer.observe(source);
    document.fonts.ready.then(measureLines);
    return () => observer.disconnect();
  }, [children]);

  return (
    <p className={styles.revealParagraph} lang="ko" data-film-reveal={observe ? true : undefined}>
      <span ref={sourceRef} className={lines.length ? styles.paragraphSource : undefined}>{children}</span>
      {lines.length > 0 && (
        <span aria-hidden="true">
          {lines.map((line, index) => (
            <RevealLine key={index} delay={delay + index * 72}>{line.trimEnd()}</RevealLine>
          ))}
        </span>
      )}
    </p>
  );
}

function FilmIndex({ onSelect }) {
  const listRef = useRef(null);
  const [{ active, revision }, setPreview] = useState({ active: films[0], revision: 0 });

  useEffect(() => {
    const list = listRef.current;
    const motion = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    let previousIndex;
    let frame;

    function update() {
      frame = undefined;
      if (!motion.matches) {
        previousIndex = undefined;
        return;
      }

      // Change selection when a row reaches the sticky preview.
      const previewTop = window.innerHeight * 0.23;
      const index = films.findLastIndex((_, i) => list.children[i].getBoundingClientRect().top <= previewTop);
      const nextIndex = Math.max(0, index);
      if (nextIndex === previousIndex) return;
      previousIndex = nextIndex;
      setPreview(current => current.active === films[nextIndex] ? current
        : { active: films[nextIndex], revision: current.revision + 1 });
    }

    function schedule() {
      if (frame === undefined) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);
  const stock = active.name === 'Go' ? go : iType;
  const handwritten = active.name === 'i-Type' || active.name === 'Go';

  return (
    <section className={styles.index} id="film-types" aria-labelledby="film-types-title">
      <h2 className={styles.label} id="film-types-title" lang="en" data-film-reveal><RevealLine>01 &nbsp; The Films</RevealLine></h2>
      <ul ref={listRef} className={styles.filmList} lang="en">
        {films.map(film => (
          <li key={film.name} data-film-reveal>
            <button type="button" aria-pressed={active === film} aria-controls="film-type-preview film-guide"
              onPointerEnter={event => {
                if (event.pointerType !== 'mouse') return;
                setPreview(current => current.active === film ? current
                  : { active: film, revision: current.revision + 1 });
              }}
              onClick={event => {
                if (event.nativeEvent.pointerType === 'mouse') return;
                setPreview(current => ({ active: film, revision: current.revision + 1 }));
                onSelect(film);
              }}>
              <RevealLine>{film.name}</RevealLine>
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.filmExample} id="film-type-preview" aria-live="polite">
        <figure className={styles.filmFigure} key={revision}>
          <div className={styles.sample}>
            {handwritten && <FilmStockLettering stockId={stock.id} lettering={stock.lettering} />}
            <div className={styles.sampleCrop}><img src={filmPrint} alt="두 사람이 담긴 폴라로이드 인화 사진" /></div>
            <Dimensions dimensions={stock.vertical} vertical />
            <Dimensions dimensions={stock.horizontal} />
          </div>
          <figcaption lang="en">[ <span>{active.label}</span> ]</figcaption>
        </figure>
      </div>
    </section>
  );
}


function GuideCard({ film, pinned, active }) {
  return (
    <article className={styles.guideCard} data-guide-active={pinned ? active : undefined}
      data-film-reveal inert={pinned && !active ? true : undefined}>
      <h3 className={styles.guideTitle} lang="en"><RevealLine>{film.name} Film</RevealLine></h3>
      <RevealParagraph observe={false} delay={100}>{film.description}</RevealParagraph>
      <dl className={styles.specs}>
        <dt lang="ko">호환 카메라</dt><dd lang="en">{film.cameras}</dd>
        <dt lang="ko">종류</dt><dd lang="en">{film.kind}</dd>
        {film.frames && <><dt lang="ko">프레임</dt><dd lang="en">{film.frames}</dd></>}
      </dl>
      <a href={film.url} className={styles.buy}><span lang="en">{film.name} Film</span> 구매 ↗</a>
    </article>
  );
}

function FilmGuideSequence({ firstFilm }) {
  const sequenceRef = useRef(null);
  const stageRef = useRef(null);
  const [pinned, setPinned] = useState(false);
  const [step, setStep] = useState(-1);
  const firstIndex = films.indexOf(firstFilm);
  const guideFilms = [...films.slice(firstIndex), ...films.slice(0, firstIndex)];

  useLayoutEffect(() => {
    const sequence = sequenceRef.current;
    const stage = stageRef.current;
    const media = window.matchMedia('(min-width: 1200px) and (prefers-reduced-motion: no-preference)');
    let frame;

    function update() {
      frame = undefined;
      setPinned(media.matches);
      if (!media.matches) {
        setStep(-1);
        return;
      }

      const bounds = sequence.getBoundingClientRect();
      const distance = -bounds.top / Math.max(1, window.innerHeight);
      const shrink = Math.min(1, Math.max(0, (distance - 0.2) / 0.9));
      const exit = Math.min(1, Math.max(0, (distance - 0.22) / 0.35));
      stage.style.setProperty('--guide-distance', distance);
      const entry = Math.min(0, Math.max(-10, distance * 15));
      stage.style.setProperty('--guide-shrink', shrink * shrink * (3 - 2 * shrink));
      stage.style.setProperty('--development-opacity', 1 - exit);
      stage.style.setProperty('--development-entry', entry + '%');
      setStep(distance < 1.08 ? -1 : Math.min(films.length - 1, Math.floor((distance - 1.08) / 0.79)));
    }

    function schedule() {
      if (frame === undefined) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.guideSequence} ref={sequenceRef} data-guide-pinned={pinned}>
      <div className={styles.guideStage} ref={stageRef}>
        <section className={styles.development} aria-label="필름 현상 과정">
          <figure className={styles.developmentImage}>
            <img src={building} alt="" loading="lazy" />
          </figure>
          <div className={styles.developmentCopy} data-film-caption lang="ko" inert={pinned && step >= 0 ? true : undefined}>
            <RevealParagraph>셔터를 누른 뒤 몇 분, 한 장의 필름 안에서 사진이 완성됩니다.</RevealParagraph>
            <RevealParagraph delay={72}>사진이 카메라 밖으로 나오는 순간, 롤러가 아래쪽 테두리 속 현상액을 필름 전체에 고르게 펴 줍니다. 처음에는 빛을 막는 층 때문에 사진이 어둡게 보이지만, 몇 분에 걸쳐 그 층이 서서히 걷히며 색과 형태가 떠오릅니다. 이 시간 동안 필름은 빛과 온도에 가장 예민하니, 뒤집어 두고 흔들지 말고 기다려 주세요.</RevealParagraph>
          </div>
        </section>
        {pinned && (
          <div className={styles.guideImageStack} aria-hidden="true">
            {guideFilms.slice(1).map((film, index) => (
              <div className={styles.guideImageLayer} key={film.name} style={{ '--guide-layer': index }}>
                <div className={styles.guideImageShade} />
                <div className={styles.guideImageSlide}>
                  <div className={styles.guideImageCounter}>
                    <img src={building} alt="" loading="lazy" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <section className={styles.guide} id="film-guide" aria-labelledby="film-guide-title"
          inert={pinned && step < 0 ? true : undefined}>
          <div className={styles.guideCopy}>
            <h2 className={styles.label} id="film-guide-title" lang="en"><span>02</span> Film Guide</h2>
            <div className={styles.guideCards}>
              {guideFilms.map((film, index) => (
                <GuideCard key={film.name} film={film} pinned={pinned} active={step === index} />
              ))}
            </div>
          </div>
          {!pinned && <figure className={styles.guideImage}>
            <img src={building} alt="나무 사이로 보이는 건물 외관" loading="lazy" />
          </figure>}
        </section>
      </div>
    </div>
  );
}


export default function FilmPage() {
  const pageRef = useRef(null);
  const [guideFilm, setGuideFilm] = useState(films[0]);

  useEffect(() => {
    if (!window.IntersectionObserver) return;

    const page = pageRef.current;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = 'true';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -16% 0px' });

    const captionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.revealed = 'true';
        captionObserver.unobserve(entry.target);
      }
    }, { threshold: 0.3 });

    for (const element of page.querySelectorAll('[data-film-reveal]')) {
      if (element.closest('[data-film-caption]')) captionObserver.observe(element);
      else observer.observe(element);
    }

    const scenes = page.querySelectorAll('[data-film-parallax]');
    const coverCopy = page.querySelector('[data-film-cover-copy]');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animationFrame;
    let start = window.scrollY;
    let target = start;
    let startedAt = 0;
    let lastWritten = start;
    const scrollDuration = 780;

    function drawMotion(scroll) {
      const copyBounds = coverCopy.getBoundingClientRect();
      const copyText = coverCopy.firstElementChild;
      const available = Math.max(0, copyBounds.height - copyText.offsetHeight - 26);
      const copyStart = Math.max(0, copyBounds.top + scroll - window.innerHeight * 0.68);
      const offset = Math.min(available, Math.max(0, scroll - copyStart) * 0.84);
      coverCopy.style.setProperty('--copy-offset', offset + 'px');

      for (const scene of scenes) {
        const bounds = scene.getBoundingClientRect();
        const cover = scene.dataset.filmParallax === 'cover';
        const entry = cover ? Math.min(window.innerHeight, bounds.top + scroll) : window.innerHeight;
        const travel = (entry - bounds.top) / Math.max(1, entry + bounds.height);
        const progress = Math.min(1, Math.max(0, travel));
        scene.style.setProperty('--photo-offset', ((progress * 2 - 1) * (cover ? 100 / 12 : 7.4468)) + '%');
      }
    }

    function stopScrolling() {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      target = window.scrollY;
    }

    function animateScroll(now) {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / scrollDuration));
      const eased = 1 - (1 - progress) ** 4;
      window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
      lastWritten = window.scrollY;
      drawMotion(lastWritten);
      animationFrame = progress < 1 ? requestAnimationFrame(animateScroll) : undefined;
    }

    function onWheel(event) {
      if (motion.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey ||
          event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      for (let node = event.target; node instanceof HTMLElement && node !== document.body; node = node.parentElement) {
        if (!/^(auto|scroll)$/.test(getComputedStyle(node).overflowY)) continue;
        const remaining = node.scrollHeight - node.clientHeight - node.scrollTop;
        if (delta < 0 ? node.scrollTop > 1 : remaining > 1) return;
      }

      const scroll = window.scrollY;
      const limit = document.documentElement.scrollHeight - innerHeight;
      const next = Math.max(0, Math.min(limit, (animationFrame === undefined ? scroll : target) + delta));
      if (animationFrame === undefined && next === scroll) return;

      event.preventDefault();
      start = scroll;
      target = next;
      startedAt = performance.now();
      lastWritten = scroll;
      if (animationFrame === undefined) animationFrame = requestAnimationFrame(animateScroll);
    }

    function onScroll() {
      const scroll = window.scrollY;
      if (animationFrame !== undefined && scroll !== lastWritten) stopScrolling();
      drawMotion(scroll);
    }

    function resetMotion() {
      stopScrolling();
      drawMotion(window.scrollY);
    }

    resetMotion();
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resetMotion);
    motion.addEventListener('change', resetMotion);
    return () => {
      observer.disconnect();
      captionObserver.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resetMotion);
      motion.removeEventListener('change', resetMotion);
      stopScrolling();
    };
  }, []);


  return (
    <div className={styles.page} ref={pageRef}>
      <section className={styles.cover} aria-labelledby="film-intro-title">
        <div className={styles.coverHeading}>
          <h1 className={styles.title} id="film-intro-title" data-film-reveal>
            <RevealLine lang="ko">순간을 담는 방식,</RevealLine>
            <RevealLine lang="en" delay={85}>Polaroid Film.</RevealLine>
          </h1>
          <a href="#film-introduction" lang="en">[Scroll down]</a>
        </div>
        <div className={styles.coverBody} id="film-introduction">
          <div className={styles.coverCopy} data-film-cover-copy>
            <RevealParagraph>폴라로이드 필름은 한 장 한 장이 작은 현상소입니다. 셔터를 누르면 카메라의 롤러가 사진 아래쪽 두꺼운 테두리 속 현상액을 고르게 펴 주고, 몇 분에 걸쳐 색이 천천히 떠오릅니다. 이 필름은 지금도 네덜란드 엔스헤데, 세상에 하나 남은 폴라로이드 필름 공장에서 만들어집니다. 같은 장면이라도 어떤 필름에, 어떤 프레임으로 담느냐에 따라 전혀 다른 사진이 됩니다.</RevealParagraph>
          </div>
          <figure className={styles.coverImage} data-film-parallax="cover">
            <img src={introImage} alt="커다란 창가에 놓인 의자와 밝은 목재 벽" />
          </figure>
        </div>
      </section>

      <blockquote className={styles.quote} lang="ko">
        <p className={styles.quoteText} data-film-reveal>
          <RevealLine>“ 우리는 여전히 네덜란드의 마지막 필름 공장에서</RevealLine>
          <RevealLine delay={85}>한 장씩 필름을 만듭니다. 화면 속 수많은 사진 대신, 손에 남는 단 한 장을 위해서.</RevealLine>
          <RevealLine delay={170}>그 한 장이 오래도록 당신의 기억이 되도록. ”</RevealLine>
        </p>
      </blockquote>

      <FilmIndex onSelect={setGuideFilm} />

      <FilmGuideSequence firstFilm={guideFilm} />

      <div className={styles.faq}><FilmFaqSection revealLine={RevealLine} /></div>
    </div>
  );
}
