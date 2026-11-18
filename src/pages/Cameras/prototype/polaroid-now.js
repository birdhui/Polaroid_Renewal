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

// 필터: 필터 원판(탭)을 누르면 인화 사진이 옆으로 넘어가며 그 필터 사진이 나온다. 누른 탭은 가운데로 온다.
//   5개가 고리처럼 이어져 있어 양 끝에서도 계속 넘어간다. ←/→ 키, 사진 좌우 끌기도 지원.
(() => {
  const root = document.querySelector('.filter-viewer');
  if (!root) return;
  const prints = [...root.querySelectorAll('.filter-print')];
  const tabs = [...root.querySelectorAll('.filter-tab')];
  const win = root.querySelector('.filter-window');
  const n = prints.length;
  const wrap = (d) => ((d % n) + n + Math.floor(n / 2)) % n - Math.floor(n / 2); // -2..2
  let active = 0;

  const place = (els, prev) => els.forEach((el, i) => {
    const o = wrap(i - active);
    const was = prev == null ? o : wrap(i - prev);
    // 고리를 한 바퀴 돌아 반대편으로 건너가는 칸은 애니메이션 없이 옮긴다
    const jump = prev != null && o !== was - wrap(active - prev);
    if (prev == null) { el.classList.add('no-anim'); el.style.setProperty('--o', o); void el.offsetWidth; el.classList.remove('no-anim'); }
    else if (jump) {
      // 투명하게 건너간 뒤, 움직이던 칸들이 지나가고 나서 다시 나타난다 (겹쳐 보이지 않게)
      el.classList.add('no-anim'); el.style.opacity = '0'; el.style.setProperty('--o', o);
      void el.offsetWidth; el.classList.remove('no-anim');
      clearTimeout(el._t); el._t = setTimeout(() => { el.style.opacity = ''; }, 520);
    } else el.style.setProperty('--o', o);
    el.classList.toggle('is-far', Math.abs(o) >= 2);
  });

  const select = (i, focus) => {
    i = ((i % n) + n) % n;
    if (i === active) return;
    const prev = active; active = i;
    place(prints, prev); place(tabs, prev);
    prints.forEach((p, k) => {
      const on = k === active;
      p.classList.toggle('is-active', on);
      p.toggleAttribute('inert', !on);
      if (on) p.removeAttribute('aria-hidden'); else p.setAttribute('aria-hidden', 'true');
    });
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === active)); t.tabIndex = k === active ? 0 : -1; });
    if (focus) tabs[active].focus({ preventScroll: true });
  };

  place(prints); place(tabs);
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  root.querySelector('.filter-tabs').addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); select(active + d, true); }
    if (e.key === 'Home') { e.preventDefault(); select(0, true); }
    if (e.key === 'End') { e.preventDefault(); select(n - 1, true); }
  });

  // 사진 좌우 끌기
  let x0 = null;
  win.addEventListener('pointerdown', (e) => { x0 = e.clientX; win.classList.add('is-drag'); });
  const end = (e) => {
    if (x0 == null) return;
    const dx = e.clientX - x0; x0 = null; win.classList.remove('is-drag');
    if (Math.abs(dx) > 40) select(active + (dx < 0 ? 1 : -1));
  };
  win.addEventListener('pointerup', end);
  win.addEventListener('pointercancel', () => { x0 = null; win.classList.remove('is-drag'); });
  win.addEventListener('pointerleave', end);
})();

// 결과물 (instax mini13 'Colorful moment' 방식)
//   섹션이 화면에 고정된 동안(1400px) 스크롤 진행률에 맞춰 사진이 순서(--k)대로 떠오른다.
//   사진마다 opacity 0→1, 아래 60px→0, 0.92→1 배, 감속(quad out). 진행률은 부드럽게 따라간다(scrub).
//   문구는 화면 아래 10% 지점에 닿을 때 글자마다 한 번 튀어 오른다.
(() => {
  const sec = document.querySelector('.results');
  if (!sec) return;
  const title = sec.querySelector('.results-title');
  const prints = [...sec.querySelectorAll('.print')];

  // 문구를 글자 단위로 쪼갠다 (스크린리더에는 원래 문장을 그대로 읽힌다)
  if (title) {
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    const chars = [];
    const split = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.append(' '); return; }
        const word = document.createElement('span'); word.className = 'bt-word'; word.setAttribute('aria-hidden', 'true');
        [...w].forEach((ch) => { const s = document.createElement('span'); s.className = 'bt-char'; s.textContent = ch; word.append(s); chars.push(s); });
        frag.append(word);
      });
      c.replaceWith(frag);
    });
    split(title);
    chars.forEach((c, i) => c.style.setProperty('--d', `${(0.6 * i / Math.max(1, chars.length - 1)).toFixed(3)}s`));
    if (reduce) title.classList.add('is-in');
    else new IntersectionObserver(([e], io) => { if (e.isIntersecting) { title.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' }).observe(title);
  }
  if (reduce) return;

  const n = prints.length;
  const step = 1 / (n + 3);
  const dur = step * 4;
  const outQuad = (t) => 1 - (1 - t) * (1 - t);
  let shown = 0; let raf = 0; let visible = false;

  const target = () => {
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - innerHeight;
    return Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
  };
  const draw = (p) => prints.forEach((el) => {
    const k = +el.style.getPropertyValue('--k');
    const t = outQuad(Math.min(1, Math.max(0, (p - k * step) / dur)));
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translateY(${(60 * (1 - t)).toFixed(1)}px) scale(${(0.92 + 0.08 * t).toFixed(4)})`;
  });
  const loop = () => {
    raf = 0;
    const p = target();
    shown += (p - shown) * 0.14; // scrub: 1 처럼 살짝 늦게 따라간다
    if (Math.abs(p - shown) < 0.0005) shown = p;
    draw(shown);
    if (visible || shown !== p) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(sec);
  shown = target(); draw(shown);
})();

// 영상 카드: 누르면 모달에서 YouTube 영상을 재생한다. 닫으면 플레이어를 지워 소리를 멈춘다.
(() => {
  const modal = document.querySelector('.video-modal');
  if (!modal) return;
  const frame = modal.querySelector('.video-modal-frame');
  let opener = null;
  const close = () => { if (modal.open) modal.close(); };
  modal.addEventListener('close', () => { frame.replaceChildren(); opener?.focus(); });
  modal.querySelector('.video-modal-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); }); // 바깥(배경) 클릭
  document.querySelectorAll('[data-yt-modal]').forEach((btn) => {
    const id = btn.dataset.ytModal;
    const img = btn.querySelector('img');
    img?.addEventListener('error', () => {
      if (!img.src.includes('mqdefault')) img.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
      else img.style.visibility = 'hidden'; // 썸네일을 못 받으면 깨진 이미지 아이콘 대신 빈 칸
    });
    btn.addEventListener('click', () => {
      opener = btn;
      const q = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', modestbranding: '1' });
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?${q}`;
      f.title = btn.querySelector('.watch-title')?.textContent || 'Polaroid video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.referrerPolicy = 'strict-origin-when-cross-origin';
      f.allowFullscreen = true;
      frame.replaceChildren(f);
      modal.showModal();
    });
  });
})();
