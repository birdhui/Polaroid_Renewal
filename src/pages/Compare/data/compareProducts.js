/**
 * Compare 결과 — 카메라 3종 비교 데이터 (Figma 시안 기준).
 * 문구·가격·색상은 시안과 함께 확인한다. 실제 가격·사양은 상품 데이터가 확정되면 교체한다.
 */
import productGo from '@/assets/compare/product-go.webp';
import productNow from '@/assets/compare/product-now.webp';
import productFlip from '@/assets/compare/product-flip.webp';

export const COMPARE_PRODUCTS = [
  {
    id: 'go',
    name: 'Polaroid Go',
    price: '₩ 159,000',
    summary: '가볍고 컴팩트해 어디서든 함께하기 좋은 카메라',
    image: productGo,
    imageSize: { width: 216, height: 217 },
    colors: ['#ba91d4', '#4ebcb0', '#87a5b7', '#f0f0f0', '#3e3e3e'],
    film: 'Go 전용',
    specs: [
      { label: '촬영 특징', value: '간편한 자동 촬영' },
      { label: '무게 (g)', value: '약 252g' },
      { label: '추천 이유', value: '작고 가벼운 휴대성' },
    ],
  },
  {
    id: 'now',
    name: 'Polaroid Now',
    price: '₩ 229,000',
    summary: '간편한 촬영으로 일상의 순간을 기록하는 기본 모델',
    image: productNow,
    imageSize: { width: 208, height: 208 },
    colors: ['#00aea3', '#f2b5ba', '#f59c7a', '#acdbe3', '#a48aba', '#e9e7e0', '#ecde60', '#494a4c'],
    film: 'i-Type / 600',
    specs: [
      { label: '촬영 특징', value: '2영역 자동 초점' },
      { label: '무게 (g)', value: '약 448g' },
      { label: '추천 이유', value: '간편한 기본 촬영' },
    ],
  },
  {
    id: 'flip',
    name: 'Polaroid Flip',
    price: '₩ 399,000',
    summary: '자동 초점과 노출 경고로 촬영을 도와주는 카메라',
    image: productFlip,
    imageSize: { width: 214, height: 214 },
    colors: ['#ffffff', '#6f6f6f'],
    film: 'i-Type / 600',
    specs: [
      { label: '촬영 특징', value: '초음파 자동 초점' },
      { label: '무게 (g)', value: '약 648g' },
      { label: '추천 이유', value: '노출 경고 기능' },
    ],
  },
];
