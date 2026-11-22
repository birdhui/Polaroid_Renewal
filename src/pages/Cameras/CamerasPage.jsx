import usePrefersReducedMotion from './hooks/usePrefersReducedMotion.js';
import MainHero from './main/MainHero.jsx';
import LineupCarousel from './main/LineupCarousel.jsx';
import MomentsIntro from './main/MomentsIntro.jsx';
import ModelFeature from './main/ModelFeature.jsx';
import HelpSplit from './main/HelpSplit.jsx';
import { HELP, LINEUP, MAIN_HERO, MODELS, MODEL_LINK_LABEL, MOMENTS } from './data/camerasMainContent.js';
import styles from './CamerasPage.module.css';

/**
 * 시안과 같은 글꼴. 이 페이지에 들어올 때만 불러온다.
 * precedence 를 주지 않는다: 주면 React 가 로드를 기다리고, 실패(오프라인·CDN 차단) 시 오류를 던진다.
 * 로드에 실패해도 공통 기본 글꼴로 표시된다.
 */
const FONT_OUTFIT = 'https://fonts.googleapis.com/css2?family=Outfit:wght@200;400;500;600&display=swap';
const FONT_PRETENDARD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

/**
 * Cameras — 카메라 메인 페이지 (담당: 정준혁)
 * Figma Cameras 프레임(node 803:354)과 같은 구성:
 *   Hero → 카메라 라인업 → Every Moment Has Its Camera → 모델 6개(Now · Now+ · Flip · Mod · I-2 · Go) → Compare · Support 안내
 * 콘텐츠는 ./data/camerasMainContent.js 에서 관리한다.
 * 헤더·푸터는 RootLayout 의 공통 SiteHeader·SiteFooter 를 사용한다.
 */
export default function CamerasPage() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className={styles.page}>
      <link rel="stylesheet" href={FONT_OUTFIT} />
      <link rel="stylesheet" href={FONT_PRETENDARD} />

      <MainHero hero={MAIN_HERO} />
      <LineupCarousel lineup={LINEUP} reducedMotion={reducedMotion} />
      <MomentsIntro moments={MOMENTS} reducedMotion={reducedMotion} />
      {MODELS.map((model) => (
        <ModelFeature key={model.id} model={model} linkLabel={MODEL_LINK_LABEL} reducedMotion={reducedMotion} />
      ))}
      <HelpSplit help={HELP} />
    </div>
  );
}
