import flip from '@/assets/compare/hero/cam-flip.webp';
import nowCoral from '@/assets/compare/hero/cam-now-coral.webp';
import nowYellow from '@/assets/compare/hero/cam-now-yellow.webp';
import goBlack from '@/assets/compare/hero/cam-go-black.webp';
import nowPlusWhite from '@/assets/compare/hero/cam-nowplus-white.webp';
import nowPlusBlue from '@/assets/compare/hero/cam-nowplus-blue.webp';
import nowPink from '@/assets/compare/hero/cam-now-pink.webp';
import nowTeal from '@/assets/compare/hero/cam-now-teal.webp';
import goTeal from '@/assets/compare/hero/cam-go-teal.webp';
import slotR1C3 from '@/assets/compare/hero/crop-r1c3.webp';
import slotR2C4 from '@/assets/compare/hero/crop-r2c4.webp';
import slotR2C5 from '@/assets/compare/hero/crop-r2c5.webp';
import slotR3C1 from '@/assets/compare/hero/crop-r3c1.webp';
import slotR3C2 from '@/assets/compare/hero/crop-r3c2.webp';

/**
 * 히어로 카메라 배치.
 * 좌표·크기는 기존 히어로 이미지(hero-cameras.webp, 2560 x 1416) 안의 픽셀 값이라
 * 정지 상태에서 기존 히어로와 같은 자리·같은 크기로 보인다. (x, y 는 이미지 왼쪽 위 기준, w x h 는 그림자 여백까지 포함한 크기)
 *
 * kind
 *  - 'cutout' : 전달받은 누끼 카메라 + 기존 히어로와 같은 그림자를 합친 이미지
 *  - 'crop'   : 누끼가 아직 없는 카메라. 기존 히어로에서 잘라낸 임시 이미지다.
 *               해당 카메라의 누끼를 받으면 이미지 파일만 바꾸고 kind 를 'cutout' 으로 고친다.
 */
export const HERO_STAGE = { width: 2560, height: 1416 };

export const HERO_CAMERAS = [
  // 1행
  { id: 'flip', kind: 'cutout', src: flip, x: -165, y: -185, w: 615, h: 615 },
  { id: 'nowCoral', kind: 'cutout', src: nowCoral, x: 404, y: -193, w: 602, h: 602 },
  { id: 'slotR1C3', kind: 'crop', src: slotR1C3, x: 1062, y: 0, w: 409, h: 323 },
  { id: 'nowYellow', kind: 'cutout', src: nowYellow, x: 1610, y: -192, w: 603, h: 603 },
  { id: 'goBlack', kind: 'cutout', src: goBlack, x: 2192, y: -198, w: 639, h: 639 },
  // 2행 (가운데는 문구 자리)
  { id: 'nowPlusWhite', kind: 'cutout', src: nowPlusWhite, x: -188, y: 425, w: 615, h: 615 },
  { id: 'nowPlusBlue', kind: 'cutout', src: nowPlusBlue, x: 339, y: 439, w: 584, h: 584 },
  { id: 'slotR2C4', kind: 'crop', src: slotR2C4, x: 1753, y: 474, w: 409, h: 468 },
  { id: 'slotR2C5', kind: 'crop', src: slotR2C5, x: 2268, y: 474, w: 292, h: 485 },
  // 3행
  { id: 'slotR3C1', kind: 'crop', src: slotR3C1, x: 0, y: 1088, w: 422, h: 328 },
  { id: 'slotR3C2', kind: 'crop', src: slotR3C2, x: 463, y: 1088, w: 462, h: 328 },
  { id: 'nowPink', kind: 'cutout', src: nowPink, x: 1023, y: 1052, w: 584, h: 584 },
  { id: 'nowTeal', kind: 'cutout', src: nowTeal, x: 1590, y: 1053, w: 584, h: 584 },
  { id: 'goTeal', kind: 'cutout', src: goTeal, x: 2169, y: 1021, w: 655, h: 655 },
];
