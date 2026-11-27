/**
 * 공통 커서 — 메인(Landing)에서 쓰던 커서를 모든 페이지에 쓴다. (kinoria 실측 값)
 * 점 11px #F0A137 포인트 컬러(누를 수 있는 곳 위에선 #5AD060), 프레임 반폭 16 · 반높이 12.5 · 모서리 8px · 선 1px #F6F5F4(+어두운 테두리)
 * 프레임 위치: 스프링 ω24 ζ0.85 (누를 수 있는 곳 위: ω36 ζ0.8) · 프레임 크기: 스프링 ω34 ζ0.5 (누르면 0.74배) · 점 크기: ω38 ζ0.45 (누르면 0.8배)
 * 누를 수 있는 곳에 올라가면 프레임이 쏙 줄었다 튕기고 점이 살짝 커졌다 돌아옴. 240Hz 로 쪼개 계산, 보일 때·숨을 때 0.18초.
 * 마우스가 있는 기기에서만 켜진다 (?kc=1 이면 확인용으로 강제 켜기). 켜지면 <html> 에 kc-on 을 달아 기본 커서를 숨긴다.
 *
 * @param {HTMLCanvasElement} cv 화면 전체를 덮는 커서용 캔버스
 * @returns {() => void} 정리 함수
 */
export function mountSiteCursor(cv) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches && !/[?&]kc=1/.test(location.search)) return () => {};
  const controller = new AbortController();
  const { signal } = controller;
  const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('kc-on');
  const g = cv.getContext('2d');
  const DOT = 11, HW = 16, HH = 12.5, FW = 24, FZ = 0.85;
  const HOT =
    'a,button,select,summary,textarea,label[for],input:not([type=hidden]),[role=button],[role=link],[role=tab],[role=menuitem],[role=switch],[role=checkbox],[role=radio],[role=option]';
  const S = { x: 0, y: 0, vis: 0, va: 0, fx: 0, fy: 0, fvx: 0, fvy: 0, k: 1, kv: 0, ds: 1, dsv: 0, hot: 0, ga: 0, down: 0, shown: false };
  let dpr = 1, KS = 1, raf = 0, last = 0, seen = -1e9, leaveTimer = 0;

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const size = () => {
    dpr = devicePixelRatio || 1;
    cv.width = Math.max(1, Math.round(innerWidth * dpr));
    cv.height = Math.max(1, Math.round(innerHeight * dpr));
    const a = Math.min(innerWidth / 1920, innerHeight / 911);
    KS = a > 1 ? Math.min(3, a) : 1; // 큰 화면에서만 비례해서 커짐
    kick();
  };
  const spring = (p, v, to, w, z, h) => {
    v += (w * w * (to - p) - 2 * z * w * v) * h;
    return [p + v * h, v];
  };
  const toward = (a, b, st) => (a < b ? Math.min(b, a + st) : Math.max(b, a - st));
  function setHot(h) {
    if (h === S.hot) return;
    S.hot = h;
    if (!CALM) {
      if (h) {
        S.kv -= 7.5;
        S.dsv += 9;
      } else S.kv += 4;
    }
  }
  function move(e) {
    if (e.pointerType === 'touch') {
      S.vis = 0;
      kick();
      return;
    }
    const now = performance.now(), snap = !S.vis && now - seen > 250;
    S.x = e.clientX;
    S.y = e.clientY;
    seen = now;
    if (snap || !S.shown) {
      S.fx = S.x;
      S.fy = S.y;
      S.fvx = S.fvy = 0;
      S.shown = true;
    }
    S.vis = 1;
    const t = e.target;
    setHot(t && t.closest && t.closest(HOT) && !t.closest('.wheel.drag') ? 1 : 0);
    kick();
  }
  const O = { capture: true, passive: true, signal };
  addEventListener('pointermove', move, O);
  addEventListener('pointerover', move, O);
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') return move(e);
      if (e.button === 0) S.down = 1;
      S.x = e.clientX;
      S.y = e.clientY;
      S.vis = 1;
      kick();
    },
    O,
  );
  const up = (e) => {
    if (e.pointerType !== 'touch') {
      S.down = 0;
      kick();
    }
  };
  addEventListener('pointerup', up, O);
  addEventListener('pointercancel', up, O);
  document.documentElement.addEventListener(
    'mouseleave',
    () => {
      leaveTimer = window.setTimeout(() => {
        S.vis = 0;
        kick();
      }, 40);
    },
    { passive: true, signal },
  );
  addEventListener('resize', size, { signal });

  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (t - (last || t - 16.7)) / 1000));
    last = t;
    const n = Math.ceil(dt / (1 / 240)), h = dt / n;
    const fw = CALM ? 400 : S.hot ? 36 : FW, fz = S.hot ? 0.8 : FZ;
    const kT = S.down ? 0.74 : 1, dT = S.down ? 0.8 : 1;
    for (let i = 0; i < n; i++) {
      [S.fx, S.fvx] = spring(S.fx, S.fvx, S.x, fw, fz, h);
      [S.fy, S.fvy] = spring(S.fy, S.fvy, S.y, fw, fz, h);
      [S.k, S.kv] = spring(S.k, S.kv, kT, 34, 0.5, h);
      [S.ds, S.dsv] = spring(S.ds, S.dsv, dT, 38, 0.45, h);
    }
    if (CALM) {
      S.fx = S.x;
      S.fy = S.y;
    }
    S.va = toward(S.va, S.vis, dt / 0.18);
    S.ga = toward(S.ga, S.hot, dt / 0.16);
    draw();
    const still =
      Math.abs(S.fx - S.x) < 0.05 && Math.abs(S.fy - S.y) < 0.05 && Math.abs(S.fvx) + Math.abs(S.fvy) < 0.05 &&
      Math.abs(S.k - kT) < 0.001 && Math.abs(S.kv) < 0.01 && Math.abs(S.ds - dT) < 0.001 && Math.abs(S.dsv) < 0.01 &&
      S.va === S.vis && S.ga === S.hot;
    if (!still) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function draw() {
    g.clearRect(0, 0, cv.width, cv.height);
    if (S.va <= 0) return;
    const d = dpr, x = S.x * d, y = S.y * d, r = (DOT / 2) * S.ds * d * KS;
    // 점: 포인트 컬러 #F0A137 (누를 수 있는 곳 위에선 #5AD060)
    const c = [240 + (90 - 240) * S.ga, 161 + (208 - 161) * S.ga, 55 + (96 - 55) * S.ga].map(Math.round);
    g.globalAlpha = S.va;
    g.fillStyle = 'rgba(0,0,0,0.22)'; // 밝은 바탕에서도 보이는 옅은 테두리
    g.beginPath();
    g.arc(x, y, r + 0.8 * d * KS, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    // 프레임: 모서리 네 개를 기기 픽셀에 맞춰 그려 1px 선이 번지지 않게
    const k = S.k * KS, lw = Math.max(1, Math.round(d * KS)), o = lw / 2, leg = Math.round(8 * d * KS);
    const L = Math.round((S.fx - HW * k) * d), R = Math.round((S.fx + HW * k) * d);
    const T = Math.round((S.fy - HH * k) * d), B = Math.round((S.fy + HH * k) * d);
    const path = () => {
      g.beginPath();
      g.moveTo(L + o, T + leg); g.lineTo(L + o, T + o); g.lineTo(L + leg, T + o);
      g.moveTo(R - leg, T + o); g.lineTo(R - o, T + o); g.lineTo(R - o, T + leg);
      g.moveTo(L + o, B - leg); g.lineTo(L + o, B - o); g.lineTo(L + leg, B - o);
      g.moveTo(R - leg, B - o); g.lineTo(R - o, B - o); g.lineTo(R - o, B - leg);
    };
    g.lineCap = 'butt';
    g.lineJoin = 'miter';
    path();
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.lineWidth = lw + 1.4 * d * KS;
    g.stroke();
    path();
    g.strokeStyle = '#F6F5F4';
    g.lineWidth = lw;
    g.stroke();
    g.globalAlpha = 1;
  }
  size();

  return () => {
    controller.abort();
    window.clearTimeout(leaveTimer);
    cancelAnimationFrame(raf);
    document.documentElement.classList.remove('kc-on');
  };
}
