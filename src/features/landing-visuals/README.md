# features/landing-visuals

Landing의 시네마틱 비주얼 전용 영역입니다. **담당: 임희지** (브랜치 `feat/landing-visuals`)

| 포함 | 포함하지 않음 |
| --- | --- |
| 영상·이미지 연출, 필름 현상·노후화 효과, Rewind 비주얼, 도면 전환, 빛 효과, 2.5D 공간(책상 배경), 랜딩 이미지·영상 에셋 최적화 | 스크롤 흐름·장면 순서·카피 (→ `src/pages/Landing/`), 3D 카메라 회전·컬러·자동초점·더블노출·셀프타이머 등 카메라 3D 제어 (→ `src/features/landing-camera/`) — 담당: 곽세희 |

## 폴더

```
components/   Landing 에 배치되는 비주얼 컴포넌트 (Rewind, 도면, 2.5D 책상 배경 등)
effects/      필름 현상·노후화, 빛, 전환 효과 (CSS · Canvas · 셰이더 등)
hooks/        비주얼 전용 훅
```

에셋 위치:
- 영상·이미지 시퀀스처럼 URL로 불러오는 파일은 `public/assets/landing/`에 둡니다.
- 코드에서 import 하는 이미지는 `src/assets/landing/`에 둡니다.

## 연결 규칙

- Landing(`src/pages/Landing/`)이 비주얼 컴포넌트를 import 해서 배치합니다.
- 비주얼 컴포넌트는 스크롤 진행률 같은 값을 **props로 받기만** 합니다. `window` 스크롤을 직접 읽거나 장면 흐름을 바꾸지 않습니다.
- 컴포넌트별 props는 구현을 시작할 때 곽세희와 정하고, 이 README에 표로 정리합니다.
- 3D 카메라(`landing-camera`)와 화면을 겹치거나 상태를 주고받아야 하면 Landing을 통해 연결합니다. 두 기능 모듈은 서로 직접 import 하지 않습니다.

## QA 책임

- 랜딩 이미지·영상 에셋 최적화(용량·포맷)
- 반응형 및 시각 효과 QA

## 아직 정하지 않은 것

- 효과 구현 방식(CSS / Canvas 2D / WebGL)과 필요한 라이브러리. 설치 전 PM 승인이 필요합니다.
- 장면별로 어떤 효과를 쓸지는 Landing 기획 확정 후 정합니다.
