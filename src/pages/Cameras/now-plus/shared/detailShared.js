/**
 * 카메라 상세페이지(Now · Now+ …)가 함께 쓰는 값 (담당: 정준혁)
 * 상세페이지는 모두 같은 틀(Hero → 디자인 → 기능 → 연출 → Film → 캐러셀 → 앱 → 스토어)을 쓰고 내용만 바꾼다.
 */

/** 시안과 같은 글꼴. 상세페이지에 들어올 때만 불러오고, 실패해도 기본 글꼴로 표시된다. */
export const FONT_GOOGLE =
  'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&family=Reenie+Beanie&family=Playfair+Display:ital,wght@1,400;1,500&display=swap';
export const FONT_PRETENDARD =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css';

/** polaroid.com 이미지 CDN (Sanity). 주소 뒤에 ?w=…&fm=webp 로 크기·형식을 고른다. */
export const SANITY = 'https://cdn.sanity.io/images/ieogcuy1/production';
/** polaroid.com 영상 파일 CDN (Sanity) */
export const SANITY_FILES = 'https://cdn.sanity.io/files/ieogcuy1/production';
