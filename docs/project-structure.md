# 프로젝트 구조

```
Polaroid_Renewal/
├─ index.html · package.json · vite.config.js · .nvmrc · .gitignore
├─ README.md · AGENTS.md · CLAUDE.md
├─ docs/                         git-convention · project-structure · development-guide
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

| 담당자 | 브랜치 | 코드 | 에셋 | 추가 책임 |
| --- | --- | --- | --- | --- |
| 곽세희 (PM) | `feat/landing-core` | `src/pages/Landing/`, `src/features/landing-camera/` | `public/assets/landing-camera/`, `src/assets/landing-camera/` | 전체 UX/UI 검수, 최종 병합·배포 |
| 임희지 | `feat/landing-visuals` | `src/features/landing-visuals/` | `public/assets/landing/`, `src/assets/landing/` | 랜딩 에셋 최적화, 반응형 QA |
| 정준혁 | `feat/cameras` | `src/pages/Cameras/` | `public/assets/cameras/`, `src/assets/cameras/` | 공통 구조·라우팅(`src/app/`), 개발 충돌 지원, `develop` 통합 테스트, `main` 기술 리뷰 |
| 손다은 | `feat/film` | `src/pages/Film/` | `public/assets/film/`, `src/assets/film/` | UX 리서치, IA·User Flow 반영, 사용성 검증 |
| 모진아 | `feat/history` | `src/pages/History/` | `public/assets/history/`, `src/assets/history/` | 브랜드 그래픽·에셋·디자인 시스템(`src/shared/styles/`, `*/assets/shared/`) |
| 이나라 | `feat/archive` | `src/pages/Archive/` | `public/assets/archive/`, `src/assets/archive/` | 사진 편집 인터랙션·UI (브라우저 내 처리) |

공통 자원의 관리자는 다음과 같아요. 수정할 때는 PM과 미리 협의합니다.

- `src/app/`(라우팅·구조): 정준혁
- `src/shared/components/`(Header·Footer·UI): 변경 전 PM 협의, 구조 검토는 정준혁
- `src/shared/styles/`: 모진아. 디자인 토큰 변경은 모진아와 PM이 검토합니다.
- `src/shared/hooks/`, `src/shared/utils/`: 함께 쓰는 공간이며, 추가할 때 PR에 사용처를 적습니다.
- `public/assets/shared/`, `src/assets/shared/`(브랜드 그래픽·폰트·아이콘): 모진아
- 루트 설정 파일(`package.json`, `vite.config.js` 등)과 `docs/`, `AGENTS.md`, `CLAUDE.md`, `README.md`: PM

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
