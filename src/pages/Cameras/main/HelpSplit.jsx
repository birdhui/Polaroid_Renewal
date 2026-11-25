import { Link } from 'react-router';
import { boxVars } from './layout.js';
import styles from './HelpSplit.module.css';

/**
 * 10. 마지막 안내 — 왼쪽(어두운 면) Compare, 오른쪽(밝은 면) Support, 가운데 반반 색 카메라 (시안 1920×1081)
 */
export default function HelpSplit({ help }) {
  return (
    <section className={styles.section} aria-label="카메라 비교와 도움말">
      <img
        className={styles.camera}
        style={boxVars(help.camera.box)}
        src={help.camera.src}
        alt={help.camera.alt}
        loading="lazy"
      />
      {help.panels.map((panel) => (
        <div
          key={panel.id}
          className={styles.panel}
          data-tone={panel.tone}
          style={{ '--cx': panel.center, '--body-top': panel.bodyTop, '--button-top': help.buttonTop }}
        >
          <h2 className={styles.heading}>
            <img
              className={styles.script}
              style={boxVars(panel.script.box)}
              src={panel.script.src}
              alt={panel.script.alt}
              loading="lazy"
            />
          </h2>
          <p className={styles.body}>
            {panel.body[0]}
            <br />
            {panel.body[1]}
          </p>
          <Link className={styles.button} to={panel.to}>
            {panel.label}
          </Link>
        </div>
      ))}
    </section>
  );
}
