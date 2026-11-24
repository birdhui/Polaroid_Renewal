import { COMPARE_LEXICON } from '../data/compareLexicon.js';
import { COMPARE_STEPS } from '../data/compareSteps.js';
import { normalizeText } from './korean.js';

/** 이 점수 이상이어야 그 선택지로 볼 수 있다. (3 = "충분한 표현" 1개) */
const MIN_SCORE = 3;
/** 두 선택지가 모두 MIN_SCORE 이상이어도, 1등이 이만큼 앞서면 1등으로 본다. 그보다 가까우면 사용자에게 다시 묻는다. */
const DOMINANT_GAP = 4;
/** 같은 선택지에서 여러 표현이 겹쳐 걸려도("필름값이 너무 비싸요") 가장 강한 표현에 이 점수까지만 더한다. 표현이 겹친 것을 더 확실한 뜻으로 세지 않기 위해서다. */
const OVERLAP_BONUS_LIMIT = 2;
/** "가장 · 제일 · 무엇보다" 처럼 우선순위를 밝힌 표현이 앞에 붙은 선택지에 더해 주는 점수 */
const PRIORITY_BONUS = 3;
const PRIORITY_CUE = /(가장|제일|젤|무엇보다|특히|특별히|우선|가장먼저|제일먼저)$/;
/** 표현 뒤에 이 말이 이어지면 그 표현은 "고민하지 않는다 / 상관없다" 는 뜻이라 쓰지 않는다. (STEP 2·3 에만 적용) */
const DISMISSED = /^.{0,6}?(상관없|상관안|괜찮|걱정(은)?(안|없|되지않)|문제(는)?없|신경(안|쓰지|은안)|중요하지않|중요치않)/;
/** 입력 글자 수 제한 */
export const MAX_ANSWER_LENGTH = 100;

// 사전의 정규식 문자열을 한 번만 RegExp 로 만든다.
const COMPILED = Object.fromEntries(
  Object.entries(COMPARE_LEXICON).map(([stepId, options]) => [
    stepId,
    Object.fromEntries(
      Object.entries(options).map(([optionId, entries]) => [
        optionId,
        entries.map(([source, weight, unless]) => ({
          pattern: new RegExp(source),
          weight,
          unless: unless ? new RegExp(unless) : null,
        })),
      ]),
    ),
  ]),
);

/** 선택지 이름("비용", "촬영 결과")이나 화면에 보이는 문장 그대로 입력한 경우를 가장 먼저 알아본다. */
function matchExactLabel(step, normalized) {
  return (
    step.options.find(
      (option) => normalizeText(option.label) === normalized || (option.answer && normalizeText(option.answer) === normalized),
    ) ?? null
  );
}

function scoreOption(entries, normalized, dismissible) {
  let strongest = 0;
  let others = 0;
  let priority = false;

  for (const { pattern, weight, unless } of entries) {
    if (unless && unless.test(normalized)) continue;
    const found = pattern.exec(normalized);
    if (!found) continue;

    const end = found.index + found[0].length;
    if (dismissible && DISMISSED.test(normalized.slice(end))) continue;

    if (weight > strongest) {
      others += strongest > 0 ? 1 : 0;
      strongest = weight;
    } else {
      others += 1;
    }
    if (!priority && PRIORITY_CUE.test(normalized.slice(Math.max(0, found.index - 6), found.index))) priority = true;
  }

  if (strongest === 0) return 0;
  return strongest + Math.min(others, OVERLAP_BONUS_LIMIT) + (priority ? PRIORITY_BONUS : 0);
}

/**
 * 사용자가 직접 쓴 답변을 지금 질문의 선택지 id 로 바꾼다. 점수 규칙만 쓰며 새 기준을 만들지 않는다.
 *
 * @param {string} stepId compareSteps.js 의 스텝 id ('experience' | 'concern' | 'shooting')
 * @param {string} text 사용자가 입력한 문장
 * @returns {{ status: 'matched', optionId: string }
 *   | { status: 'ambiguous', candidates: string[] }
 *   | { status: 'unknown' }}
 *   - matched: 선택지 하나로 분류됨
 *   - ambiguous: 둘 이상이 비슷하게 해당돼 어느 쪽이 더 중요한지 물어봐야 함 (candidates 는 점수 높은 순)
 *   - unknown: 분류할 수 없음 (임의로 고르지 않는다)
 */
export default function classifyAnswer(stepId, text) {
  const step = COMPARE_STEPS.find((item) => item.id === stepId);
  const normalized = normalizeText(String(text ?? '').slice(0, MAX_ANSWER_LENGTH));
  if (!step || !normalized) return { status: 'unknown' };

  const exact = matchExactLabel(step, normalized);
  if (exact) return { status: 'matched', optionId: exact.id };

  const dismissible = stepId !== 'experience';
  const scored = step.options
    .map((option) => ({
      id: option.id,
      score: scoreOption(COMPILED[stepId]?.[option.id] ?? [], normalized, dismissible),
    }))
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { status: 'unknown' };
  if (scored.length === 1 || scored[0].score - scored[1].score >= DOMINANT_GAP) {
    return { status: 'matched', optionId: scored[0].id };
  }
  return { status: 'ambiguous', candidates: scored.slice(0, 2).map((item) => item.id) };
}
