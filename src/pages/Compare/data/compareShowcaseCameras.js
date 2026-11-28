/**
 * Compare 히어로의 카메라 배치 (1920 x 1080 화면 기준 px).
 * grid: 처음에 격자로 나열된 자리(Figma 3398:1641 Frame 289)
 * scatter: 마지막에 가장자리에 남는 자리 — Figma 3542:918 (18대, 일부는 화면 밖으로 걸쳐 있다)
 * kept: 마지막 화면에 남는지 — 18대(kept: true)만 남고, 나머지 10대(kept: false)는 흩어질 때 나가고 돌아오지 않는다.
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
  { id: 'goTeal', src: goTeal, x: 364, y: 95, w: 138, h: 138, scatter: { x: 400, y: 58, w: 138, h: 138 }, kept: true },
  { id: 'nowCoral', src: nowCoral, x: 1436, y: 610, w: 126, h: 126, scatter: { x: 1662, y: 578, w: 126, h: 126 }, kept: true },
  { id: 'goPurple', src: productGo, x: 1158, y: 104, w: 139, h: 139, kept: false },
  { id: 'nowPlusBlue', src: nowPlusArctic, x: 891, y: 103, w: 130, h: 130, kept: false },
  { id: 'nowPlusBlack', src: nowPlusBlack, x: 1427, y: 110, w: 128, h: 128, scatter: { x: 1376, y: 88, w: 128, h: 128 }, kept: true },
  { id: 'nowPinkA', src: nowPink, x: 137, y: 348, w: 122, h: 133, scatter: { x: -62, y: 445, w: 122, h: 133 }, kept: true },
  { id: 'nowPinkB', src: nowPink, x: 905, y: 814, w: 126, h: 126, kept: false },
  { id: 'nowBlack', src: nowBlack, x: 366, y: 355, w: 125, h: 125, scatter: { x: 218, y: 293, w: 125, h: 125 }, kept: true },
  { id: 'nowYellowB', src: nowYellow, x: 1437, y: 816, w: 125, h: 125, scatter: { x: 1735, y: 898, w: 125, h: 125 }, kept: true },
  { id: 'modA', src: productMod, x: 1698, y: 375, w: 112, h: 121, scatter: { x: 1853, y: 216, w: 112, h: 121 }, kept: true },
  { id: 'modB', src: productMod, x: 369, y: 808, w: 122, h: 122, scatter: { x: 339, y: 837, w: 122, h: 122 }, kept: true },
  { id: 'nowCream', src: productNow, x: 1433, y: 374, w: 122, h: 122, scatter: { x: 1586, y: 293, w: 122, h: 122 }, kept: true },
  { id: 'nowCreamB', src: productNow, x: 1178, y: 815, w: 119, h: 126, scatter: { x: 1504, y: 833, w: 119, h: 126 }, kept: true },
  { id: 'nowTealB', src: nowTeal, x: 124, y: 804, w: 130, h: 130, scatter: { x: 63, y: 875, w: 130, h: 130 }, kept: true },
  { id: 'i2', src: productI2, x: 129, y: 99, w: 130, h: 130, scatter: { x: -33, y: 207, w: 130, h: 130 }, kept: true },
  { id: 'flipOrange', src: productFlip, x: 129, y: 590, w: 125, h: 125, scatter: { x: -62, y: 689, w: 125, h: 125 }, kept: true },
  { id: 'nowArctic', src: nowLightBlue, x: 366, y: 595, w: 124, h: 124, scatter: { x: 188, y: -16, w: 124, h: 124 }, kept: true },
  { id: 'flipBlack', src: flipBlack, x: 1693, y: 610, w: 122, h: 122, scatter: { x: 1879, y: 472, w: 106, h: 106 }, kept: true },
  { id: 'goWhiteA', src: goWhite, x: 610, y: 85, w: 158, h: 158, kept: false },
  { id: 'goWhiteB', src: goWhite, x: 1678, y: 814, w: 151, h: 151, scatter: { x: 1834, y: 656, w: 151, h: 151 }, kept: true },
  { id: 'nowPlusCoralA', src: nowPlusCoral, x: 1683, y: 112, w: 124, h: 124, scatter: { x: 1664, y: -4, w: 124, h: 124 }, kept: true },
  { id: 'nowPlusCoralB', src: nowPlusCoral, x: 633, y: 806, w: 120, h: 127, scatter: { x: 160, y: 605, w: 120, h: 127 }, kept: true },
  { id: 'nowPlusWhite', src: nowPlusWhite, x: 900, y: 597, w: 135, h: 135, kept: false },
  { id: 'nowYellowA', src: nowYellow, x: 626, y: 366, w: 126, h: 121, kept: false },
  { id: 'nowTealA', src: nowTeal, x: 1175, y: 372, w: 120, h: 120, kept: false },
  { id: 'nowPurple', src: nowPurple, x: 900, y: 372, w: 120, h: 120, kept: false },
  { id: 'goLightBlue', src: goLightBlue, x: 633, y: 597, w: 119, h: 130, kept: false },
  { id: 'goBlack', src: goBlack, x: 1175, y: 614, w: 122, h: 122, kept: false },
];
