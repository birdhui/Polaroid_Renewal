import { DEFAULT_CAMERA_STATE } from './cameraContract.js';
import styles from './CameraExperience.module.css';

/**
 * Landing 3D 카메라 레이어의 진입점. (담당: 곽세희)
 *
 * - Landing 에서 한 번만 마운트되고, 여러 섹션에 걸쳐 같은 인스턴스를 유지한다.
 *   → 3D Canvas 는 이 컴포넌트 안에서 한 번만 만들고, props 변화로만 상태를 바꾼다.
 * - props 계약: ./cameraContract.js (CameraExperienceProps)
 * - 3D 렌더링은 아직 구현하지 않았다. (three 미설치 · 모델 미확정)
 *
 * @param {import('./cameraContract.js').CameraExperienceProps} props
 */
export default function CameraExperience({
  visible = DEFAULT_CAMERA_STATE.visible,
  // 아래 값들은 3D 구현 시 사용한다.
  // pose, colorway, feature, featureProgress, action, onEvent
}) {
  return <div className={styles.layer} data-visible={visible} aria-hidden="true" />;
}
