# features/landing-camera

Landing의 Polaroid Now 3D 모델과 카메라 인터랙션 전용 영역입니다. **담당: 곽세희**

| 포함 | 포함하지 않음 |
| --- | --- |
| 3D 모델 렌더링, 회전·위치·크기 적용, 셔터·필름 출력 3D 연출, 제품 컬러 전환, Autofocus · Double Exposure · Self-Timer 3D 연출, 3D 에셋·렌더링 최적화 | Landing 스크롤 진행률 계산, 장면 전환, 카피, 장면 순서 (→ `src/pages/Landing/`) · 시네마틱 비주얼·필름 효과·2.5D 전환 (→ `src/features/landing-visuals/`, 담당: 임희지) |

## 폴더

```
CameraExperience.jsx      진입점 — Landing 이 import 하는 유일한 컴포넌트
CameraExperience.module.css
cameraContract.js         Landing ↔ 카메라 공통 인터페이스 (상수·기본값·타입)
engine/polaroidScene.js   3D 장면 엔진 (아티팩트 프로토타입 1차 이식본 — 아래 '현재 상태' 참고)
components/               3D 장면, 모델, 조명 등
animations/               셔터·필름 출력·컬러 전환 등 애니메이션
interactions/             Autofocus · Double Exposure · Self-Timer
hooks/                    3D 전용 훅
```

에셋 위치:
- 3D 모델, 영상, 오디오처럼 URL로 불러오는 파일은 `public/assets/landing-camera/`에 둡니다. 예: `/assets/landing-camera/polaroid-now.glb`
- 코드에서 import 하는 텍스처는 `src/assets/landing-camera/textures/`에 둡니다.

## 연결 규칙

1. Landing은 `CameraExperience`를 **한 번만** 마운트합니다. 여러 섹션에서 같은 인스턴스를 계속 보여주고, 3D Canvas를 섹션마다 새로 만들지 않습니다.
2. **Landing → 카메라**: props로만 전달합니다.

   | prop | 타입 | 의미 |
   | --- | --- | --- |
   | `visible` | boolean | 카메라 표시 여부. `false`여도 Canvas는 유지 |
   | `pose` | `{ rotation:[x,y,z], position:[x,y,z], scale }` | 목표 자세. 보간 방식은 카메라 모듈이 결정 |
   | `colorway` | string | 제품 컬러 id. 값 목록은 디자인 확정 후 정의 |
   | `feature` | `'autofocus' \| 'doubleExposure' \| 'selfTimer' \| null` | 현재 시연 기능 |
   | `featureProgress` | number 0~1 | 현재 기능의 진행률. Landing이 스크롤에서 계산 |
   | `action` | `{ id, type: 'shutter' \| 'ejectFilm' } \| null` | 1회성 동작. `id`가 바뀔 때만 실행 |
   | `onEvent` | `(type, payload) => void` | 카메라 → Landing 알림 |

3. **카메라 → Landing**: `onEvent`로 알리기만 합니다. 이벤트는 `ready`, `actionComplete { id, type }`, `error { message }`입니다.
4. 카메라 모듈은 `window` 스크롤이나 Landing 상태·파일을 직접 읽거나 바꾸지 않습니다.
5. Landing과 카메라 모듈은 같은 담당자(곽세희)지만, 이 경계를 그대로 지킵니다. 인터페이스(`cameraContract.js`)를 바꾸면 같은 PR에서 이 README도 함께 고칩니다. landing-visuals에 영향이 있으면 임희지와 협의합니다.

## 사용 예 (Landing 쪽)

```jsx
<CameraExperience
  visible
  pose={{ rotation: [0, Math.PI / 6, 0], position: [0, 0, 0], scale: 1 }}
  colorway="default"
  feature={CAMERA_FEATURES.AUTOFOCUS}
  featureProgress={0.4}
  action={{ id: 'shutter-1', type: CAMERA_ACTIONS.SHUTTER }}
  onEvent={(type, payload) => { /* 장면 진행 등 Landing 이 결정 */ }}
/>
```

## 아직 정하지 않은 것

- 3D 라이브러리: `three`(0.170)로 1차 이식. React Three Fiber 전환 여부는 계약 분리 작업 때 정합니다.
- 모델 파일과 컬러 목록, 장면별 pose 값
- 위 항목이 정해지기 전까지 `CameraExperience`는 빈 레이어만 렌더링합니다.

## 현재 상태 (프로토타입 1차 이식)

- `engine/polaroidScene.js`는 아티팩트 프로토타입(Polaroid Renewal)의 three.js 장면을 그대로 옮긴 것입니다.
  히어로 카메라, 플래시·사진 출력·낙하·상승, 레이어 블러, NOW 도면 정합, 8가지 컬러 회전을 그립니다.
- Landing(`src/pages/Landing/LandingPage.jsx`)이 `mountPolaroidScene(signal)`로 한 번만 붙이고, 페이지를 떠날 때 정리합니다.
- **연결 규칙 4번과 다른 점**: 프로토타입 구조를 유지하느라 지금은 window 스크롤을 직접 읽고, `window.__*` 값으로 Landing UI 엔진과 주고받습니다.
  `CameraExperience` + `cameraContract.js` props 계약으로 나누는 작업은 다음 단계에서 진행합니다.
- 사용 에셋: `/assets/landing-camera/polaroid-now.glb`, `/assets/landing-camera/draco/draco_decoder.js`, `/assets/landing-camera/print-photo.jpg`
