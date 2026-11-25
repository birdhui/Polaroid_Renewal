import { COMPARE_RULES, RANK_LABELS } from '@/pages/Compare/data/compareRecommendations.js';
import { ALTERNATIVE_LIMITS, CONCERN_NOTES, PREFERENCE_REASONS } from '@/pages/Compare/data/compareReasons.js';
import { COMPARE_PRODUCTS } from '@/pages/Compare/data/compareProducts.js';

/**
 * STEP 1~3 선택값으로 추천 카메라 3개를 순서대로 돌려준다. 점수 계산 없이 규칙표(COMPARE_RULES)만 따른다.
 * @param {{ experience: string, shooting: string, concern: string }} selection
 * @returns {{ rank: number, rankLabel: string, product: object, reason: string }[]} 규칙이 없으면 빈 배열
 */
export default function getRecommendations({ experience, shooting, concern }) {
  const ids = COMPARE_RULES[experience]?.[shooting]?.[concern];
  if (!ids) return [];

  return ids.map((id, index) => {
    const isAlternative = index === ids.length - 1;
    const limit = ALTERNATIVE_LIMITS[id];
    const limitText = typeof limit === 'string' ? limit : (limit[experience] ?? limit.default);
    const reason = [PREFERENCE_REASONS[id][shooting], CONCERN_NOTES[id][concern], isAlternative ? limitText : null]
      .filter(Boolean)
      .join(' ');

    return { rank: index + 1, rankLabel: RANK_LABELS[index], product: COMPARE_PRODUCTS[id], reason };
  });
}
