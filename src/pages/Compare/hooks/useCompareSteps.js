import { useCallback, useState } from 'react';
import { COMPARE_STEPS } from '@/pages/Compare/data/compareSteps.js';

/**
 * Compare 스텝 진행 상태.
 * - 카드를 누르면 선택만 기록하고, NEXT 로 다음 스텝에 간다. BACK 은 이전 스텝(선택 유지).
 * - 마지막 스텝에서는 NEXT 가 다음 스텝이 없으므로(isLast) 화면에서 아래 비교 섹션으로 이동시킨다.
 * - 선택하기 전에는 NEXT 를 쓸 수 없다. (canGoNext)
 */
export default function useCompareSteps(steps = COMPARE_STEPS) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [navigated, setNavigated] = useState(false);

  const step = steps[stepIndex];
  const selectedId = answers[step.id] ?? null;
  const isLast = stepIndex === steps.length - 1;

  const select = useCallback(
    (optionId) => {
      setAnswers((prev) => ({ ...prev, [step.id]: optionId }));
    },
    [step.id],
  );

  const next = useCallback(() => {
    if (!selectedId) return;
    if (isLast) return;
    setNavigated(true);
    setStepIndex((index) => index + 1);
  }, [isLast, selectedId]);

  const back = useCallback(() => {
    if (stepIndex === 0) return;
    setNavigated(true);
    setStepIndex((index) => index - 1);
  }, [stepIndex]);

  return {
    step,
    stepIndex,
    stepCount: steps.length,
    selectedId,
    select,
    next,
    back,
    canGoBack: stepIndex > 0,
    canGoNext: Boolean(selectedId),
    isLast,
    navigated,
  };
}
