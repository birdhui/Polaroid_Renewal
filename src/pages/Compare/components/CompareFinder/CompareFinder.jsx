import { useEffect, useRef, useState } from 'react';
import CompareChat from '@/pages/Compare/components/CompareChat/CompareChat.jsx';
import CompareLoading from '@/pages/Compare/components/CompareLoading/CompareLoading.jsx';
import CompareResult from '@/pages/Compare/components/CompareResult/CompareResult.jsx';
import useCompareSteps from '@/pages/Compare/hooks/useCompareSteps.js';

/**
 * Compare 섹션 — 채팅형 질문(STEP 1~3)과 그 아래 추천 결과.
 * 대답을 고르면 다음 질문이 이어지고, 마지막 질문까지 마치면 로딩 화면이 한 번 재생된 뒤 같은 자리에 추천 결과가 나타난다.
 * 지나온 질문의 대답을 바꾸면 바뀐 답으로 결과가 다시 만들어진다.
 */
export default function CompareFinder() {
  const { steps, answers, stepIndex, submitted, choose } = useCompareSteps();
  const resultRef = useRef(null);
  const loadingRef = useRef(null);
  // 로딩 화면을 다 보여 준 뒤에만 결과를 보여 준다. 결과가 이미 보이는 중에 답만 바꾸면 로딩 없이 바로 갱신한다.
  const [loaded, setLoaded] = useState(false);
  const showLoading = Boolean(submitted) && !loaded;

  useEffect(() => {
    if (!submitted) setLoaded(false);
  }, [submitted]);

  const scrollTo = (node) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // 로딩 화면이 나타나면 그 화면으로 이동한다. 모션 감소 설정이면 부드러운 스크롤을 쓰지 않는다.
  useEffect(() => {
    if (showLoading) scrollTo(loadingRef.current);
  }, [showLoading]);

  // 결과가 나타나거나 갱신되면 결과 섹션으로 이동한다.
  useEffect(() => {
    if (!submitted || !loaded) return;
    scrollTo(resultRef.current);
    resultRef.current?.focus({ preventScroll: true });
  }, [submitted, loaded]);

  return (
    <>
      <CompareChat
        steps={steps}
        answers={answers}
        stepIndex={stepIndex}
        onChoose={(stepId, optionId) => choose(optionId, stepId)}
      />
      {showLoading ? <CompareLoading ref={loadingRef} onDone={() => setLoaded(true)} /> : null}
      {submitted && loaded ? <CompareResult ref={resultRef} selection={submitted} /> : null}
    </>
  );
}
