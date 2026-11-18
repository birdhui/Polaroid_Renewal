import { useCallback, useEffect, useRef, useState } from 'react';
import { COMPARE_STEPS } from '@/pages/Compare/data/compareSteps.js';

/**
 * Compare 스텝 진행 상태.
 * - 카드를 누르면(choose) 선택이 표시된 뒤 잠깐 있다가 다음 스텝으로 자동 이동한다. BACK 은 이전 스텝(선택 유지).
 * - 마지막 스텝에서는 다음 스텝이 없으므로 선택 뒤 onLast 를 호출해 화면에서 아래 비교 섹션으로 이동시킨다.
 * - NEXT 버튼도 그대로 쓸 수 있다. 선택하기 전에는 NEXT 를 쓸 수 없다. (canGoNext)
 */
/** 선택한 카드가 눌린 상태로 보이도록 다음 스텝으로 넘어가기 전에 두는 시간(ms) */
const ADVANCE_DELAY = 300;

export default function useCompareSteps(steps = COMPARE_STEPS) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
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

  const select = useCallback(
    (optionId) => {
      setAnswers((prev) => ({ ...prev, [step.id]: optionId }));
    },
    [step.id],
  );

  const choose = useCallback(
    (optionId, onLast) => {
      setAnswers((prev) => ({ ...prev, [step.id]: optionId }));
      cancelPending();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (isLast) {
          onLast?.();
          return;
        }
        setNavigated(true);
        setStepIndex((index) => index + 1);
      }, ADVANCE_DELAY);
    },
    [cancelPending, isLast, step.id],
  );

  const next = useCallback(() => {
    if (!selectedId) return;
    if (isLast) return;
    cancelPending();
    setNavigated(true);
    setStepIndex((index) => index + 1);
  }, [cancelPending, isLast, selectedId]);

  const back = useCallback(() => {
    if (stepIndex === 0) return;
    cancelPending();
    setNavigated(true);
    setStepIndex((index) => index - 1);
  }, [cancelPending, stepIndex]);

  return {
    step,
    stepIndex,
    stepCount: steps.length,
    selectedId,
    select,
    choose,
    next,
    back,
    canGoBack: stepIndex > 0,
    canGoNext: Boolean(selectedId),
    isLast,
    navigated,
  };
}
