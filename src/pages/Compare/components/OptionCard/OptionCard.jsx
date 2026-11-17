import cameraActive from '@/assets/compare/camera-active.webp';
import cameraIdle from '@/assets/compare/camera-idle.webp';
import styles from './OptionCard.module.css';

/**
 * 스텝 선택 카드. 강조(active) 상태는 시안의 진한 카드 + 카메라 일러스트로 표시한다.
 * - active: 기본 첫 카드, 마우스를 올리거나 포커스한 카드, 선택한 카드
 */
export default function OptionCard({ label, active, selected, onActivate, onSelect }) {
  return (
    <button
      type="button"
      className={active ? `${styles.card} ${styles.active}` : styles.card}
      aria-pressed={selected}
      onPointerEnter={onActivate}
      onFocus={onActivate}
      onClick={onSelect}
    >
      <img
        className={styles.image}
        src={active ? cameraActive : cameraIdle}
        alt=""
        draggable="false"
      />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
