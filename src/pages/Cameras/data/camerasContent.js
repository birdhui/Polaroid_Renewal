/**
 * Cameras 페이지 정적 콘텐츠 (담당: 정준혁)
 *
 * - 화면 구조는 레퍼런스(collabo-detail) 기준이다. 확정된 Cameras 화면 기획서가 나오면 이 파일만 교체한다.
 * - 카피는 기획서 v1.1에서 확정된 문구(핵심 메시지 · 콘셉트 · Footer CTA)만 재사용했다.
 *   Cameras 전용 카피는 아직 확정되지 않았으므로 PM 검수 후 교체한다.
 * - 이미지는 아직 없다. `src`가 null이면 자리표시(placeholder) 프레임이 렌더링된다.
 *   에셋이 준비되면 src/assets/cameras/ 에 kebab-case 파일명으로 넣고 import 해서 `src`에 연결한다.
 */
import { ROUTES } from '@/app/routes.js';

export const CAMERAS_HERO = {
  /** 히어로 배경 이미지 (없으면 그라데이션 배경) */
  image: { src: null, alt: '' },
  /**
   * 히어로 배경 영상 (YouTube). 소리 없이 자동 재생·반복한다.
   * '동작 줄이기' 설정이면 영상 대신 image(없으면 그라데이션 배경)를 보여준다.
   */
  video: { youtubeId: 'cYaZmVrUs1I' },
  /** 가운데 로크업: 브랜드 × 제품 라인 */
  brand: 'polaroid',
  product: 'Now',
};

export const CAMERAS_STORY = {
  /** 타이틀: 영문 단어 + 이탤릭 연결어 + 영문 단어 (콘셉트 'From Moment to Memory') */
  title: { lead: 'MOMENT', link: 'to', tail: 'MEMORY' },
  /** 확정된 핵심 메시지 */
  subtitle: '지나가는 순간을, 손에 남는 기록으로.',
  /** 가운데 고정 본문 — 기획서 확정 카피(랜딩 Capture · Film Ejection · Now Reveal) 조합 */
  body: ['그 순간을, 한 장에.', '방금 지나간 순간이, 한 장의 사진으로.', '그 마음은 지금의 폴라로이드로 이어집니다.'],
  /**
   * 흩어진 사진 프레임.
   * 위치·크기는 섹션 기준 비율(%)이다. desktop / mobile 값을 각각 둔다.
   * depth: 패럴랙스 이동량(px, 스크롤 진행 0→1 동안 0→depth 만큼 이동)
   */
  photos: [
    { id: 'photo-1', src: null, alt: '', ratio: '490 / 345', depth: 0, desktop: { x: 63, y: 8, w: 34 }, mobile: { x: 62, y: 6, w: 36 } },
    { id: 'photo-2', src: null, alt: '', ratio: '453 / 679', depth: 40, desktop: { x: 2, y: 14, w: 31 }, mobile: { x: 2, y: 10, w: 34 } },
    { id: 'photo-3', src: null, alt: '', ratio: '613 / 408', depth: 0, desktop: { x: 54, y: 38, w: 43 }, mobile: { x: 52, y: 32, w: 46 } },
    { id: 'photo-4', src: null, alt: '', ratio: '600 / 793', depth: 80, desktop: { x: 2, y: 58, w: 42 }, mobile: { x: 2, y: 50, w: 44 } },
    { id: 'photo-5', src: null, alt: '', ratio: '413 / 618', depth: 80, desktop: { x: 68, y: 68, w: 29 }, mobile: { x: 66, y: 62, w: 32 } },
  ],
  /** 마지막 CTA — 기획서 확정 Footer CTA 문구 재사용 (카메라 → 호환 필름 탐색 연결) */
  cta: { label: 'Discover Film', to: ROUTES.film },
};
