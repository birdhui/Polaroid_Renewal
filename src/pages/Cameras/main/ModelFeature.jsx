import { Link } from 'react-router';
import useInView from '../hooks/useInView.js';
import ScriptDraw from './ScriptDraw.jsx';
import SCRIPT_STROKES from './scriptStrokes.js';
import styles from './ModelFeature.module.css';

/**
 * 4~9. 모델 섹션 (시안 1920×1095, Go 만 1080)
 * - 한쪽: 손글씨 모델명 + 헤드라인 · 설명 · 버튼
 * - 반대쪽: 626×626 제품 카드(배경색이 들어간 사진) + 'POLAROID CAMERA - 00N' 라벨
 * 손글씨 모델명은 섹션이 화면에 들어오면 펜으로 쓰듯 그려진다(ScriptDraw).
 * 메인 헤드라인은 처음에 흐릿하게 있다가, 드로잉이 시작되는 순간 초점이 맞듯 선명해진다.
 */
const TOTAL = 6;
const pad = (n, len = 2) => String(n).padStart(len, '0');

export default function ModelFeature({ model, linkLabel, reducedMotion }) {
  const [sectionRef, inView] = useInView({ threshold: 0.35 });
  const [cl, ct, cw, ch] = model.card.box;
  const [sl, st, sw, sh] = model.script.box;

  const linkContent = (
    <>
      {linkLabel}
      <span className={styles.srOnly}> — Polaroid {model.name}</span>
    </>
  );

  return (
    <section
      ref={sectionRef}
      id={`model-${model.id}`}
      className={styles.section}
      data-side={model.side}
      style={{ '--sh': model.height ?? 1095 }}
      aria-labelledby={`model-${model.id}-title`}
    >
      <figure
        className={styles.card}
        data-tone={model.card.tone}
        style={{ '--l': cl, '--t': ct, '--w': cw, '--h': ch }}
      >
        <img className={styles.cardImage} src={model.card.src} alt={model.card.alt} loading="lazy" />
        <figcaption className={styles.cardLabels} aria-hidden="true">
          <span className={styles.labelTopLeft}>POLAROID CAMERA - {pad(model.card.index, 3)}</span>
          <span className={styles.labelTopRight}>01 / 02</span>
          <span className={styles.labelBottom}>
            {pad(model.card.index)} / {pad(TOTAL)}
          </span>
        </figcaption>
      </figure>

      <ScriptDraw
        className={styles.script}
        style={{ '--l': sl, '--t': st, '--w': sw, '--h': sh }}
        src={model.script.src}
        strokes={SCRIPT_STROKES[model.id]}
        play={inView}
        reducedMotion={reducedMotion}
      />

      <div
        className={`${styles.copy} ${inView || reducedMotion ? styles.focused : ''}`}
        style={{ '--edge': model.edge, '--top': model.top }}
      >
        <h2 id={`model-${model.id}-title`} className={styles.title}>
          <span className={styles.srOnly}>Polaroid {model.name} — </span>
          {model.title[0]}
          <br />
          {model.title[1]}
        </h2>
        <p className={styles.body}>
          {model.body.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
        {model.to ? (
          <Link className={styles.button} to={model.to}>
            {linkContent}
          </Link>
        ) : (
          <a className={styles.button} href={model.href} target="_blank" rel="noreferrer">
            {linkContent}
            <span className={styles.srOnly}> (polaroid.com, 새 창)</span>
          </a>
        )}
      </div>
    </section>
  );
}
