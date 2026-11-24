import { withJosa } from '../utils/korean.js';

/**
 * 챗봇 문구 — 짧게 쓴다. 답을 이해했을 때는 중간 반응 없이 바로 다음 질문이 나오므로,
 * 여기에는 분류하지 못했을 때 다시 묻는 말만 있다.
 * 선택지 id 는 compareSteps.js 와 같다. 문구만 바꿔도 분류·추천에는 영향이 없다.
 */

/** 분류할 수 없을 때 다시 묻는 말 (스텝마다 질문 방식이 다르다) */
const RETRY_QUESTIONS = {
  experience: '즉석카메라를 처음 써보시나요, 이미 익숙하신가요?',
  concern: (labels) => `${labels.join(', ')} 중 어떤 점이 가장 고민되세요?`,
  shooting: (labels) => `${labels.join(', ')} 중 어떤 점이 가장 중요하세요?`,
};

/** 두 가지가 비슷하게 해당될 때 — 어느 쪽인지 묻는 말 */
const CHOICE_QUESTIONS = {
  experience: (a, b) => `${withJosa(a, '와', '과')} ${b} 중 어느 쪽에 더 가까우세요?`,
  concern: (a, b) => `${withJosa(a, '와', '과')} ${b} 중 어떤 점이 더 고민되세요?`,
  shooting: (a, b) => `${withJosa(a, '와', '과')} ${b} 중 어떤 점이 더 중요하세요?`,
};

/** 두 번 이상 계속 분류하지 못했을 때 — 선택지 버튼은 이미 치워졌으므로 입력할 말을 직접 알려 준다 */
const FALLBACK = (labels) => `${labels.join(', ')} 중 하나로 입력해 주세요.`;

/**
 * 다시 물을 때의 답변.
 * @param {object} step compareSteps.js 의 스텝
 * @param {{ status: 'ambiguous', candidates: string[] } | { status: 'unknown' }} result classifyAnswer 결과
 * @param {number} failures 같은 질문에서 연달아 분류하지 못한 횟수(이번 포함)
 */
export function buildRetryMessage(step, result, failures) {
  const labelOf = (id) => step.options.find((option) => option.id === id)?.label ?? id;
  const labels = step.options.map((option) => option.label);

  if (result.status === 'ambiguous') {
    const [first, second] = result.candidates.map(labelOf);
    return CHOICE_QUESTIONS[step.id]?.(first, second) ?? `${first}와(과) ${second} 중 어떤 점이 더 중요하세요?`;
  }
  if (failures >= 2) return FALLBACK(labels);

  const question = RETRY_QUESTIONS[step.id];
  const text = typeof question === 'function' ? question(labels) : (question ?? `${labels.join(', ')} 중에서 골라 주세요.`);
  return text;
}
