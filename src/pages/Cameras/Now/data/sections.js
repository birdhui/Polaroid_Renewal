/**
 * Cameras › Polaroid Now 상세 페이지 콘텐츠 데이터.
 * Figma "Cameras-detail Page" > "Cameras - NOW" 프레임에서 그대로 옮긴 카피이고,
 * 이미지는 같은 프레임의 레이어를 export_node_as_image로 내려받아 src/assets/cameras/now/ 에 둔 것이다.
 * 기능 02·03의 tag/tagLabel이 기능 01과 동일한 "FUNCTION — 01 / TWO-LENS AUTOFOCUS"로 남아있는 것은
 * 원본 Figma 파일의 복붙 누락으로 보이는 값이라 추측해서 고치지 않고 그대로 반영했다. 디자인 담당자 확인 필요.
 */
import heroImage from '../../../../assets/cameras/now/hero.jpg';
import introProductImage from '../../../../assets/cameras/now/intro-product.jpg';
import featureAutofocusImage from '../../../../assets/cameras/now/feature-autofocus.jpg';
import featureDoubleExposureImage from '../../../../assets/cameras/now/feature-double-exposure.jpg';
import featureSharpnessImage from '../../../../assets/cameras/now/feature-sharpness.jpg';
import filterPreviewImage from '../../../../assets/cameras/now/filter-preview.jpg';
import appStoryImage from '../../../../assets/cameras/now/app-story.jpg';
import purchaseShot1Image from '../../../../assets/cameras/now/purchase-shot-1.jpg';
import purchaseShot2Image from '../../../../assets/cameras/now/purchase-shot-2.jpg';
import purchaseShot3Image from '../../../../assets/cameras/now/purchase-shot-3.jpg';
import productNowPlusImage from '../../../../assets/cameras/now/product-now-plus.png';
import productFlipImage from '../../../../assets/cameras/now/product-flip.png';
import productModImage from '../../../../assets/cameras/now/product-mod.png';
import productI2Image from '../../../../assets/cameras/now/product-i2.png';
import productGoImage from '../../../../assets/cameras/now/product-go.png';

export const hero = {
  title: 'Now',
  description:
    '일상에서 문득 남기고 싶은 순간을 발견했다면, Now를 들어 셔터를 눌러보세요. 자동초점이 피사체에 맞춰져 그 순간을 한 장에 담아줍니다.',
  image: heroImage,
};

export const intro = {
  eyebrow: 'Iconic Polaroid design',
  heading: ['일상의 모든 순간.', '모두 Polaroid Now로.'],
  wordmark: 'Now',
  image: introProductImage,
};

export const featuresHeading = '모든 순간을 특별하게 남기는 세 가지 방법.';

/**
 * Figma의 모든 섹션 하단에 공통으로 깔리는 큰 영문 배경 레이블("Three ways to make
 * every moment count"). 원본은 스크롤에 따라 다음 섹션으로 걸치며 보이는 모션이지만,
 * 정적 구현에서는 각 섹션 하단에 옅은 투명도의 고정 배경 문구로만 표현한다.
 */
export const backgroundLabel = ['Three ways to make', 'every moment count'];

export const features = [
  {
    id: 'two-lens-autofocus',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '가까운 얼굴도, 먼 풍경도 알아서 또렷하게.',
    image: featureAutofocusImage,
    ghosts: [
      { text: '두 번 찍으면 두 장면이 한 장에.', opacity: 0.2 },
      { text: '강한 햇빛 아래서도 더 선명하게', opacity: 0.1 },
    ],
  },
  {
    id: 'double-exposure',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '두 번 찍으면 두 장면이 한 장에.',
    image: featureDoubleExposureImage,
    ghosts: [
      { text: '강한 햇빛 아래서도 더 선명하게', opacity: 0.1 },
      { text: '가까운 얼굴도, 먼 풍경도 알아서 또렷하게.', opacity: 0.2 },
    ],
  },
  {
    id: 'sharpness',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '강한 햇빛 아래서도 더 선명하게.',
    image: featureSharpnessImage,
    ghosts: [
      { text: '가까운 얼굴도, 먼 풍경도 알아서 또렷하게.', opacity: 0.2 },
      { text: '두 번 찍으면 두 장면이 한 장에.', opacity: 0.2 },
    ],
  },
];

export const filterShowcase = {
  eyebrow: 'Polaroid NOW filter',
  heading: '다양한 색의 렌즈로 세상을 새롭게 바라보는 방법.',
  previewImage: filterPreviewImage,
  items: [
    { id: 'yellow', label: 'YELLOW', color: '#e9de62' },
    { id: 'blue', label: 'BLUE', color: '#5f93c8' },
    { id: 'starburst', label: 'STARBURST', color: '#d7dbdf', featured: true },
    { id: 'red-vignette', label: 'RED VIGNETTE', color: '#c8423b' },
    { id: 'orange', label: 'ORANGE', color: '#e39a52' },
  ],
};

export const appPromo = {
  eyebrow: 'Polaroid App',
  heading: '폴라로이드 앱에서 사진을 스캔하고 공유하는 방법.',
  description:
    '앱스토어와 구글 플레이에서 폴라로이드 앱을 다운받아 더 많은 기능과 효과를 체험해보세요. 손쉽게 사진을 스캔하고 공유해보세요.',
  image: appStoryImage,
};

export const purchaseCta = {
  heading: '오늘의 어떤 순간을 첫 장으로 남길까요?',
  wordmark: 'Now',
  ctaLabel: '구매하기',
  // Figma 좌→우 순서: Shot 1(왼쪽, 573×573) → Shot 3(가운데, 573×573) → Shot 2(오른쪽, 622×573)
  images: [purchaseShot1Image, purchaseShot3Image, purchaseShot2Image],
};

export const discoverMore = {
  heading: ['Discover', 'More Cameras.'],
  description:
    '저마다 다른 매력을 가진 폴라로이드 카메라. 촬영 방식부터 디자인, 기능까지 살펴보고 당신에게 어울리는 또 다른 카메라를 만나보세요.',
  products: [
    { id: 'now-plus', label: 'Now+', row: 1, image: productNowPlusImage },
    { id: 'flip', label: 'Flip', row: 1, image: productFlipImage },
    { id: 'mod', label: 'Mod', row: 1, image: productModImage },
    { id: 'i-2', label: 'I-2', row: 2, image: productI2Image },
    { id: 'go', label: 'Go', row: 2, image: productGoImage },
  ],
};
