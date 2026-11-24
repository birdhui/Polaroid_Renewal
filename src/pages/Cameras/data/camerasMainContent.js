/**
 * Cameras 메인 페이지 콘텐츠 (담당: 정준혁)
 * Figma '1차-4조-팀프로젝트' > Cameras 프레임(node 803:354)의 문구·이미지·배치를 그대로 옮겼다.
 *
 * 좌표 규칙: 모든 수치는 시안 기준 px(가로 1920)이다. 화면에서는 CSS 변수 --px(= 화면 폭 / 1920)를 곱해 쓴다.
 * - box: [left, top, width, height] — 섹션(또는 무대) 왼쪽 위 기준
 */
import { ROUTES } from '@/app/routes.js';
import heroVideo from '@/assets/cameras/main/hero-video.mp4';
import heroPoster from '@/assets/cameras/main/hero-poster.webp';
import logoWhite from '@/assets/cameras/main/polaroid-logo-white.svg';
import momentRiversideDog from '@/assets/cameras/main/moment-riverside-dog.webp';
import momentSunlitAlley from '@/assets/cameras/main/moment-sunlit-alley.webp';
import momentMintRiverside from '@/assets/cameras/main/moment-mint-riverside.webp';
import scriptNow from '@/assets/cameras/main/script-now.webp';
import scriptNowPlus from '@/assets/cameras/main/script-now-plus.webp';
import scriptFlip from '@/assets/cameras/main/script-flip.webp';
import scriptMod from '@/assets/cameras/main/script-mod.webp';
import scriptI2 from '@/assets/cameras/main/script-i2.webp';
import scriptGo from '@/assets/cameras/main/script-go.webp';
import cameraNow from '@/assets/cameras/main/camera-now.webp';
import cameraNowPlus from '@/assets/cameras/main/camera-now-plus.webp';
import cameraFlip from '@/assets/cameras/main/camera-flip.webp';
import cameraMod from '@/assets/cameras/main/camera-mod.webp';
import cameraI2 from '@/assets/cameras/main/camera-i2.webp';
import cameraGo from '@/assets/cameras/main/camera-go.webp';
import cardNow from '@/assets/cameras/main/card-now.webp';
import cardNowPlus from '@/assets/cameras/main/card-now-plus.webp';
import cardFlip from '@/assets/cameras/main/card-flip.webp';
import cardMod from '@/assets/cameras/main/card-mod.webp';
import cardI2 from '@/assets/cameras/main/card-i2.webp';
import cardGo from '@/assets/cameras/main/card-go.webp';
// 카드에 마우스를 올리면 바뀌는 두 번째 사진 (01 / 02 → 02 / 02)
import cardNowHover from '@/assets/cameras/main/card-now-hover.webp';
import cardNowPlusHover from '@/assets/cameras/main/card-now-plus-hover.webp';
import cardFlipHover from '@/assets/cameras/main/card-flip-hover.webp';
import cardModHover from '@/assets/cameras/main/card-mod-hover.webp';
import cardI2Hover from '@/assets/cameras/main/card-i2-hover.webp';
import cardGoHover from '@/assets/cameras/main/card-go-hover.webp';
import helpCamera from '@/assets/cameras/main/help-camera-split.webp';
import scriptFindCamera from '@/assets/cameras/main/script-find-camera.webp';
import scriptFindAnswers from '@/assets/cameras/main/script-find-answers.webp';

const POLAROID_US = 'https://www.polaroid.com/en_us';

/** 1. Hero — 배경 영상 + 로고 */
export const MAIN_HERO = {
  /** 배경 영상 (소리 없음 · 반복). poster: 영상이 준비되기 전·동작 줄이기 설정일 때 보이는 첫 장면 */
  video: { src: heroVideo, poster: heroPoster },
  logo: { src: logoWhite, alt: 'Polaroid' },
  title: 'Instant Cameras',
};

/**
 * 2. 카메라 라인업 (뷰파인더 프레임 속 가운데 카메라 + 양옆 흐린 카메라)
 * 6개 모델이 차례로 가운데에 온다. 이미지는 아래 모델 섹션의 카메라 이미지를 그대로 쓴다.
 * 제목 아래 모델 이름 줄(카테고리)과 같은 순서로 넘어가며, 가운데 모델의 이름이 진하게 바뀐다.
 * size: 화면 크기 [w, h] — 400×415 안에 비율을 지켜 맞춘 값
 *       (시안 가운데 카메라 514×583 보다 작게: 제목·카메라·모델 이름이 한 화면에 들어오도록)
 * shadow: 카메라가 바닥에 닿은 그림자. I-2 는 이미지에 그림자가 들어 있어 따로 넣지 않는다.
 *         I-2 그림자처럼 바닥 선에 붙어 좌우로 퍼지도록, 이미지마다 바닥 선 위치와 몸체 좌우 끝을 잰 값
 *         (base: 위에서부터 바닥 선까지 이미지 높이 대비 비율, left·right: 몸체 바깥 여백 비율)
 */
const LINEUP_FIT = [400, 415];
const fit = ([, , w, h]) => {
  const k = Math.min(LINEUP_FIT[0] / w, LINEUP_FIT[1] / h);
  return [Math.round(w * k), Math.round(h * k)];
};

/** 카테고리 줄 순서·표기 (시안 그대로: Now | Now+ | Go | MOD | Flip | I-2) — 라인업도 이 순서로 넘어간다 */
const LINEUP_ORDER = [
  ['now', 'Now'],
  ['now-plus', 'Now+'],
  ['go', 'Go'],
  ['mod', 'MOD'],
  ['flip', 'Flip'],
  ['i2', 'I-2'],
];

/** 바닥 그림자 위치 (이미지 알파값에서 잰 값) */
const LINEUP_SHADOW = {
  now: { base: 0.9466, left: 0.092, right: 0.0905 },
  'now-plus': { base: 0.9469, left: 0.0915, right: 0.0902 },
  flip: { base: 0.9448, left: 0.1395, right: 0.1406 },
  mod: { base: 0.9465, left: 0.0934, right: 0.0934 },
  go: { base: 0.9387, left: 0.1169, right: 0.1157 },
};

export const LINEUP = {
  title: ['일상의 모든 순간,', '폴라로이드와 함께.'],
  linkLabel: 'View More',
  initial: 0,
  /** MODELS 아래에서 채운다 */
  items: [],
};

/** 3. Every Moment Has Its Camera — 기울어진 폴라로이드 사진 3장 (box 는 회전 후 외곽 상자) */
export const MOMENTS = {
  title: 'Every Moment Has Its Camera.',
  body: [
    '같은 하루에도 남기고 싶은 순간은 저마다 다르니까.',
    '가까운 사람과의 일상부터 새로운 풍경, 나만의 시선까지.',
    '그 순간에 어울리는 폴라로이드를 만나보세요.',
  ],
  photos: [
    { src: momentRiversideDog, alt: '해 질 녘 호숫가 선착장에 선 두 사람과 강아지', box: [1031, 428, 464, 469] },
    { src: momentSunlitAlley, alt: '햇살이 드는 오래된 골목길을 자전거로 지나는 사람', box: [426, 415, 457, 490] },
    { src: momentMintRiverside, alt: '나무 그늘 아래 강변에 앉아 쉬는 사람들', box: [713, 416, 488, 518] },
  ],
};

/**
 * 4~9. 모델별 섹션
 * side: 글이 놓이는 쪽(left: 왼쪽 정렬 / right: 오른쪽 정렬), edge: 글 기준선(left 면 왼쪽 x, right 면 오른쪽 x), top: 헤드라인 첫 줄 y
 * script: 손글씨 모델명 이미지 (글과 같은 쪽, 헤드라인 위)
 * card: 반대쪽 626×626 제품 카드(배경 없는 투명 사진). hover: 마우스를 올리면 바뀌는 두 번째 사진, index: 카드 번호
 *       bg: 카드 배경색(사진 배경과 같은 색 — 마우스를 올려 사진이 커질 때 테두리에 깔린다)
 * camera: 배경 없는 제품 이미지 — 위쪽 카메라 라인업에서 쓴다
 * to: 사이트 안 상세페이지 / href: 상세페이지가 없으면 polaroid.com 제품 페이지(새 창)
 */
export const MODELS = [
  {
    id: 'now',
    name: 'Now',
    tag: '입문자용',
    title: ['눈앞의 순간을,', '빨간 셔터 한 번으로.'],
    body: ['가까운 얼굴도, 그 너머의 풍경도.', 'Now가 거리에 맞는 렌즈를 골라 초점을 맞춰줘요.'],
    side: 'left',
    edge: 393,
    top: 448,
    script: { src: scriptNow, box: [317, 231, 446, 240] },
    camera: { src: cameraNow, alt: 'Polaroid Now 즉석카메라, 화이트와 퍼플 바디', box: [1206, 320, 348, 393] },
    card: { src: cardNow, alt: '퍼플 바디의 Polaroid Now 즉석카메라', hover: { src: cardNowHover, alt: '퍼플 바디의 Polaroid Now 즉석카메라, 비스듬한 각도' }, box: [1040, 235, 626, 626], index: 1 },
    to: ROUTES.camerasNow,
  },
  {
    id: 'now-plus',
    name: 'Now+',
    title: ['카메라는 저기에,', '셔터는 내 손안에.'],
    body: ['Now+를 세워두고 친구들 곁에 서 보세요.', '폴라로이드 앱으로 셔터를 누르면', '찍는 사람까지 한 장에 담겨요.'],
    side: 'right',
    edge: 1584,
    top: 520,
    script: { src: scriptNowPlus, box: [1220, 290, 474, 245] },
    camera: { src: cameraNowPlus, alt: 'Polaroid Now+ 즉석카메라, 화이트 바디', box: [377, 325, 366, 414] },
    card: { src: cardNowPlus, alt: '세이지 그린 바디의 Polaroid Now+ 즉석카메라', hover: { src: cardNowPlusHover, alt: '세이지 그린 바디의 Polaroid Now+ 즉석카메라, 비스듬한 각도' }, box: [261, 235, 626, 626], index: 2 },
    to: ROUTES.camerasNowPlus,
  },
  {
    id: 'flip',
    name: 'Flip',
    title: ['놓치기 쉬운 순간도,', '초점은 놓치지 않도록.'],
    body: [
      '갑자기 달려오는 친구도, 웃음이 터지는 찰나도.',
      'Flip의 소나 자동초점이 피사체와의 거리를 살피고,',
      '촬영 전 빛이 적절한지도 알려줘요.',
    ],
    side: 'left',
    edge: 354,
    top: 516,
    script: { src: scriptFlip, box: [283, 281, 461, 260] },
    camera: { src: cameraFlip, alt: 'Polaroid Flip 즉석카메라, 화이트 바디에 오렌지 패널', box: [1107, 315, 448, 426] },
    card: { src: cardFlip, alt: '블랙·오렌지 패널의 Polaroid Flip 즉석카메라', hover: { src: cardFlipHover, alt: 'Polaroid Flip 즉석카메라, 비스듬한 각도' }, box: [1047, 251, 626, 626], index: 3 },
    href: `${POLAROID_US}/cameras/flip-camera`,
  },
  {
    id: 'mod',
    name: 'Mod',
    title: ['다이얼 하나로,', '평범한 순간을 새롭게.'],
    body: [
      '밤거리를 수놓은 불빛을 조금 다르게 담아보세요.',
      '다이얼을 돌려 라이트 페인팅 모드를 선택하면,',
      '빛의 움직임도 한 장의 사진이 됩니다.',
    ],
    side: 'right',
    edge: 1595,
    top: 523,
    script: { src: scriptMod, box: [1220, 286, 499, 304] },
    camera: { src: cameraMod, alt: 'Polaroid Mod 즉석카메라, 그래파이트 바디', box: [352, 307, 396, 449] },
    card: { src: cardMod, alt: '그래파이트 바디의 Polaroid Mod 즉석카메라', hover: { src: cardModHover, alt: '그래파이트 바디의 Polaroid Mod 즉석카메라, 비스듬한 각도' }, box: [262, 235, 626, 626], index: 4 },
    href: `${POLAROID_US}/cameras/mod-camera`,
  },
  {
    id: 'i2',
    name: 'I-2',
    tag: '전문가용',
    title: ['빛도, 속도도,', '내가 원하는 한 장으로.'],
    body: [
      '창가에 스며드는 빛을 그대로 담고 싶다면,',
      '조리개와 셔터 속도를 직접 조절해 보세요.',
      'I-2가 당신의 시선을 한 장의 사진으로 완성해 줍니다.',
    ],
    side: 'left',
    edge: 373,
    top: 436,
    script: { src: scriptI2, box: [293, 245, 394, 239] },
    camera: { src: cameraI2, alt: 'Polaroid I-2 즉석카메라, 블랙 바디', box: [1151, 355, 468, 377] },
    card: { src: cardI2, alt: '블랙 바디의 Polaroid I-2 즉석카메라', hover: { src: cardI2Hover, alt: '블랙 바디의 Polaroid I-2 즉석카메라, 비스듬한 각도' }, box: [1014, 235, 626, 626], index: 5 },
    href: `${POLAROID_US}/cameras/i2-camera`,
  },
  {
    id: 'go',
    name: 'Go',
    title: ['가방 속 작은 카메라,', '어디서든 함께하는 순간.'],
    body: [
      '여행 중 마주친 풍경도, 친구와의 셀피도.',
      '작은 Go를 꺼내 셀피 미러로 구도를 맞추면,',
      '손안에 쏙 들어오는 사진으로 남길 수 있어요.',
    ],
    side: 'right',
    edge: 1606,
    top: 519,
    height: 1080,
    script: { src: scriptGo, box: [1316, 271, 346, 292] },
    camera: { src: cameraGo, alt: 'Polaroid Go 즉석카메라, 라이트 블루 바디', box: [383, 395, 415, 367] },
    card: { src: cardGo, alt: '라이트 블루 바디의 Polaroid Go 즉석카메라', hover: { src: cardGoHover, alt: '케이스에 담긴 라이트 블루 Polaroid Go 즉석카메라' }, box: [277, 228, 626, 626], index: 6 },
    href: `${POLAROID_US}/cameras/go-camera`,
  },
];

export const MODEL_LINK_LABEL = '제품 보러가기';

LINEUP.items = LINEUP_ORDER.map(([id, label]) => {
  const m = MODELS.find((model) => model.id === id);
  return {
    id: m.id,
    name: m.name,
    label,
    src: m.camera.src,
    alt: m.camera.alt,
    size: fit(m.camera.box),
    shadow: LINEUP_SHADOW[m.id] ?? null,
  };
});

/** 10. 마지막 안내 (왼쪽 어두운 면: Compare / 오른쪽 밝은 면: Support) */
export const HELP = {
  camera: { src: helpCamera, alt: '반은 화이트, 반은 블랙으로 나뉜 Polaroid Now 즉석카메라', box: [698, 279, 523, 523] },
  panels: [
    {
      id: 'compare',
      tone: 'dark',
      script: { src: scriptFindCamera, alt: 'Find your camera.', box: [157, 283, 513, 414] },
      body: ['어떤 폴라로이드가 나에게 맞을까요?', '카메라별 기능과 가격을 비교해 보세요.'],
      bodyTop: 582,
      center: 413.5,
      label: 'Compare',
      to: ROUTES.compare,
    },
    {
      id: 'support',
      tone: 'light',
      script: { src: scriptFindAnswers, alt: 'Find your answers.', box: [1307, 286, 489, 408] },
      body: ['내 카메라엔 어떤 필름을 쓸까요?', '필름 선택부터 촬영 방법까지 확인해 보세요.'],
      bodyTop: 586,
      center: 1575,
      label: 'Support',
      to: ROUTES.film,
    },
  ],
  buttonTop: 737,
};
