import { Link } from 'react-router';
import useInView from '../hooks/useInView.js';
import ScriptDraw from './ScriptDraw.jsx';
import SCRIPT_STROKES from './scriptStrokes.js';
import { percentBox, unionBox } from './layout.js';
import styles from './ModelFeature.module.css';

/**
 * 4~9. 모델 섹션 — 한쪽에 소개 글, 반대쪽에 손글씨 모델명 + 제품 이미지 (시안 1920×1095)
 * 손글씨·카메라는 둘을 감싸는 상자(visual) 안에 % 로 배치해, 좁은 화면에서도 같은 구도를 유지한다.
 * 손글씨 모델명은 섹션이 화면에 들어오면 펜으로 쓰듯 그려진다(ScriptDraw).
 * 메인 헤드라인은 처음에 흐릿하게 있다가, 드로잉이 시작되는 순간 초점이 맞듯 선명해진다.
 */
export default function ModelFeature({ model, linkLabel, reducedMotion }) {
  const [sectionRef, inView] = useInView({ threshold: 0.35 });
  const visualBox = unionBox([model.script.box, model.camera.box]);
  const [vl, vt, vw, vh] = visualBox;

  const script = (
    <ScriptDraw
      key="script"
      className={styles.script}
      style={percentBox(model.script.box, visualBox)}
      src={model.script.src}
      strokes={SCRIPT_STROKES[model.id]}
      play={inView}
      reducedMotion={reducedMotion}
    />
  );
  const camera = (
    <img
      key="camera"
      className={styles.camera}
      style={percentBox(model.camera.box, visualBox)}
      src={model.camera.src}
      alt={model.camera.alt}
      loading="lazy"
    />
  );

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
      <div
        className={styles.visual}
        style={{ '--l': vl, '--t': vt, '--w': vw, '--h': vh, aspectRatio: `${vw} / ${vh}` }}
      >
        {model.cameraOnTop ? [script, camera] : [camera, script]}
      </div>

      <div
        className={`${styles.copy} ${inView || reducedMotion ? styles.focused : ''}`}
        style={{ '--edge': model.edge, '--top': model.top }}
      >
        {model.tag && <span className={styles.tag}>{model.tag}</span>}
        <p className={styles.name}>{model.name}</p>
        <h2 id={`model-${model.id}-title`} className={styles.title}>
          {model.title[0]}
          <br />
          {model.title[1]}
        </h2>
        <p className={styles.body} style={{ fontWeight: model.weight }}>
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
