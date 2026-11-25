/**
 * Cameras › Polaroid Now 상세 페이지 콘텐츠 데이터.
 * Figma "Cameras-detail Page" > "Cameras - NOW" 프레임(1827:3741)에서 그대로 옮긴 카피·좌표다.
 * 좌표·크기는 Figma 1920px 프레임 기준 px 값이고, CSS에서 화면 너비에 맞춰 비율로 환산한다.
 * 기능 02·03의 tag/tagLabel이 기능 01과 동일한 "FUNCTION — 01 / TWO-LENS AUTOFOCUS"인 것은
 * Figma 원본 값 그대로다. 디자인 담당자 확인 필요.
 */
import heroImage from '../../../../assets/cameras/now/hero.jpg';
import introProductImage from '../../../../assets/cameras/now/intro-product.jpg';
import featureAutofocusImage from '../../../../assets/cameras/now/feature-autofocus-poster.png';
import featureAutofocusVideo from '../../../../assets/cameras/now/feature-autofocus.mp4';
import featureDoubleExposureImage from '../../../../assets/cameras/now/feature-double-exposure-poster.png';
import featureDoubleExposureVideo from '../../../../assets/cameras/now/feature-double-exposure.mp4';
import featureSharpnessImage from '../../../../assets/cameras/now/feature-sharpness-poster.png';
import featureSharpnessVideo from '../../../../assets/cameras/now/feature-sharpness.mp4';
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
import footerWordmark from '../../../../assets/cameras/now/footer-wordmark.svg';
import footerLogo from '../../../../assets/cameras/now/footer-logo.svg';

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

/**
 * 04·05·06 프레임은 하나의 화면으로 구현한다(Figma 주석).
 * Figma 현재 디자인: 배경 #151515, 세 프레임이 같은 레이아웃이고 문구 목록의 활성 위치만 다르다.
 * 문구 목록은 스크롤에 따라 위로 올라간다(KINORIA 방식).
 * tag(FUNCTION — 01)는 세 프레임 모두 Figma 원본 값 그대로다(디자인 담당자 확인 필요).
 */
export const features = [
  {
    id: 'two-lens-autofocus',
    tag: 'FUNCTION — 01',
    tagLabel: 'TWO-LENS AUTOFOCUS',
    headline: '가까운 얼굴도, 먼 풍경도 알아서 또렷하게.',
    image: featureAutofocusImage,
    video: featureAutofocusVideo, // 01 렌즈 클로즈업 영상 — image는 poster/대체 이미지
  },
  {
    id: 'double-exposure',
    tag: 'FUNCTION — 01',
    tagLabel: 'DOUBLE EXPOSURE MODE',
    headline: '두 번 찍으면 두 장면이 한 장에.',
    image: featureDoubleExposureImage,
    video: featureDoubleExposureVideo, // 02 더블 익스포저 영상 — 세로 영상(734×1254)을 위쪽 기준 734×734로 크롭
  },
  {
    id: 'sharpness',
    tag: 'FUNCTION — 01',
    tagLabel: 'SHARPER PICTURES',
    shift: -9, // Figma 06 프레임은 문구·선이 9px 위에 있다
    headline: '강한 햇빛 아래서도 더 선명하게',
    image: featureSharpnessImage,
    video: featureSharpnessVideo,
  },
];

export const sectionBackground = sectionBackgroundImage;

export const filterShowcase = {
  eyebrow: 'Polaroid NOW filter',
  heading: ['다양한 색의 렌즈로', '세상을 새롭게 바라보는 방법.'],
  description:
    "The world is your laboratory and the filters are your test tubes. Pull up your sleeves and start experimenting with starburst, red vignette, orange, blue, and yellow effects with your Polaroid Now or Now+ Generation 3 camera. And when you're done protect your lens with included lens cap. See the world through different colored glasses. Not compatible with Polaroid Now Generation 1 or 2  cameras.",
  previewImage: filterPreviewImage,
  // cx·cy: 원의 중심 좌표(Figma px). 선택된 원은 selectedSize, 나머지는 size로 그린다.
  // 노랑·주황은 선택되지 않았을 때 opacity 0.4다. paper는 인화지 색(없으면 color를 쓴다).
  size: 46,
  selectedSize: 60.7,
  cy: 1035.75,
  items: [
    { id: 'yellow', label: 'YELLOW', color: '#e9de62', cx: 769, opacity: 0.4 },
    { id: 'blue', label: 'BLUE', color: '#5f93c8', cx: 865, opacity: 1 },
    { id: 'starburst', label: 'STARBURST', color: '#d7dbdf', paper: '#f3f1ec', cx: 960.95, opacity: 1, selected: true },
    { id: 'red-vignette', label: 'RED VIGNETTE', color: '#c8423b', cx: 1057, opacity: 1 },
    { id: 'orange', label: 'ORANGE', color: '#e39a52', cx: 1153, opacity: 0.4 },
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
  // Figma "photo list"(2095:1295): 좌→우 Shot 1·3·2 가 한 번 더 반복되는 6장, 간격 99px.
  // 가로로 쭉 이어지는 줄이라 스크롤하면 이 줄이 먼저 끝까지 지나간 뒤에 화면이 내려간다.
  gap: 99,
  images: [
    { src: purchaseShot1Image, w: 573 },
    { src: purchaseShot3Image, w: 573 },
    { src: purchaseShot2Image, w: 622 },
    { src: purchaseShot1Image, w: 573 },
    { src: purchaseShot3Image, w: 573 },
    { src: purchaseShot2Image, w: 622 },
  ],
};

/*
 * 10 Polaroid Go Film (Figma 1938:970).
 * 필름 사진 3장은 Figma에서 PNG(2x, 투명 배경)로 내보내 src/assets/cameras/now/ 에 아래 이름으로 넣으면 자동으로 나타난다.
 *   go-film-pack.png    큰 필름 팩 (Color i-Type, 322.4×269.5 자리)
 *   go-film-thumb-1.png 선택된 작은 썸네일 — 큰 팩과 같은 사진 (79×67 자리)
 *   go-film-thumb-2.png 두 번째 썸네일 (B&W i-Type, 79×66 자리)
 * 배경이 투명한 PNG다. 파일이 없으면 점선 자리표시자가 보인다.
 */
const goFilmImages = import.meta.glob('../../../../assets/cameras/now/go-film-*.png', {
  eager: true,
  import: 'default',
});
const goFilmImage = (name) => goFilmImages[`../../../../assets/cameras/now/${name}`];

export const goFilm = {
  eyebrow: 'Compatibility',
  title: ['Polaroid Now', 'Film'],
  // bold: Pretendard SemiBold
  description: [
    [{ text: '배터리 없이 더 가볍고 합리적인 ' }, { text: 'i-Type 필름', bold: true }, { text: '부터,' }],
    [{ text: '클래식한 감성의 ' }, { text: '600 필름', bold: true }, { text: '까지.' }],
    [{ text: '원하는 필름을 골라 바로 촬영을 시작해 보세요.' }],
  ],
  ctaLabel: '모든 필름 보기',
  tabLabel: 'Now Film',
  caption: 'Color Film Double Pack',
  images: {
    pack: { src: goFilmImage('go-film-pack.png'), file: 'go-film-pack.png' },
    thumb1: { src: goFilmImage('go-film-thumb-1.png'), file: 'go-film-thumb-1.png' },
    thumb2: { src: goFilmImage('go-film-thumb-2.png'), file: 'go-film-thumb-2.png' },
  },
};

export const discoverMore = {
  eyebrow: 'Compatibility',
  heading: ['Discover More Cameras.'],
  description: [
    '저마다 다른 매력을 가진 폴라로이드 카메라. 촬영 방식부터 디자인, 기능까지 살펴보고',
    '당신에게 어울리는 또 다른 카메라를 만나보세요.',
  ],
  // photo: 제품 사진의 절대 좌표·크기(Figma px). 라벨은 사진 아래(y 895)에 사진 가운데 정렬
  products: [
    { id: 'now-plus', label: 'Now+', active: true, image: productNowPlusImage, photo: { x: 313, y: 679, w: 141, h: 160 } },
    { id: 'flip', label: 'Flip', image: productFlipImage, photo: { x: 632, y: 684, w: 157, h: 149 } },
    { id: 'mod', label: 'Mod', image: productModImage, photo: { x: 923, y: 682, w: 135, h: 153 } },
    { id: 'i-2', label: 'I-2', image: productI2Image, photo: { x: 1192, y: 690, w: 171, h: 138 } },
    { id: 'go', label: 'Go', image: productGoImage, photo: { x: 1497, y: 691, w: 153, h: 135 } },
  ],
};

/* 11 Footer (Figma 2158:1056) — 서명 이미지(image 224)는 에셋을 받을 수 없어 아직 넣지 않았다 */
export const footer = {
  logo: footerLogo,
  wordmark: footerWordmark,
  tagline: ['지나간 순간을, 손에 남는 한 장으로.', '89년을 지나온 폴라로이드는 오늘도 당신이 간직하고 싶은 순간을 한 장의 사진에 담습니다.'],
  copyright: '© 2026 Polaroid. Made by four',
  columns: [
    { title: 'QUICK LINKS', x: 1382.5, items: ['Brand', 'History', 'Cameras', 'Film', 'Compare'] },
    { title: 'SOCIALS', x: 1529, items: ['Instagram', 'Linkedin', 'YouTube'] },
    { title: 'LEGAL', x: 1675, items: ['Terms of Service', 'Privacy Policy', 'Imprint'] },
  ],
};

/*
 * Transition-camera (Figma 2408:2095) — 06 Feature 와 07 Filter 사이의 크림색 전환 장면 (1920×1928).
 * 안의 이미지 "수정4 1"(1920×1920, x0 y8)은 Figma에서 PNG로 내보내 아래 이름으로 넣으면 자동으로 나타난다.
 *   src/assets/cameras/now/transition-camera.png (jpg·webp 도 가능)
 */
const transitionImages = import.meta.glob('../../../../assets/cameras/now/transition-camera.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});
const transitionSrc = Object.values(transitionImages)[0];
export const transitionCamera = {
  text: 'POLAROID NOW',
  image: { src: transitionSrc, file: 'transition-camera.png' },
};
