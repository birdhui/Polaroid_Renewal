import styles from './MainHero.module.css';

/** 1. Hero — 전체 화면 사진 + 왼쪽 아래 Polaroid 로고와 'Instant Cameras' */
export default function MainHero({ hero }) {
  return (
    <section className={styles.hero} aria-labelledby="cameras-hero-title">
      <img className={styles.photo} src={hero.photo.src} alt={hero.photo.alt} fetchPriority="high" />
      <h1 id="cameras-hero-title" className={styles.title}>
        <img className={styles.logo} src={hero.logo.src} alt={hero.logo.alt} width="464" height="127" />
        <span className={styles.sub}>{hero.title}</span>
      </h1>
    </section>
  );
}
