import { useEffect, useRef } from 'react';
import CompareChat from '@/pages/Compare/components/CompareChat/CompareChat.jsx';
import CompareLoading from '@/pages/Compare/components/CompareLoading/CompareLoading.jsx';
import CompareResult from '@/pages/Compare/components/CompareResult/CompareResult.jsx';
import useCompareSteps from '@/pages/Compare/hooks/useCompareSteps.js';

/**
 * Compare 섹션 — 채팅형 질문(STEP 1~3)과 그 아래 추천 결과.
 * 대답을 고르면 다음 질문이 이어지고, 마지막 질문까지 마치면 로딩 섹션 자리(빈 베이지) 뒤에 추천 결과가 나타난다.
 * 지나온 질문의 대답을 바꾸면 바뀐 답으로 결과가 다시 만들어진다.
 */
export default function CompareFinder() {
  const { steps, answers, stepIndex, submitted, choose } = useCompareSteps();
  const resultRef = useRef(null);

  // 결과가 나타나거나 갱신되면 결과 섹션으로 이동한다. 모션 감소 설정이면 부드러운 스크롤을 쓰지 않는다.
  useEffect(() => {
    if (!submitted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    resultRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  return (
    <>
      <CompareChat
        steps={steps}
        answers={answers}
        stepIndex={stepIndex}
        onChoose={(stepId, optionId) => choose(optionId, stepId)}
      />
      {submitted ? (
        <>
          <CompareLoading />
          <CompareResult ref={resultRef} selection={submitted} />
        </>
      ) : null}
    </>
  );
}
