import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import CompareFinder from '@/pages/Compare/components/CompareFinder/CompareFinder.jsx';
import CompareHero from '@/pages/Compare/components/CompareHero/CompareHero.jsx';
import useScrollLock from '@/pages/Compare/hooks/useScrollLock.js';
import styles from './ComparePage.module.css';

/** 히어로가 사라지는 시간(ms) — CompareHero.module.css 의 .hero transition 과 같게 맞춘다. 시안 값이 없는 임시값이다. */
const HERO_LEAVE_DURATION = 350;

/**
 * Compare — 나에게 맞는 카메라 찾기 (feat/compare)
 * 히어로 + 채팅형 질문(STEP 1~3) → 로딩 → 추천 결과.
 * 히어로의 "찾아보기"를 누르면 스크롤로 내려가지 않고, 히어로가 사라진 그 자리에 채팅 화면이 바로 나타난다.
 * 질문을 마치면 같은 자리에서 로딩 화면 → 추천 결과로 바뀐다. (스크롤은 히어로와 질문하는 동안 잠그고, 결과가 나오면 푼다)
 * 결과가 나오면 히어로가 결과 위에 다시 붙고 화면은 결과 자리에 그대로 둔다. 그래서 위로 스크롤하면 히어로로, 아래로 스크롤하면 푸터로 갈 수 있다.
 * 이 페이지에서는 스크롤바를 보이지 않게 한다. (스크롤 자체는 휠·터치로 가능)
 * 페이지 전용 컴포넌트는 ./components/, 훅은 ./hooks/, 데이터는 ./data/ 에 둔다.
 */
export default function ComparePage() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const finderRef = useRef(null);
  const leaveTimer = useRef(null);
  const [phase, setPhase] = useState('hero'); // hero | leaving(히어로가 사라지는 중) | finder
  const [stage, setStage] = useState('chat'); // chat | loading | result
  const [finderRun, setFinderRun] = useState(0); // 결과의 "다시보기" — 값이 바뀌면 질문 화면을 처음 상태로 새로 시작한다

  // 히어로와 질문하는 동안(채팅·로딩)에는 한 화면에 고정해 둔다. 히어로를 스크롤해도 아래 푸터만 올라오는 일이 없게 하려는 것이다.
  // 결과가 나오면 풀어서 큰 결과 카드와 푸터까지 볼 수 있게 한다.
  useScrollLock(stage !== 'result', pageRef);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // 새로고침이나 다른 페이지에서 들어올 때 브라우저·라우터가 예전 스크롤 위치(결과 화면 쪽)를 되살리면, 처음 화면(히어로)에서는 스크롤이 잠겨 있어
  // 히어로 아랫부분과 푸터만 보인 채 움직일 수 없게 된다. 처음 열릴 때는 항상 맨 위에서 시작한다.
  // (되살리는 동작이 이 효과보다 나중에 일어날 수 있어 한 프레임 뒤에도 한 번 더 맞춘다)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 결과가 나오면 히어로를 결과 위에 다시 붙인다. 히어로가 위에 생기며 결과가 아래로 밀리므로, 보던 자리(결과)가 그대로 보이게 스크롤을 그만큼 내려 둔다.
  const heroAbove = phase === 'finder' && stage === 'result';
  const heroAboveBefore = useRef(false);
  useLayoutEffect(() => {
    if (heroAbove && !heroAboveBefore.current) {
      const height = heroRef.current?.getBoundingClientRect().height ?? 0;
      window.scrollTo({ top: window.scrollY + height, behavior: 'instant' });
    } else if (!heroAbove && heroAboveBefore.current) {
      window.scrollTo({ top: 0, behavior: 'instant' }); // 다시 질문으로 돌아가면 채팅이 맨 위에 오게
    }
    heroAboveBefore.current = heroAbove;
  }, [heroAbove]);

  // 결과 위에 붙은 히어로의 "찾아보기": 결과 쪽으로 부드럽게 내려간다.
  const goToFinder = useCallback(() => {
    finderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // "찾아보기": 히어로를 사라지게 한 뒤 같은 자리에서 채팅 화면으로 바꾼다. (스크롤 이동 없음)
  const startFinder = useCallback(() => {
    if (leaveTimer.current || phase !== 'hero') return;
    const showFinder = () => {
      leaveTimer.current = null;
      window.scrollTo(0, 0); // 히어로를 조금 스크롤해 둔 상태였어도 채팅 화면이 맨 위에 오게 한다
      setPhase('finder');
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      showFinder();
      return;
    }
    setPhase('leaving');
    leaveTimer.current = setTimeout(showFinder, HERO_LEAVE_DURATION);
  }, [phase]);

  return (
    <div ref={pageRef} className={styles.page}>
      {phase !== 'finder' || heroAbove ? (
        <div ref={heroRef}>
          <CompareHero onStart={heroAbove ? goToFinder : startFinder} leaving={phase === 'leaving'} />
        </div>
      ) : null}
      {phase === 'finder' ? (
        <div ref={finderRef} className={styles.finder}>
          <CompareFinder key={finderRun} onStageChange={setStage} onRestart={() => setFinderRun((run) => run + 1)} />
        </div>
      ) : null}
    </div>
  );
}
