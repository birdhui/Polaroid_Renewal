/**
 * Compare 추천 규칙표 — 프로젝트 초기 추천안 (공식 폴라로이드 추천 순위가 아니다).
 * STEP 1(경험) × STEP 2(촬영 경험) × STEP 3(구매 고민) = 32가지 조합마다 추천 카메라 3개를 순서대로 고정해 둔다.
 * 값은 compareProducts.js 의 제품 id 이며, 제품 정보(이미지·가격·무게 등)는 여기에 넣지 않는다.
 * 순서: [BEST MATCH, GOOD MATCH, ALTERNATIVE]
 */
export const RANK_LABELS = ['BEST MATCH', 'GOOD MATCH', 'ALTERNATIVE'];

export const COMPARE_RULES = {
  // A. 입문자
  beginner: {
    easy: {
      cost: ['go', 'now', 'nowPlus'],
      result: ['flip', 'now', 'go'],
      features: ['now', 'flip', 'go'],
      usage: ['now', 'go', 'flip'],
    },
    portable: {
      cost: ['go', 'now', 'nowPlus'],
      result: ['go', 'now', 'flip'],
      features: ['go', 'now', 'nowPlus'],
      usage: ['go', 'now', 'nowPlus'],
    },
    effects: {
      cost: ['nowPlus', 'flip', 'mod'],
      result: ['nowPlus', 'flip', 'mod'],
      features: ['mod', 'nowPlus', 'flip'],
      usage: ['mod', 'nowPlus', 'flip'],
    },
    control: {
      cost: ['nowPlus', 'flip', 'i2'],
      result: ['flip', 'nowPlus', 'i2'],
      features: ['nowPlus', 'i2', 'flip'],
      usage: ['nowPlus', 'flip', 'i2'],
    },
  },
  // B. 숙련자
  expert: {
    easy: {
      cost: ['go', 'now', 'flip'],
      result: ['flip', 'now', 'nowPlus'],
      features: ['flip', 'now', 'nowPlus'],
      usage: ['flip', 'now', 'go'],
    },
    portable: {
      cost: ['go', 'now', 'nowPlus'],
      result: ['go', 'now', 'flip'],
      features: ['go', 'nowPlus', 'now'],
      usage: ['go', 'now', 'nowPlus'],
    },
    effects: {
      cost: ['nowPlus', 'flip', 'mod'],
      result: ['flip', 'nowPlus', 'mod'],
      features: ['nowPlus', 'mod', 'i2'],
      usage: ['mod', 'nowPlus', 'flip'],
    },
    control: {
      cost: ['nowPlus', 'flip', 'i2'],
      result: ['i2', 'flip', 'nowPlus'],
      features: ['i2', 'nowPlus', 'flip'],
      usage: ['nowPlus', 'i2', 'flip'],
    },
  },
};
