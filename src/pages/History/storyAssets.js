/**
 * History 스토리에서 실제로 쓰는 이미지만 import 한다.
 * import 한 파일은 모두 빌드 결과(dist)에 포함되므로, 쓰지 않는 이미지는 여기에 두지 않는다.
 * 헤더 로고(story-177a75b74589.svg)는 HistoryPage.module.css 에서 url()로 직접 참조한다.
 */
// 제목 화면 폴라로이드 사진 4장 (Figma 1705:3464 — image 101 · 108 · 107 · 133)
import asset29 from '@/assets/history/story/story-title-polaroid-101.jpg';
import asset30 from '@/assets/history/story/story-title-polaroid-108.jpg';
import asset31 from '@/assets/history/story/story-title-polaroid-107.jpg';
import asset32 from '@/assets/history/story/story-title-polaroid-133.jpg';
// Film 장면 컷 · 섬광 · 인용(에드윈 랜드)
import asset7 from '@/assets/history/story/story-2512f4475ca0.webp';
import asset8 from '@/assets/history/story/story-ef085c62181d.svg';
import asset9 from '@/assets/history/story/story-92ea69d22d38.webp';
// 연도 챕터 이미지 (1937 · 1943 · 1948 · 1981 · 2008 · 2017 · 2026) — Figma 1705:3122, 1849:5276 · 5431 · 5738 · 5583 · 5896 · 6055
import asset12 from '@/assets/history/story/story-6be59fa3d3ec.webp';
import asset23 from '@/assets/history/story/story-year-1943.jpg';
import asset24 from '@/assets/history/story/story-year-1948.jpg';
import asset25 from '@/assets/history/story/story-year-1981.jpg';
import asset26 from '@/assets/history/story/story-year-2008.jpg';
import asset27 from '@/assets/history/story/story-year-2017.jpg';
import asset28 from '@/assets/history/story/story-year-2026.jpg';
// 연도 구분선 (Figma 1705:3165 — Line 15, 576px)
import asset33 from '@/assets/history/story/story-year-rule.svg';

export { asset7, asset8, asset9, asset12, asset23, asset24, asset25, asset26, asset27, asset28, asset29, asset30, asset31, asset32, asset33 };
