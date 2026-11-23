# AI 협업 작업 지침 — Polaroid Renewal

> AI 코딩 도구(Claude Code, Codex, Cursor 등)와 팀원이 함께 따르는 지침입니다.
> `AGENTS.md`와 `CLAUDE.md`는 **같은 내용**을 유지합니다. 한쪽을 고치면 다른 쪽도 같은 커밋에서 고칩니다.

## 1. 프로젝트

- Polaroid 브랜드 웹사이트 UX/UI 리뉴얼, 6인 협업. PM: 곽세희
- 핵심 메시지: "지나가는 순간을, 손에 남는 기록으로." · 랜딩 콘셉트: From Moment to Memory
- 스택: React 19 · Vite 8 · React Router 8 · JavaScript(JSX) · CSS Modules
- 범위 밖: 백엔드, 로그인, DB, 서버 API. Archive 이미지 편집·저장은 브라우저에서만 처리합니다.
- 자세한 문서
  - `docs/project-structure.md`: 구조와 담당 디렉터리
  - `docs/git-convention.md`: 브랜치, 커밋, PR
  - `docs/development-guide.md`: 개발 규칙
  - `docs/styleguide.md`: 디자인 시스템 기준

## 2. 담당과 브랜치

| 담당자 | 개발 브랜치 | 담당 디렉터리 |
| --- | --- | --- |
| 곽세희 (PM) | `feat/landing-core` | `src/pages/Landing/`, `src/features/landing-camera/` |
| 임희지 | `feat/landing-visuals` | `src/features/landing-visuals/`, `public/assets/landing/` |
| 정준혁 | `feat/cameras` | `src/pages/Cameras/`, `src/assets/cameras/` |
| 손다은 | `feat/film` | `src/pages/Film/`, `src/assets/film/` |
| 모진아 | `feat/history` | `src/pages/History/`, `src/assets/history/` |
| 이나라 | `feat/archive` | `src/pages/Archive/`, `src/assets/archive/` |
| 임희지 | `feat/cameras-now` | `src/pages/Cameras/Now/`, `src/assets/cameras/now/` |

| 담당자 | 주 담당 범위 | 추가 책임 |
| --- | --- | --- |
| 곽세희 | Landing 전체 UX/UI, 스크롤 스토리텔링, 3D 카메라 및 핵심 인터랙션 | PM, 카피·연출 관리, 전체 UX/UI 검수, 최종 `main` 병합·배포 |
| 임희지 | Landing 시네마틱 비주얼, 필름 현상·노후화 효과, 도면 전환, 2.5D 공간 | 랜딩 이미지·영상 에셋 최적화, 반응형·시각 효과 QA |
| 정준혁 | Cameras 페이지 | 프로젝트 구조·라우팅·공통 컴포넌트 관리, Git 충돌 지원, `develop` 통합 테스트, 배포 전 기술 검수 |
| 손다은 | Film 페이지 | UX 리서치, IA·User Flow 반영, 사용성 테스트 기획·진행·정리 (오류 수정은 각 페이지 담당자) |
| 모진아 | History 페이지 | 공통 디자인 시스템·`docs/styleguide.md`·스타일 토큰, 로고·파비콘 등 브랜드 공통 에셋 관리 |
| 이나라 | Archive 페이지 | 사진 업로드·편집·꾸미기·저장 인터랙션과 편집 UI |

**공통 작업 브랜치**
- `chore/project-structure`: 곽세희·정준혁. 대상은 `src/app/`, 초기 설정, 공통 라우팅, 개발 문서
- `style/design-system`: 모진아. 대상은 `docs/styleguide.md`, `src/shared/styles/`, 로고·파비콘

**에셋**
- 페이지별 이미지·영상은 각 담당자가 자기 영역 폴더(`public/assets/{영역}/`, `src/assets/{영역}/`)에서 관리한다.
- 3D 카메라 에셋은 `landing-camera`(곽세희)에 둔다.
- 그 밖의 Landing 이미지·영상은 `landing`(임희지)에 둔다.
- 브랜드 공통 에셋은 `shared`(모진아)에 둔다.

## 3. 작업 규칙 (반드시 지킬 것)

1. **작업 시작 전 현재 브랜치를 확인한다.** `git branch --show-current`가 `main`이나 `develop`이면 작업하지 않는다.
2. **배정된 브랜치와 디렉터리에서만 개발한다.**
3. **공통 파일을 수정해야 하면 해당 관리자·PM과 사전에 공유·협의한다.**
   - `src/app/`, `src/shared/components/`: 정준혁
   - `src/shared/styles/`, `docs/styleguide.md`: 모진아
   - 루트 설정(`package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `src/main.jsx`), `docs/`, `README.md`, `AGENTS.md`, `CLAUDE.md`: PM
   - 한 브랜치는 가능한 하나의 작업 범위만 담당한다.
4. **다른 팀원의 코드와 설정을 임의로 변경하거나 삭제하지 않는다.**
5. **커밋 형식은 `type(scope): 변경 내용 요약`을 따른다.** type은 `feat` `fix` `style` `perf` `refactor` `assets` `docs` `chore` 중 하나다.
6. **`main` 및 `develop`에 직접 Push하지 않는다.**
7. **변경 사항과 테스트 결과(`npm run build`, `npm run dev`)를 확인한 뒤 PR을 생성한다.**
8. **개인 PR은 담당자가 자체 점검 후 `develop`에 병합한다.** 공통 파일이 포함되면 해당 관리자와 PM 확인 후 병합한다.
9. **`develop` → `main` 병합은 PM과 다른 팀원 최소 1명의 승인 리뷰를 거친다.** `develop` 통합 테스트와 배포 전 기술 검수는 정준혁, 최종 병합·배포는 곽세희가 한다.
10. **강제 Push, 파괴적 Git 명령어(`reset --hard`, `push --force`, 히스토리 재작성), 무단 파일 삭제를 금지한다.**
11. **테스트를 완료하지 않았으면 완료했다고 보고하지 않는다.** 실행하지 못한 단계는 "미확인"으로 적는다.

### AI 도구 추가 규칙

- 브랜치 생성, 커밋, Push, PR 생성·병합은 사용자의 명시적 승인을 받은 뒤에만 한다.
- 확정된 화면 기획서가 없는 페이지·기능·디자인을 임의로 만들지 않는다.
- 확정되지 않은 담당자, 범위, 디자인 값(색상, 카피, 모션 수치)을 추측해서 채우지 않는다.
- 새 패키지는 필요한 이유를 설명하고 승인을 받은 뒤 추가한다.
- 작업 보고에는 실행한 명령과 실제 결과를 함께 적는다.

## 4. Landing 모듈 규칙

- `src/pages/Landing/` (곽세희): 스크롤 진행률, 장면 전환, 카피, 전체 흐름을 담당한다. 장면 순서는 `data/landingScenes.js`에 있다.
- `src/features/landing-camera/` (곽세희)
  - 3D 렌더링과 카메라 인터랙션을 담당하며, Landing의 스크롤 흐름을 직접 제어하지 않는다.
  - Landing이 `CameraExperience`를 **한 번만** 마운트하고 props로 상태를 전달한다. 전달하는 값: `visible`, `pose`, `colorway`, `feature`, `featureProgress`, `action`
  - 카메라는 `onEvent`로 알리기만 한다.
  - 인터페이스는 `cameraContract.js`와 `README.md`에 있다.
  - 3D Canvas를 섹션마다 다시 만들지 않는다.
- `src/features/landing-visuals/` (임희지)
  - 영상·이미지, 필름 현상·노후화, Rewind, 도면, 빛, 2.5D 책상 배경을 담당한다. 카메라의 3D 제어는 하지 않는다.
  - Landing이 import 해서 배치하고, 비주얼 컴포넌트는 진행률 등을 props로 받기만 한다.
  - props는 구현 시작 시 곽세희와 정해 그 폴더의 `README.md`에 기록한다.
- `landing-camera`와 `landing-visuals`는 서로 직접 import 하지 않고 Landing을 통해 연결한다.

## 5. 코드 규칙 요약

- import는 `@/` 별칭(`src/`)을 사용한다. 다른 담당자의 `pages/` 내부 파일은 import 하지 않는다.
- 스타일은 CSS Modules(`*.module.css`)로 분리한다. 전역 CSS는 `src/shared/styles/`에만 둔다.
- 색·간격·폰트는 `src/shared/styles/variables.css`의 토큰을 사용한다. 기준은 `docs/styleguide.md`이고, 변경은 모진아가 `style/design-system`에서 한다(PM 검토).
- Header·Footer는 `src/shared/components/`의 `SiteHeader`·`SiteFooter`만 사용하고 중복 구현하지 않는다. 관리는 정준혁이 한다.
- 네이밍: 컴포넌트·페이지는 PascalCase, 훅은 `useXxx`, 에셋은 kebab-case, CSS 클래스는 camelCase
