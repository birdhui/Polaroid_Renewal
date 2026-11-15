# Git 컨벤션

## 브랜치

| 브랜치 | 용도 | 담당 |
| --- | --- | --- |
| `main` | 최종 배포용 | PM 관리 · 직접 Push 금지 |
| `develop` | 공통 개발 통합용 | 직접 Push 금지 |
| `feat/landing-core` | Landing 스크롤 스토리 · 3D 카메라 · 핵심 인터랙션 | 곽세희 |
| `feat/landing-visuals` | Landing 시네마틱 비주얼 · 필름 효과 · 2.5D 전환 | 임희지 |
| `feat/cameras` | Cameras 페이지 | 정준혁 |
| `feat/film` | Film 페이지 | 손다은 |
| `feat/history` | History 페이지 | 모진아 |
| `feat/archive` | Archive 페이지 | 이나라 |
| `chore/*`, `fix/*`, `docs/*` | 공통 작업용 임시 브랜치 (예: `chore/project-structure`) | PM 승인 후 생성 |

- 개인 브랜치는 `develop`에서 만듭니다.
- 작업 전에 `develop`의 최신 변경을 자기 브랜치로 가져옵니다.

```bash
git switch feat/film
git fetch origin
git merge origin/develop      # 충돌이 나면 직접 해결하고 커밋
```

## 커밋 메시지

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

- **scope**: `landing`, `landing-camera`, `landing-visuals`, `history`, `cameras`, `film`, `archive`, `shared`, `app`, `config`, `docs`
- 요약은 한국어 한 줄로, 무엇을 바꿨는지 씁니다.
- 예:
  - `feat(film): 필름 종류 카드 마크업 추가`
  - `assets(landing-camera): polaroid-now 모델 추가`
  - `fix(shared): 헤더 활성 메뉴 표시 오류 수정`

## Pull Request와 병합

1. 개인 브랜치를 Push한 뒤 **`develop`으로 PR**을 만듭니다.
2. PR을 올리기 전에 직접 확인합니다.
   - `npm run build` 성공
   - `npm run dev`로 내 페이지 동작 확인
   - 내 담당 디렉터리 밖의 파일이 바뀌지 않았는지 `git diff --stat origin/develop`으로 확인
3. PR 설명에 무엇을 바꿨는지, 어떻게 테스트했는지 적습니다. 담당 밖의 공통 파일을 바꿨다면 이유와 영향도 적습니다.
4. **개인 PR → `develop`**: 담당자가 자체 점검 후 병합합니다. 공통 파일이 포함된 PR은 PM 확인 후 병합합니다.
5. **`develop` → `main`**: 정준혁이 `develop` 통합 테스트와 기술 리뷰를 하고, PM과 다른 팀원 최소 1명의 승인 리뷰를 받은 뒤 PM(곽세희)이 병합합니다.

## 금지

- `main`·`develop`에 직접 Push
- 강제 Push(`git push --force`), `git reset --hard`로 공유 브랜치 되돌리기 등 히스토리를 지우는 명령
- 다른 팀원의 브랜치나 파일을 허락 없이 수정·삭제
- 테스트하지 않은 상태로 "완료" 보고
