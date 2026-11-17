import CamerasHero from './components/CamerasHero/CamerasHero.jsx';
import CamerasStory from './components/CamerasStory/CamerasStory.jsx';
import CameraCategory from './components/CameraCategory/CameraCategory.jsx';
import ShopStage from './components/ShopStage/ShopStage.jsx';
import BestSellerGrid from './components/BestSellerGrid/BestSellerGrid.jsx';
import CollabCards from './components/CollabCards/CollabCards.jsx';
import { CAMERAS_HERO, CAMERAS_STORY } from './data/camerasContent.js';
import {
  CAMERA_TILES,
  CATEGORY_HEAD,
  BEST_SELLER_INTRO,
  BEST_SELLERS,
  COLLAB_INTRO,
  COLLAB_HEAD,
  COLLABS,
} from './data/shopContent.js';
import styles from './CamerasPage.module.css';

const STORY_ID = 'cameras-story';

/**
 * Cameras — 카메라 서브페이지 (담당: 정준혁)
 * 구조: Hero(로크업) → Story(타이틀 · 사진 · 고정 본문 · CTA)
 *       → 샵: 카메라 카테고리 → Best Sellers 소개 → 베스트셀러 6개 → Collaboration 소개 → 콜라보 4개
 * 화면 구조는 레퍼런스(collabo-detail) 기준이며, 콘텐츠는 ./data/camerasContent.js 에서 관리한다.
 * 샵 영역은 Marshall Rebrand shop · instax 카테고리 · adidas 콜라보 카드 구조를 참고했고, 콘텐츠는 ./data/shopContent.js 에서 관리한다.
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
      <CameraCategory id="cameras-category-title" head={CATEGORY_HEAD} tiles={CAMERA_TILES} />
      <ShopStage id="cameras-best" label="베스트셀러 소개" tone="dark" {...BEST_SELLER_INTRO} />
      <BestSellerGrid label="모델별 베스트셀러" products={BEST_SELLERS} />
      <ShopStage id="cameras-collab" label="콜라보레이션 소개" tone="deep" {...COLLAB_INTRO} />
      <CollabCards id="cameras-collab-title" head={COLLAB_HEAD} items={COLLABS} />
    </div>
  );
}
