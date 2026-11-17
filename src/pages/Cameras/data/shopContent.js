/**
 * Cameras 페이지 하단 '샵' 영역 정적 콘텐츠 (담당: 정준혁)
 *
 * 순서: 카메라 카테고리 → Best Sellers 소개 → 베스트셀러 6개 → Collaboration 소개 → 콜라보 4개
 * - 상품명·가격·한 줄 설명은 polaroid.com/en_us 에서 모델별 'Most popular' 정렬 1위 상품을 그대로 가져왔다. (2026-11-17 기준, USD)
 * - 무게·필름은 각 상품 페이지의 스펙 값이다.
 * - 타일 배경색·글자색은 이 페이지 전용 임시 값이다. 공통 토큰이 확정되면 교체한다.
 * - 콜라보 이미지는 아직 없다. `image`가 null이면 자리표시 박스가 렌더링된다.
 */
import modImage from '@/assets/cameras/polaroid-mod.webp';
import flipImage from '@/assets/cameras/polaroid-flip.webp';
import i2Image from '@/assets/cameras/polaroid-i2.webp';
import nowPlusImage from '@/assets/cameras/polaroid-now-plus.webp';
import nowImage from '@/assets/cameras/polaroid-now.webp';
import goImage from '@/assets/cameras/polaroid-go.webp';

const POLAROID_US = 'https://www.polaroid.com/en_us';

/**
 * 카메라 카테고리 타일 (instax.co.kr 카테고리 타일 구조 참고)
 * word: 타일을 가로지르는 큰 단어 / fs: 단어 크기(타일 폭 대비 cqw) / w: 카메라 폭(%)
 * halo: 카메라와 겹치는 외곽선 글자를 읽히게 하는 테두리 그림자 색
 */
export const CAMERA_TILES = [
  {
    id: 'mod',
    word: 'MOD',
    name: 'Polaroid Mod',
    href: `${POLAROID_US}/cameras/mod-camera`,
    image: { src: modImage, alt: 'Polaroid Mod 즉석카메라, 블랙 바디에 실버 링 렌즈' },
    bg: '#E3412B',
    fg: '#FFFFFF',
    fs: 33,
    w: 56,
  },
  {
    id: 'flip',
    word: 'FLIP',
    name: 'Polaroid Flip',
    href: `${POLAROID_US}/cameras/flip-camera`,
    image: { src: flipImage, alt: 'Polaroid Flip 즉석카메라, 화이트 바디에 오렌지 패널' },
    bg: '#1D7FC4',
    fg: '#FFFFFF',
    fs: 35,
    w: 60,
  },
  {
    id: 'i2',
    word: 'I-2',
    name: 'Polaroid I-2',
    href: `${POLAROID_US}/cameras/i2-camera`,
    image: { src: i2Image, alt: 'Polaroid I-2 즉석카메라, 블랙 바디' },
    bg: '#6B3FB5',
    fg: '#FFFFFF',
    fs: 42,
    w: 62,
  },
  {
    id: 'now-plus',
    word: 'NOW+',
    name: 'Polaroid Now+',
    href: `${POLAROID_US}/cameras/now-plus-camera`,
    image: { src: nowPlusImage, alt: 'Polaroid Now+ 즉석카메라, 화이트 바디' },
    bg: '#F6C243',
    fg: '#1A1712',
    halo: 'rgba(255, 255, 255, 0.75)',
    fs: 27,
    w: 54,
  },
  {
    id: 'now',
    word: 'NOW',
    name: 'Polaroid Now',
    href: `${POLAROID_US}/cameras/now-camera`,
    image: { src: nowImage, alt: 'Polaroid Now 즉석카메라, 화이트와 퍼플 바디' },
    bg: '#F28C28',
    fg: '#1A1712',
    halo: 'rgba(255, 255, 255, 0.75)',
    fs: 33,
    w: 54,
  },
  {
    id: 'go',
    word: 'GO',
    name: 'Polaroid Go',
    href: `${POLAROID_US}/cameras/go-camera`,
    image: { src: goImage, alt: 'Polaroid Go 즉석카메라, 라이트 블루 바디' },
    bg: '#74B544',
    fg: '#1A1712',
    halo: 'rgba(255, 255, 255, 0.75)',
    fs: 48,
    w: 58,
  },
];

export const CATEGORY_HEAD = {
  title: 'Shop by Camera',
  desc: '찍는 방식이 다르면 사진도 달라집니다. 나에게 맞는 폴라로이드를 모델별로 둘러보세요.',
};

/** Best Sellers 소개 (이미지는 추후 `image`에 연결) */
export const BEST_SELLER_INTRO = {
  eyebrow: 'OUR BEST SELLERS',
  title: ['Best Sellers'],
  desc: ['가장 많은 사람들의 순간을 함께한 폴라로이드.', '모델별로 가장 사랑받는 한 대씩을 모았습니다.'],
  image: null,
};

/** 모델별 베스트셀러 (polaroid.com/en_us · sort=Most popular · 1위) */
export const BEST_SELLERS = [
  {
    id: 'mod',
    model: 'MOD',
    name: 'Polaroid Mod Instant Camera',
    price: '$169.99',
    tagline: 'The instant camera for real analog creativity',
    film: 'i-Type · 600',
    weight: '520g',
    image: { src: modImage, alt: 'Polaroid Mod Instant Camera' },
    href: `${POLAROID_US}/products/polaroid-mod-instant-camera`,
  },
  {
    id: 'flip',
    model: 'FLIP',
    name: 'Polaroid Flip Starter Set Special',
    price: '$239.99',
    tagline: 'The ultimate easy-to-use instant camera',
    film: 'i-Type · 600',
    weight: '648g',
    image: { src: flipImage, alt: 'Polaroid Flip Starter Set Special' },
    href: `${POLAROID_US}/products/flip-starter-set-special`,
  },
  {
    id: 'i2',
    model: 'I-2',
    name: 'Polaroid I-2 Starter Set',
    price: '$614.99',
    tagline: 'The pro-grade instant camera engineered for craft',
    film: 'SX-70 · 600 · i-Type',
    weight: '563g',
    image: { src: i2Image, alt: 'Polaroid I-2 Starter Set' },
    href: `${POLAROID_US}/products/polaroid-i2-starter-set`,
  },
  {
    id: 'now-plus',
    model: 'NOW+',
    name: 'Polaroid Now+ Generation 3 Starter Set',
    price: '$164.99',
    tagline: 'The classic instant camera plus app connectivity',
    film: 'i-Type · 600',
    weight: '452g',
    image: { src: nowPlusImage, alt: 'Polaroid Now+ Generation 3 Starter Set' },
    href: `${POLAROID_US}/products/now-plus-starter-set`,
  },
  {
    id: 'now',
    model: 'NOW',
    name: 'Polaroid Now Generation 3 – Pokémon Edition',
    price: '$139.99',
    tagline: 'The classic instant camera',
    film: 'i-Type · 600',
    weight: '448g',
    image: { src: nowImage, alt: 'Polaroid Now Generation 3 – Pokémon Edition' },
    href: `${POLAROID_US}/products/polaroid-now-pokemon-edition`,
  },
  {
    id: 'go',
    model: 'GO',
    name: 'Polaroid Go Instant Camera Generation 3',
    price: '$89.99',
    tagline: 'The world’s smallest instant analog camera',
    film: 'Go 필름',
    weight: '251.9g',
    image: { src: goImage, alt: 'Polaroid Go Instant Camera Generation 3' },
    href: `${POLAROID_US}/products/go-polaroid-camera`,
  },
];

/** Collaboration 소개 (이미지는 추후 `image`에 연결) */
export const COLLAB_INTRO = {
  eyebrow: 'OUR COLLABORATION',
  title: ['Made Together.', 'Kept Forever.'],
  desc: [
    '아티스트와 브랜드, 그리고 오랫동안 사랑받아 온 캐릭터와 함께 만든 폴라로이드.',
    '서로 다른 두 세계가 만나 한 장의 사진으로 남습니다.',
  ],
  image: null,
};

export const COLLAB_HEAD = {
  title: 'Collaborations',
  desc: '지금 만날 수 있는 한정 에디션과 온라인 단독 세트.',
};

/** 콜라보 카드 (adidas.co.kr 콜라보 카드 구조 참고) */
export const COLLABS = [
  {
    id: 'pokemon',
    title: 'Polaroid x Pokémon',
    desc: '포켓몬 30주년, 모든 순간을 담을 준비',
    href: `${POLAROID_US}/discover/polaroid-pokemon-collaboration`,
    placeholder: { label: ['Polaroid', 'x Pokémon'], bg: '#FFD23F', fg: '#1A1712' },
    image: null,
  },
  {
    id: 'moma',
    title: 'Polaroid x MoMA',
    desc: '영감을 주도록 디자인하고, 창작을 위해 만들다',
    href: `${POLAROID_US}/products/polaroid-now-moma-edition`,
    placeholder: { label: ['Polaroid', 'x MoMA'], bg: '#ECE6DA', fg: '#1A1712' },
    image: null,
  },
  {
    id: 'thrasher',
    title: 'Polaroid x Thrasher',
    desc: '하이드로 디핑으로 완성한, 세상에 하나뿐인 카메라',
    href: `${POLAROID_US}/products/polaroid-now-thrasher-edition`,
    placeholder: { label: ['Polaroid', 'x Thrasher'], bg: '#151515', fg: '#F28C28' },
    image: null,
  },
  {
    id: 'online-exclusive',
    title: 'Online Exclusive Sets',
    desc: '온라인에서만 만나는 특별한 구성',
    href: `${POLAROID_US}/campaigns/online-exclusive-sets`,
    placeholder: { label: ['Online', 'Exclusive'], bg: '#1D7FC4', fg: '#FFFFFF' },
    image: null,
  },
];
