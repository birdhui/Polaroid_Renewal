import { useEffect, useRef, useState } from 'react';

/**
 * 요소가 뷰포트에 들어오면(threshold 만큼 보이면) true 가 된다.
 * - 기본: 처음 한 번만 true 가 되고 그대로 유지한다.
 * - repeat: true 면 요소가 화면에서 완전히 벗어날 때 다시 false 가 되어, 다시 들어올 때마다 모션을 반복할 수 있다.
 *   (조금이라도 보이는 동안에는 false 로 돌아가지 않으므로, 가장자리에서 깜빡이지 않는다)
 * IntersectionObserver 를 지원하지 않는 환경에서는 바로 true.
 */
export default function useInView({ threshold = 0.2, rootMargin = '0px', repeat = false } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || (inView && !repeat)) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          setInView(true);
          if (!repeat) observer.disconnect();
        } else if (repeat && !entry.isIntersecting) {
          setInView(false);
        }
      },
      { threshold: repeat ? [0, threshold] : threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin, repeat]);

  return [ref, inView];
}
