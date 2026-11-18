import { useCallback, useEffect, useRef } from 'react';
import CompareResult from '@/pages/Compare/components/CompareResult/CompareResult.jsx';
import StepPanel from '@/pages/Compare/components/StepPanel/StepPanel.jsx';
import useCompareSteps from '@/pages/Compare/hooks/useCompareSteps.js';
import styles from './CompareFinder.module.css';

/**
 * Compare 섹션 — 왼쪽 소개 문구와 오른쪽 STEP 선택, 그 아래 추천 결과.
 * 카드를 고르면 다음 스텝으로 자동 이동하고(NEXT·BACK 도 사용 가능), STEP 3 까지 마치면 추천 결과가 나타난다.
 * 결과는 3개 질문을 모두 마친 뒤에만 보이며, 다시 선택하기로 STEP 1 에 돌아갈 수 있다.
 */
export default function CompareFinder() {
  const { step, selectedId, submitted, choose, next, back, reset, canGoBack, canGoNext, navigated } = useCompareSteps();
  const finderRef = useRef(null);
  const resultRef = useRef(null);

  // 결과가 나타나거나 갱신되면 결과 섹션으로 이동한다. 모션 감소 설정이면 부드러운 스크롤을 쓰지 않는다.
  useEffect(() => {
    if (!submitted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    resultRef.current?.focus({ preventScroll: true });
  }, [submitted]);

  const handleReset = useCallback(() => {
    reset();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    finderRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [reset]);

  return (
    <>
      <section className={styles.finder} aria-labelledby="compare-title">
        <div ref={finderRef} className={styles.inner}>
          <div className={styles.intro}>
            <h2 id="compare-title" className={styles.title}>
              Compare
            </h2>
            <p className={styles.description}>
              나에게 맞는 카메라를 찾고,
              <br />
              가격과 기능, 필름까지 비교해 보세요.
            </p>
          </div>
          <StepPanel
            key={step.id}
            step={step}
            selectedId={selectedId}
            moveFocus={navigated}
            canGoBack={canGoBack}
            canGoNext={canGoNext}
            onSelect={choose}
            onBack={back}
            onNext={next}
          />
        </div>
      </section>
      {submitted ? <CompareResult ref={resultRef} selection={submitted} onReset={handleReset} /> : null}
    </>
  );
}
