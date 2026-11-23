import photo01Wide from '@/assets/compare/loading/photo-01-wide.webp';
import photo01Square from '@/assets/compare/loading/photo-01-square.webp';

/**
 * 로딩 화면(CompareLoading)에서 순서대로 바뀌는 사진.
 * - square: 정사각형(최종 단계) 사진 — 필수
 * - wide:   처음 열릴 때 보이는 가로 크롭 사진 — 없으면 square 를 가로로 잘라 쓴다
 *
 * 지금은 사진이 1장뿐이다. 나머지 5장이 준비되면 이 배열에 같은 모양으로 추가하면 된다.
 * (assets/compare/loading/photo-02-square.webp … 처럼 넣고 위에서 import)
 */
export const LOADING_PHOTOS = [
  { id: 'photo-01', wide: photo01Wide, square: photo01Square },
];
