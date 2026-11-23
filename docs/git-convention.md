# Git 컨벤션

## 01. Branch Convention

### 기본 브랜치

| 브랜치 | 용도 | 관리 |
| --- | --- | --- |
| `main` | 최종 검증된 코드 및 배포 | 곽세희 |
| `develop` | 팀원 개발 내용 통합 및 테스트 | 전체 팀, 정준혁 기술 검수 |

두 브랜치 모두 직접 Push하지 않고 Pull Request로만 반영합니다.

### 팀원별 개발 브랜치

| 번호 | 브랜치명 | 담당자 | 주요 수정 디렉터리 |
| --- | --- | --- | --- |
| 01 | `feat/landing-core` | 곽세희 | `src/pages/Landing/`, `src/features/landing-camera/` |
| 02 | `feat/landing-visuals` | 임희지 | `src/features/landing-visuals/`, `public/assets/landing/` |
| 03 | `feat/cameras` | 정준혁 | `src/pages/Cameras/`, `src/assets/cameras/` |
| 04 | `feat/film` | 손다은 | `src/pages/Film/`, `src/assets/film/` |
| 05 | `feat/history` | 모진아 | `src/pages/History/`, `src/assets/history/` |
| 06 | `feat/archive` | 이나라 | `src/pages/Archive/`, `src/assets/archive/` |
| 07 | `feat/cameras-now` | 임희지 | `src/pages/Cameras/Now/`, `src/assets/cameras/now/` |

### 공통 작업용 브랜치

| 브랜치명 | 담당자 | 목적 |
| --- | --- | --- |
| `chore/project-structure` | 곽세희·정준혁 | 최초 폴더 구조, import, 라우팅 및 문서 정리 |
| `style/design-system` | 모진아 | 공통 디자인 토큰·폰트·스타일 가이드 변경 |

### 브랜치 규칙

- 새로운 기능은 `develop`에서 브랜치를 생성한다.
- 한 브랜치는 가능한 하나의 작업 범위만 담당한다.
- 작업 완료 후 Pull Request를 생성하여 `develop`에 병합한다.
- 공통 코드 변경 시 담당자와 공유한 뒤 작업한다.
- `main`에는 최종 검토된 버전만 병합한다.
- 작업 전에 `develop`의 최신 변경을 자기 브랜치로 가져온다.

```bash
git switch feat/film
git fetch origin
git merge origin/develop      # 충돌이 나면 직접 해결하고 커밋 (어려우면 정준혁에게 지원 요청)
```

### 브랜치별 관리 파일

| 브랜치 | 담당 파일 |
| --- | --- |
| `feat/landing-core` | 랜딩 페이지, 스크롤 컨트롤러, 3D 카메라, 핵심 인터랙션 |
| `feat/landing-visuals` | 랜딩 시각 효과, 영상·필름·도면·2.5D 모듈 |
| `feat/cameras` | Cameras 페이지의 화면과 데이터 |
| `feat/film` | Film 페이지의 화면과 데이터 |
| `feat/history` | History 페이지의 화면과 데이터 |
| `feat/archive` | Archive 페이지와 사진 편집 기능 |
| `feat/cameras-now` | Cameras › Polaroid Now 상세 페이지의 화면과 데이터 |
| `style/design-system` | `docs/styleguide.md`, `src/shared/styles/`, 공통 로고·파비콘 |
| `chore/project-structure` | `src/app/`, 프로젝트 초기 설정, 공통 라우팅, 개발 문서 |

## 02. Commit Convention

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
| `assets` | 이미지·영상·오디오·폰트·3D 모델 추가/변경 |
| `docs` | 문서 수정 |
| `chore` | 설정·빌드·의존성·구조 등 기타 작업 |

- **scope**: `landing`, `landing-camera`, `landing-visuals`, `cameras`, `film`, `history`, `archive`, `design-system`, `shared`, `app`, `config`, `docs`
- 요약은 한국어 한 줄로, 무엇을 바꿨는지 씁니다.
- 예:
  - `feat(film): 필름 종류 카드 마크업 추가`
  - `assets(landing-visuals): 도면 전환 이미지 시퀀스 추가`
  - `style(design-system): 컬러 토큰 확정값 반영`
  - `fix(shared): 헤더 활성 메뉴 표시 오류 수정`

## 03. Pull Request와 병합

1. 브랜치를 Push한 뒤 **`develop`으로 PR**을 만듭니다.
2. PR을 올리기 전에 직접 확인합니다.
   - `npm run build` 성공
   - `npm run dev`로 내 페이지와 페이지 이동 확인
   - 내 담당 디렉터리 밖의 파일이 바뀌지 않았는지 `git diff --stat origin/develop`으로 확인
3. PR 설명에 무엇을 바꿨는지, 어떻게 테스트했는지 적습니다. 공통 파일을 바꿨다면 이유와 영향도 적습니다.
4. **개인 PR → `develop`**: 담당자가 자체 점검 후 병합합니다. 공통 파일이 포함된 PR은 해당 공통 영역 담당자와 PM 확인 후 병합합니다.
5. **`develop` → `main`**:
   - 정준혁이 `develop` 통합 테스트와 배포 전 기술 검수를 합니다.
   - PM과 다른 팀원 최소 1명의 승인 리뷰를 받습니다.
   - 곽세희가 병합합니다.

## 04. 금지

- `main`·`develop`에 직접 Push
- 강제 Push(`git push --force`), `git reset --hard`로 공유 브랜치 되돌리기 등 히스토리를 지우는 명령
- 다른 팀원의 브랜치나 파일을 허락 없이 수정·삭제
- 테스트하지 않은 상태로 "완료" 보고
