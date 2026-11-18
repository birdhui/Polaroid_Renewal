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
    imageSize: { width: 216, height: 217 },
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
    detailPath: null,
  },
  now: {
    id: 'now',
    name: 'Polaroid Now',
    generation: 'Generation 3',
    price: '₩ 229,000',
    summary: '간편한 촬영으로 일상의 순간을 기록하는 기본 모델',
    image: productNow,
    imageSize: { width: 208, height: 208 },
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
    detailPath: null,
  },
  nowPlus: {
    id: 'nowPlus',
    name: 'Polaroid Now+',
    generation: 'Generation 3',
    price: '₩ 259,000',
    summary: '앱 연동으로 촬영 설정을 넓혀 쓰는 Now 시리즈 모델',
    image: nowPlusBlack,
    imageSize: { width: 208, height: 208 },
    // 국내 판매 색상: 블랙 · 화이트 · 코랄 · 아틱블루 (hex 는 제품 이미지에서 추출)
    defaultColor: 'black',
    colors: [
      { id: 'black', hex: '#161617', image: nowPlusBlack },
      { id: 'white', hex: '#e4e4e6', image: nowPlusWhite },
      { id: 'coral', hex: '#f67952', image: nowPlusCoral },
      { id: 'arctic-blue', hex: '#82cada', image: nowPlusArcticBlue },
    ],
    film: 'i-Type / 600',
    feature: '2영역 자동 초점 · 앱 연동 수동 촬영',
    weight: '약 452g',
    detailPath: null,
  },
  flip: {
    id: 'flip',
    name: 'Polaroid Flip',
    generation: null,
    price: '₩ 399,000',
    summary: '자동 초점과 노출 경고로 촬영을 도와주는 카메라',
    image: productFlip,
    imageSize: { width: 214, height: 214 },
    defaultColor: null,
    colors: [
      { id: 'white', hex: '#ffffff', image: null },
      { id: 'black', hex: '#6f6f6f', image: flipBlack },
    ],
    film: 'i-Type / 600',
    feature: '초음파 자동 초점',
    weight: '약 648g',
    detailPath: null,
  },
  mod: {
    id: 'mod',
    name: 'Polaroid Mod',
    generation: null,
    price: null, // 국내 판매가가 확인되지 않아 임의로 채우지 않는다.
    summary: '다이얼로 창작 모드를 바꿔 쓰는 아날로그 카메라',
    image: productMod,
    imageSize: { width: 208, height: 208 },
    defaultColor: null,
    colors: [], // 공식 색상 미확인 — 확인 후 채운다.
    film: 'i-Type / 600',
    feature: '4가지 창작 모드 다이얼',
    weight: '약 520g',
    detailPath: null,
  },
  i2: {
    id: 'i2',
    name: 'Polaroid I-2',
    generation: null,
    price: '₩ 1,090,000',
    summary: '조리개와 셔터 속도를 직접 조절하는 수동 조작 카메라',
    image: productI2,
    imageSize: { width: 208, height: 208 },
    defaultColor: 'black',
    colors: [{ id: 'black', hex: '#3e3e3e', image: productI2 }],
    film: 'i-Type / 600 / SX-70',
    feature: '본체 수동 노출 조절',
    weight: '약 563g',
    detailPath: null,
  },
};
