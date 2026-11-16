# 개발 가이드

## 시작하기

```bash
node -v                       # 22.22.0 이상
git clone https://github.com/birdhui/Polaroid_Renewal.git
cd Polaroid_Renewal
git switch feat/<내-브랜치>      # PM이 만든 개인 브랜치 (docs/git-convention.md)
npm install
npm run dev                   # http://localhost:5173
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 (PR 전 필수) |
| `npm run preview` | 빌드 결과 미리보기 |

## 기술 스택

- React 19 · Vite 8 · React Router 8 · JavaScript(JSX) · CSS Modules
- 아직 설치하지 않은 것: Three.js(또는 React Three Fiber), 스크롤·모션 라이브러리, 린터. 필요하면 PR 전에 PM과 협의합니다.
- 백엔드·로그인·DB·서버 API는 범위가 아닙니다. Film 페이지의 사진 편집과 저장도 브라우저 안에서만 처리합니다.

## 작업 규칙

1. **작업 전 브랜치 확인**: `git branch --show-current`가 내 브랜치인지 확인합니다. 한 브랜치는 하나의 작업 범위만 다룹니다.
2. **내 담당 디렉터리에서만 개발**합니다. 담당 범위는 `docs/project-structure.md`를 참고하세요.
3. **다른 페이지 파일은 수정하지 않습니다.** 필요하면 담당자에게 요청합니다.
4. **공통 파일은 PM과 사전 협의**한 뒤 수정합니다. 대상: `src/app/`, `src/shared/`, 루트 설정, 문서
5. **Header·Footer는 `src/shared/components/`에만 있습니다.** 페이지에서 다시 만들지 않습니다. 수정은 정준혁과 공유한 뒤 진행합니다.
6. **패키지는 실제로 필요할 때만** 추가하고, 이유를 PR에 적습니다.
7. **완성되지 않은 디자인을 임의로 만들지 않습니다.** 확정된 화면 기획서가 배정된 기능만 구현합니다.

## 코드 작성 규칙

### import

`@/`는 `src/`를 가리킵니다.

```js
import SiteHeader from '@/shared/components/SiteHeader/SiteHeader.jsx';
import CameraExperience from '@/features/landing-camera/CameraExperience.jsx';
```

다른 담당자의 `pages/` 내부 파일은 import 하지 않습니다. 여러 페이지에서 필요한 것은 `shared/`로 옮기자고 제안합니다.

### 스타일

- 컴포넌트마다 `Component.module.css`(CSS Modules)를 사용합니다. 전역 CSS는 `src/shared/styles/`에만 둡니다.
- 색·간격·폰트는 `src/shared/styles/variables.css`의 CSS 변수를 사용합니다. 기준은 `docs/styleguide.md`에 있고, 변경은 모진아가 `style/design-system` 브랜치에서 진행합니다(PM 검토).

### 네이밍

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| 컴포넌트 폴더·파일 | PascalCase, 폴더명 = 파일명 | `FilmCard/FilmCard.jsx` |
| 페이지 | `{Page}Page.jsx` | `FilmPage.jsx` |
| 스타일 | `{Component}.module.css` | `FilmCard.module.css` |
| 훅 | `use` + camelCase | `useScrollProgress.js` |
| 데이터·유틸 | camelCase | `filmTypes.js` |
| 에셋 | kebab-case | `i-type-color.webp` |
| CSS 클래스 | camelCase | `.cardTitle` |
| 상수 | UPPER_SNAKE_CASE | `LANDING_SCENES` |

### 페이지 폴더 사용법

```
pages/Film/
├─ FilmPage.jsx            페이지 진입점 (router.jsx 가 import)
├─ FilmPage.module.css
├─ components/             이 페이지 전용 컴포넌트
├─ hooks/                  이 페이지 전용 훅
└─ data/                   이 페이지 전용 정적 데이터 (목록, 카피 등)
```

## PR 전 점검

- [ ] `npm run build` 성공
- [ ] `npm run dev`로 내 페이지와 다른 페이지 이동 확인
- [ ] `git diff --stat origin/develop`에 담당 밖 파일이 없음 (있다면 PR에 이유 기재)
- [ ] 커밋 메시지가 `type(scope): 요약` 형식
- [ ] 내 브랜치의 Vercel 미리보기 URL에서 화면 확인
- [ ] 테스트하지 못한 항목은 PR에 "미확인"으로 기재

## Vercel 배포와 미리보기

| 브랜치 | 배포 종류 | 주소 |
| --- | --- | --- |
| `main` | Production (실서비스) | https://polaroid-renewal.vercel.app |
| 그 외 모든 브랜치 (`feat/*`, `develop` 등) | Preview (미리보기) | 브랜치별 고정 주소 (아래 확인 방법 참고) |

- 브랜치에 Push하면 Vercel이 자동으로 빌드해 그 브랜치만의 미리보기 URL을 만든다. 별도 작업은 필요 없다.
- 브랜치 주소는 고정이고, 브랜치 이름의 `/`는 `-`로 바뀐다.
- 같은 브랜치에 다시 Push하면 같은 주소가 최신 커밋으로 갱신된다.
- `/history` 같은 하위 경로를 새로고침해도 열리도록 루트의 `vercel.json`이 모든 경로를 `index.html`로 보낸다. 이 파일은 PM 관리 파일이다.

### 내 미리보기 확인하기

1. 내 브랜치에 Push한다.
2. GitHub 저장소 → 내 브랜치 선택 → 최신 커밋 옆 상태 아이콘(✓ / ● / ✕)을 누른다.
3. **Vercel – Preview** 항목이 ✓(성공)인지 확인하고 **Details**를 눌러 미리보기 사이트로 이동한다.
   - ● 노란색: 빌드 중. 1~2분 기다린다.
   - ✕ 빨간색: 빌드 실패. 로컬에서 `npm run build`를 실행해 오류를 고친 뒤 다시 Push한다.
4. PR을 열면 Vercel 봇이 PR 댓글에 미리보기 링크를 남긴다.
5. 한 번 찾은 미리보기 주소는 즐겨찾기해 두면 이후 Push 때도 같은 주소로 최신 화면을 볼 수 있다.

> Vercel 대시보드(Deployments 화면)는 PM 계정에서만 보인다. 팀원은 GitHub 상태 아이콘, PR 댓글, 고정 주소로 확인한다.
