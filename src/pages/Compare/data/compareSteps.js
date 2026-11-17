/**
 * Compare 페이지 스텝 데이터 — Figma 시안(compare) 문구 기준.
 * 문구를 바꿀 때는 시안과 함께 확인한다.
 */
export const COMPARE_STEPS = [
  {
    id: 'experience',
    label: 'STEP 1',
    question: '즉석카메라 사용 경험은 어느 정도 인가요?',
    options: [
      { id: 'beginner', label: '입문자' },
      { id: 'expert', label: '전문가' },
    ],
  },
  {
    id: 'shooting',
    label: 'STEP 2',
    question: '어떤 촬영 경험을 원하시나요?',
    options: [
      { id: 'easy', label: '간편한 촬영' },
      { id: 'portable', label: '휴대성' },
      { id: 'effects', label: '다양한 촬영 효과' },
      { id: 'control', label: '세밀한 조절' },
    ],
  },
  {
    id: 'concern',
    label: 'STEP 3',
    question: '구매 전 가장 고민되는 점은 무엇인가요?',
    options: [
      { id: 'cost', label: '카메라•필름 비용' },
      { id: 'result', label: '촬영결과' },
      { id: 'features', label: '기능차이' },
      { id: 'usage', label: '활용도' },
    ],
  },
];
