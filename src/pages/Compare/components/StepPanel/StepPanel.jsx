import { useEffect, useId, useRef, useState } from 'react';
import OptionCard from '@/pages/Compare/components/OptionCard/OptionCard.jsx';
import StepNav from '@/pages/Compare/components/StepNav/StepNav.jsx';
import styles from './StepPanel.module.css';

/**
 * 한 스텝의 질문과 선택 카드.
 * 스텝이 바뀌면 부모가 key 로 다시 마운트하므로 강조 상태는 첫 카드부터 시작한다.
 * `moveFocus` 가 true 면 질문으로 포커스를 옮겨 키보드·스크린리더 사용자가 스텝 전환을 알 수 있게 한다.
 */
export default function StepPanel({ step, selectedId, moveFocus, canGoBack, canGoNext, onSelect, onBack, onNext }) {
  const [hoverId, setHoverId] = useState(null);
  const headingRef = useRef(null);
  const headingId = useId();

  useEffect(() => {
    if (moveFocus) headingRef.current?.focus({ preventScroll: true });
  }, [moveFocus]);

  const activeId = selectedId ?? hoverId ?? step.options[0].id;

  return (
    <div className={styles.panel}>
      <h3 id={headingId} ref={headingRef} className={styles.heading} tabIndex={-1}>
        <span className={styles.label}>{step.label}</span>
        <span className={styles.question}>{step.question}</span>
      </h3>
      <div className={styles.options} role="group" aria-labelledby={headingId}>
        {step.options.map((option) => (
          <OptionCard
            key={option.id}
            label={option.label}
            active={option.id === activeId}
            selected={option.id === selectedId}
            onActivate={() => setHoverId(option.id)}
            onSelect={() => onSelect(option.id)}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <StepNav canGoBack={canGoBack} canGoNext={canGoNext} onBack={onBack} onNext={onNext} />
      </div>
    </div>
  );
}
