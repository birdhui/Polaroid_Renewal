import styles from './StepNav.module.css';

function Chevron() {
  return (
    <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * 스텝 이동 버튼 (BACK / NEXT).
 * 이동할 수 없을 때는 disabled 로 두어 키보드·스크린리더에서도 상태가 전달되게 한다.
 */
export default function StepNav({ canGoBack, canGoNext, onBack, onNext }) {
  return (
    <div className={styles.nav}>
      <button type="button" className={`${styles.button} ${styles.back}`} disabled={!canGoBack} onClick={onBack}>
        <Chevron />
        <span className={styles.label}>BACK</span>
      </button>
      <button type="button" className={`${styles.button} ${styles.next}`} disabled={!canGoNext} onClick={onNext}>
        <span className={styles.label}>NEXT</span>
        <span className={styles.forward}>
          <Chevron />
        </span>
      </button>
    </div>
  );
}
