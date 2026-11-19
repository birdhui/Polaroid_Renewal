import storeBgImage from '@/assets/cameras/now/now-store-bg.webp';
import styles from '../CameraNowPage.module.css';

/**
 * 7. 스토어 이동 (배경 사진 + 유리 박스) — polaroid.com Now 카메라 쇼핑 페이지로 연결.
 * 박스 전체를 눌러도 이동한다(링크의 ::after 가 박스를 덮는다).
 */
const STORE_URL = 'https://www.polaroid.com/en_us/cameras/now-camera';

export default function NowStore() {
  return (
    <section className={styles.store} aria-labelledby="now-store-title">
      <img className={styles.storeBg} src={storeBgImage} alt="" loading="lazy" decoding="async" />
      <div className={styles.storeCard}>
        <p className={styles.storeTop} id="now-store-title">
          Since 1937, Polaroid has turned <br />
          moments into things you can hold.
        </p>
        <a className={styles.storeLink} href={STORE_URL} target="_blank" rel="noopener noreferrer">
          Go to the Polaroid{' '}
          <span className={styles.storeNowrap}>
            Store
            <span className={styles.storeArrow} aria-hidden="true">
              →
            </span>
          </span>
          <span className={styles.srOnly}> (새 창에서 polaroid.com Now 카메라 페이지 열기)</span>
        </a>
        <p className={styles.storeBottom} aria-hidden="true">
          MAKE IT A MOMENT.
        </p>
      </div>
    </section>
  );
}
