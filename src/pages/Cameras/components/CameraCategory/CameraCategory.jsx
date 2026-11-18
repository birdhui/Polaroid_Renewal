import SectionHead from '../SectionHead/SectionHead.jsx';
import useInView from '../../hooks/useInView.js';
import styles from './CameraCategory.module.css';

/**
 * 카메라 카테고리: 단색 정사각 타일 2열.
 * 큰 단어는 두 겹이다. 채워진 글자는 카메라 뒤에, 외곽선 글자는 카메라 위에 둔다.
 * 그래서 카메라와 겹치는 부분은 외곽선으로 보이고, 나머지는 채워진 글자로 보인다.
 */
function CameraTile({ tile }) {
  const [ref, inView] = useInView({ threshold: 0.2 });
  const style = {
    '--tile-bg': tile.bg,
    '--tile-fg': tile.fg,
    '--tile-fs': `${tile.fs}cqw`,
    '--tile-w': `${tile.w}%`,
    ...(tile.halo ? { '--tile-halo': tile.halo } : {}),
  };

  return (
    <li ref={ref} className={`${styles.item} ${inView ? styles.isIn : ''}`}>
      <a className={styles.tile} href={tile.href} target="_blank" rel="noopener noreferrer" style={style}>
        <span className={`${styles.word} ${styles.fill}`} aria-hidden="true">
          {tile.word}
        </span>
        <img className={styles.camera} src={tile.image.src} alt={tile.image.alt} loading="lazy" decoding="async" />
        <span className={`${styles.word} ${styles.line}`} aria-hidden="true">
          {tile.word}
        </span>
        <span className={styles.meta}>
          {tile.name}
          <span className={styles.more}>둘러보기 →</span>
        </span>
      </a>
    </li>
  );
}

/**
 * sectionId: 히어로의 SCROLL 안내가 스크롤·포커스할 대상 id (tabIndex -1 로 포커스만 받는다)
 */
export default function CameraCategory({ id, sectionId, head, tiles }) {
  return (
    <section id={sectionId} className={styles.section} aria-labelledby={id} tabIndex={sectionId ? -1 : undefined}>
      <SectionHead id={id} title={head.title} desc={head.desc} />
      <ul className={styles.tiles} role="list">
        {tiles.map((tile) => (
          <CameraTile key={tile.id} tile={tile} />
        ))}
      </ul>
    </section>
  );
}
