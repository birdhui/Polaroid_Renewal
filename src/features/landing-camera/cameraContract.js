/**
 * Landing ↔ landing-camera 공통 인터페이스 (계약)
 *
 * - 소유: 곽세희(Landing · landing-camera). landing-visuals(임희지)에 영향이 있으면 임희지와 협의한다.
 * - 방향: Landing → 카메라는 props(아래 CameraExperienceProps)로만 전달한다.
 *         카메라 → Landing은 onEvent 콜백으로 "알리기만" 한다.
 * - 카메라 모듈은 window 스크롤, Landing 상태, Landing 파일을 직접 읽거나 바꾸지 않는다.
 * - 값의 의미만 정의한다. 실제 회전값·색상·연출은 디자인 확정 후 각 담당자가 채운다.
 *
 * 자세한 설명: src/features/landing-camera/README.md
 */

/** 기능 시연 모드 — 한 번에 하나만 활성. 기능이 없으면 null */
export const CAMERA_FEATURES = Object.freeze({
  AUTOFOCUS: 'autofocus',
  DOUBLE_EXPOSURE: 'doubleExposure',
  SELF_TIMER: 'selfTimer',
});

/** Landing → 카메라 1회성 동작 신호 (action.type) */
export const CAMERA_ACTIONS = Object.freeze({
  SHUTTER: 'shutter',
  EJECT_FILM: 'ejectFilm',
});

/** 카메라 → Landing 알림 (onEvent 의 첫 번째 인자) */
export const CAMERA_EVENTS = Object.freeze({
  READY: 'ready', // 모델·에셋 로딩 완료
  ACTION_COMPLETE: 'actionComplete', // action 처리 완료 — payload: { id, type }
  ERROR: 'error', // 로딩·렌더링 실패 — payload: { message }
});

/**
 * @typedef {Object} CameraPose
 * @property {[number, number, number]} rotation  라디안 [x, y, z]
 * @property {[number, number, number]} position  장면 단위 [x, y, z]
 * @property {number} scale                        1 = 기본 크기
 */

/**
 * @typedef {Object} CameraAction
 * @property {string} id     매번 새 값(예: 'shutter-1'). id 가 바뀔 때만 1회 실행된다.
 * @property {string} type   CAMERA_ACTIONS 중 하나
 */

/**
 * @typedef {Object} CameraExperienceProps
 * @property {boolean} visible               카메라 레이어 표시 여부 (false 여도 Canvas 는 유지)
 * @property {CameraPose} pose               목표 자세 — 보간(애니메이션) 방식은 카메라 모듈이 결정
 * @property {string} colorway               제품 컬러 id — 값 목록은 디자인 확정 후 정의
 * @property {string|null} feature          CAMERA_FEATURES 중 하나 또는 null
 * @property {number} featureProgress        현재 feature 진행률 0~1 (Landing 스크롤에서 계산해 전달)
 * @property {CameraAction|null} action      1회성 동작 신호
 * @property {(type: string, payload?: object) => void} [onEvent]  카메라 → Landing 알림
 */

/** 기본값 — Landing 이 아직 값을 정하지 않은 항목에 사용 */
export const DEFAULT_CAMERA_STATE = Object.freeze({
  visible: false,
  pose: Object.freeze({ rotation: [0, 0, 0], position: [0, 0, 0], scale: 1 }),
  colorway: 'default',
  feature: null,
  featureProgress: 0,
  action: null,
});
