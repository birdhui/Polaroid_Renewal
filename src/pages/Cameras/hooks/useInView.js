import { useEffect, useRef, useState } from 'react';

/**
 * 요소가 뷰포트에 처음 들어오면 true 가 된다. (한 번만)
 * IntersectionObserver 를 지원하지 않는 환경에서는 바로 true.
 */
export default function useInView({ threshold = 0.2, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return [ref, inView];
}
