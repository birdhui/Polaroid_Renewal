import { Link } from 'react-router';
import useInView from '../hooks/useInView.js';
import ScriptDraw from './ScriptDraw.jsx';
import SCRIPT_STROKES from './scriptStrokes.js';
import styles from './ModelFeature.module.css';

/**
 * 4~9. 모델 섹션 (시안 1920×1095, Go 만 1080)
 * - 한쪽: 손글씨 모델명 + 헤드라인 · 설명 · 버튼
 * - 반대쪽: 626×626 제품 카드(배경 없는 투명 사진) + 'POLAROID CAMERA - 00N' 라벨
 * 글 묶음이 화면에 어느 정도(60%) 보이면 한꺼번에:
 *   손글씨 모델명이 펜으로 쓰듯 그려지고(ScriptDraw), 흐릿하던 헤드라인과 제품 카드가 초점이 맞듯 선명해진다.
 * 제품 카드에 마우스를 올리면(또는 키보드로 카드에 머물면) 두 번째 사진으로 바뀐다 (framer 'Hover Blur Cards' 참고):
 *   지금 사진은 오른쪽으로 살짝 밀리며 흐려지고, 다음 사진은 왼쪽에서 흐린 채 들어와 선명해진다(약 0.35초).
 *   오른쪽 위 번호도 01 / 02 → 02 / 02 로 바뀐다. 떼면 거꾸로 돌아온다.
 */
const TOTAL = 6;
const pad = (n, len = 2) => String(n).padStart(len, '0');

export default function ModelFeature({ model, linkLabel, reducedMotion }) {
  const [copyRef, inView] = useInView({ threshold: 0.6 });
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
      id={`model-${model.id}`}
      className={styles.section}
      data-side={model.side}
      style={{ '--sh': model.height ?? 1095 }}
      aria-labelledby={`model-${model.id}-title`}
    >
      <figure
        className={`${styles.card} ${inView || reducedMotion ? styles.focused : ''}`}
        style={{ '--l': cl, '--t': ct, '--w': cw, '--h': ch }}
        tabIndex={model.card.hover ? 0 : undefined}
        aria-label={model.card.hover ? `${model.card.alt} — 다른 각도 사진 보기` : undefined}
      >
        <div className={styles.cardMedia}>
          <img className={`${styles.cardImage} ${styles.cardFirst}`} src={model.card.src} alt={model.card.alt} loading="lazy" />
          {model.card.hover && (
            <img
              className={`${styles.cardImage} ${styles.cardSecond}`}
              src={model.card.hover.src}
              alt={model.card.hover.alt}
              loading="lazy"
            />
          )}
        </div>
        <figcaption className={styles.cardLabels} aria-hidden="true">
          <span className={styles.labelTopLeft}>POLAROID CAMERA - {pad(model.card.index, 3)}</span>
          <span className={styles.labelTopRight}>
            <span className={styles.countFirst}>01 / 02</span>
            {model.card.hover && <span className={styles.countSecond}>02 / 02</span>}
          </span>
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
        ref={copyRef}
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
