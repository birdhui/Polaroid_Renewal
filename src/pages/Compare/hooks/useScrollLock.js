import { useEffect } from 'react';

/**
 * 페이지 스크롤을 잠근다. (enabled 가 true 인 동안)
 * - 잠글 때 스크롤바가 사라지며 화면 폭이 변해 레이아웃이 움직이지 않도록 스크롤바 자리는 그대로 둔다.
 * - target 이 화면보다 커서 잠그면 일부가 가려지는 경우(작은 화면, 가로로 눕힌 폰 등)에는 잠그지 않는다.
 *   화면 크기가 바뀌면 다시 판단한다.
 *
 * @param {boolean} enabled
 * @param {{ current: HTMLElement | null }} targetRef 화면에 고정해 보여 줄 영역
 */
export default function useScrollLock(enabled, targetRef) {
  useEffect(() => {
    if (!enabled) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const saved = {
      htmlOverflow: html.style.overflow,
      htmlGutter: html.style.scrollbarGutter,
      bodyOverflow: body.style.overflow,
    };
    let locked = false;

    const lock = () => {
      if (locked) return;
      html.style.scrollbarGutter = 'stable';
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      locked = true;
    };
    const unlock = () => {
      if (!locked) return;
      html.style.overflow = saved.htmlOverflow;
      html.style.scrollbarGutter = saved.htmlGutter;
      body.style.overflow = saved.bodyOverflow;
      locked = false;
    };
    const update = () => {
      const target = targetRef.current;
      const fits = target ? target.getBoundingClientRect().height <= window.innerHeight + 1 : true;
      if (fits) lock();
      else unlock();
    };

    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      unlock();
    };
  }, [enabled, targetRef]);
}
