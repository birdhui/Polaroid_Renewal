import { withJosa } from '../utils/korean.js';

/**
 * 자유 입력에 대한 챗봇 답변 문구 — 짧고 친근한 톤으로 쓴다.
 * 선택지 id 는 compareSteps.js 와 같다. 문구만 바꿔도 분류·추천에는 영향이 없다.
 */

/** 답변을 이해했을 때 — 이 말 다음에 다음 질문(또는 추천 찾기)이 이어진다. */
const ACKNOWLEDGEMENTS = {
  experience: {
    beginner: '처음 사용하시는군요! 부담 없이 시작할 수 있는 카메라를 찾아볼게요.',
    expert: '익숙하시군요! 경험에 맞는 카메라를 찾아볼게요.',
  },
  concern: {
    cost: '비용이 신경 쓰이시는군요! 그럼 어떤 촬영 경험을 원하시는지 알아볼게요.',
    result: '사진이 잘 나올지가 중요하시군요! 그럼 어떤 촬영 경험을 원하시는지 알아볼게요.',
    features: '카메라마다 뭐가 다른지 궁금하시군요! 그럼 어떤 촬영 경험을 원하시는지 알아볼게요.',
    usage: '오래 잘 쓰는 게 중요하시군요! 그럼 어떤 촬영 경험을 원하시는지 알아볼게요.',
  },
  shooting: {
    easy: '간편하게 찍고 싶으시군요! 딱 맞는 카메라를 찾아볼게요.',
    portable: '휴대성이 중요하시군요! 딱 맞는 카메라를 찾아볼게요.',
    effects: '다양한 효과를 즐기고 싶으시군요! 딱 맞는 카메라를 찾아볼게요.',
    control: '직접 조절하는 걸 좋아하시는군요! 딱 맞는 카메라를 찾아볼게요.',
  },
};

/** 분류할 수 없을 때 다시 묻는 말 (스텝마다 질문 방식이 다르다) */
const RETRY_QUESTIONS = {
  experience: '즉석카메라를 처음 써보시는지, 이미 익숙하신지 알려주세요.',
  concern: (labels) => `${labels.join(', ')} 중 어떤 점이 가장 고민되세요?`,
  shooting: (labels) => `${labels.join(', ')} 중 어떤 점이 가장 중요하세요?`,
};

/** 두 가지가 비슷하게 해당될 때 — 더 중요한 쪽을 묻는 말 */
const CHOICE_QUESTIONS = {
  experience: (a, b) => `${withJosa(a, '와', '과')} ${b} 사이에 계시나 봐요! 어느 쪽에 더 가까우신가요?`,
  concern: (a, b) => `${withJosa(a, '와', '과')} ${withJosa(b, '도', '도')} 고민되시는군요! 둘 중 어떤 점이 더 크게 고민되세요?`,
  shooting: (a, b) => `${withJosa(a, '와', '과')} ${b} 모두 중요하시군요! 그중 어떤 점이 더 중요하세요?`,
};

/** 두 번 이상 계속 분류하지 못했을 때 */
const FALLBACK = '표현이 조금 어려웠나 봐요. 위의 선택지에서 골라 주셔도 좋아요!';

/** 이해했을 때의 답변. */
export function buildAcknowledgement(stepId, optionId) {
  return ACKNOWLEDGEMENTS[stepId]?.[optionId] ?? '알겠어요! 다음으로 넘어갈게요.';
}

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
  if (failures >= 2) return FALLBACK;

  const question = RETRY_QUESTIONS[step.id];
  const text = typeof question === 'function' ? question(labels) : (question ?? `${labels.join(', ')} 중에서 골라 주세요.`);
  return `조금 더 알려주실 수 있을까요? ${text}`;
}
