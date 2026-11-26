import styles from './FeatureShowcase.module.css';

/**
 * Feature — Figma "Cameras - NOW_v3"(2854:2377) 04~07 프레임.
 * 소개 → 01 → 02 → 03 네 장면을 16:9 프레임으로 위아래로 이어 붙인 일반 스크롤 구간이다.
 * (고정·카메라 이동·회전·페이드 같은 스크롤 연출 없음 — 스크롤하면 한 페이지처럼 그대로 올라간다)
 *  - 01·03: 왼쪽 683×658 사진 + 오른쪽 제목·부제·설명 / 02: 왼쪽 글 + 오른쪽 큰 카메라
 * 카메라 이미지는 src/assets/cameras/now/v3-camera-3q.png · v3-camera-front.png 로 둔다(없으면 그 자리는 비어 있다).
 */

const images = import.meta.glob('../../../../assets/cameras/now/v3-camera-*.png', { eager: true, import: 'default' });
const camera3q = Object.entries(images).find(([key]) => key.includes('v3-camera-3q'))?.[1];
const cameraFront = Object.entries(images).find(([key]) => key.includes('v3-camera-front'))?.[1];

// Figma 좌표(px). crop(l,t,iw,ih)은 상자 안에서 이미지가 차지하는 비율(%), flip 은 좌우 반전.
const CAMERA_INTRO = { x: 73, y: 157, w: 807, h: 770, l: -11.03, t: -12.73, iw: 119.33, ih: 125.06, flip: false };
const CAMERA_FRONT = { x: 1162, y: 117, size: 1515 };
// 기능 순서(01, 02, 03)별 3/4 각도 카메라. 없으면 null
const CAMERA_BY_FEATURE = [
  { x: 1073, y: 861, w: 1473, h: 1334, l: 0, t: -16.49, iw: 105.5, ih: 116.49, flip: true },
  { x: 992, y: -439, w: 1554, h: 1554, l: 0, t: 0, iw: 100, ih: 100, flip: true },
  null,
];

const px = (v) => `calc(${v} * var(--u))`;

function Camera3q({ k }) {
  if (!camera3q || !k) return null;
  return (
    <div
      className={styles.camera3q}
      style={{
        left: px(k.x),
        top: px(k.y),
        width: px(k.w),
        height: px(k.h),
        transform: k.flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <img src={camera3q} alt="" style={{ left: `${k.l}%`, top: `${k.t}%`, width: `${k.iw}%`, height: `${k.ih}%` }} />
    </div>
  );
}

export default function FeatureShowcase({ heading, features, intro }) {
  return (
    <div className={styles.wrap}>
      {/* 소개: 뒤쪽 큰 글자 + 제목·부제 + 카메라 */}
      <section className={styles.section} aria-label={heading}>
        <div className={styles.wordmark} aria-hidden="true">
          {intro.wordmark.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <div className={styles.introCopy}>
          <h3 className={styles.introTitle}>
            {intro.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h3>
          <p className={styles.introSubtitle}>
            {intro.subtitle.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <p className={styles.introDescription}>{intro.description}</p>
        </div>
        {cameraFront && (
          <img
            className={styles.cameraFront}
            src={cameraFront}
            alt=""
            style={{ left: px(CAMERA_FRONT.x), top: px(CAMERA_FRONT.y), width: px(CAMERA_FRONT.size), height: px(CAMERA_FRONT.size) }}
          />
        )}
        <Camera3q k={CAMERA_INTRO} />
      </section>

      {features.map((feature, i) => {
        const side = feature.layout === 'camera' ? styles.left : styles.right;
        return (
          <section key={feature.id} className={styles.section}>
            {feature.layout === 'media' && (
              <div className={styles.mediaBox}>
                {feature.photo ? (
                  <img className={styles.video} src={feature.photo} alt="" />
                ) : (
                  <video
                    className={styles.video}
                    src={feature.video}
                    poster={feature.image}
                    preload="auto"
                    autoPlay
                    loop
                    muted
                    playsInline
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
            <Camera3q k={CAMERA_BY_FEATURE[i]} />
            <div className={`${styles.copy} ${side}`}>
              <div className={styles.text}>
                <h3 className={styles.title}>
                  {feature.titleLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h3>
                <p className={styles.subtitle}>{feature.subtitle}</p>
                <p className={styles.description}>
                  {feature.descriptionLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </p>
              </div>
              <p className={styles.label}>{feature.label}</p>
              <span className={styles.rule} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
