import { COMPARE_RULES } from '@/pages/Compare/data/compareRecommendations.js';
import { SHOWCASE_CAMERAS } from '@/pages/Compare/data/compareShowcaseCameras.js';

/**
 * 질문 화면(Figma 3510:654)의 카메라 배치 — 1920 x 1080 화면 기준 px.
 *  - grid  : 질문 화면이 처음 열릴 때의 격자(Frame 293). 히어로 마지막 화면과 같은 자리다.
 *  - 선택에 맞는 카메라 3대가 가운데에 크게 모이고, 나머지는 작게 흩어진다(Frame 294).
 * Figma 294 에는 카메라 3대(Now+ White · Now Yellow · Go light blue)만 크게 놓여 있는데, 이건 자리를 잡아 둔 임시 예시라서
 * 큰 자리 3곳(BIG_SLOTS)만 쓰고 어떤 모델이 들어갈지는 질문 선택에 따라 바뀐다.
 * 카메라 이미지는 히어로와 같은 프로젝트의 누끼 이미지를 쓴다. (Figma 이미지는 내려받을 수 없었다)
 */
export const FINDER_STAGE = { width: 1920, height: 1080 };

/** 이미지 안쪽 여백이 같아서 가로·세로 중 큰 쪽의 정사각형으로 두고 중심 좌표로 바꾼다 */
const toSlot = ({ x, y, w, h }) => ({ cx: x + w / 2, cy: y + h / 2, size: Math.max(w, h) });

/** 카메라 id → 모델(compareProducts.js 의 제품 id) */
const MODEL = {
  goTeal: 'go', goPurple: 'go', goWhiteA: 'go', goWhiteB: 'go', goLightBlue: 'go', goBlack: 'go',
  nowCoral: 'now', nowPinkA: 'now', nowPinkB: 'now', nowBlack: 'now', nowYellowA: 'now', nowYellowB: 'now',
  nowCream: 'now', nowCreamB: 'now', nowTealA: 'now', nowTealB: 'now', nowPurple: 'now', nowArctic: 'now',
  nowPlusBlue: 'nowPlus', nowPlusBlack: 'nowPlus', nowPlusCoralA: 'nowPlus', nowPlusCoralB: 'nowPlus', nowPlusWhite: 'nowPlus',
  flipOrange: 'flip', flipBlack: 'flip', modA: 'mod', modB: 'mod', i2: 'i2',
};

/** 모델마다 큰 자리에 올릴 대표 카메라 */
const BIG_CAMERA = { go: 'goLightBlue', now: 'nowYellowA', nowPlus: 'nowPlusWhite', flip: 'flipOrange', mod: 'modA', i2: 'i2' };

/** 큰 자리 3곳 (Frame 294). 1순위는 가운데 가장 큰 자리, 2·3순위는 위쪽 양옆 */
const BIG_SLOTS = [
  toSlot({ x: 867, y: 469, w: 219, h: 219 }),
  toSlot({ x: 633, y: 238, w: 211, h: 203 }),
  toSlot({ x: 1070, y: 218, w: 196, h: 213 }),
];
const DEFAULT_BIG = ['nowPlusWhite', 'nowYellowA', 'goLightBlue'];

/** 작게 흩어졌을 때의 자리 (Frame 294) */
const SMALL_SLOT = {
  goTeal: toSlot({ x: 426, y: 16, w: 128, h: 128 }),
  nowCoral: toSlot({ x: 1557, y: 688, w: 126, h: 126 }),
  goPurple: toSlot({ x: 1288, y: -54, w: 139, h: 139 }),
  goWhiteA: toSlot({ x: 160, y: 1023, w: 85, h: 85 }),
  nowPlusBlack: toSlot({ x: 1683, y: -84, w: 128, h: 128 }),
  nowPinkA: toSlot({ x: 82, y: 200, w: 85, h: 93 }),
  nowBlack: toSlot({ x: 307, y: 250, w: 123, h: 123 }),
  nowYellowB: toSlot({ x: 1538, y: 932, w: 91, h: 91 }),
  modA: toSlot({ x: 1829, y: 441, w: 77, h: 83 }),
  modB: toSlot({ x: 308, y: 768, w: 122, h: 122 }),
  nowCream: toSlot({ x: 1500, y: 207, w: 134, h: 134 }),
  nowTealB: toSlot({ x: 93, y: 752, w: 88, h: 88 }),
  i2: toSlot({ x: 137, y: -65, w: 130, h: 130 }),
  flipOrange: toSlot({ x: 30, y: 501, w: 94, h: 94 }),
  nowArctic: toSlot({ x: 217, y: 501, w: 124, h: 124 }),
  flipBlack: toSlot({ x: 1629, y: 469, w: 118, h: 118 }),
  goWhiteB: toSlot({ x: 1772, y: 849, w: 113, h: 113 }),
  nowPlusCoralA: toSlot({ x: 1768, y: 207, w: 86, h: 86 }),
  nowPlusCoralB: toSlot({ x: 468, y: 962, w: 86, h: 86 }),
  // 기본 상태에서 큰 자리에 있는 3대. 다른 모델에게 큰 자리를 내주면 이 중 하나가 비워진 작은 자리로 옮겨 간다.
  nowPlusWhite: BIG_SLOTS[0],
  nowYellowA: BIG_SLOTS[1],
  goLightBlue: BIG_SLOTS[2],
};

/** 카메라 목록: 카메라 id, 이미지, 처음 격자 자리(히어로와 같음), 흩어졌을 때 쓰이는 카메라인지 */
export const FINDER_CAMERAS = SHOWCASE_CAMERAS.map((camera) => ({
  id: camera.id,
  src: camera.src,
  grid: toSlot(camera),
  inLayout: Boolean(SMALL_SLOT[camera.id]), // false 면 Figma 294 에 없는 카메라 — 흩어질 때 가운데로 빨려 들어가며 사라진다
  hiddenAtGrid: camera.id === 'nowPlusCoralB', // 격자(Frame 293)에서는 카드에 가려지는 자리라 처음엔 보이지 않는다
}));
// 처음 격자에서 카드(아래 가운데)에 가려지는 카메라는 Figma 293 에 없다
const CARD_BOX = { x1: 633, x2: 1326, y1: 790, y2: 1031 };
FINDER_CAMERAS.forEach((camera) => {
  const { cx, cy, size } = camera.grid;
  const hit = cx + size / 2 > CARD_BOX.x1 && cx - size / 2 < CARD_BOX.x2 && cy + size / 2 > CARD_BOX.y1 && cy - size / 2 < CARD_BOX.y2;
  if (hit) camera.hiddenAtGrid = true;
});

/** 처음(격자) 상태 */
export function getGridState() {
  return Object.fromEntries(
    FINDER_CAMERAS.map((camera) => [camera.id, { ...camera.grid, op: camera.hiddenAtGrid ? 0 : 1, z: 1 }]),
  );
}

/* ---- 질문 선택 → 어울리는 카메라 3대 ----
 * compareRecommendations.js 의 추천표(경험 × 촬영 경험 × 고민)를 읽어서, 선택지를 포함한 조합들에서 1·2·3순위로 자주 뽑힌 모델을 센다.
 * (1순위 3점 · 2순위 2점 · 3순위 1점) 추천표 자체는 바꾸지 않는다.
 */
const MODEL_ORDER = ['go', 'now', 'nowPlus', 'flip', 'mod', 'i2'];
const SCORES = {};
const addScore = (key, model, points) => {
  SCORES[key] ??= {};
  SCORES[key][model] = (SCORES[key][model] ?? 0) + points;
};
Object.entries(COMPARE_RULES).forEach(([experience, byShooting]) => {
  Object.entries(byShooting).forEach(([shooting, byConcern]) => {
    Object.entries(byConcern).forEach(([concern, ranked]) => {
      ranked.forEach((model, rank) => {
        const points = 3 - rank;
        addScore(`experience:${experience}`, model, points);
        addScore(`shooting:${shooting}`, model, points);
        addScore(`concern:${concern}`, model, points);
      });
    });
  });
});

/** 선택지에 어울리는 모델 3개 [1순위, 2순위, 3순위] */
export function getTrio(stepId, optionId) {
  const scores = SCORES[`${stepId}:${optionId}`] ?? {};
  return [...MODEL_ORDER]
    .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0) || MODEL_ORDER.indexOf(a) - MODEL_ORDER.indexOf(b))
    .slice(0, 3);
}

/** 어울리는 모델 3개가 큰 자리에 모이고 나머지가 작게 흩어진 상태 */
export function getComposition(trio) {
  const bigIds = trio.map((model) => BIG_CAMERA[model]);
  const assigned = {};
  bigIds.forEach((id, index) => {
    assigned[id] = { ...BIG_SLOTS[index], z: 2 };
  });
  const vacated = bigIds.filter((id) => !DEFAULT_BIG.includes(id)).map((id) => SMALL_SLOT[id]);
  const displaced = DEFAULT_BIG.filter((id) => !bigIds.includes(id));
  displaced.forEach((id, index) => {
    assigned[id] = { ...vacated[index], z: 1 };
  });
  return Object.fromEntries(
    FINDER_CAMERAS.map((camera) => {
      if (assigned[camera.id]) return [camera.id, { ...assigned[camera.id], op: 1 }];
      if (!camera.inLayout) return [camera.id, { cx: 960, cy: 540, size: 70, op: 0, z: 1 }];
      return [camera.id, { ...SMALL_SLOT[camera.id], op: 1, z: 1 }];
    }),
  );
}

export const CAMERA_MODEL = MODEL;
