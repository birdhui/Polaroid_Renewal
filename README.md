# Polaroid Renewal

Polaroid 브랜드 UX/UI 웹사이트 리뉴얼 프로젝트입니다.

- **스택**: React 19 · Vite 8 · React Router 8 · JavaScript(JSX) · CSS Modules
- **페이지**: Landing(헤더 타이틀 로고로 이동) + 서브페이지 History · Cameras · Film · Archive
- **예정**: Three.js 기반 카메라 인터랙션 (`src/three/`)
- **배포**: 아직 하지 않음

## 시작하기

### 요구 사항

- Node.js **22.22.0 이상** (React Router 8 요구 사항) — `node -v`로 확인
- npm (Node.js에 포함)

### 설치 및 실행

```bash
git clone https://github.com/birdhui/Polaroid_Renewal.git
cd Polaroid_Renewal
git switch develop          # 통합 브랜치
git switch <배정받은-브랜치>   # PM이 생성·배정한 개인 브랜치
npm install
npm run dev                 # http://localhost:5173
```

### 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 로컬 미리보기 |

## 협업 규칙

자세한 내용은 [AGENTS.md](./AGENTS.md)를 확인하세요. (`CLAUDE.md`도 같은 내용)

- 배정받은 브랜치에서만 개발하고, `main`·`develop`에는 직접 Push하지 않습니다. 반영은 `develop`으로 Pull Request를 보냅니다.
- 공통 파일을 수정해야 하면 변경 이유와 영향을 먼저 확인합니다.
- 기존 코드를 임의로 삭제하지 않습니다.
- 테스트(`npm run build` 등)를 완료하지 않았으면 완료했다고 보고하지 않습니다.

### 커밋 메시지

```
type(scope): 변경 내용 요약
```

허용 타입: `feat` `fix` `style` `perf` `refactor` `assets` `docs` `chore`

예: `feat(landing): 히어로 섹션 마크업 추가`

## 폴더 구조

```
Polaroid_Renewal/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ favicon.svg
│  ├─ models/            # 3D 모델 (.glb/.gltf)
│  └─ videos/            # 대용량 영상
└─ src/
   ├─ main.jsx           # 진입점
   ├─ app/               # App, router, routes(경로 상수)
   ├─ layouts/RootLayout/
   ├─ components/
   │  ├─ common/         # 사이트 공통 영역 (SiteHeader)
   │  └─ ui/             # 재사용 UI 컴포넌트
   ├─ pages/
   │  ├─ Landing/  History/  Cameras/  Film/  Archive/
   │  └─ NotFound/
   ├─ three/             # Three.js 장면·오브젝트·로더·유틸
   ├─ hooks/
   ├─ utils/
   ├─ styles/            # reset, variables(디자인 토큰), global
   └─ assets/
      ├─ images/         # common/ landing/ history/ cameras/ film/ archive/
      ├─ icons/
      ├─ fonts/
      └─ textures/
```

에셋 위치, 네이밍 규칙, 공통 파일 목록은 [AGENTS.md](./AGENTS.md)에 정리되어 있습니다.
