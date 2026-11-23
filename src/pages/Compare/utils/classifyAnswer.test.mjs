// 사용법: node src/pages/Compare/utils/classifyAnswer.test.mjs  (프로젝트 루트에서)
// 문장 → 기대하는 분류. 'matched:선택지id' | 'ambiguous:a,b' | 'unknown'
import classifyAnswer from './classifyAnswer.js';
import { COMPARE_LEXICON } from '../data/compareLexicon.js';
import { COMPARE_STEPS } from '../data/compareSteps.js';
import { COMPARE_RULES } from '../data/compareRecommendations.js';

const CASES = {
  experience: [
    // 요청서 예시
    ['완전 초보예요', 'matched:beginner'],
    ['한 번도 안 써봤어요', 'matched:beginner'],
    ['카메라에 대해 잘 몰라요', 'matched:beginner'],
    ['처음 사용해 봐요', 'matched:beginner'],
    ['여행 갈 때 몇 번 써봤어요', 'matched:beginner'],
    // 입문자 변형
    ['완전 초보예요!', 'matched:beginner'],
    ['처음이에요', 'matched:beginner'],
    ['입문자입니다', 'matched:beginner'],
    ['입문자', 'matched:beginner'],
    ['이제 막 시작했어요', 'matched:beginner'],
    ['써본 적 없어요', 'matched:beginner'],
    ['사용해본 적이 없어요 ㅠㅠ', 'matched:beginner'],
    ['경험이 거의 없어요', 'matched:beginner'],
    ['아직 잘 몰라요', 'matched:beginner'],
    ['어떻게 쓰는지 몰라요', 'matched:beginner'],
    ['사용법을 몰라요', 'matched:beginner'],
    ['익숙하지 않아요', 'matched:beginner'],
    ['익숙하지는 않아요', 'matched:beginner'],
    ['가끔 써요', 'matched:beginner'],
    ['한두 번 써봤어요', 'matched:beginner'],
    ['생일 때 한 번 찍어본 게 전부예요', 'unknown'],
    ['전문가는 아니고 초보예요', 'matched:beginner'],
    ['전문가는 아니에요', 'matched:beginner'],
    ['카메라는 처음 사봐요', 'matched:beginner'],
    ['초보자예요', 'matched:beginner'],
    // 전문가 변형
    ['전문가예요', 'matched:expert'],
    ['전문가', 'matched:expert'],
    ['자주 써요', 'matched:expert'],
    ['오래 써왔어요', 'matched:expert'],
    ['3년째 쓰고 있어요', 'matched:expert'],
    ['몇 년째 쓰고 있어요', 'matched:expert'],
    ['많이 써봤어요', 'matched:expert'],
    ['꽤 익숙해요', 'matched:expert'],
    ['능숙한 편이에요', 'matched:expert'],
    ['경험이 많아요', 'matched:expert'],
    ['취미로 사진을 찍어요', 'matched:expert'],
    ['카메라 잘 알아요', 'matched:expert'],
    ['매일 들고 다니면서 찍어요', 'matched:expert'],
    ['초보는 아니에요', 'matched:expert'],
    ['초보 탈출했어요', 'matched:expert'],
    ['여러 대 가지고 있어요', 'matched:expert'],
    // 애매함 / 분류 불가
    ['초보인데 취미로 오래 했어요', 'ambiguous:beginner,expert'],
    ['써본 적은 있어요', 'unknown'],
    ['안녕하세요', 'unknown'],
    ['ㅋㅋㅋ', 'unknown'],
    ['몰라요', 'unknown'],
    ['', 'unknown'],
    ['??', 'unknown'],
    ['😀', 'unknown'],
  ],
  concern: [
    // 요청서 예시
    ['필름값이 너무 비쌀까 봐 걱정돼요', 'matched:cost'],
    ['사진이 잘 나올지 모르겠어요', 'matched:result'],
    ['카메라마다 뭐가 다른지 모르겠어요', 'matched:features'],
    ['사놓고 안 쓸까 봐 걱정돼요', 'matched:usage'],
    // 비용
    ['가격이 부담돼요', 'matched:cost'],
    ['돈이 많이 들 것 같아서요', 'matched:cost'],
    ['필름 유지비가 걱정이에요', 'matched:cost'],
    ['예산이 빠듯해요', 'matched:cost'],
    ['가성비가 중요해요', 'matched:cost'],
    ['너무 비싼 건 싫어요', 'matched:cost'],
    ['비용', 'matched:cost'],
    // 촬영 결과
    ['화질이 좋을지 궁금해요', 'matched:result'],
    ['사진이 흐릿하게 나올까 봐요', 'matched:result'],
    ['결과물이 예쁘게 나왔으면 좋겠어요', 'matched:result'],
    ['색감이 마음에 들지 걱정이에요', 'matched:result'],
    ['사진을 망칠까 봐 걱정돼요', 'matched:result'],
    ['촬영 결과', 'matched:result'],
    // 기능
    ['성능 차이를 잘 모르겠어요', 'matched:features'],
    ['기능이 너무 많아서 헷갈려요', 'matched:features'],
    ['어떤 모델이 좋은지 모르겠어요', 'matched:features'],
    ['뭘 사야 할지 모르겠어요', 'matched:features'],
    ['종류가 많아서 고르기 어려워요', 'matched:features'],
    ['스펙 비교가 어려워요', 'matched:features'],
    ['기능', 'matched:features'],
    // 활용도
    ['금방 질릴까 봐요', 'matched:usage'],
    ['서랍에 넣어두고 안 쓰게 될 것 같아요', 'matched:usage'],
    ['자주 쓸 수 있을지 모르겠어요', 'matched:usage'],
    ['활용을 잘 할지 걱정이에요', 'matched:usage'],
    ['한두 번 쓰고 말까 봐요', 'matched:usage'],
    ['활용도', 'matched:usage'],
    // 부정 · 무시
    ['가격은 괜찮은데 사진이 잘 나올지 걱정돼요', 'matched:result'],
    ['비용은 상관없어요 화질이 중요해요', 'matched:result'],
    // 애매함 / 분류 불가
    ['비용도 걱정되고 사진이 잘 나올지도 걱정돼요', 'ambiguous:result,cost'],
    ['가격도 그렇고 성능도 궁금해요', 'ambiguous:cost,features'],
    ['특히 가격이 제일 걱정돼요 사진도 걱정되긴 해요', 'matched:cost'],
    ['잘 모르겠어요', 'unknown'],
    ['딱히 없어요', 'unknown'],
    ['ㅎㅎ', 'unknown'],
  ],
  shooting: [
    // 요청서 예시
    ['그냥 버튼만 누르면 찍히는 게 좋아요', 'matched:easy'],
    ['여행 갈 때 가지고 다니고 싶어요', 'matched:portable'],
    ['다양한 사진을 찍어보고 싶어요', 'matched:effects'],
    ['설정을 직접 조절하고 싶어요', 'matched:control'],
    ['여행 갈 때 편하게 들고 다니고 싶어요', 'matched:portable'],
    // 편리성
    ['간편하게 찍고 싶어요', 'matched:easy'],
    ['쉽게 쓸 수 있으면 좋겠어요', 'matched:easy'],
    ['복잡한 건 싫어요', 'matched:easy'],
    ['설정 안 하고 바로 찍고 싶어요', 'matched:easy'],
    ['복잡한 설정은 싫어요', 'matched:easy'],
    ['자동으로 알아서 찍어줬으면 해요', 'matched:easy'],
    ['편리성', 'matched:easy'],
    // 휴대성
    ['가볍고 작았으면 좋겠어요', 'matched:portable'],
    ['주머니에 쏙 들어가면 좋겠어요', 'matched:portable'],
    ['어디든 들고 다니고 싶어요', 'matched:portable'],
    ['가방에 넣고 다니기 좋았으면 해요', 'matched:portable'],
    ['무겁지 않았으면 해요', 'matched:portable'],
    ['휴대성', 'matched:portable'],
    // 효과
    ['이중 노출 같은 재미있는 효과를 써보고 싶어요', 'matched:effects'],
    ['색다른 사진을 찍고 싶어요', 'matched:effects'],
    ['여러 가지 모드가 있으면 좋겠어요', 'matched:effects'],
    ['창의적인 사진이 좋아요', 'matched:effects'],
    ['효과', 'matched:effects'],
    // 조작성
    ['세밀하게 조절하고 싶어요', 'matched:control'],
    ['수동으로 찍어보고 싶어요', 'matched:control'],
    ['밝기를 내 마음대로 바꾸고 싶어요', 'matched:control'],
    ['조작성', 'matched:control'],
    // 애매함 / 분류 불가
    ['가볍고 버튼만 누르면 되는 카메라요', 'ambiguous:easy,portable'],
    ['휴대하기 편하고 다양한 효과도 쓰고 싶어요', 'ambiguous:effects,portable'],
    ['모르겠어요', 'unknown'],
    ['카메라 사고 싶어요', 'unknown'],
    ['ㅋㅋㅋㅋ', 'unknown'],
  ],
};

let failed = 0;
let total = 0;
for (const [stepId, cases] of Object.entries(CASES)) {
  for (const [text, expected] of cases) {
    total += 1;
    const result = classifyAnswer(stepId, text);
    const actual =
      result.status === 'matched'
        ? `matched:${result.optionId}`
        : result.status === 'ambiguous'
          ? `ambiguous:${[...result.candidates].sort().join(',')}`
          : 'unknown';
    const normalizeExpected = (v) => (v.startsWith('ambiguous:') ? `ambiguous:${v.slice(10).split(',').sort().join(',')}` : v);
    if (actual !== normalizeExpected(expected)) {
      failed += 1;
      console.log(`✗ [${stepId}] "${text}" → ${actual}  (기대: ${expected})`);
    }
  }
}

// 사전의 선택지 id 가 스텝 데이터·추천 규칙표와 같은지 확인한다. (새 id 를 만들지 않았다는 보증)
for (const step of COMPARE_STEPS) {
  const lexiconIds = Object.keys(COMPARE_LEXICON[step.id] ?? {}).sort().join();
  const stepIds = step.options.map((o) => o.id).sort().join();
  total += 1;
  if (lexiconIds !== stepIds) {
    failed += 1;
    console.log(`✗ 사전 id 불일치 [${step.id}] 사전: ${lexiconIds} / 스텝: ${stepIds}`);
  }
}
const ruleIds = new Set();
for (const exp of Object.values(COMPARE_RULES)) for (const [shooting, byConcern] of Object.entries(exp)) { ruleIds.add(`shooting:${shooting}`); for (const concern of Object.keys(byConcern)) ruleIds.add(`concern:${concern}`); }
for (const [stepId, optionId] of [...ruleIds].map((v) => v.split(':'))) {
  total += 1;
  const step = COMPARE_STEPS.find((s) => s.id === stepId);
  if (!step.options.some((o) => o.id === optionId)) { failed += 1; console.log(`✗ 규칙표 id 가 스텝에 없음: ${stepId}:${optionId}`); }
}

console.log(failed ? `\n${failed} / ${total} 실패` : `전부 통과 (${total}건)`);
process.exit(failed ? 1 : 0);
