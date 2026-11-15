import CameraExperience from '@/features/landing-camera/CameraExperience.jsx';
import { DEFAULT_CAMERA_STATE } from '@/features/landing-camera/cameraContract.js';
import styles from './LandingPage.module.css';

/**
 * Landing — 브랜드 첫 진입 화면 (담당: 곽세희)
 *
 * 이 페이지가 담당: 스크롤 진행률, 장면 전환, 카피, 전체 흐름 (장면 순서: ./data/landingScenes.js)
 * 3D 카메라는 @/features/landing-camera (담당: 곽세희) — 여기서 한 번만 마운트하고 props 로만 상태를 전달한다.
 * 시네마틱 비주얼·필름 효과·2.5D 전환은 @/features/landing-visuals (담당: 임희지) 에서 가져와 배치한다.
 * 장면·섹션 컴포넌트는 ./components/, 스크롤 훅은 ./hooks/ 에 둔다.
 */
export default function LandingPage() {
  return (
    <section className={styles.page} aria-labelledby="landing-title">
      <h1 id="landing-title">Landing</h1>
      <CameraExperience {...DEFAULT_CAMERA_STATE} />
    </section>
  );
}
