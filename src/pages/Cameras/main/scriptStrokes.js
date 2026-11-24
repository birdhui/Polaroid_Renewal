/**
 * 손글씨 모델명 드로잉용 '드러나는 시각' 지도 (담당: 정준혁)
 * script-{id}-time.png: 손글씨 이미지와 같은 크기의 흑백 지도. 밝을수록 먼저 드러나는 픽셀(255 = 처음, 1 = 마지막, 0 = 잉크 밖).
 * 이미지 분석 스크립트(저장소 밖)로 생성: 잉크 → 뼈대 → 왼쪽 글자부터 한 붓 그리기 순서 → 펜이 지나간 자리를 둥근 붓으로 칠한 시각.
 *  - 갈림길에서 꺾인 뼈대 대신 부드럽게 편 중심선을 따라, 획 전체에서 같은 두께의 붓으로 칠한다
 *    → 앞 획을 그릴 때 뒤 획 뿌리가 혹처럼 튀어나오거나 이가 빠진 듯 깎이지 않는다.
 *  - 갈림길과 갈림길을 잇는 짧은 조각(예: N 골짜기 → o 출발점)은 이어지는 획 바로 앞에 붙여 그린다.
 *  - 고리(o 등)는 양쪽 반을 동시에 그리지 않고, 한쪽을 다 그린 뒤 이어서 돌아오게 한다.
 *  - 잉크 바깥 4px 까지 같은 시각을 넣어 둔다(ScriptDraw 의 경계 흐림이 잉크 가장자리를 깎지 않도록).
 */
import now from '@/assets/cameras/main/script-now-time.png';
import nowPlus from '@/assets/cameras/main/script-now-plus-time.png';
import flip from '@/assets/cameras/main/script-flip-time.png';
import mod from '@/assets/cameras/main/script-mod-time.png';
import i2 from '@/assets/cameras/main/script-i2-time.png';
import go from '@/assets/cameras/main/script-go-time.png';

const SCRIPT_STROKES = {
  now: { w: 1092, h: 588, time: now },
  'now-plus': { w: 1040, h: 536, time: nowPlus },
  flip: { w: 990, h: 558, time: flip },
  mod: { w: 1208, h: 736, time: mod },
  i2: { w: 1062, h: 646, time: i2 },
  go: { w: 1016, h: 858, time: go },
};

export default SCRIPT_STROKES;
