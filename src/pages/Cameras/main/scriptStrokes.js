/**
 * 손글씨 모델명 드로잉용 '드러나는 시각' 지도 (담당: 정준혁)
 * script-{id}-time.png: 손글씨 이미지와 같은 크기의 흑백 지도. 밝을수록 먼저 드러나는 픽셀(255 = 처음, 1 = 마지막, 0 = 잉크 밖).
 * 이미지 분석 스크립트(저장소 밖)로 생성: 잉크 → 뼈대 → 왼쪽 글자부터 한 붓 그리기 순서 → 픽셀마다 가장 가까운 펜 위치의 시각.
 * 그래서 펜이 지나가는 그 획의 잉크만 드러나고, 옆 획이 미리 보이거나 끝에 따로 채워지는 조각이 없다.
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
