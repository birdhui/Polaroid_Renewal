/* Cameras 쇼핑 페이지 시안 스크립트 — polaroid-shop.html 전용 */

// 파일을 직접(file://) 열면 YouTube가 오류 153을 띄우므로 영상 대신 기본 배경을 보여준다.
if(location.protocol==="file:"){document.querySelectorAll(".hero-video").forEach(function(v){v.classList.add("is-off");var f=v.querySelector("iframe");if(f)f.removeAttribute("src")});console.warn("YouTube 배경 영상은 http(s) 주소에서만 재생됩니다 (file:// 에서는 오류 153).")}

// 스크롤해서 화면에 들어온 요소(.rv)를 차례로 나타낸다.
(() => {
  const els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  els.forEach(e => io.observe(e));
})();
