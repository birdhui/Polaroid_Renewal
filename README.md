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

| 담당자 | 범위 | 브랜치 | 디렉터리 |
| --- | --- | --- | --- |
| 곽세희 (PM) | Landing 스크롤 스토리 · 3D 카메라 · 핵심 인터랙션 / 전체 UX/UI 검수, 최종 병합·배포 | `feat/landing-core` | `src/pages/Landing/`, `src/features/landing-camera/` |
| 임희지 | Landing 시네마틱 비주얼 · 필름 효과 · 2.5D 전환 / 랜딩 에셋 최적화, 반응형 QA | `feat/landing-visuals` | `src/features/landing-visuals/`, `public/assets/landing/` |
| 정준혁 | Cameras / 공통 구조·라우팅, 충돌 지원, `develop` 통합 테스트, `main` 기술 리뷰 | `feat/cameras` | `src/pages/Cameras/` |
| 손다은 | Film / UX 리서치, IA·User Flow, 사용성 검증 | `feat/film` | `src/pages/Film/` |
| 모진아 | History / 브랜드 그래픽·에셋·디자인 시스템 | `feat/history` | `src/pages/History/` |
| 이나라 | Archive / 사진 편집 인터랙션·UI | `feat/archive` | `src/pages/Archive/` |

## 문서

- [프로젝트 구조와 담당 디렉터리](./docs/project-structure.md)
- [Git 컨벤션 (브랜치 · 커밋 · PR)](./docs/git-convention.md)
- [개발 가이드](./docs/development-guide.md)
- [Landing ↔ 3D 카메라 인터페이스](./src/features/landing-camera/README.md)
- [Landing 비주얼 모듈](./src/features/landing-visuals/README.md)
- [AI 협업 작업 지침](./AGENTS.md) (`CLAUDE.md`와 같은 내용)

## 핵심 규칙

- `main`·`develop`에 직접 Push하지 않습니다. 개인 브랜치에서 `develop`으로 PR을 보냅니다.
- 커밋 메시지: `type(scope): 변경 내용 요약` (`feat` `fix` `style` `perf` `refactor` `assets` `docs` `chore`)
- 내 담당 디렉터리만 수정합니다. 공통 파일은 PM과 먼저 협의합니다.
- 테스트(`npm run build`)를 완료하지 않았으면 완료했다고 보고하지 않습니다.
