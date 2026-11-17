/* Polaroid Now 상세페이지 시안 스크립트 — polaroid-now.html 전용 */

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 화면에 들어온 요소(.rv)를 차례로 나타낸다.
(() => {
  const els = document.querySelectorAll('.rv');
  if (reduce || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
})();

// 기능 영상: 화면 밖에서는 멈춘다.
(() => {
  const vids = document.querySelectorAll('.feat-video');
  if (reduce) { vids.forEach((v) => { v.removeAttribute('autoplay'); v.pause(); }); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) e.target.play().catch(() => {}); else e.target.pause();
  }), { threshold: 0.2 });
  vids.forEach((v) => io.observe(v));
})();

// 소개 영상: 썸네일을 누르면 YouTube 플레이어로 바꾼다.
(() => {
  const box = document.querySelector('.film-player');
  if (!box) return;
  const id = box.dataset.yt;
  const poster = box.querySelector('.film-poster');
  poster.addEventListener('error', () => {
    if (!poster.src.includes('hqdefault')) poster.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  });
  box.querySelector('.film-play').addEventListener('click', () => {
    const q = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', modestbranding: '1' });
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${id}?${q}`;
    f.title = 'How to use the Polaroid Now';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
})();

// 결과물: 스크롤에 따라 인화 사진이 하나씩 흩뿌려진다.
(() => {
  const sec = document.querySelector('.results');
  if (!sec || reduce) return;
  const prints = [...sec.querySelectorAll('.print')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / total));
    // 섹션 위쪽이 화면 35% 지점에 닿으면 시작, 스크롤 절반쯤에서 모두 놓임
    const enter = r.top < innerHeight * 0.35 ? p * 0.9 + 0.02 : -1;
    prints.forEach((el) => el.classList.toggle('on', enter >= parseFloat(el.style.getPropertyValue('--at'))));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
