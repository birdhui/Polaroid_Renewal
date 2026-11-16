import CamerasHero from './components/CamerasHero/CamerasHero.jsx';
import CamerasStory from './components/CamerasStory/CamerasStory.jsx';
import { CAMERAS_HERO, CAMERAS_STORY } from './data/camerasContent.js';
import styles from './CamerasPage.module.css';

const STORY_ID = 'cameras-story';

/**
 * Cameras — 카메라 서브페이지 (담당: 정준혁)
 * 구조: Hero(로크업) → Story(타이틀 · 사진 · 고정 본문 · CTA)
 * 화면 구조는 레퍼런스(collabo-detail) 기준이며, 콘텐츠는 ./data/camerasContent.js 에서 관리한다.
 * Header·Footer 는 RootLayout 의 공통 컴포넌트를 그대로 사용한다.
 */
export default function CamerasPage() {
  return (
    <div className={styles.page}>
      <CamerasHero hero={CAMERAS_HERO} nextId={STORY_ID} />
      <CamerasStory
        id={STORY_ID}
        story={CAMERAS_STORY}
        lockup={{ brand: CAMERAS_HERO.brand, product: CAMERAS_HERO.product }}
      />
    </div>
  );
}
