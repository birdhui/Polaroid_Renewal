/**
 * Compare 추천 대상 카메라 6종 — 제품 정보만 둔다. (추천 순서는 compareRecommendations.js)
 * Go · Now · Now+ 는 Generation 3 모델이다.
 *
 * 값이 정해지지 않은 항목은 임의로 채우지 않고 null 또는 빈 값으로 둔다.
 * - image: null 이면 "이미지 준비 중" 자리가 표시된다. 제품 이미지를 받으면 import 해서 채운다.
 * - price: null 이면 "가격 확인 중"으로 표시된다. 국내 판매가가 확인되면 채운다.
 * - detailPath: 제품 상세페이지 경로. 상세페이지가 생기면 채운다. null 이면 버튼은 연결 전 상태다.
 * - colors: [{id, hex, image}] — image 가 있는 칩은 눌렀을 때 제품 이미지가 바뀐다. 확인되지 않은 모델은 비워 둔다.
 * Go · Now · Flip 기본 이미지와 컬러칩은 Figma 시안 값이다.
 * imageSize 는 추천 카드에 표시되는 제품 이미지 크기(1920 기준 px)다. Go 165 · Now 159 · Flip 156 은 시안 값이고,
 * 시안에 없는 모델(Now+ · Mod · i-2)은 Now 와 같은 159 로 맞춰 두었다.
 */
import productGo from '@/assets/compare/product-go.webp';
import productNow from '@/assets/compare/product-now.webp';
import productFlip from '@/assets/compare/product-flip.webp';
import productMod from '@/assets/compare/product-mod.webp';
import productI2 from '@/assets/compare/product-i2.webp';
import goTeal from '@/assets/compare/colors/go-teal.webp';
import goLightBlue from '@/assets/compare/colors/go-light-blue.webp';
import goWhite from '@/assets/compare/colors/go-white.webp';
import goBlack from '@/assets/compare/colors/go-black.webp';
import nowTeal from '@/assets/compare/colors/now-teal.webp';
import nowPink from '@/assets/compare/colors/now-pink.webp';
import nowCoral from '@/assets/compare/colors/now-coral.webp';
import nowLightBlue from '@/assets/compare/colors/now-light-blue.webp';
import nowPurple from '@/assets/compare/colors/now-purple.webp';
import nowYellow from '@/assets/compare/colors/now-yellow.webp';
import nowBlack from '@/assets/compare/colors/now-black.webp';
import nowPlusBlack from '@/assets/compare/colors/now-plus-black.webp';
import nowPlusWhite from '@/assets/compare/colors/now-plus-white.webp';
import nowPlusCoral from '@/assets/compare/colors/now-plus-coral.webp';
import nowPlusArcticBlue from '@/assets/compare/colors/now-plus-arctic-blue.webp';
import flipBlack from '@/assets/compare/colors/flip-black.webp';

export const COMPARE_PRODUCTS = {
  go: {
    id: 'go',
    name: 'Polaroid Go',
    generation: 'Generation 3',
    price: '₩ 159,000',
    summary: '가볍고 컴팩트해 어디서든 함께하기 좋은 카메라',
    image: productGo,
    imageSize: { width: 165, height: 165 },
    // image 가 있는 색은 칩을 눌렀을 때 제품 이미지가 바뀐다. defaultColor 는 기본 이미지(Figma)에 해당하는 색 id.
    defaultColor: 'purple',
    colors: [
      { id: 'purple', hex: '#ba91d4', image: productGo },
      { id: 'teal', hex: '#4ebcb0', image: goTeal },
      { id: 'light-blue', hex: '#87a5b7', image: goLightBlue },
      { id: 'white', hex: '#f0f0f0', image: goWhite },
      { id: 'black', hex: '#3e3e3e', image: goBlack },
    ],
    film: 'Go 전용',
    feature: '간편한 자동 촬영',
    weight: '약 252g',
    recommendReason: '작고 가벼운 휴대성',
    detailPath: null,
  },
  now: {
    id: 'now',
    name: 'Polaroid Now',
    generation: 'Generation 3',
    price: '₩ 229,000',
    summary: '간편한 촬영으로 일상의 순간을 기록하는 기본 모델',
    badge: '입문자용', // 카드 이미지 아래 주황 라벨 (Figma 2374:1505). 시안에 라벨이 있는 모델만 둔다
    image: productNow,
    imageSize: { width: 159, height: 159 },
    defaultColor: 'white',
    colors: [
      { id: 'teal', hex: '#00aea3', image: nowTeal },
      { id: 'pink', hex: '#f2b5ba', image: nowPink },
      { id: 'coral', hex: '#f59c7a', image: nowCoral },
      { id: 'light-blue', hex: '#acdbe3', image: nowLightBlue },
      { id: 'purple', hex: '#a48aba', image: nowPurple },
      { id: 'white', hex: '#e9e7e0', image: productNow },
      { id: 'yellow', hex: '#ecde60', image: nowYellow },
      { id: 'black', hex: '#494a4c', image: nowBlack },
    ],
    film: 'i-Type / 600',
    feature: '2영역 자동 초점',
    weight: '약 448g',
    recommendReason: '간편한 기본 촬영',
    detailPath: null,
  },
  nowPlus: {
    id: 'nowPlus',
    name: 'Polaroid Now+',
    generation: 'Generation 3',
    price: '₩ 259,000',
    summary: '앱 연동으로 다양한 촬영 설정을 활용할 수 있는 카메라',
    image: nowPlusBlack,
    imageSize: { width: 159, height: 159 },
    // 국내 판매 색상: 블랙 · 화이트 · 코랄 · 아틱블루 (hex 는 제품 이미지에서 추출)
    defaultColor: 'black',
    colors: [
      { id: 'arctic-blue', hex: '#82cada', image: nowPlusArcticBlue },
      { id: 'coral', hex: '#f67952', image: nowPlusCoral },
      { id: 'black', hex: '#000000', image: nowPlusBlack },
      { id: 'white', hex: '#ffffff', image: nowPlusWhite },
    ],
    film: 'i-Type / 600',
    feature: '앱 연동 · 2영역 자동 초점 · 앱 수동 촬영',
    weight: '약 452g',
    recommendReason: '다양한 촬영 설정',
    detailPath: null,
  },
  flip: {
    id: 'flip',
    name: 'Polaroid Flip',
    generation: null,
    price: '₩ 399,000',
    summary: '자동 초점과 노출 경고로 촬영을 도와주는 카메라',
    badge: '전문가용', // Figma 2374:1507
    image: productFlip,
    imageSize: { width: 156, height: 156 },
    defaultColor: 'white',
    colors: [
      { id: 'white', hex: '#ffffff', image: productFlip },
      { id: 'black', hex: '#6f6f6f', image: flipBlack },
    ],
    film: 'i-Type / 600',
    feature: '초음파 자동 초점',
    weight: '약 648g',
    recommendReason: '노출 경고 기능',
    detailPath: null,
  },
  mod: {
    id: 'mod',
    name: 'Polaroid Mod',
    generation: null,
    price: null, // 국내 판매가가 확인되지 않아 임의로 채우지 않는다.
    summary: '4가지 창작 모드로 색다른 촬영을 즐기는 카메라',
    image: productMod,
    imageSize: { width: 159, height: 159 },
    defaultColor: 'graphite',
    colors: [{ id: 'graphite', hex: '#555555', image: productMod }], // Figma 시안 색상
    film: 'i-Type / 600',
    feature: '4가지 창작 모드 · 밝기 조절',
    weight: '약 520g',
    recommendReason: '창의적인 촬영 효과',
    detailPath: null,
  },
  i2: {
    id: 'i2',
    name: 'Polaroid I-2',
    generation: null,
    price: '₩ 1,090,000',
    summary: '정교한 초점과 수동 조절을 지원하는 전문가용 카메라',
    image: productI2,
    imageSize: { width: 159, height: 159 },
    defaultColor: 'black',
    colors: [{ id: 'black', hex: '#1c1c1c', image: productI2 }],
    film: 'i-Type / 600 / SX-70',
    feature: '연속 자동 초점 · 수동 제어',
    weight: '약 563g',
    recommendReason: '전문적인 촬영 설정',
    detailPath: null,
  },
};
