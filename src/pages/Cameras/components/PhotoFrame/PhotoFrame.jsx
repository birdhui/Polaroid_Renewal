import styles from './PhotoFrame.module.css';

/**
 * 사진 프레임. `src`가 없으면 같은 비율의 자리표시 프레임을 보여준다.
 * - 화면 밖 이미지는 지연 로딩(lazy) + 비동기 디코딩
 * - 비율을 미리 잡아 두어 이미지가 늦게 와도 레이아웃이 흔들리지 않게 한다(CLS 방지)
 */
export default function PhotoFrame({ src, alt = '', ratio = '4 / 3', priority = false, className = '' }) {
  const frameClass = `${styles.frame} ${className}`.trim();

  if (!src) {
    return <div className={`${frameClass} ${styles.placeholder}`} style={{ aspectRatio: ratio }} aria-hidden="true" />;
  }

  return (
    <img
      className={frameClass}
      style={{ aspectRatio: ratio }}
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );
}
