import styles from '../CameraNowPage.module.css';

/**
 * 3. 기능 소개 — 기능마다 한 화면을 채우는 좌우 분할 에디토리얼 (상세페이지 공통)
 * 한쪽은 설명(라벨 · 기능명 · 사진/영상 · 제목 · 설명), 반대쪽은 큰 이미지 자리(확정 전 회색 상자)다.
 *
 * @param {object} props
 * @param {string} props.idPrefix  id 접두어 (예: 'now', 'nowplus')
 * @param {string} props.model     설명 아래 표시할 모델명 (예: 'Polaroid Now')
 * @param {string} [props.eyebrow]   섹션 라벨 (eyebrow·title 이 없으면 머리말 없이 바로 기능부터 보여 준다)
 * @param {string[]} [props.title]   섹션 제목 두 줄
 * @param {Array<{id:string, side:'left'|'right', name:string, video?:string, img?:string, alt:string, title:string[], desc:string}>} props.items
 *        side 는 설명(사진+글)이 놓이는 쪽이다.
 * @param {boolean} props.reducedMotion
 */
export default function NowFeatures({ idPrefix, model, eyebrow, title, items, reducedMotion }) {
  const rv = styles.rv;
  const total = String(items.length).padStart(2, '0');

  return (
    <section
      className={styles.features}
      aria-labelledby={title ? `${idPrefix}-feat-title` : undefined}
      aria-label={title ? undefined : `${model} 주요 기능`}
    >
      {title && (
        <header className={`${styles.featIntro} ${rv}`}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 id={`${idPrefix}-feat-title`}>
            {title[0]}
            <br />
            {title[1]}
          </h2>
        </header>
      )}
      <ol className={styles.featList} role="list">
        {items.map((f, i) => (
          <li key={f.id} className={`${styles.featRow} ${f.side === 'right' ? styles.featRowFlip : ''}`}>
            <article className={styles.featInfo} aria-labelledby={`${idPrefix}-feat-${f.id}`}>
              <span className={`${styles.featTag} ${rv}`}>Function — {String(i + 1).padStart(2, '0')}</span>
              <p className={`${styles.featName} ${rv}`}>{f.name}</p>
              <div className={`${styles.featMedia} ${rv}`}>
                {f.video ? (
                  <video src={f.video} autoPlay={!reducedMotion} muted loop playsInline preload="metadata" aria-label={f.alt} />
                ) : (
                  <img src={f.img} alt={f.alt} loading="lazy" decoding="async" />
                )}
              </div>
              <h3 id={`${idPrefix}-feat-${f.id}`} className={rv}>
                {f.title[0]}
                <br />
                {f.title[1]}
              </h3>
              <p className={`${styles.featDesc} ${rv}`}>{f.desc}</p>
              <div className={styles.featFoot} aria-hidden="true">
                <span>{model}</span>
                <span>
                  {String(i + 1).padStart(2, '0')} / {total}
                </span>
              </div>
            </article>
            {/* 큰 이미지 자리 (이미지 확정 전 회색 상자) */}
            <div className={styles.featVisual} role="img" aria-label={`${f.name} 큰 이미지 (추가 예정)`}>
              <span className={styles.featPending}>이미지 추가 예정</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
