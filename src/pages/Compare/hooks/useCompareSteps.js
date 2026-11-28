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
 * - 채팅형 화면에서는 이미 지나온 스텝의 선택지를 다시 눌러 답만 바꿀 수 있다(choose 의 두 번째 인자).
 *   화면은 그대로이고, 마지막 스텝까지 마친 상태라면 바뀐 답으로 결과가 다시 만들어진다.
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
        // 추천 규칙표는 선택지의 ruleId(없으면 id)로 찾는다.
        setSubmitted(
          Object.fromEntries(
            steps.map((item) => {
              const option = item.options.find((candidate) => candidate.id === nextAnswers[item.id]);
              return [item.id, option?.ruleId ?? nextAnswers[item.id]];
            }),
          ),
        );
      }
    },
    [steps],
  );

  /** 선택이 보인 뒤 잠깐 있다가 다음 스텝으로 넘어가거나(마지막이면 결과를 만들고) 한다. */
  const scheduleAdvance = useCallback(
    (nextAnswers) => {
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
    [cancelPending, isLast, submit],
  );

  const choose = useCallback(
    (optionId, stepId = step.id) => {
      const targetIndex = steps.findIndex((item) => item.id === stepId);
      // 없는 스텝이거나 아직 나타나지 않은 스텝이면 무시한다.
      if (targetIndex === -1 || targetIndex > stepIndex) return;

      // 이미 지나온 스텝의 답을 고치는 경우: 화면은 그대로 두고 답만 바꾼다.
      if (targetIndex < stepIndex) {
        if (answers[stepId] === optionId) return;
        const nextAnswers = { ...answers, [stepId]: optionId };
        setAnswers(nextAnswers);
        if (isLast) {
          // 마지막 스텝이 보이는 중이면 바뀐 답으로 결과를 다시 만든다. (모두 답하지 않았다면 submit 은 아무것도 하지 않는다)
          cancelPending();
          submit(nextAnswers);
        } else if (timerRef.current) {
          // 다음 스텝으로 넘어가는 중이었다면 새 답이 반영되도록 다시 건다.
          scheduleAdvance(nextAnswers);
        }
        return;
      }

      const nextAnswers = { ...answers, [step.id]: optionId };
      setAnswers(nextAnswers);
      scheduleAdvance(nextAnswers);
    },
    [answers, cancelPending, isLast, scheduleAdvance, step.id, stepIndex, steps, submit],
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
    steps,
    step,
    answers,
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
