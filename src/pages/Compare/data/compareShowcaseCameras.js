/**
 * Compare 히어로의 카메라 배치 — Figma 3398:1641 (1920 x 1080 화면 기준 px).
 * grid: 처음에 격자로 나열된 자리(Frame 289) · scatter: 흩어졌을 때 가장자리에 남는 자리(Frame 287, 일부는 화면 밖으로 걸쳐 있다)
 * kept: 마지막 화면(Frame 290)에도 남는지 — 가운데 6대(kept: false)는 흩어질 때 나가고 돌아오지 않는다.
 * 카메라 이미지는 프로젝트에 있는 누끼 이미지(assets/compare/colors, product-*)를 시안의 모델·색에 맞춰 골랐다.
 */
import flipBlack from '@/assets/compare/colors/flip-black.webp';
import goBlack from '@/assets/compare/colors/go-black.webp';
import goLightBlue from '@/assets/compare/colors/go-light-blue.webp';
import goTeal from '@/assets/compare/colors/go-teal.webp';
import goWhite from '@/assets/compare/colors/go-white.webp';
import nowBlack from '@/assets/compare/colors/now-black.webp';
import nowCoral from '@/assets/compare/colors/now-coral.webp';
import nowLightBlue from '@/assets/compare/colors/now-light-blue.webp';
import nowPink from '@/assets/compare/colors/now-pink.webp';
import nowPlusArctic from '@/assets/compare/colors/now-plus-arctic-blue.webp';
import nowPlusBlack from '@/assets/compare/colors/now-plus-black.webp';
import nowPlusCoral from '@/assets/compare/colors/now-plus-coral.webp';
import nowPlusWhite from '@/assets/compare/colors/now-plus-white.webp';
import nowPurple from '@/assets/compare/colors/now-purple.webp';
import nowTeal from '@/assets/compare/colors/now-teal.webp';
import nowYellow from '@/assets/compare/colors/now-yellow.webp';
import productFlip from '@/assets/compare/product-flip.webp';
import productGo from '@/assets/compare/product-go.webp';
import productI2 from '@/assets/compare/product-i2.webp';
import productMod from '@/assets/compare/product-mod.webp';
import productNow from '@/assets/compare/product-now.webp';

export const SHOWCASE_STAGE = { width: 1920, height: 1080 };

export const SHOWCASE_CAMERAS = [
  { id: 'goTeal', src: goTeal, x: 375, y: 141, w: 125, h: 125, scatter: { x: 377, y: -34, w: 114, h: 113 }, kept: true },
  { id: 'nowCoral', src: nowCoral, x: 1434, y: 593, w: 118, h: 118, kept: true },
  { id: 'goPurple', src: productGo, x: 1175, y: 141, w: 125, h: 125, scatter: { x: 1325, y: -52, w: 113, h: 113 }, kept: true },
  { id: 'nowPlusBlue', src: nowPlusArctic, x: 913, y: 148, w: 109, h: 109, kept: true },
  { id: 'nowPlusBlack', src: nowPlusBlack, x: 1434, y: 147, w: 113, h: 113, scatter: { x: 1506, y: -52, w: 106, h: 106 }, kept: true },
  { id: 'nowPinkA', src: nowPink, x: 132, y: 372, w: 102, h: 111, kept: true },
  { id: 'nowPinkB', src: nowPink, x: 1175, y: 824, w: 110, h: 110, scatter: { x: 1196, y: 990, w: 107, h: 107 }, kept: true },
  { id: 'nowBlack', src: nowBlack, x: 364, y: 374, w: 108, h: 108, kept: true },
  { id: 'nowYellowB', src: nowYellow, x: 1690, y: 823, w: 110, h: 110, scatter: { x: 1771, y: 918, w: 108, h: 108 }, kept: true },
  { id: 'modA', src: productMod, x: 1698, y: 374, w: 98, h: 106, kept: true },
  { id: 'modB', src: productMod, x: 369, y: 827, w: 103, h: 103, scatter: { x: 326, y: 1000, w: 103, h: 103 }, kept: true },
  { id: 'nowCream', src: productNow, x: 1435, y: 370, w: 112, h: 112, kept: true },
  { id: 'nowCreamB', src: productNow, x: 916, y: 819, w: 105, h: 111, kept: true },
  { id: 'nowTealB', src: nowTeal, x: 124, y: 824, w: 110, h: 110, scatter: { x: -22, y: 916, w: 110, h: 110 }, kept: true },
  { id: 'i2', src: productI2, x: 132, y: 145, w: 116, h: 116, scatter: { x: 38, y: 60, w: 101, h: 100 }, kept: true },
  { id: 'flipOrange', src: productFlip, x: 129, y: 590, w: 125, h: 125, kept: true },
  { id: 'nowArctic', src: nowLightBlue, x: 369, y: 595, w: 118, h: 118, kept: true },
  { id: 'flipBlack', src: flipBlack, x: 1691, y: 597, w: 119, h: 119, kept: true },
  { id: 'goWhiteA', src: goWhite, x: 625, y: 131, w: 144, h: 144, scatter: { x: 567, y: -52, w: 131, h: 131 }, kept: true },
  { id: 'goWhiteB', src: goWhite, x: 1427, y: 809, w: 135, h: 135, scatter: { x: 1340, y: 972, w: 131, h: 131 }, kept: true },
  { id: 'nowPlusCoralA', src: nowPlusCoral, x: 1689, y: 150, w: 111, h: 111, scatter: { x: 1778, y: 60, w: 101, h: 100 }, kept: true },
  { id: 'nowPlusCoralB', src: nowPlusCoral, x: 633, y: 812, w: 112, h: 119, scatter: { x: 466, y: 997, w: 101, h: 100 }, kept: true },
  { id: 'nowPlusWhite', src: nowPlusWhite, x: 912, y: 592, w: 124, h: 124, kept: false },
  { id: 'nowYellowA', src: nowYellow, x: 633, y: 376, w: 111, h: 107, kept: false },
  { id: 'nowTealA', src: nowTeal, x: 1175, y: 372, w: 110, h: 110, kept: false },
  { id: 'nowPurple', src: nowPurple, x: 916, y: 373, w: 109, h: 109, kept: false },
  { id: 'goLightBlue', src: goLightBlue, x: 633, y: 597, w: 112, h: 122, kept: false },
  { id: 'goBlack', src: goBlack, x: 1175, y: 597, w: 119, h: 119, kept: false },
];
