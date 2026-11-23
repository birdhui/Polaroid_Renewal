# 프로젝트 구조

```
Polaroid_Renewal/
├─ index.html · package.json · vite.config.js · .nvmrc · .gitignore
├─ README.md · AGENTS.md · CLAUDE.md
├─ docs/                         git-convention · project-structure · development-guide · styleguide
├─ public/
│  ├─ favicon.svg
│  └─ assets/                    URL로 불러오는 큰 파일 (영상 · 오디오 · 3D 모델 · 큰 이미지)
│     ├─ landing/  landing-camera/  history/  cameras/  film/  archive/  shared/
└─ src/
   ├─ main.jsx                   진입점
   ├─ app/                       App.jsx · router.jsx · routes.js(경로 상수 · 메뉴 순서)
   ├─ pages/
   │  ├─ Landing/                LandingPage.jsx + components/ hooks/ data/(landingScenes.js)
   │  ├─ History/  Cameras/  Film/  Archive/
   │  │                          {Page}Page.jsx · {Page}Page.module.css · components/ hooks/ data/
   │  └─ NotFound/               404
   ├─ features/
   │  ├─ landing-camera/         CameraExperience.jsx · cameraContract.js · components/ animations/ interactions/ hooks/
   │  └─ landing-visuals/        components/ effects/ hooks/ (시네마틱 비주얼 · 필름 효과 · 2.5D 전환)
   ├─ shared/
   │  ├─ components/             RootLayout · SiteHeader · SiteFooter · ui/(버튼 등)
   │  ├─ styles/                 reset.css · variables.css(디자인 토큰) · global.css
   │  ├─ hooks/
   │  └─ utils/
   └─ assets/                    코드에서 import 하는 이미지·아이콘·폰트·텍스처 (빌드 시 최적화)
      ├─ landing/  landing-camera/textures/  history/  cameras/  film/  archive/
      └─ shared/  fonts/ icons/ images/
```

## 담당 디렉터리

| 담당자 | 브랜치 | 코드 | 에셋 |
| --- | --- | --- | --- |
| 곽세희 (PM) | `feat/landing-core` | `src/pages/Landing/`, `src/features/landing-camera/` | `public/assets/landing-camera/`, `src/assets/landing-camera/` |
| 임희지 | `feat/landing-visuals` | `src/features/landing-visuals/` | `public/assets/landing/`, `src/assets/landing/` |
| 정준혁 | `feat/cameras` | `src/pages/Cameras/` | `public/assets/cameras/`, `src/assets/cameras/` |
| 손다은 | `feat/film` | `src/pages/Film/` | `public/assets/film/`, `src/assets/film/` |
| 모진아 | `feat/history` | `src/pages/History/` | `public/assets/history/`, `src/assets/history/` |
| 이나라 | `feat/archive` | `src/pages/Archive/` | `public/assets/archive/`, `src/assets/archive/` |
| 임희지 | `feat/cameras-now` | `src/pages/Cameras/Now/` | `public/assets/cameras/now/`, `src/assets/cameras/now/` |

### 역할과 추가 책임

| 담당자 | 주 담당 범위 | 추가 책임 |
| --- | --- | --- |
| 곽세희 | Landing 전체 UX/UI, 스크롤 스토리텔링, 3D 카메라 및 핵심 인터랙션 개발 | PM, 카피·연출 관리, 전체 UX/UI 검수, 최종 `main` 병합 및 배포 |
| 임희지 | Landing 시네마틱 비주얼, 필름 현상·노후화 효과, 도면 전환 및 2.5D 공간 구현 | 랜딩 이미지·영상 에셋 최적화, 반응형 및 시각 효과 QA |
| 정준혁 | Cameras 페이지 UX/UI 및 프론트엔드 개발 | 프로젝트 구조·라우팅·공통 컴포넌트 관리, Git 충돌 지원, `develop` 통합 테스트 및 배포 전 기술 검수 |
| 손다은 | Film 페이지 UX/UI 및 프론트엔드 개발 | UX 리서치, IA·User Flow 반영, 사용성 테스트 기획·진행 및 결과 정리 |
| 모진아 | History 페이지 UX/UI 및 프론트엔드 개발 | 공통 디자인 시스템·`styleguide.md`·스타일 토큰 관리, 브랜드 공통 에셋 관리 |
| 이나라 | Archive 페이지 UX/UI 및 프론트엔드 개발 | 사진 업로드·편집·꾸미기·저장 인터랙션 및 편집 UI 구현·검증 |

- **곽세희 — Landing Core**: Loading부터 Footer까지 전체 스크롤 흐름, 3D 카메라 회전·컬러 변경·자동초점·더블노출·셀프타이머를 개발합니다.
- **임희지 — Landing Visuals**: 영상·이미지·필름 현상·Rewind·도면·빛·2.5D 책상 배경을 구현합니다. 카메라의 3D 제어 자체는 곽세희가 담당합니다.
- **정준혁 — Frontend Integration & QA**:
  - Cameras를 개발하면서 공통 라우팅과 Header·Footer 등 코드 구조를 관리합니다.
  - 통합 과정의 공통 오류를 점검하고, 해결이 어려운 충돌을 지원합니다.
- **손다은 — UX Validation**:
  - Film 페이지를 개발하고, 전체 프로젝트의 핵심 사용자 과업과 사용성 검증을 정리합니다.
  - 실제 오류 수정은 각 페이지 담당자가 합니다.
- **모진아 — Design System**:
  - History 개발과 별도로 공통 폰트·컬러·스타일 기준과 로고·파비콘을 관리합니다.
  - 페이지별 이미지·영상은 각 담당자가 직접 관리합니다.
- **이나라 — Archive Editor**:
  - 사용자가 사진을 업로드하고 필름·메모·스티커·날짜를 적용한 뒤 이미지로 저장하는 편집 기능을 구현합니다.
  - 모두 브라우저에서만 처리합니다.
  - 고급 3D 효과는 기본 기능 완성 후 추가합니다.

### 공통 영역 관리자

공통 영역은 수정 전에 관리자와 공유합니다.

| 영역 | 관리 | 작업 브랜치 |
| --- | --- | --- |
| `src/app/`(라우팅), 프로젝트 초기 설정, 개발 문서 | 곽세희·정준혁 | `chore/project-structure` 등 `chore/*` |
| `src/shared/components/`(RootLayout · Header · Footer · ui) | 정준혁 | `chore/*` 또는 PM 협의 |
| `src/shared/styles/`, `docs/styleguide.md`, 로고·파비콘(`public/favicon.svg`), `*/assets/shared/` | 모진아 | `style/design-system` |
| `src/shared/hooks/`, `src/shared/utils/` | 공용. 추가 시 PR에 사용처 기재, 정준혁 검수 | 각자 브랜치 |
| `package.json` · `vite.config.js` 등 루트 설정, `AGENTS.md` · `CLAUDE.md` · `README.md` | 곽세희(PM) | `chore/*` |

## 페이지와 라우팅

| 페이지 | 경로 | 진입 |
| --- | --- | --- |
| Landing | `/` | 헤더 타이틀 로고 |
| History | `/history` | 헤더 메뉴 |
| Cameras | `/cameras` | 헤더 메뉴 |
| Film | `/film` | 헤더 메뉴 |
| Archive | `/archive` | 헤더 메뉴 |
| NotFound | 그 외 | — |

- 경로와 메뉴 순서는 `src/app/routes.js`, 페이지 연결은 `src/app/router.jsx`에서 관리합니다.
- 모든 페이지는 `RootLayout` 안에서 렌더링되므로 Header·Footer를 페이지에서 다시 만들지 않습니다.

## Landing 모듈 분리

| 영역 | 담당 | 역할 |
| --- | --- | --- |
| `src/pages/Landing/` | 곽세희 | 스크롤 진행률, 장면 전환, 카피, 전체 흐름. 장면 순서는 `data/landingScenes.js` |
| `src/features/landing-camera/` | 곽세희 | 3D 렌더링, 카메라 인터랙션. Landing 스크롤을 직접 읽거나 제어하지 않음 |
| `src/features/landing-visuals/` | 임희지 | 시네마틱 비주얼, 필름 효과, 2.5D 전환. 진행률 등은 props로만 받음 |

- Landing은 `CameraExperience`를 한 번만 마운트하고 props·`onEvent`로 연결합니다. 여러 섹션에서 같은 3D Canvas를 씁니다. 규칙은 `src/features/landing-camera/README.md`와 `cameraContract.js`를 보세요.
- Landing은 landing-visuals 컴포넌트를 import 해서 배치합니다. props는 구현 시작 시 곽세희·임희지가 정해 `src/features/landing-visuals/README.md`에 기록합니다.
- 두 기능 모듈(`landing-camera`, `landing-visuals`)은 서로 직접 import 하지 않고 Landing을 통해 연결합니다.

확정된 Landing 흐름:

```
Loading → Hero → Viewfinder Exit → Camera Reveal → Capture → Film Ejection → Rewind → 1943 Question
→ Evolution → 2008 Pause → Rebirth → Now Reveal → Colors → Autofocus → Double Exposure → Self-Timer → Footer
```

Now+ 섹션, 별도 아웃트로, 추가 사진 갤러리는 범위에 포함하지 않습니다.

## 에셋 위치 기준

| 종류 | 위치 | 사용 |
| --- | --- | --- |
| 영상 · 오디오 · 3D 모델(.glb/.gltf) · 아주 큰 이미지 | `public/assets/{영역}/` | `'/assets/film/sample.mp4'`처럼 URL로 사용 |
| 컴포넌트에서 쓰는 이미지 · 아이콘 · 폰트 · 텍스처 | `src/assets/{영역}/` | `import img from '@/assets/film/roll.webp'` |

- 파일명은 kebab-case 소문자로 짓습니다. 예: `polaroid-now-front.webp`
- 대략 10MB가 넘는 파일은 압축하거나 PM과 저장 방식을 상의합니다.
