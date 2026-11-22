/**
 * Compare 페이지 스텝 데이터 — 선택지 id 는 compareRecommendations.js 의 규칙표 키와 같아야 한다.
 * 문구와 순서는 최종 Figma 시안(채팅형) 기준이다. 표시 문구·순서만 바꿔도 id 가 같으면 추천 규칙은 그대로 동작한다.
 * layout: 'stack' 은 긴 선택지를 세로로 쌓고, 'row' 는 짧은 선택지 4개를 가로로 나란히 둔다.
 */
export const COMPARE_STEPS = [
  {
    id: 'experience',
    label: 'STEP 1',
    question: '즉석카메라 사용 경험은 어느 정도 인가요?',
    layout: 'stack',
    options: [
      { id: 'beginner', label: '오늘 처음 사용해봐요.' },
      { id: 'expert', label: '사용한 지 5년 이상이에요.' },
    ],
  },
  {
    id: 'concern',
    label: 'STEP 2',
    question: '구매 전 가장 고민되는 점은 무엇인가요?',
    layout: 'row',
    options: [
      { id: 'cost', label: '비용' },
      { id: 'result', label: '촬영 결과' },
      { id: 'features', label: '기능' },
      { id: 'usage', label: '활용도' },
    ],
  },
  {
    id: 'shooting',
    label: 'STEP 3',
    question: '어떤 촬영 경험을 원하시나요?',
    layout: 'row',
    options: [
      { id: 'easy', label: '편리성' },
      { id: 'portable', label: '휴대성' },
      { id: 'effects', label: '효과' },
      { id: 'control', label: '조작성' },
    ],
  },
];
