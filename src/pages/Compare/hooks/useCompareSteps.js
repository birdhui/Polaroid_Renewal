import { useCallback, useEffect, useRef, useState } from 'react';
import { COMPARE_STEPS } from '@/pages/Compare/data/compareSteps.js';

/** 선택한 카드가 눌린 상태로 보이도록 다음 스텝으로 넘어가기 전에 두는 시간(ms) */
const ADVANCE_DELAY = 300;

/**
 * Compare 스텝 진행 상태.
 * - 카드를 누르면(choose) 선택이 표시된 뒤 잠깐 있다가 다음 스텝으로 자동 이동한다. NEXT/BACK 버튼도 쓸 수 있다.
 * - STEP 3 까지 모두 선택해 마치면 그때의 선택값이 `submitted` 에 담긴다. 추천 결과는 이 값으로만 보여 준다.
 * - BACK 이나 다시 선택하기(reset)를 하면 `submitted` 가 비워져 결과가 사라지고, 다시 마치면 새 선택값으로 갱신된다.
 * - 이전 스텝으로 돌아가도 선택한 답은 유지된다.
 */
export default function useCompareSteps(steps = COMPARE_STEPS) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [navigated, setNavigated] = useState(false);
  const timerRef = useRef(null);

  const cancelPending = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const step = steps[stepIndex];
  const selectedId = answers[step.id] ?? null;
  const isLast = stepIndex === steps.length - 1;

  const submit = useCallback(
    (nextAnswers) => {
      if (steps.every((item) => nextAnswers[item.id])) {
        setSubmitted(
          Object.fromEntries(steps.map((item) => [item.id, nextAnswers[item.id]])),
        );
      }
    },
    [steps],
  );

  const choose = useCallback(
    (optionId) => {
      const nextAnswers = { ...answers, [step.id]: optionId };
      setAnswers(nextAnswers);
      cancelPending();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (isLast) {
          submit(nextAnswers);
          return;
        }
        setNavigated(true);
        setStepIndex((index) => index + 1);
      }, ADVANCE_DELAY);
    },
    [answers, cancelPending, isLast, step.id, submit],
  );

  const next = useCallback(() => {
    if (!selectedId) return;
    cancelPending();
    if (isLast) {
      submit(answers);
      return;
    }
    setNavigated(true);
    setStepIndex((index) => index + 1);
  }, [answers, cancelPending, isLast, selectedId, submit]);

  const back = useCallback(() => {
    if (stepIndex === 0) return;
    cancelPending();
    setSubmitted(null);
    setNavigated(true);
    setStepIndex((index) => index - 1);
  }, [cancelPending, stepIndex]);

  /** 결과를 닫고 STEP 1 로 돌아간다. 이전에 고른 답은 그대로 남아 있다. */
  const reset = useCallback(() => {
    cancelPending();
    setSubmitted(null);
    setNavigated(true);
    setStepIndex(0);
  }, [cancelPending]);

  return {
    step,
    stepIndex,
    stepCount: steps.length,
    selectedId,
    submitted,
    choose,
    next,
    back,
    reset,
    canGoBack: stepIndex > 0,
    canGoNext: Boolean(selectedId),
    isLast,
    navigated,
  };
}
