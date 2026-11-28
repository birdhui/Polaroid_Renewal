import logoWordmark from '@/assets/shared/images/logo-polaroid-wordmark.svg';
import { SHOWCASE_CAMERAS } from '../../data/compareShowcaseCameras.js';
import styles from './CompareHero.module.css';

/*
 * Compare 히어로 — 카메라가 원 두 겹으로 화면 가운데를 둘러싸고, 두 원이 각각 통째로 시계 방향으로 천천히 돈다.
 * (참고: Vitra Office Chair Finder 첫 화면 · 팀에서 만든 카메라 파인더 프로토타입)
 *  - 카메라는 원에 붙어 있어 원과 함께 돈다. 카메라마다 따로 돌지 않으므로 언제나 가운데를 향한 각도 그대로다.
 *  - 안쪽 원은 조금 빠르게, 바깥쪽 원은 조금 느리게 돈다.
 *  - 처음에 카메라가 하나씩 살짝 커지며 나타난다. 문구·버튼·로고는 가만히 있다.
 * 반지름·크기·주기는 1920 x 1080 화면 기준 px 이고, 프로토타입 값에서 간격과 크기를 조금 키운 임시값이다.
 */
const RING_LAYOUT = [
  {
    name: 'outer',
    radius: 840, // 프로토타입 800
    size: 184, // 프로토타입 172
    period: 170, // 한 바퀴(초) — 안쪽보다 조금 느리게
    startAngle: 7, // 안쪽 원과 카메라가 일렬로 겹치지 않게 살짝 비켜 둔다
    ids: [
      'goWhiteA',
      'nowBlack',
      'goPurple',
      'nowTealA',
      'nowCream',
      'nowPlusBlue',
      'flipOrange',
      'nowYellowB',
      'goWhiteB',
      'nowPurple',
      'nowPlusWhite',
      'goLightBlue',
      'nowPinkB',
      'modB',
      'nowTealB',
      'nowPlusCoralB',
      'nowCreamB',
      'goBlack',
    ],
  },
  {
    name: 'inner',
    radius: 500, // 프로토타입 470
    size: 164, // 프로토타입 152
    period: 110, // 한 바퀴(초) — 바깥쪽보다 조금 빠르게
    startAngle: 0,
    ids: ['nowCoral', 'goTeal', 'nowPlusBlack', 'nowPinkA', 'i2', 'nowYellowA', 'flipBlack', 'nowPlusCoralA', 'modA', 'nowArctic'],
  },
];

const POP_STAGGER = 40; // 카메라가 하나씩 나타나는 간격(ms)

const RINGS = RING_LAYOUT.map((ring) => ({
  ...ring,
  cameras: ring.ids.map((id, index) => ({
    id,
    src: SHOWCASE_CAMERAS.find((camera) => camera.id === id).src,
    angle: ring.startAngle + (360 / ring.ids.length) * index, // 원 위의 자리이자 카메라가 기울어진 각도(가운데를 향함)
    delay: index * POP_STAGGER,
  })),
}));

/**
 * Compare 히어로 — 가운데에 안내 문구와 "찾아보기" 버튼, 위에 로고가 있고, 둘레에서 카메라 원 두 겹이 돈다.
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
                key={camera.id}
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
      <span className={styles.logo} role="img" aria-label="Polaroid" style={{ '--logo': `url("${logoWordmark}")` }} />
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
