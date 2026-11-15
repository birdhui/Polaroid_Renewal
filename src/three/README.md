# src/three

Three.js 기반 3D 인터랙션 코드를 모아두는 위치입니다. 아직 `three`는 설치되어 있지 않습니다.
도입 방식(순수 Three.js / React Three Fiber)이 정해지면 설치 후 아래 구조에 맞춰 추가합니다.

| 폴더 | 용도 | 예시 |
| --- | --- | --- |
| `scenes/` | 페이지 단위 3D 장면 (렌더러·카메라·조명 구성) | `CameraShowcaseScene.jsx` |
| `objects/` | 장면 안에 배치되는 개별 3D 오브젝트 | `InstantCameraModel.jsx` |
| `loaders/` | GLTF/텍스처 로딩 로직 | `loadModel.js` |
| `utils/` | 수학·애니메이션 등 3D 전용 유틸 | `easing.js` |

## 원칙

- 페이지 컴포넌트(`src/pages/...`)는 3D 장면을 **불러와 배치만** 하고, 3D 로직은 이 폴더에 둡니다.
- 3D 모델 파일은 `public/models/`에 두고 URL(`/models/파일명.glb`)로 불러옵니다.
- 텍스처·환경맵처럼 코드에서 import 하는 3D 에셋은 `src/assets/textures/`에 둡니다.
- 장면이 언마운트될 때 geometry, material, texture, renderer를 반드시 `dispose()` 합니다.
