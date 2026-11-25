import photo01Wide from '@/assets/compare/loading/photo-01-wide.webp';
import photo01Square from '@/assets/compare/loading/photo-01-square.webp';
import photo02Square from '@/assets/compare/loading/photo-02-square.webp';
import photo03Square from '@/assets/compare/loading/photo-03-square.webp';
import photo04Square from '@/assets/compare/loading/photo-04-square.webp';
import photo05Square from '@/assets/compare/loading/photo-05-square.webp';
import photo06Square from '@/assets/compare/loading/photo-06-square.webp';

/**
 * 로딩 화면(CompareLoading)에서 순서대로 바뀌는 사진 6장.
 * - square: 정사각형(최종 단계) 사진 — 필수
 * - wide:   처음 열릴 때 보이는 가로 크롭 사진 — 없으면 square 를 가로로 잘라 쓴다 (첫 사진에만 쓴다)
 *
 * photo-02 ~ 06 은 Figma 1597:185 의 사진 5장(왼쪽부터 순서대로)이다. 248×248 로 받은 이미지라
 * 화면이 2배 해상도(레티나)면 조금 부드럽게 보일 수 있다. 큰 원본을 받으면 같은 이름으로 교체하면 된다.
 * 사진을 더 넣으려면 assets/compare/loading/ 에 photo-07-square.webp 처럼 넣고 이 배열에 추가한다.
 */
export const LOADING_PHOTOS = [
  { id: 'photo-01', wide: photo01Wide, square: photo01Square },
  { id: 'photo-02', square: photo02Square },
  { id: 'photo-03', square: photo03Square },
  { id: 'photo-04', square: photo04Square },
  { id: 'photo-05', square: photo05Square },
  { id: 'photo-06', square: photo06Square },
];
