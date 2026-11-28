import { SHOWCASE_CAMERAS } from '../../data/compareShowcaseCameras.js';
import styles from './CompareHero.module.css';

/*
 * Compare 히어로 — 카메라가 원 두 겹으로 화면 가운데를 둘러싸고, 두 원이 각각 통째로 시계 방향으로 천천히 돈다.
 * (참고: Figma 시안 3551:2021 · Vitra Office Chair Finder 첫 화면)
 *  - 카메라는 원에 붙어 있어 원과 함께 돈다. 카메라마다 따로 돌지 않으므로 언제나 가운데를 향한 각도 그대로다.
 *  - 안쪽 원은 조금 빠르게, 바깥쪽 원은 조금 느리게 돈다.
 *  - 두 원 모두 화면 높이보다 커서 위아래로는 화면 밖을 지나간다. 그래서 카메라가 양옆에 모이고 가운데가 넓게 빈다.
 *  - 처음에 카메라가 하나씩 살짝 커지며 나타난다. 문구·버튼은 가만히 있다.
 * 반지름·크기·대수·시작 각도는 시안(1953 x 1080)에 놓인 카메라 자리를 재서 맞춘 값이고, 주기는 시안에 없어서 정한 임시값이다.
 * 반지름·크기는 1920 x 1080 화면 기준 px 이다.
 */
const RING_LAYOUT = [
  {
    name: 'outer',
    radius: 945,
    size: 158,
    count: 24, // 시안에서 이웃한 카메라가 약 15도 간격
    period: 170, // 한 바퀴(초) — 안쪽보다 조금 느리게
    startAngle: 63.6, // 시안 오른쪽 위 카메라 자리 (12시 방향에서 시계 방향으로 잰 각도)
    offset: 14, // 카메라 순서에서 몇 번째부터 쓸지 — 안쪽 원과 같은 카메라가 나란히 오지 않게 한다
  },
  {
    name: 'inner',
    radius: 680,
    size: 150,
    count: 14, // 시안에서 이웃한 카메라가 약 25도 간격
    period: 100, // 한 바퀴(초) — 바깥쪽(170초)보다 조금 빠르게
    startAngle: 50, // 시안 오른쪽 위 검정 카메라 자리
    offset: 0,
  },
];

// 원 위에 차례로 놓을 카메라 — 이웃끼리 색이 겹치지 않게 섞어 둔 순서. 원마다 이 순서를 돌아가며 쓴다.
const CAMERA_ORDER = [
  'goTeal',
  'nowCoral',
  'nowPlusBlack',
  'nowPinkA',
  'goWhiteA',
  'nowYellowB',
  'i2',
  'nowArctic',
  'flipOrange',
  'nowBlack',
  'nowPurple',
  'modA',
  'nowPlusCoralA',
  'goLightBlue',
  'nowCream',
  'flipBlack',
  'nowTealB',
  'goPurple',
  'nowPlusWhite',
  'goBlack',
  'nowPlusBlue',
];

const POP_STAGGER = 30; // 카메라가 하나씩 나타나는 간격(ms)

const RINGS = RING_LAYOUT.map((ring) => ({
  ...ring,
  cameras: Array.from({ length: ring.count }, (_, index) => {
    const id = CAMERA_ORDER[(ring.offset + index) % CAMERA_ORDER.length];
    return {
      key: `${ring.name}-${index}`,
      src: SHOWCASE_CAMERAS.find((camera) => camera.id === id).src,
      angle: ring.startAngle + (360 / ring.count) * index, // 원 위의 자리이자 카메라가 기울어진 각도(가운데를 향함)
      delay: index * POP_STAGGER,
    };
  }),
}));

/**
 * Compare 히어로 — 가운데에 안내 문구와 "찾아보기" 버튼이 있고, 둘레에서 카메라 원 두 겹이 돈다. (로고는 사이트 헤더에 있다)
 * 카메라는 장식이라 스크린리더에서는 숨기고, 문구는 전부 텍스트로 올린다.
 * "찾아보기"를 누르면 ComparePage 가 (onStart) 히어로를 사라지게 하고 그 자리에 채팅 화면을 띄운다. 스크롤로 이동하지 않는다.
 */
export default function CompareHero({ onStart, leaving = false }) {
  return (
    <header className={styles.hero} data-leaving={leaving}>
      <div className={styles.stage} aria-hidden="true">
        {RINGS.map((ring) => (
          <div key={ring.name} className={styles.ring} style={{ '--period': `${ring.period}s` }}>
            {ring.cameras.map((camera) => (
              <div
                key={camera.key}
                className={styles.cam}
                style={{
                  '--a': `${camera.angle.toFixed(2)}deg`,
                  '--r': ring.radius,
                  '--s': ring.size,
                  '--d': `${camera.delay}ms`,
                }}
              >
                <img className={styles.camera} src={camera.src} alt="" draggable="false" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.copy}>
        <h1 className={styles.title}>
          Which Polaroid camera is
          <br />
          right for you?
        </h1>
        <button type="button" className={styles.cta} onClick={onStart} disabled={leaving}>
          찾아보기
        </button>
      </div>
    </header>
  );
}
