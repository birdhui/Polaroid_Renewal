/**
 * Cameras › Polaroid Now 상세 페이지 콘텐츠 데이터.
 * Figma "Cameras-detail Page" > "Cameras - NOW" 프레임(1827:3741)에서 그대로 옮긴 카피·좌표다.
 * 좌표·크기는 Figma 1920px 프레임 기준 px 값이고, CSS에서 화면 너비에 맞춰 비율로 환산한다.
 * 기능 02·03의 tag/tagLabel이 기능 01과 동일한 "FUNCTION — 01 / TWO-LENS AUTOFOCUS"인 것은
 * Figma 원본 값 그대로다. 디자인 담당자 확인 필요.
 */
import heroImage from '../../../../assets/cameras/now/hero.jpg';
import introProductImage from '../../../../assets/cameras/now/intro-product.jpg';
import featureBackgroundImage from '../../../../assets/cameras/now/feature-bg.jpg';
import featureAutofocusImage from '../../../../assets/cameras/now/feature-autofocus.jpg';
import featureDoubleExposureImage from '../../../../assets/cameras/now/feature-double-exposure.jpg';
import featureSharpnessImage from '../../../../assets/cameras/now/feature-sharpness.jpg';
import sectionBackgroundImage from '../../../../assets/cameras/now/dark-section-bg.jpg';
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
  description: [
    '일상에서 문득 남기고 싶은 순간을 발견했다면, Now를 들어 셔터를 눌러보세요.',
    '자동초점이 피사체에 맞춰져 그 순간을 한 장에 담아줍니다.',
  ],
  image: heroImage,
};

export const intro = {
  eyebrow: 'Iconic Polaroid design',
  heading: ['일상의 모든 순간.', '모두 Polaroid Now로.'],
  wordmark: 'Now',
  image: introProductImage,
};

export const featuresHeading = ['모든 순간을 특별하게 남기는', '세 가지 방법.'];

export const featureBackground = featureBackgroundImage;

/**
 * 04·05·06 프레임은 하나의 화면으로 구현한다(Figma 주석).
 * 선택한 기능이 위(진하게)에 오고, 나머지 둘이 ghosts 순서·투명도대로 아래에 흐리게 나온다.
 * imageTop/imageSize: 06 선명도 이미지만 762px(y 184)이고 나머지는 766px(y 180)이다.
 */
export const features = [
  {
    id: 'two-lens-autofocus',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '가까운 얼굴도, 먼 풍경도 알아서 또렷하게.',
    image: featureAutofocusImage,
    imageTop: 180,
    imageSize: 766,
    ghosts: [
      { id: 'double-exposure', opacity: 0.2 },
      { id: 'sharpness', opacity: 0.1 },
    ],
  },
  {
    id: 'double-exposure',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '두 번 찍으면 두 장면이 한 장에.',
    image: featureDoubleExposureImage,
    imageTop: 180,
    imageSize: 766,
    ghosts: [
      { id: 'sharpness', opacity: 0.1 },
      { id: 'two-lens-autofocus', opacity: 0.2 },
    ],
  },
  {
    id: 'sharpness',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '강한 햇빛 아래서도 더 선명하게',
    image: featureSharpnessImage,
    imageTop: 184,
    imageSize: 762,
    ghosts: [
      { id: 'two-lens-autofocus', opacity: 0.2 },
      { id: 'double-exposure', opacity: 0.2 },
    ],
  },
];

export const sectionBackground = sectionBackgroundImage;

export const filterShowcase = {
  eyebrow: 'Polaroid NOW filter',
  heading: ['다양한 색의 렌즈로', '세상을 새롭게 바라보는 방법.'],
  description:
    "The world is your laboratory and the filters are your test tubes. Pull up your sleeves and start experimenting with starburst, red vignette, orange, blue, and yellow effects with your Polaroid Now or Now+ Generation 3 camera. And when you're done protect your lens with included lens cap. See the world through different colored glasses. Not compatible with Polaroid Now Generation 1 or 2  cameras.",
  previewImage: filterPreviewImage,
  // x·y·size: Figma 좌표(px). 선택된 필터는 STARBURST이고, 노랑·주황은 opacity 0.4다.
  items: [
    { id: 'yellow', label: 'YELLOW', color: '#e9de62', x: 745, y: 858.7, size: 46, opacity: 0.4 },
    { id: 'blue', label: 'BLUE', color: '#5f93c8', x: 841, y: 858.7, size: 46, opacity: 1 },
    { id: 'starburst', label: 'STARBURST', color: '#d7dbdf', x: 929.6, y: 851.4, size: 60.7, opacity: 1, selected: true },
    { id: 'red-vignette', label: 'RED VIGNETTE', color: '#c8423b', x: 1033, y: 858.7, size: 46, opacity: 1 },
    { id: 'orange', label: 'ORANGE', color: '#e39a52', x: 1129, y: 858.7, size: 46, opacity: 0.4 },
  ],
};

export const appPromo = {
  eyebrow: 'Polaroid App',
  heading: ['폴라로이드 앱에서', '사진을 스캔하고 공유하는 방법.'],
  description: [
    '앱스토어와 구글 플레이에서',
    '폴라로이드 앱을 다운받아 더 많은 기능과 효과를 체험해보세요.',
    '손쉽게 사진을 스캔하고 공유해보세요.',
  ],
  image: appStoryImage,
  downloadLabel: 'DOWNLOAD APP',
  stores: ['IOS', 'ANDROID'],
  messagePlaceholder: 'Send message',
  profileName: 'Polaroid',
};

export const purchaseCta = {
  heading: '오늘의 어떤 순간을 첫 장으로 남길까요?',
  wordmark: 'Now',
  ctaLabel: '구매하기',
  // Figma 좌→우: Shot 1(0, 573×573) → Shot 3(673, 573×573) → Shot 2(1367, 622×573, 프레임 밖으로 잘림)
  images: [
    { src: purchaseShot1Image, x: 0, w: 573 },
    { src: purchaseShot3Image, x: 673, w: 573 },
    { src: purchaseShot2Image, x: 1367, w: 622 },
  ],
};

export const discoverMore = {
  heading: ['Discover', 'More Cameras.'],
  description: [
    '저마다 다른 매력을 가진 폴라로이드 카메라.',
    '촬영 방식부터 디자인, 기능까지 살펴보고',
    '당신에게 어울리는 또 다른 카메라를 만나보세요.',
  ],
  // x·y: 카드 위치, photo: 카드 안 제품 사진의 절대 좌표·크기(Figma px)
  products: [
    { id: 'now-plus', label: 'Now+', x: 787, y: 225, active: true, image: productNowPlusImage, photo: { x: 847, y: 267, w: 141, h: 160 } },
    { id: 'flip', label: 'Flip', x: 1106, y: 225, image: productFlipImage, photo: { x: 1158, y: 278, w: 157, h: 149 } },
    { id: 'mod', label: 'Mod', x: 1425, y: 225, image: productModImage, photo: { x: 1488, y: 276, w: 135, h: 153 } },
    { id: 'i-2', label: 'I-2', x: 918, y: 575, image: productI2Image, photo: { x: 963, y: 628, w: 171, h: 138 } },
    { id: 'go', label: 'Go', x: 1237, y: 575, image: productGoImage, photo: { x: 1291, y: 629, w: 153, h: 135 } },
  ],
};
