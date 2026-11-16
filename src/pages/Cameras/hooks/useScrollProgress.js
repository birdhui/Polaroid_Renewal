import { useEffect } from 'react';

/**
 * 요소가 화면 아래에서 들어와 위로 완전히 빠져나갈 때까지의 진행률(0→1)을
 * CSS 변수 `--progress` 로 요소에 기록한다.
 * React 상태를 쓰지 않고 DOM 에 직접 써서 스크롤마다 리렌더링하지 않는다.
 * 화면 밖에 있을 때는 계산하지 않고, `disabled` 이면 아무것도 하지 않는다.
 */
export default function useScrollProgress(ref, { disabled = false } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return undefined;

    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = rect.height + vh;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      el.style.setProperty('--progress', progress.toFixed(4));
    };

    const onScroll = () => {
      if (!visible || frame) return;
      frame = requestAnimationFrame(update);
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible) onScroll();
          })
        : null;

    if (observer) observer.observe(el);
    else visible = true;

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      el.style.removeProperty('--progress');
    };
  }, [ref, disabled]);
}
