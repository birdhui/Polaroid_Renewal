import { SANITY } from '../detailShared.js';
import styles from '../CameraNowPage.module.css';

/**
 * 6. 앱 연동 (상세페이지 공통) — 왼쪽 문구 + 오른쪽 휴대폰 화면(스토리 → 스캔 → 공유가 반복 재생)
 * @param {object} props
 * @param {string} props.idPrefix id 접두어 (예: 'now')
 * @param {string} [props.printSrc] 휴대폰 화면에 나오는 인화 사진
 */
const DEFAULT_PRINT = `${SANITY}/1228092e3ce76ea6edaaf862626bc42aca3311ee-4107x5000.jpg?w=500&fm=webp&q=85`;

export default function NowApp({ idPrefix, printSrc = DEFAULT_PRINT }) {
  const rv = styles.rv;
  return (
    <section className={styles.app} aria-labelledby={`${idPrefix}-app-title`}>
      <div className={rv}>
        <span className={styles.eyebrow}>Polaroid App</span>
        <h2 id={`${idPrefix}-app-title`}>Scan and share your photos in the Polaroid App.</h2>
        <p className={styles.appLinks}>
          <span>DOWNLOAD APP</span>
          <span className={styles.u}>IOS</span>
          <span className={styles.sep} aria-hidden="true">
            |
          </span>
          <span className={styles.u}>ANDROID</span>
        </p>
      </div>

      <div className={styles.phone} role="img" aria-label="Polaroid 앱으로 인화 사진을 스캔하고 공유하는 화면이 반복 재생되는 휴대폰">
        <div className={styles.screen}>
          {/* story */}
          <div className={`${styles.s} ${styles.sStory}`}>
            <div className={styles.storyBg} />
            <div className={styles.status}>
              <span>9:41</span>
              <i />
            </div>
            <div className={styles.storyBar}>
              <i />
            </div>
            <div className={styles.storyHead}>
              <span className={styles.avatar} />
              <b>Polaroid</b>
              <span className={styles.dot} />
              <span className={styles.dots}>···</span>
              <span className={styles.x}>×</span>
            </div>
            <img className={styles.storyPrint} src={printSrc} alt="" loading="lazy" />
            <div className={styles.storyFoot}>
              <span className={styles.msg}>Send message</span>
              <svg className={styles.ic} viewBox="0 0 24 24">
                <rect x="5" y="4" width="14" height="16" rx="2" />
              </svg>
              <svg className={`${styles.ic} ${styles.heart}`} viewBox="0 0 24 24">
                <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
              </svg>
              <svg className={styles.ic} viewBox="0 0 24 24">
                <path d="M21 4 3 11l7 2 2 7z" />
              </svg>
            </div>
            <svg className={styles.popHeart} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          </div>
          {/* scan */}
          <div className={`${styles.s} ${styles.sScan}`}>
            <span className={styles.hold}>Hold still, please!</span>
            <div className={styles.scanFrame}>
              <img className={styles.scanPrint} src={printSrc} alt="" loading="lazy" />
              <i className={`${styles.c} ${styles.tl}`} />
              <i className={`${styles.c} ${styles.tr}`} />
              <i className={`${styles.c} ${styles.bl}`} />
              <i className={`${styles.c} ${styles.br}`} />
              <span className={`${styles.count} ${styles.n3}`}>3</span>
              <span className={`${styles.count} ${styles.n2}`}>2</span>
              <span className={`${styles.count} ${styles.n1}`}>1</span>
            </div>
            <span className={styles.shutter} />
          </div>
          {/* share */}
          <div className={`${styles.s} ${styles.sShare}`}>
            <div className={styles.status}>
              <span>9:41</span>
              <i />
            </div>
            <span className={styles.x}>×</span>
            <p className={styles.shareTitle}>Select a sharing format</p>
            <div className={styles.shareCards}>
              <img src={printSrc} alt="" loading="lazy" />
              <span className={styles.peek} />
            </div>
            <ul className={styles.shareApps} role="list">
              <li>
                <i style={{ background: 'conic-gradient(#f5c33b,#f2763a,#e2457f,#8c5bd6,#3d8fe0,#4cc36a,#f5c33b)' }} />
                Photos
              </li>
              <li>
                <i style={{ background: '#34c759' }} />
                Messages
              </li>
              <li>
                <i style={{ background: 'linear-gradient(45deg,#f7b733,#e1306c,#833ab4)' }} />
                Stories
              </li>
              <li>
                <i className={styles.more} />
                More
              </li>
            </ul>
          </div>
        </div>
        <span className={styles.island} aria-hidden="true" />
      </div>
    </section>
  );
}
