import { useEffect, useRef } from 'react';
import styles from './FocusTitle.module.css';

export default function FocusTitle({ as: Heading, children, className, id, lang, animateOnLoad = false }) {
  const titleRef = useRef(null);

  useEffect(() => {
    const title = titleRef.current;
    let frame = null;

    function updateFocus() {
      frame = null;
      const { top, height } = title.getBoundingClientRect();
      const revealInset = Math.min(height * 0.75, window.innerHeight * 0.22);
      const distance = window.innerHeight - top - revealInset;
      const focusDistance = Math.max(height, Math.min(280, Math.max(160, window.innerHeight * 0.3)));
      const progress = Math.max(0, Math.min(1, distance / focusDistance));
      title.style.setProperty('--focus-progress', progress);
    }

    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(updateFocus);
    }

    updateFocus();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Heading
      className={`${className} ${styles.title}`}
      data-focus-on-load={animateOnLoad || undefined}
      id={id}
      lang={lang}
      ref={titleRef}
    >
      {children}
    </Heading>
  );
}
