import { useEffect } from 'react';

/**
 * 상세페이지 공통 움직임
 * 1) 화면에 들어온 요소(revealClass)를 차례로 나타낸다(inClass 를 붙인다).
 * 2) 페이지 안 영상은 화면 안에 있을 때만 재생한다.
 * 동작 줄이기 설정이면 요소는 바로 보이고 영상은 멈춘 상태로 둔다.
 */
export default function useDetailPageMotion(pageRef, reducedMotion, revealClass, inClass) {
  useEffect(() => {
    const els = pageRef.current?.querySelectorAll(`.${revealClass}`) ?? [];
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add(inClass));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(inClass);
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pageRef, reducedMotion, revealClass, inClass]);

  useEffect(() => {
    const vids = pageRef.current?.querySelectorAll('video') ?? [];
    if (reducedMotion) {
      vids.forEach((v) => v.pause());
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.play().catch(() => {});
          else e.target.pause();
        }),
      { threshold: 0.2 },
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [pageRef, reducedMotion]);
}
