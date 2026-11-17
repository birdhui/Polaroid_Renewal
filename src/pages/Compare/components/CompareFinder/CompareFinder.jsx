import { useCallback, useRef } from 'react';
import CompareResult from '@/pages/Compare/components/CompareResult/CompareResult.jsx';
import StepPanel from '@/pages/Compare/components/StepPanel/StepPanel.jsx';
import useCompareSteps from '@/pages/Compare/hooks/useCompareSteps.js';
import styles from './CompareFinder.module.css';

/**
 * Compare 섹션 — 왼쪽 소개 문구와 오른쪽 STEP 선택, 그 아래 카메라 비교 섹션.
 * 소개 문구는 스텝이 바뀌어도 그대로 유지한다. 마지막 스텝에서 NEXT 를 누르면 아래 비교 섹션으로 이동한다.
 */
export default function CompareFinder() {
  const { step, selectedId, select, next, back, canGoBack, canGoNext, isLast, navigated } = useCompareSteps();
  const resultRef = useRef(null);

  // 모션 감소 설정이면 부드러운 스크롤을 쓰지 않는다.
  const goToResult = useCallback(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    resultRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <section className={styles.finder} aria-labelledby="compare-title">
        <div className={styles.inner}>
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
            onSelect={select}
            onBack={back}
            onNext={isLast ? goToResult : next}
          />
        </div>
      </section>
      <CompareResult ref={resultRef} />
    </>
  );
}
