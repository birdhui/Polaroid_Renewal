import { useEffect, useRef, useState } from 'react';
import CompareChat from '@/pages/Compare/components/CompareChat/CompareChat.jsx';
import CompareLoading from '@/pages/Compare/components/CompareLoading/CompareLoading.jsx';
import CompareResult from '@/pages/Compare/components/CompareResult/CompareResult.jsx';
import useCompareSteps from '@/pages/Compare/hooks/useCompareSteps.js';
import preloadLoadingImages from '@/pages/Compare/utils/preloadLoadingImages.js';
import styles from './CompareFinder.module.css';

/** 마지막 대답을 고른 뒤 로딩 화면으로 바뀌기까지 기다리는 시간(ms) — 고른 답이 잠깐 보이게 한다. 시안 값이 없는 임시값이다. */
const HANDOFF_DELAY = 900;

/**
 * Compare 섹션 — 채팅형 질문(STEP 1~3) → 로딩 → 추천 결과가 한 화면 크기의 같은 자리에서 차례로 바뀐다.
 * 마지막 질문까지 마치면 채팅 화면이 그 자리에서 로딩 화면으로, 로딩이 끝나면 그 자리에서 추천 결과로 바뀐다.
 * 결과의 "다시보기"를 누르면 onRestart 로 처음 질문부터 다시 시작한다. (화면을 스크롤해서 옮기지 않는다.) 지금 어느 화면인지는 onStageChange('chat' | 'loading' | 'result')로 알려 준다.
 */
export default function CompareFinder({ onStageChange, onRestart }) {
  const { steps, answers, stepIndex, submitted, choose } = useCompareSteps();
  const resultRef = useRef(null);
  // 로딩 화면을 다 보여 준 뒤에만 결과를 보여 준다.
  const [loaded, setLoaded] = useState(false);
  const [handedOff, setHandedOff] = useState(false); // 마지막 답을 잠깐 보여 준 뒤 로딩으로 넘어갔는지

  useEffect(() => {
    if (!submitted) {
      setLoaded(false);
      setHandedOff(false);
      return undefined;
    }
    const timer = setTimeout(() => setHandedOff(true), HANDOFF_DELAY);
    return () => clearTimeout(timer);
  }, [submitted]);

  // 질문하는 동안 로딩 화면 이미지를 미리 불러와 둔다. (로딩이 시작될 때 멈칫하지 않게)
  useEffect(() => {
    preloadLoadingImages();
  }, []);

  const stage = !submitted || !handedOff ? 'chat' : loaded ? 'result' : 'loading';

  useEffect(() => {
    onStageChange?.(stage);
  }, [stage, onStageChange]);

  // 결과가 나타나면 키보드·스크린리더 사용자가 결과로 이어서 읽을 수 있게 포커스만 옮긴다. (화면은 움직이지 않는다)
  useEffect(() => {
    if (stage === 'result') resultRef.current?.focus({ preventScroll: true });
  }, [stage]);

  return (
    <div className={styles.stage} data-stage={stage}>
      {stage === 'chat' ? (
        <CompareChat
          steps={steps}
          answers={answers}
          stepIndex={stepIndex}
          onChoose={(stepId, optionId) => choose(optionId, stepId)}
        />
      ) : null}
      {stage === 'loading' ? <CompareLoading onDone={() => setLoaded(true)} /> : null}
      {stage === 'result' ? <CompareResult ref={resultRef} selection={submitted} onRetry={onRestart} /> : null}
    </div>
  );
}
