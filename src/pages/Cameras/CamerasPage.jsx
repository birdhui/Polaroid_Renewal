import CamerasHero from './components/CamerasHero/CamerasHero.jsx';
import CameraCategory from './components/CameraCategory/CameraCategory.jsx';
import ShopStage from './components/ShopStage/ShopStage.jsx';
import BestSellerGrid from './components/BestSellerGrid/BestSellerGrid.jsx';
import CollabCards from './components/CollabCards/CollabCards.jsx';
import { CAMERAS_HERO } from './data/camerasContent.js';
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

/**
 * 시안과 같은 글꼴. 이 페이지에 들어올 때만 불러온다.
 * precedence 를 주지 않는다: 주면 React 가 로드를 기다리고, 실패(오프라인·CDN 차단) 시 오류를 던진다.
 * 로드에 실패해도 공통 기본 글꼴로 표시된다.
 */
const FONT_ARCHIVO = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap';
const FONT_PRETENDARD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

const CATEGORY_SECTION_ID = 'cameras';

/**
 * Cameras — 카메라 쇼핑 페이지 (담당: 정준혁)
 * polaroid-shop 시안(./prototype/polaroid-shop.html)과 같은 구성:
 *   Hero → 카메라 카테고리 → Best Sellers 소개 → 베스트셀러 6개 → Collaboration 소개 → 콜라보 4개
 * 콘텐츠는 ./data/camerasContent.js(히어로) · ./data/shopContent.js(샵 영역)에서 관리한다.
 * 시안의 자체 헤더·푸터 대신 RootLayout 의 공통 SiteHeader·SiteFooter 를 사용한다.
 */
export default function CamerasPage() {
  return (
    <div className={styles.page}>
      <link rel="stylesheet" href={FONT_ARCHIVO} />
      <link rel="stylesheet" href={FONT_PRETENDARD} />

      <CamerasHero hero={CAMERAS_HERO} nextId={CATEGORY_SECTION_ID} />
      <CameraCategory
        id="cameras-category-title"
        sectionId={CATEGORY_SECTION_ID}
        head={CATEGORY_HEAD}
        tiles={CAMERA_TILES}
      />
      <ShopStage id="cameras-best" label="베스트셀러 소개" tone="dark" {...BEST_SELLER_INTRO} />
      <BestSellerGrid label="모델별 베스트셀러" products={BEST_SELLERS} />
      <ShopStage id="cameras-collab" label="콜라보레이션 소개" tone="deep" {...COLLAB_INTRO} />
      <CollabCards id="cameras-collab-title" head={COLLAB_HEAD} items={COLLABS} />

      <span className={styles.concept}>CONCEPT · 비공식</span>
    </div>
  );
}
