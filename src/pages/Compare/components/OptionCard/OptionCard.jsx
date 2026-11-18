import cameraIdle from '@/assets/compare/camera-idle.webp';
import styles from './OptionCard.module.css';

/**
 * 스텝 선택 카드. 기본은 배경과 일러스트가 70% 투명도이고, 마우스를 올리거나 포커스·선택하면 100%가 된다.
 * 호버해도 일러스트 크기나 그림은 바뀌지 않는다.
 */
export default function OptionCard({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      className={selected ? `${styles.card} ${styles.selected}` : styles.card}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <img className={styles.image} src={cameraIdle} alt="" draggable="false" />
      <span className={styles.label}>{label}</span>
    </button>
  );
}
