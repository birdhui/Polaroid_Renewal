import storeBgImage from '@/assets/cameras/now/now-store-bg.webp';
import styles from '../CameraNowPage.module.css';

/**
 * 7. 스토어 이동 (배경 사진 + 유리 박스, 상세페이지 공통) — polaroid.com 해당 모델 쇼핑 페이지로 연결.
 * 박스 전체를 눌러도 이동한다(링크의 ::after 가 박스를 덮는다).
 * @param {object} props
 * @param {string} [props.idPrefix]
 * @param {string} [props.url]     polaroid.com 상품(카테고리) 주소
 * @param {string} [props.modelName] 스크린리더 안내에 쓰는 모델명
 */
const STORE_URL = 'https://www.polaroid.com/en_us/cameras/now-camera';

export default function NowStore({ idPrefix = 'now', url = STORE_URL, modelName = 'Now' }) {
  return (
    <section className={styles.store} aria-labelledby={`${idPrefix}-store-title`}>
      <img className={styles.storeBg} src={storeBgImage} alt="" loading="lazy" decoding="async" />
      <div className={styles.storeCard}>
        <p className={styles.storeTop} id={`${idPrefix}-store-title`}>
          Since 1937, Polaroid has turned <br />
          moments into things you can hold.
        </p>
        <a className={styles.storeLink} href={url} target="_blank" rel="noopener noreferrer">
          Go to the Polaroid{' '}
          <span className={styles.storeNowrap}>
            Store
            <span className={styles.storeArrow} aria-hidden="true">
              →
            </span>
          </span>
          <span className={styles.srOnly}> (새 창에서 polaroid.com {modelName} 카메라 페이지 열기)</span>
        </a>
        <p className={styles.storeBottom} aria-hidden="true">
          MAKE IT A MOMENT.
        </p>
      </div>
    </section>
  );
}
