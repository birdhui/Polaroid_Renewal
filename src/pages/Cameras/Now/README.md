# Cameras › Polaroid Now 상세 페이지

- 브랜치: `feat/cameras-now` (`main` 기준으로 생성)
- 경로: `/cameras/now` (`src/app/routes.js` 의 `ROUTES.camerasNow`)
- 작업 폴더: `src/pages/Cameras/Now/` (컴포넌트 `components/`, 훅 `hooks/`, 데이터 `data/`)
- 에셋: `src/assets/cameras/`, `public/assets/cameras/`

## 처음 시작할 때

```bash
git switch main
git pull origin main
git fetch origin
git switch feat/cameras-now        # 원격 브랜치를 받아 로컬 브랜치로 전환
npm install
npm run dev                        # http://localhost:5173/cameras/now
```

## 작업 규칙

- 작업 전 `git branch --show-current` 가 `feat/cameras-now` 인지 확인합니다.
- 이 폴더와 Cameras 에셋 폴더 밖의 공통 파일(`src/app/`, `src/shared/`, 루트 설정)은 담당자·PM 과 협의한 뒤 수정합니다.
- 커밋 형식: `feat(cameras): 변경 내용 요약`
- `npm run build` 확인 후 `develop` 으로 PR 을 올립니다. `main`·`develop` 에 직접 Push 하지 않습니다.
