import flip from '@/assets/compare/hero/cam-flip.webp';
import nowCoral from '@/assets/compare/hero/cam-now-coral.webp';
import nowPlusBlack from '@/assets/compare/hero/cam-nowplus-black.webp';
import nowYellow from '@/assets/compare/hero/cam-now-yellow.webp';
import goBlack from '@/assets/compare/hero/cam-go-black.webp';
import nowPlusWhite from '@/assets/compare/hero/cam-nowplus-white.webp';
import nowPlusBlue from '@/assets/compare/hero/cam-nowplus-blue.webp';
import mod from '@/assets/compare/hero/cam-mod.webp';
import flipOrange from '@/assets/compare/hero/cam-flip-orange.webp';
import goPurple from '@/assets/compare/hero/cam-go-purple.webp';
import i2 from '@/assets/compare/hero/cam-i2.webp';
import nowPink from '@/assets/compare/hero/cam-now-pink.webp';
import nowTeal from '@/assets/compare/hero/cam-now-teal.webp';
import goTeal from '@/assets/compare/hero/cam-go-teal.webp';

/**
 * 히어로 카메라 배치.
 * 좌표·크기는 기존 히어로 이미지(hero-cameras.webp, 2560 x 1416) 안의 픽셀 값이라
 * 정지 상태에서 기존 히어로와 같은 자리·같은 크기로 보인다. (x, y 는 이미지 왼쪽 위 기준, w x h 는 그림자 여백까지 포함한 크기)
 * 각 이미지는 전달받은 누끼 카메라에 기존 히어로와 같은 그림자를 합친 것이다.
 */
export const HERO_STAGE = { width: 2560, height: 1416 };

export const HERO_CAMERAS = [
  // 1행
  { id: 'flip', src: flip, x: -165, y: -185, w: 615, h: 615 },
  { id: 'nowCoral', src: nowCoral, x: 404, y: -193, w: 602, h: 602 },
  { id: 'nowPlusBlack', src: nowPlusBlack, x: 1008, y: -179, w: 585, h: 585 },
  { id: 'nowYellow', src: nowYellow, x: 1610, y: -192, w: 603, h: 603 },
  { id: 'goBlack', src: goBlack, x: 2192, y: -198, w: 639, h: 639 },
  // 2행 (가운데는 문구 자리)
  { id: 'nowPlusWhite', src: nowPlusWhite, x: -188, y: 425, w: 615, h: 615 },
  { id: 'nowPlusBlue', src: nowPlusBlue, x: 339, y: 439, w: 584, h: 584 },
  { id: 'mod', src: mod, x: 1701, y: 445, w: 580, h: 580 },
  { id: 'flipOrange', src: flipOrange, x: 2234, y: 423, w: 617, h: 617 },
  // 3행
  { id: 'goPurple', src: goPurple, x: -202, y: 1019, w: 651, h: 651 },
  { id: 'i2', src: i2, x: 429, y: 1045, w: 591, h: 591 },
  { id: 'nowPink', src: nowPink, x: 1023, y: 1052, w: 584, h: 584 },
  { id: 'nowTeal', src: nowTeal, x: 1590, y: 1053, w: 584, h: 584 },
  { id: 'goTeal', src: goTeal, x: 2169, y: 1021, w: 655, h: 655 },
];
