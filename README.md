# Polaroid Renewal

> 지나가는 순간을, 손에 남는 기록으로. — From Moment to Memory

Polaroid 브랜드 웹사이트 UX/UI 리뉴얼 프로젝트입니다. (6인 협업)

- **스택**: React 19 · Vite 8 · React Router 8 · JavaScript(JSX) · CSS Modules
- **페이지**: Landing(헤더 타이틀 로고) + History · Cameras · Film · Archive
- **배포**: 아직 하지 않음

## 시작하기

Node.js **22.22.0 이상**이 필요합니다. (`node -v`로 확인)

```bash
git clone https://github.com/birdhui/Polaroid_Renewal.git
cd Polaroid_Renewal
git switch feat/<내-브랜치>
npm install
npm run dev          # http://localhost:5173
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (PR 전 필수) |
| `npm run preview` | 빌드 결과 미리보기 |

## 팀과 담당

| 담당자 | 역할 | 개발 브랜치 | 담당 디렉터리 |
| --- | --- | --- | --- |
| 곽세희 (PM) | Landing Core — 스크롤 스토리텔링 · 3D 카메라 · 핵심 인터랙션 | `feat/landing-core` | `src/pages/Landing/`, `src/features/landing-camera/` |
| 임희지 | Landing Visuals — 필름 현상·노후화 · 도면 전환 · 2.5D 공간 | `feat/landing-visuals` | `src/features/landing-visuals/`, `public/assets/landing/` |
| 정준혁 | Cameras · Frontend Integration & QA | `feat/cameras` | `src/pages/Cameras/`, `src/assets/cameras/` |
| 손다은 | Film · UX Validation | `feat/film` | `src/pages/Film/`, `src/assets/film/` |
| 모진아 | History · Design System | `feat/history` | `src/pages/History/`, `src/assets/history/` |
| 이나라 | Archive Editor | `feat/archive` | `src/pages/Archive/`, `src/assets/archive/` |

공통 작업 브랜치: `chore/project-structure`(곽세희·정준혁), `style/design-system`(모진아)

## 문서

- [프로젝트 구조와 담당 디렉터리](./docs/project-structure.md)
- [Git 컨벤션 (브랜치 · 커밋 · PR)](./docs/git-convention.md)
- [개발 가이드](./docs/development-guide.md)
- [스타일 가이드](./docs/styleguide.md)
- [Landing ↔ 3D 카메라 인터페이스](./src/features/landing-camera/README.md)
- [Landing 비주얼 모듈](./src/features/landing-visuals/README.md)
- [AI 협업 작업 지침](./AGENTS.md) (`CLAUDE.md`와 같은 내용)

## 핵심 규칙

- `main`·`develop`에 직접 Push하지 않습니다. 개인 브랜치에서 `develop`으로 PR을 보냅니다.
- 커밋 메시지: `type(scope): 변경 내용 요약` (`feat` `fix` `style` `perf` `refactor` `assets` `docs` `chore`)
- 내 담당 디렉터리만 수정합니다. 공통 파일은 관리자(라우팅·공통 컴포넌트: 정준혁, 스타일: 모진아)·PM과 먼저 공유합니다.
- 테스트(`npm run build`)를 완료하지 않았으면 완료했다고 보고하지 않습니다.
