# AI 협업 작업 원칙 — Polaroid Renewal

> 이 파일은 AI 코딩 도구(Codex, Claude Code, Cursor 등)와 팀원이 함께 따르는 작업 원칙입니다.
> `AGENTS.md`와 `CLAUDE.md`는 **같은 내용**을 유지합니다. 한쪽을 수정하면 다른 쪽도 같은 커밋에서 함께 수정하세요.

## 1. 프로젝트 개요

- Polaroid 브랜드 UX/UI 웹사이트 리뉴얼 (6인 협업, PM이 브랜치와 작업 범위를 배정)
- 스택: React 19 + Vite 8 + React Router 8, JavaScript(JSX), CSS Modules
- 주요 페이지: Landing(헤더 타이틀 로고로 진입) + 서브페이지 History, Cameras, Film, Archive
- Three.js 기반 카메라 인터랙션 도입 예정 (`src/three/`, 아직 미설치)
- 배포는 아직 하지 않음

## 2. 공통 작업 원칙 (반드시 지킬 것)

1. **배정받은 브랜치에서만 개발한다.** 작업 전 `git branch --show-current`로 현재 브랜치를 확인한다.
2. **`main` 또는 `develop`에 직접 Push하지 않는다.** 반영은 Pull Request로만 한다.
3. **공통 파일을 수정해야 한다면 변경 이유와 영향을 먼저 확인한다.** PR 설명에 이유와 영향 범위를 적고, 필요하면 PM에게 먼저 공유한다.
4. **기존 코드를 임의로 삭제하지 않는다.** 다른 사람의 코드나 파일을 지우거나 이름을 바꿔야 하면 먼저 확인받는다.
5. **커밋 메시지는 팀 규칙을 따른다.** (아래 4번 참고)
6. **테스트를 완료하지 않았으면 완료했다고 보고하지 않는다.** 실행하지 못한 확인 단계는 "미확인"으로 명시한다.

### AI 도구에 대한 추가 규칙

- 요청받은 범위 밖의 페이지·기능·디자인을 임의로 만들지 않는다.
- 확정되지 않은 담당자, 개발 범위, 디자인 값을 추측해서 채우지 않는다.
- 새 의존성은 필요한 이유를 설명하고 승인을 받은 뒤 추가한다.
- Push, 브랜치 생성·삭제, 강제 Push(`--force`), 히스토리 재작성은 사용자의 명시적 승인 없이 하지 않는다.
- 작업 완료 보고에는 실행한 명령(`npm run dev`, `npm run build` 등)과 실제 결과를 함께 적는다.

## 3. 공통 파일 목록

아래 파일은 모든 팀원이 영향을 받으므로 수정 전 확인이 필요합니다.

- `package.json`, `package-lock.json`, `vite.config.js`, `index.html`
- `src/main.jsx`, `src/app/` (App, router, routes)
- `src/layouts/`, `src/components/common/`, `src/components/ui/`
- `src/styles/` (reset, variables, global)
- `.gitignore`, `README.md`, `AGENTS.md`, `CLAUDE.md`

## 4. 커밋 규칙

```
type(scope): 변경 내용 요약
```

| type | 용도 |
| --- | --- |
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `style` | UI·스타일 변경 (로직 변경 없음) |
| `perf` | 성능 개선 |
| `refactor` | 동작 변화 없는 코드 구조 개선 |
| `assets` | 이미지·영상·폰트·3D 모델 등 에셋 추가/변경 |
| `docs` | 문서 수정 |
| `chore` | 설정·빌드·의존성 등 기타 작업 |

- `scope`는 영향 범위: `landing`, `history`, `cameras`, `film`, `archive`, `common`, `three`, `config` 등
- 요약은 한국어로, 무엇을 바꿨는지 한 줄로 적는다.
- 예: `feat(cameras): 카메라 목록 섹션 마크업 추가`, `assets(film): 필름 패키지 이미지 추가`, `fix(common): 헤더 활성 메뉴 표시 오류 수정`

## 5. 브랜치 전략

- `main`: 최종 기준 브랜치. 직접 Push 금지.
- `develop`: 통합 브랜치. 개인 브랜치의 PR은 `develop`으로 보낸다. 직접 Push 금지.
- 개인 작업 브랜치: PM이 생성·배정한다. 배정 전에는 브랜치를 임의로 만들지 않는다.
- 작업 시작 전 `develop`의 최신 변경을 받아온다.

## 6. 폴더 구조와 역할

```
public/
  models/        3D 모델(.glb/.gltf) — URL(/models/...)로 로드
  videos/        용량이 큰 영상 — URL(/videos/...)로 로드
src/
  app/           App, router, routes(경로 상수) — 공통
  layouts/       공통 레이아웃 (RootLayout)
  components/
    common/      사이트 공통 영역 컴포넌트 (SiteHeader 등)
    ui/          재사용 UI 단위 컴포넌트 (Button 등)
  pages/
    Landing/  History/  Cameras/  Film/  Archive/  NotFound/
                 각 페이지 컴포넌트 + 페이지 전용 components/
  three/         Three.js 장면·오브젝트·로더·유틸
  hooks/         공용 커스텀 훅
  utils/         공용 유틸 함수
  styles/        reset, variables(디자인 토큰), global
  assets/
    images/      common/ landing/ history/ cameras/ film/ archive/
    icons/  fonts/  textures/
```

### 페이지 역할

| 페이지 | 경로 | 역할 |
| --- | --- | --- |
| Landing | `/` | 브랜드 첫 진입 화면 — 메뉴에 없고 헤더 타이틀 로고로 이동 |
| History | `/history` | 브랜드 히스토리 |
| Cameras | `/cameras` | 카메라 제품군 소개 |
| Film | `/film` | 필름 제품군 소개 |
| Archive | `/archive` | 사진·콘텐츠 아카이브 |

세부 기능과 담당자는 PM이 확정한 뒤 정합니다.

### 에셋 위치 기준

- 코드에서 `import` 하는 이미지·아이콘·폰트·텍스처 → `src/assets/` (빌드 시 최적화·해시 처리)
- 페이지 전용 이미지 → `src/assets/images/{페이지명}/`, 여러 페이지 공용 → `src/assets/images/common/`
- 3D 모델, 대용량 영상처럼 URL로 직접 불러오는 파일 → `public/models/`, `public/videos/`
- 용량이 큰 파일(대략 10MB 이상)은 커밋 전에 압축하거나 PM과 저장 방식을 상의한다.

## 7. 네이밍 규칙

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 폴더·파일 | PascalCase, 폴더명 = 파일명 | `SiteHeader/SiteHeader.jsx` |
| 페이지 컴포넌트 | `{Page}Page.jsx` | `CamerasPage.jsx` |
| 컴포넌트 스타일 | `{Component}.module.css` | `SiteHeader.module.css` |
| 훅 | `use` + camelCase | `useScrollProgress.js` |
| 유틸·일반 JS | camelCase | `formatDate.js` |
| 에셋 파일 | kebab-case, 소문자 | `sx-70-front.webp` |
| CSS 클래스(Modules) | camelCase | `.heroTitle` |
| 상수 | UPPER_SNAKE_CASE | `NAV_ITEMS` |

- import 경로는 `@/` 별칭(`src/`)을 사용한다. 예: `import SiteHeader from '@/components/common/SiteHeader/SiteHeader.jsx'`
- 색·간격·폰트는 `src/styles/variables.css`의 CSS 변수를 사용한다.

## 8. 작업 전후 확인

```bash
npm install        # 의존성 설치 (package.json 변경 시)
npm run dev        # 개발 서버 실행 후 화면 확인
npm run build      # PR 전 빌드 확인
```

PR을 올리기 전 `npm run build`가 성공해야 합니다. 실행하지 못했다면 PR에 그 사실을 적습니다.
