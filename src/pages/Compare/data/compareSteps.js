/**
 * Compare 페이지 스텝 데이터 — 선택지 id 는 compareRecommendations.js 의 규칙표 키와 같아야 한다.
 * 문구와 순서는 최종 Figma 시안(채팅형) 기준이다. 표시 문구·순서만 바꿔도 id 가 같으면 추천 규칙은 그대로 동작한다.
 * ruleId = 추천 규칙표가 아는 값(beginner / expert). 눈금에서 고르는 선택지가 규칙표보다 더 잘게 나뉜 STEP 1 에서만 쓰고, 없으면 id 를 그대로 쓴다.
 * 선택지: id = 추천 규칙에 쓰는 내부 값(바꾸지 않는다) / rulerLabel = 눈금 카드(질문 화면)에 쓰는 문구, 없으면 label / label = 짧은 이름(챗봇 되묻기·직접 입력 분류에서 쓴다) / answer = 화면에 보이는 문장형 답변
 */
export const COMPARE_STEPS = [
  {
    id: 'experience',
    label: 'STEP 1',
    question: '즉석카메라 사용 경험은 어느 정도인가요?',
    options: [
      { id: 'first', ruleId: 'beginner', label: '처음', answer: '즉석카메라는 처음 사용해 봐요.' },
      { id: 'novice', ruleId: 'beginner', label: '초보', answer: '몇 번 써 봤지만 아직 서툴러요.' },
      { id: 'familiar', ruleId: 'expert', label: '익숙', answer: '사용 경험이 있어서 익숙해요.' },
      { id: 'expert', ruleId: 'expert', label: '전문가', answer: '다양하게 다뤄 봐서 능숙해요.' },
    ],
  },
  {
    id: 'concern',
    label: 'STEP 2',
    question: '구매 전 가장 고민되는 점은 무엇인가요?',
    options: [
      { id: 'cost', label: '비용', answer: '카메라와 필름 가격이 걱정돼요.' },
      { id: 'result', label: '촬영 결과', answer: '사진이 잘 나올지 궁금해요.' },
      { id: 'features', label: '기능', answer: '모델별 기능 차이를 알고 싶어요.' },
      { id: 'usage', label: '활용도', answer: '구매 후 자주 사용할지 고민돼요.' },
    ],
  },
  {
    id: 'shooting',
    label: 'STEP 3',
    question: '어떤 촬영 경험을 원하나요?',
    options: [
      { id: 'easy', label: '편리성', rulerLabel: '간편한 촬영', answer: '간편하게 사진을 찍고 싶어요.' },
      { id: 'portable', label: '휴대성', answer: '가볍게 들고 다니고 싶어요.' },
      { id: 'effects', label: '효과', rulerLabel: '다양한 촬영 효과', answer: '다양한 촬영 효과를 사용하고 싶어요.' },
      { id: 'control', label: '조작성', rulerLabel: '세밀한 조정', answer: '직접 세밀하게 조작하고 싶어요.' },
    ],
  },
];
