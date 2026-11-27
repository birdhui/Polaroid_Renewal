/**
 * Landing 화면 UI 엔진 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)의 화면 스크립트를 그대로 옮긴 이식본 (3차: 아티팩트 최신본 전체).
 * - 시작 로딩 화면(뷰파인더 프레임), 히어로 책상 배경, 글꼴 준비, 히어로 타이포 등장·퇴장, 사진 뒤 문구,
 *   역사 연도·도면, NOW·컬러 타이포, ZERO MINUTES, 부품 목록, Make a Moment Last · 필름 사진, NOW 섬광,
 *   사용자 경험 설계(SHOT), Your Style 사진, 타임라인 갤러리, 사운드, 왼쪽 목차 링을 담당한다.
 * - 커서는 공통 SiteCursor(@/shared/components/SiteCursor)를 쓴다. SHOT 뷰파인더 안에서만 숨기는 처리는 맨 아래에 있다.
 * - 3D 장면(@/features/landing-camera/engine)과는 window.__* 값으로 주고받는다 (프로토타입 구조 유지).
 *   계약(cameraContract.js) 기반으로 나누는 작업은 다음 단계에서 한다.
 *
 * @param {AbortSignal} signal 페이지를 떠날 때 abort → 이벤트·루프 정리
 */
export const LANDING_UI_GLOBALS = ['__LITE', '__LOADER', '__SHOT', '__afterReady', '__colorIn', '__desk', '__deskOp', '__dvfx', '__fTop', '__film', '__fin', '__fl', '__fontsOk', '__fontsReady', '__gal', '__heroExit', '__hist', '__introDone', '__introDone2', '__ldBlur', '__loaderHold', '__parts', '__rolls', '__rollsV', '__setSection', '__shIn', '__shot', '__storyIn', '__tb', '__tick', '__whenReady', '__ysf', '__zx'];

export function mountLandingUi(signal) {
  // ── 프로토타입(아티팩트) 코드를 그대로 옮기기 위한 범위 한정 ──
  // 창(window)·문서(document)에 다는 이벤트는 페이지를 떠날 때 signal 로 한 번에 해제되고, 애니메이션 루프·타이머도 함께 멈춘다.
  const withSignal = (o) => (o && typeof o === 'object' ? { ...o, signal } : { capture: !!o, signal });
  const addEventListener = (type, fn, o) => window.addEventListener(type, fn, withSignal(o));
  const requestAnimationFrame = (fn) => (signal.aborted ? 0 : window.requestAnimationFrame((t) => { if (!signal.aborted) fn(t); }));
  const setTimeout = (fn, ms) => { const id = window.setTimeout(() => { if (!signal.aborted) fn(); }, ms); signal.addEventListener('abort', () => window.clearTimeout(id)); return id; };

  /* 휴대폰·태블릿(터치 기기, 작은 화면): DOM 에 CSS filter:blur 를 쓰지 않음.
     아이폰 13 에서 블러가 걸린 층(문장 줄, 부품 진행줄) 자리에 자홍색 선이 그려졌음 — 3D 캔버스 여러 장 위에서 필터용 그래픽 메모리를 못 잡으면 사파리가 그 층을 깨진 채로 그림.
     그래서 이런 기기에서는 흐림 대신 투명도만으로 나타나고 사라지게 함 (글자 흐림은 text-shadow 방식인 __tb 로 그대로 유지) */
  (() => { const lite = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600 || /[?&]lite=1/.test(location.search);
    window.__LITE = lite; if (lite) document.documentElement.classList.add('lite');
    window.__fl = lite ? (v) => (v ? String(v).replace(/blur\([^)]*\)\s*/g, '').trim() : v) : (v) => v; })();

  window.__whenReady = new Promise((res) => { const chk = () => (document.documentElement.dataset.model === 'ready' ? res() : setTimeout(chk, 80)); chk(); setTimeout(res, 12000); })
    .then(() => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 500 }) : setTimeout(r, 200))));
  window.__afterReady = (fn) => window.__whenReady.then(fn);

  /* 쓰는 글꼴·굵기를 처음부터 전부 불러 둠 (아직 안 나온 장면의 글꼴까지) → 다 준비되면 히어로 글자 등장. 네트워크가 막히면 4초 뒤 그냥 진행 */
  window.__fontsOk = !document.fonts;
  window.__fontsReady = !document.fonts ? Promise.resolve() : Promise.race([
    Promise.all(['200','300','400','500','600','700','800'].map(w => document.fonts.load(w + ' 16px Outfit', 'Aa09')).concat(
      ['300','400','500'].map(w => document.fonts.load(w + ' 16px "Noto Sans KR"', '우리는')))).catch(() => {}),
    new Promise(r => setTimeout(r, 4000))
  ]).then(() => { window.__fontsOk = true; });

  /* 글자 블러: CSS filter 대신 text-shadow 로 — iOS 사파리에서 글자에 filter:blur 를 걸면 가장자리에 검은 테두리가 생김 (Kinoria 처럼 깨끗하게) */
  window.__tb = (el, px, extra) => { const s = el.style; s.filter = '';
    if (!(px > 0.05)) { s.color = ''; s.textShadow = extra || ''; return; }
    // 블러 중에도 원래 글자색 유지 (예: 주황 라벨이 흰색으로 보였다가 주황으로 바뀌지 않게)
    if (!el._tbc) { const was = s.color; s.color = ''; const m = getComputedStyle(el).color.match(/[\d.]+/g) || [255, 255, 255, 1]; s.color = was; el._tbc = [m[0], m[1], m[2], m[3] === undefined ? 1 : +m[3]]; }
    const [r, g, b, a] = el._tbc, k = Math.min(1, px / 5);
    s.color = `rgba(${r},${g},${b},${(a * (1 - 0.92 * k)).toFixed(3)})`;
    s.textShadow = `0 0 ${px.toFixed(2)}px rgba(${r},${g},${b},${(a * (0.45 + 0.55 * k)).toFixed(3)})` + (extra ? ', ' + extra : ''); };

  // [임시] 인트로(로딩 → 영상 → 뷰파인더 빠져나오기) 숨김 — 히어로부터 개발. 되살리려면 SKIP_INTRO = false
  window.__LOADER = !/[?&]noload=1/.test(location.search) && window.__S == null;   // 시작 로딩 화면(프레임만) 사용. 테스트용 고정 장면(__S)·?noload=1 에서는 끔
  // 숨김일 때는 인트로 코드를 아예 실행하지 않음 → 인트로용 WebGL 캔버스·셰이더·레이어 이미지·영상을 만들거나 받지 않음
  const SKIP_INTRO = true;
  // 새로고침 시 브라우저가 이전 스크롤 위치를 복원하면 히어로가 '스크롤됨' 상태로 시작해 텍스트가 안 보임 → 항상 맨 위에서 시작
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  if (SKIP_INTRO) {
    document.documentElement.dataset.skipIntro = '';
    window.__introDone = true;
    if (!window.__LOADER) setTimeout(() => window.dispatchEvent(new Event('intro:done')), 0);   // 두 엔진(화면 UI · 3D 장면)이 붙은 다음 틱에 시작 신호
  } else (function intro() {
    const vEl = document.getElementById('video');
    vEl.src = '/assets/landing/hero.mp4'; vEl.poster = '/assets/landing/hero-poster.jpg'; vEl.preload = 'auto'; vEl.play().catch(() => {});
  /* =====================================================================
     Viewfinder intro — KINORIA 방식
     · 사진(영상)은 화면에 고정. 크기가 변하지 않는다 → 로딩 중엔 초점만 맞춰짐
     · 뷰파인더(베젤)는 깊이가 다른 3겹(rim · pillars · wall). 카메라가 앞으로 dolly 하면
       가까운 겹일수록 빨리 커지며 화면 밖으로 지나간다 (패럴랙스)
     · 타임라인: load(초점 헌팅) → settle 0.18s → pull 1.05s(랙 포커스, 16% 오버슈트)
                → open 0.72s(구멍이 열리고 dolly 가속, 블룸·렌즈 볼록 해제)
     ===================================================================== */
  const CFG = {
    minHold: 1.15, settle: 0.18, pull: 1.05, overlap: 0.82, open: 1.5,
    blur: 0.042,        // 초점이 완전히 나갔을 때 블러 반경 (화면 너비 대비)
    blurEdge: 0.5,      // 가장자리일수록 더 흐림
    chroma: 0.006,      // 색수차
    bulge: 0.12,        // 아이피스 볼록 (중심 확대)
    dollyEnd: 0.97,     // rim 까지의 거리 = 1
    depth: [2.7, 1.65, 1.0], // wall, pillars, rim
  };
  const BEZEL = { w: 1920, h: 1081, cx: 959, cy: 547.5, hx: 407, hy: 380.5 };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };

  /* ---------------- GL */
  const canvas = document.getElementById('gl');
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true });

  const VS = `#version 300 es
  in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;
  const FS = `#version 300 es
  precision highp float;
  uniform vec2 uRes; uniform float uDpr;
  uniform sampler2D uVid; uniform vec4 uPicBox;       // 영상이 놓이는 화면 상자 (css px)
  uniform sampler2D uL0, uL1, uL2; uniform vec3 uScale; // wall, pillars, rim
  uniform vec4 uFrame; uniform vec2 uWin; uniform vec2 uWinHalf;
  uniform float uFocus, uBlurPx, uBlurEdge, uChroma, uBulge, uGlow, uBarrelLod, uBarrelA, uVidLodMax;
  out vec4 o;
  const int TAPS = 24;
  const float GA = 2.39996323;

  vec2 picUV(vec2 px){ return (px - uPicBox.xy) / uPicBox.zw; }

  void main(){
    vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y) / uDpr;

    // 아이피스 볼록: 창 중심이 부풀고 가장자리가 당겨짐 (4제곱 가중)
    vec2 q = (px - uWin) / uWinHalf;
    float r2 = dot(q,q);
    float w4 = 1.0 - min(r2, 1.0); w4 *= w4;
    vec2 spx = uWin + (px - uWin) * (1.0 - uBulge * w4);

    // 원판 블러 (골든 앵글 나선 24탭) — 가장자리일수록 더 흐림
    vec2 c = (px - uRes*0.5) / (0.5*uRes.y);
    float er2 = dot(c,c) * 0.5;
    float rad = uBlurPx * abs(1.0 - uFocus) * (1.0 + uBlurEdge * er2);
    float lod = clamp(log2(max(2.0 * rad / sqrt(float(TAPS)) * (uPicBox.z > 0. ? 1920.0/uPicBox.z : 1.0), 1.0)), 0.0, uVidLodMax);
    // 색수차는 아주 약하게, 그리고 R·G·B 를 같은 원판 블러로 처리 → 채널마다 번짐이 같아서 색이 틀어지지 않음
    vec2 ca = (px - uRes*0.5) * uChroma * 0.25;
    vec3 col = vec3(0.0);
    for (int i = 0; i < TAPS; i++) {
      float fi = float(i);
      float rr = sqrt((fi + 0.5) / float(TAPS)) * rad;
      float th = fi * GA;
      vec2 s = spx + rr*vec2(cos(th), sin(th));
      col.r += textureLod(uVid, picUV(s + ca), lod).r;
      col.g += textureLod(uVid, picUV(s), lod).g;
      col.b += textureLod(uVid, picUV(s - ca), lod).b;
    }
    col /= float(TAPS);

    // 블룸: 밝은 부분만, 원래 색 그대로 살짝 (전체에 색을 얹지 않음)
    vec3 gsrc = textureLod(uVid, picUV(spx), min(lod + 3.0, uVidLodMax)).rgb;
    float lum = dot(gsrc, vec3(0.2126, 0.7152, 0.0722));
    col += gsrc * max(lum - 0.6, 0.0) * 0.8 * uGlow;

    // 뷰파인더 3겹 — 창 중심을 기준으로 각자의 깊이만큼 커짐
    vec2 pf;
    vec4 t;
    pf = ((px - uWin) / uScale.x + uWin - uFrame.xy) / uFrame.zw;
    if (all(greaterThan(pf, vec2(0.0))) && all(lessThan(pf, vec2(1.0)))) { t = textureLod(uL0, pf, uBarrelLod); col = mix(col, t.rgb, t.a * uBarrelA); }
    pf = ((px - uWin) / uScale.y + uWin - uFrame.xy) / uFrame.zw;
    if (all(greaterThan(pf, vec2(0.0))) && all(lessThan(pf, vec2(1.0)))) { t = textureLod(uL1, pf, uBarrelLod); col = mix(col, t.rgb, t.a * uBarrelA); }
    pf = ((px - uWin) / uScale.z + uWin - uFrame.xy) / uFrame.zw;
    if (all(greaterThan(pf, vec2(0.0))) && all(lessThan(pf, vec2(1.0)))) { t = textureLod(uL2, pf, uBarrelLod); col = mix(col, t.rgb, t.a * uBarrelA); }

    o = vec4(col, 1.0);
  }`;

  function compile(type, src){ const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, 'aPos'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {}; for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name] = gl.getUniformLocation(prog, u.name); }
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  function makeTex(){ const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
    return t; }
  function upload(tex, src){ try { gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D); } catch (e) {} }

  const texVid = makeTex();
  const texL = [makeTex(), makeTex(), makeTex()];

  /* ---------------- assets + real loading progress */
  const parts = { layers: 0, video: 0, fonts: 0 };
  const W8 = { layers: 0.3, video: 0.55, fonts: 0.15 };
  const target = () => Object.keys(parts).reduce((s, k) => s + parts[k] * W8[k], 0);
  const setPart = (k, v) => { parts[k] = Math.max(parts[k], clamp(v)); };

  let layersReady = 0;
  ['wall', 'pillars', 'rim'].forEach((n, i) => {
    const img = new Image(); img.src = `/assets/landing/layer-${n}.webp`;
    img.decode().then(() => { upload(texL[i], img); layersReady++; setPart('layers', layersReady / 3);
      if (layersReady === 3) document.body.classList.add('ready'); }).catch(() => { layersReady++; });
  });
  const video = document.getElementById('video');
  const poster = new Image(); poster.src = video.getAttribute('poster');
  poster.decode().then(() => { if (!vidFrame) upload(texVid, poster); }).catch(() => {});
  let vidFrame = false, lastVT = -1;
  video.addEventListener('canplaythrough', () => setPart('video', 1), { once: true });
  video.addEventListener('progress', () => { try { const b = video.buffered; if (b.length && video.duration) setPart('video', b.end(b.length-1) / video.duration); } catch(e){} });
  video.addEventListener('error', () => setPart('video', 1));
  setTimeout(() => setPart('video', 1), 9000);
  video.play().catch(() => {});
  window.__fontsReady.then(() => setPart('fonts', 1));

  /* ---------------- HUD */
  const scaleEl = document.getElementById('scale');
  scaleEl.innerHTML = '<i></i>'.repeat(13);
  const ticks = [...scaleEl.children];
  const pctEl = document.getElementById('pct'), stateEl = document.getElementById('state');
  const hud = document.querySelector('.hud');

  /* ---------------- timeline (KINORIA 구조) */
  let phase, clock, phaseT, shown, focus, focus0, fk, marks, open, exit, glow;
  function reset(){
    phase = 'load'; clock = 0; phaseT = 0; shown = 0; focus = 0.1; focus0 = 0.1; fk = 0;
    marks = 1; open = 0; exit = 0; glow = 1; stateEl.textContent = 'LOADING...';
  }
  reset();
  const hunt = (t, n) => (Math.sin(t * 1.7) * 0.055 + Math.sin(t * 0.63 + 1.1) * 0.085) * (1 - n * 0.55);
  const rack = (h) => (focus0 + (1 - focus0) * ss(h)) * (1 + Math.sin(h * Math.PI) * 0.16);

  function step(dt){
    clock += dt; phaseT += dt;
    shown += (target() - shown) * Math.min(1, dt * 4.5);
    if (phase === 'load') {
      focus = clamp(0.1 + shown * 0.26 + hunt(clock, shown));
      if (shown > 0.995 && clock > CFG.minHold) { phase = 'settle'; phaseT = 0; }
    } else if (phase === 'settle') {
      if (phaseT >= CFG.settle) { phase = 'pull'; phaseT = 0; focus0 = focus; stateEl.textContent = 'FOCUSED'; }
    } else if (phase === 'pull' || phase === 'open') {
      fk = clamp(fk + dt / CFG.pull);
      focus = rack(fk); marks = 1 - ss(fk);
      if (phase === 'pull' && fk >= CFG.overlap) { phase = 'open'; phaseT = 0; }
      if (phase === 'open') {
        const h = clamp(phaseT / CFG.open);
        open = ss(h / 0.78);
        // 부드러운 가감속(천천히 출발 → 가속 → 영상 100% 에서 부드럽게 정지)
        exit = CFG.dollyEnd * (h < 0.5 ? 4 * h * h * h : 1 - Math.pow(-2 * h + 2, 3) / 2);
        if (h >= 1) phase = 'done';
      }
    }
    const p = phase === 'open' || phase === 'done' ? ss(clamp((phase === 'done' ? 1 : phaseT / CFG.open) / 0.72)) : 0;
    glow = (0.18 + 0.82 * Math.pow(clamp(1 - focus), 0.8)) * (1 - p);
    if (phase === 'done') { focus = 1; marks = 0; open = 1; exit = CFG.dollyEnd; glow = 0; if (!window.__introDone) { window.__introDone = true; window.dispatchEvent(new Event('intro:done')); } }
  }

  /* ---------------- frame */
  let last = performance.now();
  function frame(now){
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);

    // video texture
    if (video.readyState >= 2 && video.currentTime !== lastVT) { upload(texVid, video); vidFrame = true; lastVT = video.currentTime; }

    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const vw = innerWidth, vh = innerHeight;
    const cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }

    // 베젤 프레임: 가로 화면은 화면을 덮고, 세로 화면은 창이 너비의 94%
    const fw = vw / vh < 1 ? vw * (BEZEL.w / 814) * 0.94 : Math.max(vw, vh * BEZEL.w / BEZEL.h);
    const fh = fw * BEZEL.h / BEZEL.w, k = fw / BEZEL.w;
    const fx = (vw - fw) / 2, fy = (vh - fh) / 2;
    const winX = fx + BEZEL.cx * k, winY = fy + BEZEL.cy * k;

    // 영상은 항상 화면을 덮는 크기 그대로 (확대하지 않음)
    const va = 1920 / 1080;
    const pw = Math.max(vw, vh * va), ph = pw / va;

    // dolly: 깊이 z 인 겹은 z / (z - d) 배로 커짐
    const sc = CFG.depth.map((z) => z / Math.max(z - exit, 0.02));

    // 로딩이 끝나면 이 캔버스는 '유리(영상)' 레이어가 되어 다음 장면 스크립트가 그린다
    if (phase === 'done' && window.__exitRender) {
      window.__exitRender({ gl, texVid, dpr, vw, vh, cw, ch });
      hud.style.setProperty('--marks', '0');
      requestAnimationFrame(frame);
      return;
    }
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(prog);
    gl.uniform2f(U.uRes, vw, vh); gl.uniform1f(U.uDpr, dpr);
    gl.uniform4f(U.uPicBox, (vw - pw) / 2, (vh - ph) / 2, pw, ph);
    gl.uniform4f(U.uFrame, fx, fy, fw, fh);
    gl.uniform2f(U.uWin, winX, winY);
    gl.uniform2f(U.uWinHalf, BEZEL.hx * k, BEZEL.hy * k);
    gl.uniform3f(U.uScale, sc[0], sc[1], sc[2]);
    gl.uniform1f(U.uFocus, focus);
    gl.uniform1f(U.uBlurPx, CFG.blur * vw);
    gl.uniform1f(U.uBlurEdge, CFG.blurEdge);
    gl.uniform1f(U.uChroma, CFG.chroma);
    gl.uniform1f(U.uBulge, CFG.bulge * (1 - open));
    gl.uniform1f(U.uGlow, glow);
    gl.uniform1f(U.uBarrelLod, 0.6 + 2.2 * clamp(1 - focus) + 2.5 * open);
    gl.uniform1f(U.uBarrelA, 1 - ss((exit / CFG.dollyEnd - 0.75) / 0.25));
    gl.uniform1f(U.uVidLodMax, 7.0);
    const bind = (unit, tex, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U[name], unit); };
    bind(0, texVid, 'uVid'); bind(1, texL[0], 'uL0'); bind(2, texL[1], 'uL1'); bind(3, texL[2], 'uL2');
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // HUD
    pctEl.textContent = `${Math.round(shown * 100)}%`;
    const needle = shown * (ticks.length - 1);
    ticks.forEach((t, i) => t.classList.toggle('on', Math.abs(i - needle) < 1.6));
    hud.style.setProperty('--marks', marks.toFixed(3));
    hud.style.setProperty('--hud-blur', `${(CFG.blur * vw * clamp(Math.abs(1 - focus)) * 0.2 * 0.35).toFixed(2)}px`);
    hud.style.setProperty('--focus-s', (1.28 - 0.28 * clamp(focus)).toFixed(3));

    requestAnimationFrame(frame);
  }

    requestAnimationFrame(frame);
  })();

  /* =====================================================================
     시작 로딩 화면 — 뷰파인더 프레임만 (영상 없음). Kinoria 로딩 화면과 같은 구성·순서
     화면: 흐릿한 뷰파인더 안쪽(3겹: wall · pillars · rim) + 또렷한 HUD(모서리 4개 · 브랜드명 · 초점 괄호 · 눈금 · f 11 / 진행률 / AUTO — Now 의 실제 조리개 범위 f/11–f/64 와 자동 노출)
     순서: load(초점이 살짝 오락가락, 진행률 = 실제 로딩) → settle 0.18초 → pull 1.05초(초점이 맞으며 HUD 가 사라지고 창 너머 히어로가 드러남)
          → open 1.5초(프레임을 통과해 앞으로 나아감: 가까운 겹일수록 빨리 커지며 화면 밖으로) → 히어로
     진행률은 실제 값: 프레임 이미지 3장 25% · 글꼴 15% · 3D 카메라 모델 60%
     ===================================================================== */
  (function loader() {
    const root = document.documentElement, canvas = document.getElementById('gl'), hud = document.querySelector('.hud');
    const go = () => { if (window.__introDone2) return; window.__introDone2 = true; const f = () => window.dispatchEvent(new Event('intro:done')); setTimeout(f, 0); };   // 3D 장면 엔진이 붙은 다음 틱에 시작 신호
    if (!window.__LOADER) return;
    let gl = null; try { gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true }); } catch (e) {}
    if (!gl || !hud) { window.__LOADER = false; go(); return; }      // WebGL2 를 못 쓰면 로딩 화면 없이 바로 히어로
    root.dataset.loader = 'hold'; window.__loaderHold = true; window.__ldBlur = 1.4;
    go();   // 히어로는 처음부터 프레임 뒤에서 그려짐 — 로딩 중엔 흐릿하게 비치다가 마지막에 초점이 맞음 (Kinoria 와 같은 흐름)
    const CFG = { minHold: 1.15, settle: 0.18, pull: 1.05, overlap: 0.82, open: 1.5, dollyEnd: 0.97, depth: [2.7, 1.65, 1.0] };
    const BEZEL = { w: 1920, h: 1081, cx: 959, cy: 547.5 };
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
    const VS = `#version 300 es
  in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;
    const FS = `#version 300 es
  precision highp float;
  uniform vec2 uRes; uniform float uDpr;
  uniform sampler2D uL0, uL1, uL2; uniform vec3 uScale;   // wall, pillars, rim
  uniform vec4 uFrame; uniform vec2 uWin; uniform float uLod, uA, uDim, uT, uGl;
  out vec4 o;
  // 프레임 금속에 맺혀 일렁이는 빛 (Kinoria 로딩 화면: 창 양옆 기둥과 위쪽 띠에서 따뜻한 빛이 번쩍이며 숨쉼)
  float glint(vec2 p, vec2 c, vec2 r){ vec2 d = (p - c) / r; return exp(-dot(d, d)); }
  float flick(float t, float f, float ph){ float a = 0.5 + 0.5 * sin(t * f + ph), b = 0.5 + 0.5 * sin(t * f * 2.37 + ph * 1.7), fl = pow(max(0.0, sin(t * f * 0.43 + ph * 2.3)), 10.0); return 0.28 + 0.42 * a * b + 0.9 * fl; }
  void lay(sampler2D s, float k, vec2 px, inout vec4 acc){
    vec2 pf = ((px - uWin) / k + uWin - uFrame.xy) / uFrame.zw;
    if (all(greaterThan(pf, vec2(0.0))) && all(lessThan(pf, vec2(1.0)))) { vec4 t = textureLod(s, pf, uLod); float a = t.a * uA; acc.rgb = acc.rgb * (1.0 - a) + t.rgb * a; acc.a = acc.a * (1.0 - a) + a; }
  }
  void main(){
    vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y) / uDpr;
    vec4 acc = vec4(0.0, 0.0, 0.0, uDim);                   // 창 너머: 로딩 중엔 검게 가려 두었다가 초점이 맞을 때 걷힘
    lay(uL0, uScale.x, px, acc); lay(uL1, uScale.y, px, acc); lay(uL2, uScale.z, px, acc);
    if (uGl > 0.002) {
      // 빛의 위치는 가운데 겹(기둥)의 그림 좌표 기준 → 프레임이 커지며 지나갈 때 빛도 같이 움직임
      vec2 pm = ((px - uWin) / uScale.y + uWin - uFrame.xy) / uFrame.zw;
      float wob = 0.012 * sin(uT * 0.7), bz = clamp((acc.a - uDim) / max(0.001, 1.0 - uDim), 0.0, 1.0);   // bz: 프레임이 있는 곳
      float g = 0.0;
      g += glint(pm, vec2(0.262 + wob, 0.40), vec2(0.020, 0.105)) * flick(uT, 1.9, 0.3) * 1.25;        // 왼쪽 기둥 위
      g += glint(pm, vec2(0.236 - wob, 0.60), vec2(0.016, 0.070)) * flick(uT, 2.6, 2.1) * 0.75;        // 왼쪽 기둥 아래
      g += glint(pm, vec2(0.742 - wob, 0.42), vec2(0.020, 0.115)) * flick(uT, 2.2, 4.0) * 1.35;        // 오른쪽 기둥 위
      g += glint(pm, vec2(0.760 + wob, 0.66), vec2(0.015, 0.075)) * flick(uT, 3.1, 1.2) * 0.7;         // 오른쪽 기둥 아래
      g += glint(pm, vec2(0.50 + 0.05 * sin(uT * 0.31), 0.205), vec2(0.20, 0.022)) * flick(uT, 1.3, 5.2) * 0.42;   // 위쪽 띠
      g += glint(pm, vec2(0.50 - 0.04 * sin(uT * 0.27), 0.815), vec2(0.17, 0.018)) * flick(uT, 1.6, 0.9) * 0.2;    // 아래쪽 띠
      float halo = glint(pm, vec2(0.25, 0.48), vec2(0.10, 0.26)) * flick(uT, 0.9, 3.3) + glint(pm, vec2(0.75, 0.50), vec2(0.10, 0.27)) * flick(uT, 1.1, 0.6);   // 기둥 둘레의 넓고 옅은 번짐
      float sweep = exp(-pow((pm.x - (0.5 + 0.62 * sin(uT * 0.33))) / 0.07, 2.0));                        // 프레임 위를 천천히 훑는 빛
      float lum = dot(acc.rgb, vec3(0.3, 0.55, 0.15));
      vec3 warm = vec3(1.0, 0.80, 0.46), hot = vec3(1.0, 0.96, 0.84);
      vec3 L = (mix(warm, hot, clamp(g * 0.75, 0.0, 1.0)) * g * (0.35 + 0.65 * bz) + warm * halo * 0.10 * (0.4 + 0.6 * bz) + warm * sweep * lum * 2.2 * bz) * uGl;
      acc.rgb += L; acc.a = clamp(acc.a + max(L.r, max(L.g, L.b)) * 0.7, 0.0, 1.0);
    }
    // 프레임 그림 바깥(세로로 긴 화면의 위아래)은 프레임의 연장으로 보고 검게 채움 → 그림이 끝나는 자리에 네모난 경계가 보이지 않게
    vec2 pr = ((px - uWin) / uScale.z + uWin - uFrame.xy) / uFrame.zw;
    vec2 dq = max(-pr, pr - 1.0); float outK = smoothstep(-0.012, 0.0, max(dq.x, dq.y)) * uA;
    acc = vec4(acc.rgb * (1.0 - outK), acc.a * (1.0 - outK) + outK);
    o = acc;
  }`;
    let prog, U = {}, texL;
    try {
      const comp = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
      prog = gl.createProgram(); gl.attachShader(prog, comp(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, comp(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(prog, 0, 'aPos'); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      for (let i = 0, n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS); i < n; i++) { const u = gl.getActiveUniform(prog, i); U[u.name] = gl.getUniformLocation(prog, u.name); }
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const mk = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0])); return t; };
      texL = [mk(), mk(), mk()];
    } catch (e) { console.error('[loader]', e); delete root.dataset.loader; window.__loaderHold = false; window.__LOADER = false; go(); return; }
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ZERO);
    const up = (tex, src) => { try { gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D); } catch (e) {} };

    // 실제 로딩 진행률
    const parts = { layers: 0, fonts: 0, model: 0 }, W8 = { layers: 0.25, fonts: 0.15, model: 0.6 };
    const target = () => Object.keys(parts).reduce((s, k) => s + parts[k] * W8[k], 0), setPart = (k, v) => { parts[k] = Math.max(parts[k], clamp(v)); };
    let nL = 0;
    ['wall', 'pillars', 'rim'].forEach((n, i) => { const img = new Image(); img.src = `/assets/landing/layer-${n}.webp`;
      const ok = () => { nL++; setPart('layers', nL / 3); if (nL === 3) document.body.classList.add('ready'); };
      img.decode().then(() => { up(texL[i], img); ok(); }).catch(ok); });
    (window.__fontsReady || Promise.resolve()).then(() => setPart('fonts', 1));
    const modelCheck = () => { const m = root.dataset.model; if (m === 'ready' || m === 'error') setPart('model', 1); };
    { const mo = new MutationObserver(modelCheck); mo.observe(root, { attributes: true, attributeFilter: ['data-model'] }); signal.addEventListener('abort', () => mo.disconnect()); } modelCheck();
    let creep = 0, readyAt = 0;                                           // 모델은 받는 중간 값을 알 수 없어, 기다리는 동안 눈금이 아주 천천히 차오르게 (최대 85%)
    setTimeout(() => { setPart('layers', 1); setPart('fonts', 1); setPart('model', 1); }, 15000);   // 무엇이든 15초 넘게 걸리면 그대로 진행

    // HUD — 캔버스에 직접 그림 (Kinoria 도 HUD 를 화면에 직접 그림). 초점이 나간 모습을 CSS 필터 없이 표현:
    //   같은 HUD 를 작은 원판 모양으로 20번 조금씩 어긋나게 겹쳐 그리면(빛 더하기) 렌즈의 초점 흐림처럼 번짐
    //   처음엔 글자·모서리가 크게 번지고 초점이 오락가락(숨쉬듯 커졌다 작아지고 살짝 떠다님) → 로딩이 진행될수록 서서히 또렷해짐
    // 치수는 Kinoria 캡처 실측값 (모서리 사각형 기준 %) — 위 CSS 의 .hud 주석과 같은 값
    hud.style.visibility = 'hidden';
    const hcv = document.createElement('canvas'); hcv.setAttribute('aria-hidden', 'true');
    hcv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:61;pointer-events:none;display:block';
    document.body.appendChild(hcv); signal.addEventListener('abort', () => hcv.remove());   // 로딩 중에 페이지를 떠나면 표시용 캔버스 제거
    const hx = hcv.getContext('2d'), HC = '238,232,222', HA = '232,85,63', MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace";
    const spaced = (txt, x, y, ls, align) => { const cw = hx.measureText('0').width, adv = cw + ls, w = adv * txt.length - ls; let px = align === 'c' ? x - w / 2 : align === 'r' ? x - w : x; for (const ch of txt) { hx.fillText(ch, px, y); px += adv; } };
    function hudOnce(L, T, rw, rh, pct, needle) {
      const ln = Math.max(1, rw * 0.0042), arm = rw * 0.071;
      hx.strokeStyle = `rgba(${HC},0.7)`; hx.fillStyle = `rgba(${HC},0.7)`; hx.lineWidth = ln; hx.lineCap = 'butt'; hx.textBaseline = 'middle'; hx.textAlign = 'left';
      hx.beginPath();                                                   // 모서리 4개
      hx.moveTo(L, T + arm); hx.lineTo(L, T); hx.lineTo(L + arm, T);
      hx.moveTo(L + rw - arm, T); hx.lineTo(L + rw, T); hx.lineTo(L + rw, T + arm);
      hx.moveTo(L, T + rh - arm); hx.lineTo(L, T + rh); hx.lineTo(L + arm, T + rh);
      hx.moveTo(L + rw - arm, T + rh); hx.lineTo(L + rw, T + rh); hx.lineTo(L + rw, T + rh - arm);
      const fw = rw * 0.176, fh = rh * 0.365, fx0 = L + rw / 2 - fw / 2, fy0 = T + rh / 2 - fh / 2, fa = fw * 0.13;   // 초점 괄호 [ ]
      hx.moveTo(fx0 + fa, fy0); hx.lineTo(fx0, fy0); hx.lineTo(fx0, fy0 + fh); hx.lineTo(fx0 + fa, fy0 + fh);
      hx.moveTo(fx0 + fw - fa, fy0); hx.lineTo(fx0 + fw, fy0); hx.lineTo(fx0 + fw, fy0 + fh); hx.lineTo(fx0 + fw - fa, fy0 + fh);
      hx.stroke();
      const tw = Math.max(1, rw * 0.005), x0 = L + rw * 0.31, x1 = L + rw * 0.69 - tw, by = T + rh * 0.838;   // 눈금 12칸 (긴·짧·짧), 마지막 2칸은 붉은색
      for (let i = 0; i < 12; i++) { const th = rh * (i % 3 === 0 ? 0.066 : 0.0403), a = i <= needle + 0.02 ? 1 : 0.32; hx.fillStyle = `rgba(${i >= 10 ? HA : HC},${(i >= 10 ? a : a * 0.7 + 0.0).toFixed(3)})`; hx.fillRect(x0 + (x1 - x0) * i / 11, by - th, tw, th); }
      hx.fillStyle = `rgba(${HC},0.7)`;
      hx.font = `400 ${(rw * 0.029).toFixed(2)}px ${MONO}`; { const pm = hx.measureText('P'), bear = -(pm.actualBoundingBoxLeft || 0); spaced('POLAROID', L - ln / 2 - bear, T + rh * 0.198, rw * 0.029 * 0.45, 'l'); }   // 첫 글자 P 의 획 왼쪽 끝 = 모서리 세로선의 왼쪽 끝 (글자 자체의 왼쪽 여백만큼 당김)
      hx.font = `400 ${(rw * 0.0347).toFixed(2)}px ${MONO}`; const ry = T + rh * 0.912;
      spaced('f 11', L + rw * 0.23, ry, rw * 0.0347 * 0.02, 'l'); spaced('AUTO', L + rw * 0.774, ry, rw * 0.0347 * 0.02, 'r');
      hx.font = `700 ${(rw * 0.0347).toFixed(2)}px ${MONO}`; hx.fillStyle = `rgba(${HA},1)`; spaced(pct, L + rw * 0.502, ry, rw * 0.0347 * 0.06, 'c');
    }
    // 채워진 눈금과 진행률 숫자 둘레의 은은한 빛(윤곽 번짐) — kinoria: 불이 들어온 눈금·숫자가 살짝 빛을 냄
    //   같은 도형을 둘레로 조금씩 옮겨 아주 옅게 여러 번 겹쳐 그려(좁은 고리 + 넓은 고리) 번진 빛을 만듦. 그림자 번짐 기능은 쓰지 않음(무거워서 화면이 멈췄음)
    function hudGlow(L, T, rw, rh, pct, needle, k) {
      const tw = Math.max(1, rw * 0.005), x0 = L + rw * 0.31, x1 = L + rw * 0.69 - tw, by = T + rh * 0.838, ry = T + rh * 0.912;
      hx.textBaseline = 'middle'; hx.textAlign = 'left'; hx.font = `700 ${(rw * 0.0347).toFixed(2)}px ${MONO}`;
      for (const [rad, al, n] of [[rw * 0.0065, 0.085, 8], [rw * 0.016, 0.04, 10]]) {
        for (let j = 0; j < n; j++) {
          const ox = Math.cos(j / n * 6.2832) * rad, oy = Math.sin(j / n * 6.2832) * rad;
          for (let i = 0; i < 12; i++) { if (i > needle + 0.02) continue; const th = rh * (i % 3 === 0 ? 0.066 : 0.0403); hx.fillStyle = `rgba(${i >= 10 ? HA : HC},${(al * k * (i >= 10 ? 1 : 0.7)).toFixed(4)})`; hx.fillRect(x0 + (x1 - x0) * i / 11 + ox, by - th + oy, tw, th); }
          hx.fillStyle = `rgba(${HA},${(al * k).toFixed(4)})`; spaced(pct, L + rw * 0.502 + ox, ry + oy, rw * 0.0347 * 0.06, 'c');
        }
      }
    }
    function drawHud(alpha, defocus, t) {
      const vw = innerWidth, vh = innerHeight, d = Math.min(2, devicePixelRatio || 1), cw = Math.round(vw * d), chh = Math.round(vh * d);
      if (hcv.width !== cw || hcv.height !== chh) { hcv.width = cw; hcv.height = chh; }
      hx.setTransform(d, 0, 0, d, 0, 0); hx.clearRect(0, 0, vw, vh); if (alpha <= 0.004) return;
      const rw = Math.min(vw * 0.797, vh * 0.514), rh = rw * 592 / 961, cx = vw / 2, cy = vh * 0.525;
      const R = defocus * rw * 0.034, N = R < 0.5 ? 1 : 20;                               // 번짐 반경 (가장 흐릴 때 사각형 폭의 3.4%)
      const s = 1 + 0.03 * defocus, dx = Math.sin(t * 1.3) * rw * 0.004 * defocus, dy = Math.cos(t * 0.9 + 0.7) * rw * 0.003 * defocus;   // 초점이 나간 만큼 살짝 커지고 떠다님
      const pct = `${Math.round(shown * 100)}%`, needle = shown * 11;
      hx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N; i++) {
        const rr = N === 1 ? 0 : R * Math.sqrt((i + 0.5) / N), th = i * 2.39996323;
        hx.setTransform(d * s, 0, 0, d * s, d * (cx * (1 - s) + dx + rr * Math.cos(th)), d * (cy * (1 - s) + dy + rr * Math.sin(th)));
        hx.globalAlpha = alpha / N;
        hudOnce(cx - rw / 2, cy - rh / 2, rw, rh, pct, needle);
      }
      hx.setTransform(d * s, 0, 0, d * s, d * (cx * (1 - s) + dx), d * (cy * (1 - s) + dy)); hx.globalAlpha = 1;
      hudGlow(cx - rw / 2, cy - rh / 2, rw, rh, pct, needle, alpha);
      hx.globalAlpha = 1; hx.globalCompositeOperation = 'source-over';
    }
    let phase = 'load', clock = 0, phaseT = 0, shown = 0, focus = 0.1, focus0 = 0.1, fk = 0, marks = 1, open = 0, exit = 0, last = performance.now(), dead = false;
    const hunt = (t, n) => (Math.sin(t * 1.7) * 0.055 + Math.sin(t * 0.63 + 1.1) * 0.085) * (1 - n * 0.55);
    const rack = (h) => (focus0 + (1 - focus0) * ss(h)) * (1 + Math.sin(h * Math.PI) * 0.16);
    function step(dt) {
      clock += dt; phaseT += dt;
      if (parts.model < 1) creep = Math.min(0.42, creep + dt * 0.035);
      const tg = Math.min(1, target() + (parts.model < 1 ? creep : 0));
      shown += (tg - shown) * Math.min(1, dt * 4.5);
      if (phase === 'load') { focus = clamp(0.1 + shown * 0.26 + hunt(clock, shown)); if (parts.model >= 1 && !readyAt) readyAt = clock;
        if (shown > 0.995 && clock > CFG.minHold && target() >= 1 && clock - readyAt > 1.1) { phase = 'settle'; phaseT = 0; } }   // 카메라가 흐릿하게 보이는 시간을 1.1초는 둠
      else if (phase === 'settle') { if (phaseT >= CFG.settle) { phase = 'pull'; phaseT = 0; focus0 = focus; root.dataset.loader = 'go'; } }   // 초점을 당기기 시작
      else if (phase === 'pull' || phase === 'open') {
        fk = clamp(fk + dt / CFG.pull); focus = rack(fk); marks = 1 - ss(fk);
        if (phase === 'pull' && fk >= CFG.overlap) { phase = 'open'; phaseT = 0; }
        if (phase === 'open') { const hh = clamp(phaseT / CFG.open); open = ss(hh / 0.78); exit = CFG.dollyEnd * (hh < 0.5 ? 4 * hh * hh * hh : 1 - Math.pow(-2 * hh + 2, 3) / 2);
          if (hh > 0.5) window.__loaderHold = false;       // 프레임이 절반쯤 지나가면 히어로 글자가 나타나기 시작
          if (hh >= 1) phase = 'done'; }
      }
    }
    function end() {
      dead = true; window.__loaderHold = false; window.__ldBlur = 0; delete root.dataset.loader; hcv.remove(); hud.style.visibility = '';
      try { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {}   // 로딩 화면용 그래픽 메모리 반납 (휴대폰 대비)
      canvas.width = canvas.height = 1;
    }
    function frame(now) {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt);
      if (phase === 'done') { end(); return; }
      window.__ldBlur = 1.5 * Math.abs(1 - focus);   // 창 너머 카메라의 흐림: 로딩 중엔 초점이 오락가락 → 당길 때 한 번 살짝 지나쳤다가(16%) 또렷하게
      const dpr = Math.min(devicePixelRatio || 1, 1.5), vw = innerWidth, vh = innerHeight, cw = Math.round(vw * dpr), ch = Math.round(vh * dpr);
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
      const fw = vw / vh < 1 ? vw * (BEZEL.w / 814) * 0.94 : Math.max(vw, vh * BEZEL.w / BEZEL.h), fh = fw * BEZEL.h / BEZEL.w, k = fw / BEZEL.w, fx = (vw - fw) / 2, fy = (vh - fh) / 2;
      const sc = CFG.depth.map((z) => z / Math.max(z - exit, 0.02));
      gl.viewport(0, 0, cw, ch); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(prog);
      gl.uniform2f(U.uRes, vw, vh); gl.uniform1f(U.uDpr, dpr); gl.uniform4f(U.uFrame, fx, fy, fw, fh); gl.uniform2f(U.uWin, fx + BEZEL.cx * k, fy + BEZEL.cy * k);
      gl.uniform3f(U.uScale, sc[0], sc[1], sc[2]);
      gl.uniform1f(U.uLod, 0.4 + 4.6 * clamp(1 - focus) + 2.5 * open);                      // 초점이 나가 있을수록 프레임이 흐림
      gl.uniform1f(U.uA, 1 - ss((exit / CFG.dollyEnd - 0.75) / 0.25));
      gl.uniform1f(U.uDim, 0.3 * (1 - ss(fk / 0.7)));
      gl.uniform1f(U.uT, clock); gl.uniform1f(U.uGl, (1 - 0.55 * ss(fk)) * (1 - ss((exit / CFG.dollyEnd - 0.55) / 0.4)));   // 일렁이는 빛: 초점이 맞으면 조금 잦아들고, 프레임을 통과하며 사라짐   // HUD 가 읽히도록 로딩 중에만 살짝 어둡게
      [['uL0', 0], ['uL1', 1], ['uL2', 2]].forEach(([n, i]) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texL[i]); gl.uniform1i(U[n], i); });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // HUD 의 초점: 처음엔 크게 나가 있다가 로딩이 진행될수록 서서히 맞음. 그 위에 초점이 오락가락하는 흔들림이 얹힘(진행될수록 잦아듦)
      const hDef = clamp((1 - ss(Math.min(1, shown * 1.12))) * 0.85 + Math.abs(hunt(clock * 1.6, shown)) * 2.4 * (1 - 0.7 * shown));
      drawHud(marks, hDef, clock);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* 히어로 책상 배경: 보일 때만 켜 두고, 3D 카메라가 책상에 드리우는 그림자를 그리며, 마우스에 따라 사진을 아주 조금 움직여 깊이감을 줌 (scene.js 가 매 프레임 부름) */
  (() => {
    const D = document.querySelector('.desk'); if (!D) return;
    const IMG = D.querySelector('.dk-img'), BL = D.querySelector('.dk-blur'), CAM = D.querySelector('.dk-cam'), FX = [...document.querySelectorAll('.dkfx')], cx = CAM.getContext('2d');
    const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    const Q = 5;                                                             // 그림자는 화면의 1/5 크기로 그려 늘림 → 가장자리가 저절로 부드러워지고 가벼움
    let vis = null, lastOp = '', mx = 0, my = 0, px = 0, py = 0, lastT = 0, lastImg = '', lastBl = '', lastSh = '';
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    const poly = (pts, ox, oy) => { cx.beginPath(); pts.forEach((p, i) => { const x = p[0] / Q + ox, y = p[1] / Q + oy; i ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.closePath(); cx.fill(); cx.stroke(); };   // 굵은 둥근 테두리까지 칠해 모서리를 둥글게
    function shadow(S, k) {
      const W = innerWidth, H = innerHeight, cw = Math.ceil(W / Q), ch = Math.ceil(H / Q);
      const key = S ? S.hull.map((p) => p[0].toFixed(0) + ',' + p[1].toFixed(0)).join(' ') + '|' + k.toFixed(2) + '|' + cw : '';
      if (key === lastSh) return; lastSh = key;
      if (CAM.width !== cw || CAM.height !== ch) { CAM.width = cw; CAM.height = ch; }
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cw, ch); if (!S || k <= 0.01) return;
      // 도형 자체는 화면 밖에 그리고 그 그림자(번진 모양)만 화면에 들어오게 함 — 흐림 필터 없이 부드러운 가장자리를 얻는 방법
      const OFF = cw * 3; cx.fillStyle = cx.strokeStyle = '#000'; cx.lineJoin = 'round'; cx.shadowOffsetX = OFF;
      cx.shadowColor = `rgba(14, 7, 2, ${(0.62 * k).toFixed(3)})`; cx.shadowBlur = Math.max(1.5, W / Q * 0.011); cx.lineWidth = W / Q * 0.022; poly(S.hull, -OFF, 0);     // 드리운 그림자: 가장자리가 조금만 번짐
      cx.shadowColor = `rgba(10, 5, 2, ${(0.5 * k).toFixed(3)})`; cx.shadowBlur = Math.max(0.8, W / Q * 0.004); cx.lineWidth = W / Q * 0.006; poly(S.foot, -OFF, 0);      // 바닥에 닿은 자리: 더 짙고 또렷함
      cx.shadowColor = 'transparent';
    }
    window.__desk = (sc) => {
      const op = 1 - ss((sc - 0.08) / 0.54), on = op > 0.003;               // 스크롤을 시작하면 천천히 옅어지며 뒤의 오로라 배경으로 넘어감 (플래시가 터지는 0.72 전에 다 사라짐)
      window.__deskOp = op;
      if (on !== vis) { vis = on; D.style.visibility = on ? 'visible' : 'hidden'; D.classList.toggle('paused', !on); FX.forEach((f) => { f.style.visibility = on ? 'visible' : 'hidden'; f.classList.toggle('paused', !on); }); }
      if (!on) return;
      const os = op.toFixed(3); if (os !== lastOp) { lastOp = os; D.style.opacity = os; FX.forEach((f) => { f.style.opacity = os; }); }
      const now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      px += (mx - px) * (1 - Math.exp(-dt * 3.5)); py += (my - py) * (1 - Math.exp(-dt * 3.5));
      const ti = `translate3d(${(-px * 14).toFixed(2)}px, ${(-py * 9).toFixed(2)}px, 0)`; if (ti !== lastImg) { lastImg = ti; IMG.style.transform = ti; BL.style.transform = ti; }
      const ld = Math.min(1, (window.__ldBlur || 0)), bl = Math.min(1, ld / 0.9).toFixed(2); if (bl !== lastBl) { lastBl = bl; BL.style.opacity = bl; }   // 시작 로딩 화면이 초점을 맞추는 동안: 흐린 사진 → 또렷한 사진
      { const S = window.__camSh; shadow(S, (1 - 0.7 * ld) * (S && S.k != null ? S.k : 1)); }
    };
  })();

  /* 텍스트를 단어 단위로 나눠 순서대로 초점이 맞춰지게 (레퍼런스: 단어마다 2.5% 간격) */
  (function(){
    let i = 0, ci = 0;
    // 오른쪽 열: 글자 단위 (oryzo)
    document.querySelectorAll('.ui .col [data-r]').forEach((el) => {
      el.removeAttribute('data-r'); el.dataset.oz = '';
      if (el.tagName === 'HR') return;
      const walk = (node) => {
        [...node.childNodes].forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
              const word = document.createElement('span'); word.className = 'fwd';
              for (const ch of w) { const sp = document.createElement('span'); sp.className = 'fc'; sp.textContent = ch; sp.style.setProperty('--c', ci++); word.appendChild(sp); }
              frag.appendChild(word);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1 && c.tagName === 'I') { const w = document.createElement('span'); w.className = 'fc'; w.style.setProperty('--c', ci++); c.replaceWith(w); w.appendChild(c); }
          else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
        });
      };
      walk(el);
    });
    // 그 밖(SCROLL 등): 단어 단위 초점 (framer)
    document.querySelectorAll('.ui [data-r]').forEach((el) => {
      if (el.tagName === 'HR') return;
      const walk = (node) => {
        [...node.childNodes].forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
              const sp = document.createElement('span'); sp.className = 'fw'; sp.textContent = w; sp.style.setProperty('--i', i++); frag.appendChild(sp);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1 && c.tagName !== 'BR' && c.tagName !== 'I') walk(c);
          else if (c.tagName === 'I') { const w = document.createElement('span'); w.className = 'fw'; w.style.setProperty('--i', i++); c.replaceWith(w); w.appendChild(c); }
        });
      };
      walk(el);
    });
  })();


  /* KINORIA 효과용 값: 블록 등장 순서(--kd) */
  (function(){
    const order = [0, 50, 120, 200, 300, 360];
    document.querySelectorAll('.ui .col [data-oz]').forEach((el, i) => el.style.setProperty('--kd', (order[i] ?? 300 + i * 60) + 'ms'));
  })();

  /* 스크롤 퇴장 — KINORIA 실측 모션을 스크롤 진행도(k: 0 → 1)에 그대로 연동
     글자 t 구간: 0 ~ .6 빛 번짐(밝기 1 → 1.22, 웜 글로우 .11em / .43em), .6 ~ 1 흐려지며(0 → .05em) 사라짐 */
  (function(){
    const chars = [...document.querySelectorAll('.ui .col .fc')].map((el) => ({ el, r: Math.random() * 0.45 }));
    const rule = document.querySelector('.ui .col hr');
    const logo = document.querySelector('.wordmark img');
    const cue = document.querySelector('.cue');
    const wheel = document.getElementById('wheel');
    let last = -1;
    const eyb = document.querySelector('.ui .eyebrow');
    window.__heroExit = (k) => {
      if (Math.abs(k - last) < 0.0005) return;
      last = k;
      for (const c of chars) {
        const t = Math.min(1, Math.max(0, (k - c.r) / 0.55));
        const st = c.el.style;
        if (t <= 0) { st.opacity = ''; st.filter = ''; st.textShadow = ''; st.color = ''; continue; }
        const g = t < 0.6 ? t / 0.6 : 1 - (t - 0.6) / 0.4;      // 빛 세기
        const f = t < 0.6 ? 0 : (t - 0.6) / 0.4;                 // 사라짐
        st.opacity = (1 - f).toFixed(3);
        c.fs = c.fs || parseFloat(getComputedStyle(c.el).fontSize) || 16;
        window.__tb(c.el, 0.05 * f * c.fs, g > 0.01 ? `0 0 ${(0.11 * g).toFixed(3)}em rgba(255,237,215,${(0.8 * g).toFixed(3)}), 0 0 ${(0.43 * g).toFixed(3)}em rgba(255,233,205,${(0.4 * g).toFixed(3)})` : '');
      }
      const fade = (a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));
      if (rule) rule.style.filter = `opacity(${(1 - fade(0.15, 0.6)).toFixed(3)})`;
      if (logo) { const q = fade(0.05, 0.9); logo.style.filter = window.__fl(q > 0 ? `blur(${(22 * q).toFixed(2)}px)` : ''); logo.style.opacity = (1 - q).toFixed(3); logo.style.transform = `scale(${(1 + 0.04 * q).toFixed(4)})`; }
      if (cue) { cue.style.opacity = (1 - fade(0, 0.5)).toFixed(3); window.__tb(cue, 4 * fade(0, 0.5)); }
      if (eyb) { const q = fade(0, 0.45); eyb.style.opacity = (1 - q).toFixed(3); eyb.style.visibility = q >= 1 ? 'hidden' : ''; window.__tb(eyb, 4 * q); }   // 휴대폰 히어로의 사양 한 줄: 히어로를 벗어나면 같이 사라짐 (전: 모든 장면에 떠 있었음)
    };
  })();

  /* print_2 카피: 사진이 중앙에 있을 때 전체가 흐릿하게 먼저 깔리고(appear),
     사진이 위로 올라가며 그 아래 가장자리가 지나가는 순서대로 — 맨 아래 문장부터 위로 — 한 줄씩 초점이 맞춰짐 */
  (function(){
    const lines = [];                         // [{ words: [], y }]
    document.querySelectorAll('.story h3, .story p').forEach((el) => {
      const parts = el.innerHTML.split(/(<br[^>]*>)/);   // 줄바꿈 태그(모바일 전용 <br class="mb"> 포함)는 그대로 보존
      el.innerHTML = parts.map((h) => /^<br/.test(h) ? h : `<span class="sl">${h.split(/(\s+)/).map((w) => /^\s+$/.test(w) || !w ? w : `<span class="sw">${w}</span>`).join('')}</span>`).join('');
      el.querySelectorAll('.sl').forEach((ln) => lines.push({ el: ln, words: [...ln.querySelectorAll('.sw')], y: 0 }));
    });
    let measured = false;
    const measure = () => { lines.forEach((l) => { const r = l.words[0] ? l.words[0].getBoundingClientRect() : l.el.getBoundingClientRect(); l.y = r.top + r.height / 2; }); measured = true; };
    addEventListener('resize', () => { measured = false; });
    document.fonts && document.fonts.ready.then(() => { measured = false; });
    let lastA = -1, lastE = -1e9;
    // a: 흐릿하게 나타나는 정도(0~1), edgeY: 화면상 사진 아래 가장자리 y(px)
    window.__storyIn = (a, edgeY) => {
      if (edgeY == null) edgeY = 1e9;
      if (Math.abs(a - lastA) < 0.0005 && Math.abs(edgeY - lastE) < 0.5) return; lastA = a; lastE = edgeY;
      if (!measured && a > 0) measure();
      const band = Math.max(60, innerHeight * 0.16);          // 가장자리가 줄을 지나고 이만큼 올라가는 동안 초점이 맞춰짐
      lines.forEach((l) => {
        const t = Math.min(1, Math.max(0, (l.y + 12 - edgeY) / band));
        const e = t * t * (3 - 2 * t);
        l.words.forEach((w, i) => {
          const tw = Math.min(1, Math.max(0, e * 1.25 - (i / Math.max(1, l.words.length)) * 0.25));   // 줄 안에서도 살짝 흐름
          w.style.opacity = a <= 0 ? '0' : (a * (0.34 + 0.66 * tw)).toFixed(3);
          window.__tb(w, a <= 0 ? 0 : 10 * (1 - tw));
          // 위치·크기는 고정 — 블러 → 초점만 (예전엔 단어마다 3.5% 확대됐다 줄어들어 글자가 움직여 보였음)
        });
      });
    };
    window.__storyIn(0);
  })();


  /* 03. 역사: 스크롤(sc, 화면 단위)에 연동
     연도 = 시간축 키프레임 사이를 보간 → 각 자리 숫자는 원통 드럼처럼 뒤로 넘어감(1의 자리가 가장 빠름)
     도면 = 각 연도에 도착할 때 선이 그려지고(stroke-dash), 다 그려지면 원본 선화로 또렷하게, 다음 연도로 넘어가면 사라짐 */
  (function(){
    const H = document.querySelector('.hist'), yearEl = H.querySelector('.year'), sinceEl = H.querySelector('.since');
    const drawEl = H.querySelector('.draw'), svg = drawEl.querySelector('svg'), modelEl = H.querySelector('.model');
    const story = document.querySelector('.story');
    const MS = [ // [연도, 도착 sc, 출발 sc, 모델명, 그림]
      [1937, 4.15, 4.35, '', null], [1948, 4.75, 5.0, 'MODEL 95', '1948'], [1972, 5.35, 5.6, 'SX-70', '1972'],
      [1977, 5.8, 6.05, 'ONESTEP', '1977'], [1981, 6.25, 6.45, 'SUN 660', '1981'], [2026, 7.05, 99, '', '2026'],   // 2026 도면 밑에는 모델명 표기 없음
    ];
    const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
    // 연도: 1937 에서 출발하면 2026 까지 한 번도 멈추지 않고 계속 올라감 (도면은 각 연도에서 머물러도 숫자는 계속 흐름).
    //       각 도면이 가장 또렷한 순간(도착~출발 가운데)에 그 해를 지나가도록, 부드러운 단조 곡선으로 이음
    // 1970 부터 2026 까지는 점점 천천히 감속하며 2026 에 부드럽게 맞춰 멈춤 (감속 곡선: 1-(1-t)^3.2 — 갈수록 확실히 느려져 마지막 몇 해는 한 해씩 천천히)
    const Y_STEP = 1970, SC_STEP = 5.42, SC_END = 7.05, DEC_P = 3.2, STEP_RATE = (2026 - Y_STEP) * DEC_P / (SC_END - SC_STEP);
    const YK = [[MS[0][2], MS[0][0]], ...MS.slice(1, -1).filter((m) => m[0] < Y_STEP).map((m) => [(m[1] + m[2]) / 2, m[0]]), [SC_STEP, Y_STEP]];
    const YM = (() => {   // Fritsch–Carlson 단조 3차 보간 기울기 (처음은 0 → 천천히 출발, 끝은 감속 구간 시작 속도와 이어짐)
      const n = YK.length, dl = [], m = new Array(n).fill(0);
      for (let i = 0; i < n - 1; i++) dl.push((YK[i + 1][1] - YK[i][1]) / (YK[i + 1][0] - YK[i][0]));
      for (let i = 1; i < n - 1; i++) { const a0 = dl[i - 1], a1 = dl[i]; m[i] = a0 * a1 <= 0 ? 0 : 3 * (YK[i + 1][0] - YK[i - 1][0]) / ((2 * YK[i + 1][0] - YK[i][0] - YK[i - 1][0]) / a0 + (YK[i + 1][0] + YK[i][0] - 2 * YK[i - 1][0]) / a1); }
      m[n - 1] = STEP_RATE;
      return m;
    })();
    function yearAt(sc) {
      if (sc <= YK[0][0]) return YK[0][1];
      if (sc >= SC_STEP) {                                   // 감속 구간: 1970 에서 가장 빠르고 2026 으로 갈수록 점점 느려짐
        const t = Math.min(1, (sc - SC_STEP) / (SC_END - SC_STEP));
        return Y_STEP + (2026 - Y_STEP) * (1 - Math.pow(1 - t, DEC_P));
      }
      let i = 0; while (sc > YK[i + 1][0]) i++;
      const [x0, y0] = YK[i], [x1, y1] = YK[i + 1], h = x1 - x0, t = (sc - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * YM[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * YM[i + 1];
    }
    // 4자리 드럼
    const drums = [], drumEls = [];
    for (let d = 0; d < 4; d++) {
      const dg = document.createElement('span'); dg.className = 'dg';
      for (let n = 0; n < 10; n++) { const f = document.createElement('i'); f.textContent = n; dg.appendChild(f); }
      yearEl.appendChild(dg); drums.push([...dg.children]); drumEls.push(dg);
    }
    // 숫자별 실제 글자폭(em) — 연도 폰트(Outfit) 로드 후 캔버스로 측정
    // 숫자 칸 너비: 화면에 실제로 그려진 숫자 폭을 그대로 잼 (canvas 로 따로 재지 않음).
    // 연도 요소 안에 보이지 않는 기준 글자(0~9 를 각각 10번)를 두고, 글꼴이 바뀌거나(기본 서체 → Outfit) 크기가 바뀌면
    // ResizeObserver 가 그 즉시 다시 잼 → 칸 너비와 실제 글자가 어긋나 찌그러져 보이는 순간이 생기지 않음
    let ADV = null, ADV_LS = 0;
    const yRef = document.createElement('span');
    yRef.className = 'yref'; yRef.setAttribute('aria-hidden', 'true');
    yRef.innerHTML = [...'0123456789'].map((ch) => `<i>${ch.repeat(10)}</i>`).join('');
    yearEl.appendChild(yRef);
    const yRefs = [...yRef.children];
    const measureAdv = () => {
      const px = yRefs.map((el) => el.offsetWidth / 10);
      if (px.some((v) => !(v > 0))) return;
      ADV = px; ADV_LS = parseFloat(getComputedStyle(yearEl).getPropertyValue('--ls')) || 0;
    };
    let yReady = !document.fonts;
    const remeasure = () => { measureAdv(); yShown = null; lastSc = -1; if (yDisp !== null) setYear(Math.max(1937, Math.min(2026, yDisp))); };
    if (window.ResizeObserver) { const ro = new ResizeObserver(remeasure); yRefs.forEach((el) => ro.observe(el)); signal.addEventListener('abort', () => ro.disconnect()); }
    measureAdv();
    if (document.fonts) {
      Promise.all([document.fonts.load('700 104px Outfit', '0123456789'), document.fonts.load('400 22px Outfit', 'Since')].map((p) => p.catch(() => {})))
        .then(() => document.fonts.ready).then(() => { remeasure(); yReady = true; });
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', remeasure, { signal });
      setTimeout(() => { if (!yReady) { remeasure(); yReady = true; } }, 6000);   // 글꼴을 못 받는 환경에서도 결국 보이게
    }
    function setYear(Yraw) {
      // 걸쇠(디텐트): 한 해의 대부분은 온전한 숫자로 멈춰 있고, 끝 35% 에서만 다음 숫자로 빠르게 넘어감 → 멈췄을 때 숫자가 반쯤 걸쳐 잘려 보이지 않음
      const Yi = Math.floor(Yraw), Yf = Yraw - Yi, Yt2 = Math.min(1, Math.max(0, (Yf - 0.65) / 0.35)), Y = Yi + Yt2 * Yt2 * (3 - 2 * Yt2);
      // 주행거리계 방식: 1의 자리는 연속 회전, 윗자리는 아래 자리가 9→0 넘어갈 때만 함께 굴러감
      for (let d = 0; d < 4; d++) {
        const k = 3 - d, P = Math.pow(10, k);
        let v = Math.floor(Y / P) % 10;
        if (k === 0) v = Y % 10;
        else { const low = Y % P; if (low > P - 1) v += low - (P - 1); }
        if (ADV) {   // 칸 너비: 지금 보이는 숫자(굴러가는 중이면 두 숫자 사이 보간)의 글자폭 + 자간
          const a = Math.floor(v) % 10, b2 = (a + 1) % 10, t = v - Math.floor(v);
          const w = ADV[a] * (1 - t) + ADV[b2] * t + (d < 3 ? ADV_LS : 0);
          drumEls[d].style.width = w.toFixed(2) + 'px';
        }
        drums[d].forEach((f, n) => {
          let d = n - v; d = ((d + 5) % 10 + 10) % 10 - 5;              // -5..5 (0 = 현재 숫자)
          if (Math.abs(d) > 1.2) { f.style.opacity = 0; return; }
          // 글자 모양은 절대 변형하지 않음(회전·축소·원근 없음) — 위아래로만 미끄러지고, 칸 밖으로 나가는 만큼만 옅어짐. 멈춰 있을 땐 옆 숫자가 전혀 안 보임
          f.style.transform = `translate3d(0, ${(d * 100).toFixed(2)}%, 0)`;
          f.style.opacity = Math.max(0, 1 - Math.abs(d) * 1.15).toFixed(3);
        });
      }
    }
    // 도면
    let D = null, cur = null, paths = [], lastDraw = -1, mfill = null;
    window.__afterReady(() => ['1948', '1972', '1977', '1981', '2026'].forEach((k) => { const im = new Image(); im.src = `/assets/landing/history/line-${k}.webp`; }));   // 카메라가 뜬 뒤 미리 받아둠
    window.__afterReady(function loadDrawings() {                         
      fetch('/assets/landing/history/drawings.json').then((r) => r.json()).then((j) => { D = j; }).catch(() => {});   // 연도별 도면 (선 경로·래스터 정보)
    });
    function showDrawing(key, U, W) {
      if (key === cur || !D) return;
      cur = key;
      if (!key) { svg.innerHTML = ''; paths = []; mfill = null; return; }
      // 보이는 그림은 원본 도면 래스터 그대로(POLAROID·모델명 선명) — 선 중심선을 따라가는 마스크로 '그려지듯' 드러나고,
      // 그리는 중이든 끝난 뒤든 선 굵기는 원본과 동일
      const o = D[key];
      svg.setAttribute('viewBox', `0 0 ${o.w} ${o.h}`);
      svg.innerHTML = `<defs><mask id="dm" maskUnits="userSpaceOnUse" x="-6" y="-6" width="${o.w + 12}" height="${o.h + 12}">
        <g stroke-width="${Math.max(7, o.w / 110).toFixed(1)}">${o.d.map((d) => `<path pathLength="1" d="${d}"/>`).join('')}</g>
        <rect class="mfill" x="-6" y="-6" width="${o.w + 12}" height="${o.h + 12}" fill="#fff" opacity="0"/></mask></defs>
        <image href="/assets/landing/history/line-${key}.webp" x="0" y="0" width="${o.w}" height="${o.h}" preserveAspectRatio="none" mask="url(#dm)"/>`;
      paths = [...svg.querySelectorAll('mask path')]; lastDraw = -1;
      paths.forEach((p, i) => { p.style.strokeDasharray = '1 1'; const m0 = /M([\d.]+) ([\d.]+)/.exec(o.d[i]); p._s = m0 ? (0.75 * (+m0[1] / o.w) + 0.25 * (+m0[2] / o.h)) : 0; });
      mfill = svg.querySelector('.mfill');
      drawEl.dataset.w = o.w; drawEl.dataset.h = o.h;
    }
    let lastSc = -1, yDisp = null, yVel = 0, yShown = null, yLastT = 0;
    window.__hist = (sc, W, Hh) => {
      { const pj = window.__nowProj; if (pj) H.style.setProperty('--tb', (pj.oy - 0.5687 * pj.ppu - Math.max(28, 64)) + 'px'); }
      window.__colorIn && window.__colorIn(sc);
      window.__zx && window.__zx(sc);
      window.__parts && window.__parts(sc);
      window.__film && window.__film(sc);
      // 연도 숫자는 스크롤 위치를 바로 따라가지 않고 약 0.3초 늦게 부드럽게 따라감 → 휠 한 칸씩 끊겨 들어오는 입력이나
      // 끝에서 아주 느려질 때도 멈칫멈칫(버퍼링처럼) 보이지 않고 미끄러지듯 감속하며 2026 에 멈춤
      {
        const nowT = performance.now(), dtY = Math.min(0.05, (nowT - (yLastT || nowT)) / 1000); yLastT = nowT;
        const Yt = yearAt(sc);
        if (yDisp === null || sc < 3.9) yDisp = Yt;
        else { yVel += ((Yt - yDisp) * 90 - 19 * yVel) * dtY; yDisp += yVel * dtY; }       // 임계감쇠 스프링 (ω≈9.5)
        if (Math.abs(Yt - yDisp) < 0.002 && Math.abs(yVel) < 0.02) { yDisp = Yt; yVel = 0; }
        if (yDisp !== yShown) { yShown = yDisp; setYear(Math.max(1937, Math.min(2026, yDisp))); }
      }
      if (Math.abs(sc - lastSc) < 0.0004) return; lastSc = sc;
      const U = 1;
      // 앞 장면 카피 퇴장 (블러 아웃)
      const so = Math.min(1, Math.max(0, (sc - 3.65) / 0.35));
      if (so > 0 || story.dataset.out) { story.querySelectorAll('.sw').forEach((w) => window.__tb(w, so > 0 ? 10 * so : 0)); if (so > 0) story.dataset.out = 1; else delete story.dataset.out; }
      story.style.opacity = (1 - so).toFixed(3);
      if (innerWidth / innerHeight < 0.8) { const si = Math.min(1, Math.max(0, (sc - 2.3) / 0.6)), se = 1 - Math.pow(1 - si, 3); story.style.translate = `0 ${((1 - se) * 9 - so * so * 12).toFixed(2)}vh`; }   // 휴대폰: 아래에서 올라와 자리 잡고, 나갈 땐 위로 올라가며 흐려짐
      else if (story.style.translate) story.style.translate = '';
      // 섹션 등장/퇴장
      const inK = Math.min(1, Math.max(0, (sc - 3.9) / 0.3));
      const outK = Math.min(1, Math.max(0, (sc - 7.25) / 0.35));

      const focus = (k) => `blur(${(9 * (1 - k)).toFixed(2)}px)`;
      yearEl.style.opacity = (yReady && ADV ? inK * (1 - outK) : 0).toFixed(3); window.__tb(yearEl, inK < 1 ? 9 * (1 - inK) : 8 * outK);
      const sinceK = inK * (1 - Math.min(1, Math.max(0, (sc - 4.3) / 0.2)));
      sinceEl.style.opacity = sinceK.toFixed(3); window.__tb(sinceEl, 9 * (1 - sinceK));
      // 현재 마일스톤
      let m = null, mi = -1;
      for (let i = 1; i < MS.length; i++) if (sc >= MS[i][1] - 0.18 && sc < MS[i][2] + 0.12) { m = MS[i]; mi = i; }
      if (m) {
        showDrawing(m[4], U, W);
        const draw = Math.min(1, Math.max(0, (sc - (m[1] - 0.18)) / 0.32));            // 선이 그려짐
        const lv = m[2] > 90 ? Math.min(1, Math.max(0, (sc - 7.5) / 0.55)) : Math.min(1, Math.max(0, (sc - m[2]) / 0.12)), leave = lv * lv * (3 - 2 * lv);   // 떠날 때도 스크롤에 붙어 부드럽게 (올리면 그대로 되돌아옴)
        const w = +drawEl.dataset.w || 600, h = +drawEl.dataset.h || 500;
        // 2026 도면과 같은 크기: 2026 도면은 실물 카메라에 맞춰 화면 폭의 (39.27%×0.886) 폭, 세로/가로 0.5955 비율.
        // 다른 도면도 화면에서 차지하는 면적이 2026 도면과 같도록 맞춤 → 모양(가로·세로 비율)은 달라도 체감 크기가 같음
        const w26 = (W / Hh < 0.8 ? 0.84 : 0.3927) * (0.31 / 0.35) * W * (1204 / 1156), A26 = w26 * w26 * 0.5955;
        const S = Math.min(Math.sqrt(A26 / (w * h)), 0.86 * W / w);
        if (m[4] !== '2026' || !window.__nowProj) { drawEl.style.width = (w * S) + 'px'; drawEl.style.height = (h * S) + 'px'; }
        drawEl.style.opacity = (1 - leave).toFixed(3);
        drawEl.style.filter = window.__fl(leave > 0.002 ? `blur(${(8 * leave).toFixed(2)}px)` : '');   // 다음 해로 넘어갈 때 블러되며 사라짐
        // 마지막 도면(2026 NOW): 3D 모델 원점·배율에 맞춰 정확히 겹쳐 놓음 (도면 실루엣으로 찾은 각도와 상대 위치)
        const pj = window.__nowProj;
        if (m[4] === '2026' && pj) {
          drawEl.style.transform = 'none';
          drawEl.style.left = (pj.ox - 0.9680 * pj.ppu) + 'px'; drawEl.style.top = (pj.oy - 0.5857 * pj.ppu) + 'px';   // 모델에서 직접 추출한 도면 → 실물과 완전 일치
          drawEl.style.width = (1.9490 * pj.ppu) + 'px'; drawEl.style.height = (1.1607 * pj.ppu) + 'px';
        } else { drawEl.style.transform = ''; drawEl.style.left = drawEl.style.top = ''; }
        svg.style.setProperty('--k', draw);
        if (Math.abs(draw - lastDraw) > 0.0005) { lastDraw = draw;
          for (const p of paths) { const t = Math.min(1, Math.max(0, (draw * 1.55 - p._s * 0.55) / 1)); const e = 1 - Math.pow(1 - t, 2); p.style.strokeDashoffset = (1 - e).toFixed(4); }
          if (mfill) mfill.setAttribute('opacity', Math.min(1, Math.max(0, (draw - 0.85) / 0.15)).toFixed(3)); }
        modelEl.textContent = m[3];
        const lk = Math.min(1, Math.max(0, (draw - 0.4) / 0.4)) * (1 - leave);
        modelEl.style.opacity = lk.toFixed(3); window.__tb(modelEl, 9 * (1 - lk));
      } else { drawEl.style.opacity = 0; drawEl.style.filter = ''; modelEl.style.opacity = 0; }
      // 실물 전환 구간 카피 (단어 단위 초점)
      hlWords.forEach((w, i) => {
        const t = Math.min(1, Math.max(0, (sc - 7.35 - i * 0.05) / 0.35)), e = 1 - Math.pow(1 - t, 3);
        const o = Math.min(1, Math.max(0, (sc - 8.6 - i * 0.02) / 0.3)), eo = o * o;   // 카피가 뜬 뒤 스크롤을 더 내려야(화면 두 번 이상) 사라짐
        w.style.opacity = t <= 0 || o >= 1 ? 0 : ((0.28 + 0.72 * e) * (1 - eo)).toFixed(3);
        window.__tb(w, t < 1 ? 9 * (1 - e) : 8 * eo);
      });
    };
    // 컬러 장면 타이포: 도면이 실물 카메라로 바뀐 뒤 블러 → 포커스, 위의 컬러 이름은 색이 바뀔 때마다 블러로 교체
    const cname = H.querySelector('.cname'), ctitle = H.querySelector('.ctitle');
    ctitle.innerHTML = ctitle.innerHTML.split('<br>').map((ln) => ln.split(/(\s+)/).map((w) => /^\s+$/.test(w) || !w ? w : `<span class="sw">${w}</span>`).join('')).join('<br>');
    const cWords = [...ctitle.querySelectorAll('.sw')];
    let cnameCur = 'pebble white', cnameT = -1, cOutF = 0, cOutT = 0;   // cOutF: 퇴장 진행도 — 스크롤 값을 시간으로 부드럽게 뒤따라감 (휠이 끊겨 들어와도 글자가 뚝뚝 끊기지 않게)
    window.__colorIn = (sc) => {
      const base = Math.min(1, Math.max(0, (sc - 8.7) / 0.4));   // 등장: '이어온 시간을 지나' 가 흐려지는 동안(8.6~8.9) 같은 자리에서 겹쳐 초점이 맞춰짐 — 위아래로 움직이지 않음
      cWords.forEach((w, i) => {
        const t = Math.min(1, Math.max(0, (sc - 8.72 - i * 0.04) / 0.38)), e = 1 - Math.pow(1 - t, 3);
        w.style.opacity = t <= 0 ? 0 : (0.28 + 0.72 * e).toFixed(3);
        window.__tb(w, t >= 1 ? 0 : 9 * (1 - e));
      });
      const want = (window.__nowCol && window.__nowCol.name) || 'pebble white';
      const now = performance.now();
      if (want !== cnameCur) { cnameCur = want; cnameT = now; }
      const sw = cnameT < 0 ? 1 : Math.min(1, (now - cnameT) / 520);
      if (sw < 0.5 && cname.textContent !== cnameCur && sw > 0.25) cname.textContent = cnameCur;
      if (sw >= 0.5) cname.textContent = cnameCur;
      const dip = sw < 1 ? Math.abs(Math.cos(Math.PI * sw)) : 1;            // 바뀌는 순간 흐려졌다 또렷해짐
      const e0 = 1 - Math.pow(1 - base, 3);
      // 퇴장: black 으로 바뀐 뒤 컬러 이름과 타이틀이 한 덩어리로 위로 떠오르며 점점 흐려져 사라짐 (전: 제자리에서 낱말마다 따로 흐려짐 → 버벅여 보임)
      const outW = Math.min(1, Math.max(0, (sc - 12.4) / 0.55)), dtO = cOutT ? Math.min(0.05, (now - cOutT) / 1000) : 0; cOutT = now;
      cOutF = window.__snap || outW <= 0 ? outW : cOutF + (outW - cOutF) * (1 - Math.exp(-dtO * 7));
      if (Math.abs(outW - cOutF) < 0.0005) cOutF = outW;
      const out = cOutF, oe = out * out * out * (out * (out * 6 - 15) + 10), ofd = Math.min(1, oe * 1.25);   // 글자는 다 올라가기 조금 전에 먼저 다 사라짐
      cname.style.opacity = (0.85 * e0 * dip * (1 - ofd)).toFixed(3);
      window.__tb(cname, 8 * (1 - e0) + 6 * (1 - dip) + 16 * oe);
      if (out > 0) cWords.forEach((w) => { w.style.opacity = (1 - ofd).toFixed(3); window.__tb(w, 16 * oe); });
      const cBlk = ctitle.parentElement;
      const cPort = innerWidth / innerHeight < 0.8, cTy = -oe * (cPort ? 12 : 11);   // 움직이는 건 마지막에 사라질 때뿐: 위로 올라가며 흐려짐 (전: 휴대폰·세로로 긴 창에서는 등장할 때도 아래에서 올라왔음)
      const cTr = Math.abs(cTy) > 0.005 ? `0 ${cTy.toFixed(3)}vh` : '';
      if (cBlk.style.translate !== cTr) cBlk.style.translate = cTr;
    };
    // 04. 부품 확대샷: 블랙 카메라가 블러되며 올라가는 동안 아래에서 블러된 확대샷이 올라오며 초점이 맞춰짐.
    //     이후 스크롤에 따라 오른쪽 기능 목록이 한 칸씩 위로 올라가고, 가운데 항목만 진하게 (kinoria 부품 장면 방식)
    const PT = document.querySelector('.parts');
    const P_A = 14.45, P_IN = 0.85, P_STEP = 0.7, P_OUT = 16.85;   // 시작 · 등장 길이 · 항목 하나당 스크롤 길이 · 퇴장 시작
    const PI = document.querySelector('.parts-img'), pBox = PI.querySelector('.pimg'), pTrk = PT.querySelector('.ptrk');
    let pImgs = [], pRows = [];
    const pFades = [...PT.querySelectorAll('.pfade')];
    const pLabel = PT.querySelector('.plabel'), pDesc = PT.querySelector('.pdesc'), pCount = PT.querySelector('.pcount');
    // kinoria 처럼 제목 첫 글자를 이어 읽으면 이름이 됨: N · O · W (공식·판매처 사양 기준 카피)
    const P_INFO = [
      { label: 'LENS', img: 'lens', title: 'Never Out Of Focus', lead: 'A two-lens autofocus system.', short: 'It picks the right lens for every shot.',
        body: 'One lens covers 0.4 to 1.3 m, the other 1 m to infinity. The camera chooses between them on its own, so close-ups and wide views both land sharp.' },
      { label: 'POWER', img: 'rear', title: 'One Charge, Fifteen Packs', lead: 'A built-in USB-C rechargeable battery.', short: 'Over 15 packs of film per charge.',
        body: 'Charge it like your phone. One charge lasts for over 15 packs of film, so there are no disposable batteries to carry or throw away.' },
      { label: 'FLASH', img: 'flash', title: 'Whatever The Light', lead: 'A smarter flash and ranging sensor.', short: 'Clearer pictures, even on sunny days.',
        body: 'The light meter sits in a better spot and the improved ranging sensor reads the scene more closely, so the flash fires just right — even in bright sun.' },
    ];
    pBox.innerHTML = P_INFO.map((d) => `<img data-src="/assets/landing/parts/part-${d.img}.webp" alt="" decoding="async">`).join('');
    pTrk.innerHTML = P_INFO.map((d) => `<p><span>${d.title}</span></p>`).join('');
    const pMob = PT.querySelector('.pmob'), pmWord = PT.querySelector('.pmword'), pmCount = PT.querySelector('.pmcount');
    pmWord.innerHTML = 'NOW'.split('').map((c) => `<span>${c}</span>`).join('');   // 모바일 진행 표시: 지금 항목의 첫 글자가 밝게 (kinoria K I N O R I A)
    const pmLetters = [...pmWord.children];
    // 모바일 항목 블록: kinoria 처럼 세 블록이 40px 간격으로 세로로 이어져 스크롤에 붙어 올라가고, 가운데 온 블록만 보임
    pMob.insertAdjacentHTML('beforeend', P_INFO.map((d) => `<div class="pmblk"><b>${d.label}</b><h3>${d.title}</h3><i>${d.lead}</i><p>${d.body}</p></div>`).join(''));
    const pmBlks = [...pMob.querySelectorAll('.pmblk')];
    const mobQ = matchMedia('(max-aspect-ratio: 4/5)');
    const fitTitles = () => {   // 제목이 화면 폭을 넘지 않도록 세 제목을 같은 크기로 맞춤 (kinoria 는 34px 기준)
      if (!mobQ.matches) return;
      const hs = pmBlks.map((b) => b.querySelector('h3'));
      hs.forEach((h) => { h.style.fontSize = ''; });
      const w = pMob.clientWidth || innerWidth - 40;
      const over = Math.max(...hs.map((h) => h.scrollWidth / w));
      if (over > 1) hs.forEach((h) => { h.style.fontSize = (34 / over).toFixed(2) + 'px'; });
    };
    addEventListener('resize', fitTitles); (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitTitles); fitTitles();
    pImgs = [...pBox.querySelectorAll('img')]; pRows = [...pTrk.querySelectorAll('p')];
    const pIns = pRows.map((r) => r.firstElementChild), pLit = pRows.map(() => false);
    const pLeft = PT.querySelector('.pleft'), pList = PT.querySelector('.plist'), pX = PT.querySelector('.px'), pLines = [...PT.querySelectorAll('.pline')];
    const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const kOut = (t) => 1 - Math.pow(1 - t, 4);                         // kinoria cubic-bezier(.165,.84,.44,1) 근사
    let pCur = -1, pSwapT = -1, pImgCur = -1, pImgPrev = -1, pImgT = -1;
    window.__parts = (sc) => {
      const t = Math.min(1, Math.max(0, (sc - P_A) / P_IN));
      PT.style.visibility = PI.style.visibility = t > 0 && sc < P_OUT + 0.6 ? 'visible' : 'hidden';
      if (t <= 0 || sc >= P_OUT + 0.6) { pImgCur = -1; pBox._e = t <= 0 ? 0 : 1; pBox._t = 0; if (pLit.some(Boolean)) pIns.forEach((el, i) => { pLit[i] = false; el.style.transitionDelay = ''; el.classList.remove('on'); }); return; }
      const now = performance.now();
      const U = innerHeight / 1080;
      // 확대샷: 카메라가 떠오르기 시작하면 아래에서 블러된 채 올라와 서서히 초점
      // 화면 맨 아래가 아니라 제자리보다 조금(14vh) 아래에서 흐릿하게 나타나 천천히 떠오르며 초점이 맞음 (kinoria: 중간쯤에서 올라옴).
      // 스크롤 위치를 바로 따라가지 않고 약 0.35초 늦게 부드럽게 따라감 → 휠 한 칸에 툭 올라오지 않음
      const it = Math.min(1, Math.max(0, (t - 0.1) / 0.9)), ieT = it * it * (3 - 2 * it);
      const pdt = Math.min(0.05, (now - (pBox._t || now)) / 1000); pBox._t = now;
      pBox._e = pBox._e === undefined || window.__snap ? ieT : pBox._e + (ieT - pBox._e) * (1 - Math.exp(-pdt * 3.2));
      const ie = Math.abs(ieT - pBox._e) < 0.001 ? ieT : pBox._e;
      // 퇴장: 다음 장면(필름)으로 넘어가며 확대샷이 블러되며 위로 빠져나감
      const xo = Math.min(1, Math.max(0, (sc - P_OUT) / 0.6)), xe = xo * xo * (3 - 2 * xo);
      pBox.style.transform = `translate3d(0, ${((1 - ie) * 14 - xe * 60).toFixed(2)}vh, 0)`;
      pBox.style.filter = window.__fl(ie >= 0.999 && xe <= 0.001 ? '' : `blur(${(18 * (1 - ie) + 20 * xe).toFixed(2)}px)`);
      pBox.style.opacity = (Math.min(1, ie * 1.25) * (1 - Math.max(0, xo - 0.55) / 0.45)).toFixed(3);
      const xY = -xe * 22 * innerHeight / 100;   // 퇴장: 전체가 위로 22vh
      PT.style.opacity = Math.max(0, 1 - Math.max(0, (xo - 0.1) / 0.55)).toFixed(3);   // 가운데 문구가 뜨기 전에 사라짐
      PT.style.filter = window.__fl(xe > 0.001 ? `blur(${(10 * xe).toFixed(2)}px)` : '');
      // 기능 목록 진행
      //  웹 (kinoria d7 실측): 목록 전체가 스크롤 양에 그대로 비례해 계속 움직임(멈추는 구간 없음 — 부드러움은 스크롤 감속에서). 가운데 기준선에 가장 가까운 항목이 '지금 항목'
      //  모바일: 기존대로 항목 사이에서 잠깐 머무름
      const raw = Math.max(0, Math.min(pRows.length - 1, (sc - P_A - P_IN) / P_STEP));
      const k = Math.floor(raw), f = raw - k, fe = f < 0.2 ? 0 : f > 0.8 ? 1 : (() => { const x = (f - 0.2) / 0.6; return x * x * (3 - 2 * x); })();
      const mob = mobQ.matches;
      const p = mob ? Math.min(pRows.length - 1, k + fe) : (sc - P_A - P_IN) / P_STEP;
      const pc = Math.max(0, Math.min(pRows.length - 1, p));
      const idx = Math.round(pc);
      const PITCH = 112 * U, LINE = (637 + 35) * U, H = innerHeight;
      pTrk.style.transform = `translate3d(0, ${(-PITCH * p).toFixed(2)}px, 0)`;
      // 첫 항목이 기준선에 닿기 전·마지막 항목이 지나간 뒤엔 왼쪽 설명·×·점선이 목록을 따라 움직임 (kinoria: 이름·× 는 1배, 설명은 1.25배)
      const z = mob ? 0 : (pc - p) * PITCH;
      pList.style.transform = xY ? `translate3d(0, ${xY.toFixed(1)}px, 0)` : '';
      pX.style.transform = z || xY ? `translate3d(0, ${(z + xY).toFixed(1)}px, 0)` : '';
      pLines.forEach((el) => { el.style.transform = z ? `translate3d(0, ${z.toFixed(1)}px, 0)` : ''; });
      pLeft.style.transform = z || xY ? `translate3d(0, ${(z + xY).toFixed(1)}px, 0)` : '';
      [pLabel, pDesc, pCount].forEach((el) => { el.style.translate = z ? `0 ${(z * 0.25).toFixed(1)}px` : ''; });
      // 오른쪽 목록 (kinoria 실측): 가운데 항목만 흰색 1, 바로 위·아래 0.54, 그 밖 0.13 — 단계로 딱 바뀜.
      // 등장: 화면 아래 88% 선을 넘을 때 안쪽 글자가 1.4초 동안 블러·아래에서 올라오며 나타남(한 번에 여러 개면 0.12초 + 0.09초씩 차례로). 다시 내려가면 사라짐
      // 퇴장: 화면 위쪽 20% 안으로 들어가면 흐려지며 사라짐
      const gate = t > 0.45;   // 앞 장면(ZERO) 글자가 다 빠진 뒤부터 등장
      let lead = 0;
      pRows.forEach((r, i) => {
        const dd = Math.abs(i - idx), lvl = dd === 0 ? 1 : dd === 1 ? 0.54 : 0.13;
        const y = LINE + (i - p) * PITCH + xY;                              // 이 항목의 화면 세로 위치(가운데)
        if (pLit[i]) { if (y > H * 0.882 || !gate) { pLit[i] = false; pIns[i].style.transitionDelay = ''; pIns[i].classList.remove('on'); } }
        else if (gate && y < H * 0.88) { pLit[i] = true; const dl = 0.12 + lead * 0.09; lead++; pIns[i].style.transitionDelay = `${dl}s, ${dl}s, ${dl}s`; pIns[i].classList.add('on'); }
        const mt = Math.min(1, Math.max(0, (y / H) / 0.2));
        if (r.classList.contains('on') !== (dd === 0)) { r.classList.toggle('on', dd === 0); r._tbc = null; }
        r.style.opacity = (lvl * mt).toFixed(3);
        r.style.transform = '';
        r.style.filter = window.__fl(mt >= 0.999 ? '' : `blur(${((1 - mt) * 10).toFixed(2)}px)`);
      });
      const tt = Math.min(1, Math.max(0, (t - 0.45) / 0.55));
      pFades.forEach((el, i) => {
        const ti = Math.min(1, Math.max(0, tt * 1.4 - (pFades.length - 1 - i) * 0.06)), te = 1 - Math.pow(1 - ti, 3);
        el.dataset.base = te; el.style.opacity = te.toFixed(3);
        if (el.classList.contains('pmrow')) el.style.filter = window.__fl(te >= 0.999 ? '' : `blur(${(5 * (1 - te)).toFixed(2)}px)`);   // N·O·W 글자는 각자 색(회색/흰색)을 그대로 두고 흐림만
        else if (el.tagName !== 'I' && !el.classList.contains('pscrim')) window.__tb(el, 9 * (1 - te));
      });
      // 확대샷 교체 (kinoria 실측, 웹·모바일 공통): 항목이 바뀌면 새 확대샷이 위에서 아래로 닦이듯 덮음 (시간 기반 약 0.8초, 천천히 시작해 천천히 끝남)
      if (idx !== pImgCur) {
        if (pImgCur < 0) { pImgPrev = -1; pImgT = -1; }
        else { pImgPrev = pImgCur; pImgT = now; }
        pImgCur = idx;
      }
      const wp = pImgT < 0 ? 1 : Math.min(1, (now - pImgT) / 800), we = wp < 0.5 ? 4 * wp * wp * wp : 1 - Math.pow(-2 * wp + 2, 3) / 2;
      if (wp >= 1) pImgPrev = -1;
      pImgs.forEach((im, i) => {
        if (i === pImgCur) {
          im.style.opacity = '1'; im.classList.add('pin');
          im.style.clipPath = we >= 1 ? '' : `inset(0 0 ${((1 - we) * 100).toFixed(2)}% 0)`;
          im.style.transform = we >= 1 ? '' : `scale(${(1.06 - 0.06 * we).toFixed(4)})`;
        } else if (i === pImgPrev) {
          im.style.opacity = '1'; im.classList.remove('pin'); im.style.clipPath = ''; im.style.transform = '';
        } else { im.style.opacity = '0'; im.classList.remove('pin'); im.style.clipPath = ''; im.style.transform = ''; }
      });
      // 왼쪽 라벨·설명·번호 (웹): 항목이 바뀌면 글자는 바로 바뀌고, 아주 살짝 흐려졌다(약 12%) 1.4초에 걸쳐 또렷해짐
      if (idx !== pCur) {
        pCur = idx; pSwapT = pSwapT < 0 && pLabel.dataset.i === undefined ? -1 : now;
        const info = P_INFO[pCur] || P_INFO[0], nn = String(P_INFO.length).padStart(2, '0'), cc = String(pCur + 1).padStart(2, '0');
        pLabel.textContent = `(${info.label})`; pDesc.innerHTML = `${info.lead}<br>${info.short}`;
        pCount.textContent = `(${cc} / ${nn})`;
        pmCount.textContent = `${cc} / ${nn}`;
        pmLetters.forEach((l, i) => l.classList.toggle('on', i === pCur));   // 진행 표시: N · O · W 중 지금 항목의 글자만 흰색
        pLabel.dataset.i = String(pCur);
      }
      const dip = 0;   // 항목이 바뀌면 글자만 딱 바뀜 (아래에서 올라오거나 흐려지는 모션 없음 — kinoria)
      [pLabel, pDesc, pCount].forEach((el) => {
        const bb = parseFloat(el.dataset.base || 1);
        el.style.opacity = (bb * (1 - dip) * (el === pCount ? 0.55 : 1)).toFixed(3);
        el.style.transform = dip > 0.001 ? `translateY(${dip.toFixed(3)}em)` : '';
        window.__tb(el, 9 * (1 - bb) + 10 * dip);
      });
      // 모바일 블록 (kinoria 실측): 블록이 40px 간격으로 붙어 올라가며, 가운데에서 ±8px 안은 또렷, 22px 밖은 사라짐
      if (mobQ.matches) {
        const bb = parseFloat(pFades[0].dataset.base || 1);
        pmBlks.forEach((b, i) => {
          const d = (i - p) * 40;
          b.style.transform = `translate3d(0, ${d.toFixed(1)}px, 0)`;
          b.style.opacity = ((1 - sstep(8, 22, Math.abs(d))) * bb).toFixed(3);
          b.style.filter = window.__fl(bb < 0.999 ? `blur(${(9 * (1 - bb)).toFixed(2)}px)` : '');
        });
      }
    };
    // 05. Make a Moment Last: 가운데 작은 카메라 앞에 사진이 나타나 스크롤에 맞춰 와다다다 바뀌며 커지고,
    //     세 단어(Make · a Moment · Last)는 사진이 커질수록 양옆으로 벌어지며 옅어짐. 마지막 사진은 위로 빠져나감
    const FL = document.querySelector('.film');
    const fPrints = [...FL.querySelectorAll('.fstack img')];
    const fW = [...FL.querySelectorAll('.fw:not(.fwx)')], fWx = FL.querySelector('.fwx');
    const M_A = 17.0, M_UP = [17.15, 17.95], M_OUT = [18.3, 18.75], B_A = 18.62, B_B = 19.45;   // 문장 장면(카메라 낙하·문장 상승) · 나머지 문장 퇴장 · 사진 넘김 시작 · 끝 (scene.js 와 같은 값)
    const MSG = document.querySelector('.msg'), mLines = MSG.querySelector('.mlines');
    const mKeys = [...MSG.querySelectorAll('.mk')], mOthers = [...MSG.querySelectorAll('.mo')];
    const mobQ2 = matchMedia('(max-aspect-ratio: 4/5)');
    const fitMsg = () => {   // 문장 크기: 1920 기준 82px, 가장 긴 줄이 화면 폭의 90%를 넘지 않게 (모바일은 화면 폭 기준). 다음 장면 세 단어도 같은 크기
      const U = innerHeight / 1080;
      let fs;
      if (mobQ2.matches) fs = Math.min(innerWidth * 0.075, 34);
      else {
        // 가운데 줄의 'Make a Moment Last' 가 화면 정중앙에 오도록 문단 전체를 좌우로 옮김 (줄은 왼쪽 정렬 유지 — kinoria 'it only opens this much')
        mLines.style.fontSize = '100px'; mLines.style.left = '0px';
        const x0 = mLines.getBoundingClientRect().left, wmax = Math.max(...[...mLines.querySelectorAll('.ml')].map((l) => l.getBoundingClientRect().width));
        const a = (mKeys[0].getBoundingClientRect().left + mKeys[2].getBoundingClientRect().right) / 2 - x0;   // 문단 왼쪽 → 핵심 문장 가운데
        fs = Math.min(82 * U, 100 * innerWidth * 0.46 / a, 100 * innerWidth * 0.46 / Math.max(1, wmax - a));
        mLines.style.fontSize = '';
        mLines.style.left = (innerWidth / 2 - a * fs / 100).toFixed(1) + 'px';
      }
      if (mobQ2.matches) mLines.style.left = '';
      document.documentElement.style.setProperty('--mfs', fs.toFixed(2) + 'px');
    };
    addEventListener('resize', fitMsg); (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitMsg); fitMsg();
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    let fGapM = null, fFinT = 0, fTgt = -1, fV0 = 0, fT0 = 0;
    window.__film = (sc) => {
      // ── 문장 장면 ──
      const mOn = sc > M_UP[0] - 0.05 && sc < M_OUT[1] + 0.05;
      MSG.style.visibility = mOn ? 'visible' : 'hidden';
      mLines.classList.toggle('on', sc > M_UP[0] + 0.02);           // kinoria 처럼 처음 보일 때 1.4초에 걸쳐 블러 → 또렷 (스크롤을 올려 사라지면 다시)
      const up = Math.min(1, Math.max(0, (sc - M_UP[0]) / (M_UP[1] - M_UP[0]))), ue = 1 - Math.pow(1 - up, 3);
      mLines.style.transform = `translateY(calc(-50% + ${((1 - ue) * 78).toFixed(2)}vh))`;   // 아래 화면 밖에서 스크롤에 붙어 올라와 가운데에 멈춤
      const ho = Math.min(1, Math.max(0, (sc - M_OUT[0]) / (M_OUT[1] - M_OUT[0]))), he = ho * ho * (3 - 2 * ho);
      mOthers.forEach((el) => {                                          // 나머지 문장: 살짝 위로 뜨며 블러되며 사라짐
        // kinoria 실측(it only · opens · this much): 나머지 문장은 약 0.43em 위로 뜨며 블러로 먼저 다 사라지고, 그 뒤에야 사진이 커지기 시작함
        el.style.opacity = (1 - sm(0, 0.6, ho)).toFixed(3);
        el.style.filter = window.__fl(ho > 0.001 ? `blur(${(10 * sm(0, 0.6, ho)).toFixed(2)}px)` : '');
        el.style.transform = ho > 0.001 ? `translateY(${(-0.43 * sm(0, 0.6, ho)).toFixed(3)}em)` : '';
      });
      // ── Make a Moment Last ──
      // 세 단어는 문장 장면이 시작될 때부터 이 요소들이 맡음: 문장 속 제자리(mKeys 의 위치)를 매 프레임 그대로 따라가고, 문장과 같은 식으로 흐릿한 데서 또렷해짐.
      // (전: 나머지 문장이 사라지기 시작할 때 문장 속 글자를 이 요소로 바꿔 끼웠는데, 두 글자가 그려지는 방식이 달라 바뀌는 순간 글자가 살짝 움직여 보였음)
      const on = sc > M_UP[0] - 0.05;
      FL.style.visibility = on ? 'visible' : 'hidden';
      if (!on) { fFinT = 0; fTgt = -1; return; }
      const nowT = performance.now(), tg = sc > M_UP[0] + 0.02 ? 1 : 0;
      if (tg !== fTgt) { fTgt = tg; fV0 = fFinT; fT0 = nowT; }                              // 문장이 나타나기/사라지기 시작한 시각 기준 (프레임이 느려도 문장과 어긋나지 않게)
      fFinT = Math.min(1, Math.max(0, fV0 + (tg ? 1 : -1) * (nowT - fT0) / 1400));           // 문장의 1.4초 등장(.mlines.on)과 같은 길이
      const fin = 1 - Math.pow(1 - fFinT, 4);
      const U = innerHeight / 1080;
      const mob = mobQ2.matches;
      const k = Math.min(1, Math.max(0, (sc - B_A) / (B_B - B_A)));
      const ke = 1 - Math.pow(1 - k, 1.6);
      const out = Math.min(1, Math.max(0, (sc - B_B - 0.05) / 0.5)), oe = out * out * (3 - 2 * out);
      // 세 단어: 문장 속 자리에서 출발해 가운데로 모이고, 사진이 커질수록 Make·Last 가 양옆으로 벌어지며 옅어짐
      if (!fGapM || fGapM.w !== innerWidth || fGapM.h !== innerHeight) fGapM = { w: innerWidth, h: innerHeight, g: 0.45 * (parseFloat(getComputedStyle(fW[1]).fontSize) || 30) };
      const gap = fGapM.g;   // 단어끼리 겹치지 않는 최소 간격 (창 크기가 바뀔 때만 읽음)
      // Make · Last 벌어짐 (kinoria it only · this much 실측): 사진이 넘어가는 동안 가운데 단어는 제자리,
      // 양옆 단어는 자간이 0 → 0.3em 으로 벌어지며 화면 가장자리(좌우 4%)까지 밀려남. 곡선 1-(1-t)^2.4, 흐려지지 않고 흰색 그대로
      // kinoria 실측: 세 단어는 문장 속 제자리에 그대로 있다가(따로 모이거나 미리 벌어지지 않음), 사진이 커지기 시작하는 순간부터
      // 사진과 같은 진행값으로 벌어짐 — 사진 크기 1-(1-t)^1.7, 자간·벌어짐 1-(1-t)^2.4, 자간 0 → 0.3em. 가운데 단어는 제자리
      const sp = 1 - Math.pow(1 - k, 2.4), lsEm = 0.3 * sp;
      const fsz = gap / 0.45, lsPx = lsEm * fsz;
      [fW[0], fW[2]].forEach((w) => { w.style.letterSpacing = sp > 0.0005 ? `calc(-.014em + ${lsEm.toFixed(4)}em)` : ''; });
      const sp0 = Math.max((mob ? 0.45 : 1) * 404 * U, fW[1].offsetWidth / 2 + Math.max(fW[0].offsetWidth, fW[2].offsetWidth) / 2 + gap);
      const cx = innerWidth / 2, cy = innerHeight / 2, edge = innerWidth * 0.06;
      if (!fGapM.ph) fGapM.ph = (FL.querySelector('.fstack').offsetHeight || innerWidth * 0.85) / 2;   // 다 커진 사진 높이의 절반
      const fPH = fGapM.ph;
      // 가운데 단어(a Moment)는 문장 속 제자리에서 움직이지 않음 (전: 벌어지는 동안 화면 정중앙으로 조금씩 옮겨 가 문구 전체가 밀려 보였음). 양옆 단어와 사진은 그 자리를 기준으로
      const rm = mKeys[1].getBoundingClientRect(), mdx = rm.left + rm.width / 2 - cx, mdy = rm.top + rm.height / 2 - cy;
      fW.forEach((w, i) => {
        const vw = w.offsetWidth - (i === 1 ? 0 : lsPx);                     // 보이는 글자 폭 (마지막 글자 뒤 자간 제외)
        const s1 = innerWidth / 2 - edge - vw / 2;                           // 가장자리에 닿았을 때 가운데까지 거리
        const lim = innerWidth / 2 - vw / 2 - 14;                            // 좁은 화면에서도 단어가 화면 밖으로 나가지 않게
        const r = mKeys[i].getBoundingClientRect(), dx0 = r.left + r.width / 2 - cx, dy0 = r.top + r.height / 2 - cy;   // 문장 속 제자리
        let dx1 = i === 1 ? mdx : (i === 0 ? -1 : 1) * Math.min(Math.max(s1, Math.abs(dx0)), lim) + lsPx / 2;            // 다 벌어진 자리 (가운데 단어는 제자리)
        let dy1 = mdy;
        if (mob && i !== 1) {   // 휴대폰(kinoria 모바일): 옆으로 벌어지지 않고 세로로 — Make 는 사진 위, Last 는 사진 아래 가운데에 놓이며 사진이 커지는 만큼 위아래로 밀려남
          dx1 = mdx + lsPx / 2; dy1 = mdy + (i === 0 ? -1 : 1) * (fPH + 1.1 * fsz) + 0.02 * innerHeight;   // 사진 중심이 화면 가운데보다 2% 아래 · 다 커진 사진의 위아래 바깥 자리로 먼저 가 있어 흰 테두리와 겹치는 시간이 짧음
        }
        const dx = dx0 + (dx1 - dx0) * sp, dy = dy0 + (dy1 - dy0) * sp;
        void sp0;
        w.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px - ${(oe * 6).toFixed(2)}vh))`;
        const base = 1 - oe;
        if (i === 1) {   // 사진이 거의 다 커졌을 때 a Moment → a Memory 로 블러 교차 (kinoria opens → needs)
          const sw = Math.min(1, Math.max(0, (k - 0.8) / 0.1)), se = sw * sw * (3 - 2 * sw);
          w.style.opacity = (base * (1 - se) * fin).toFixed(3); window.__tb(w, 10 * oe + 9 * se);
          fWx.style.transform = w.style.transform; fWx.style.opacity = (base * se).toFixed(3); window.__tb(fWx, 10 * oe + 9 * (1 - se));
        } else { w.style.opacity = (base * fin).toFixed(3); window.__tb(w, 10 * oe); }
        if (fin < 0.999) w.style.filter = window.__fl(`blur(${(10 * (1 - fin)).toFixed(2)}px)`);   // 문장과 같은 블러 → 또렷
      });
      // 사진: 나머지 문장이 사라지면 가운데에 작게 나타나고, 넘김 동안 맨 위 사진이 바뀌며 커짐 (272 → 659px, 1920 기준)
      const n = fPrints.length, top = sc < B_A ? 0 : Math.min(n - 1, Math.floor(k * n));
      if (top !== window.__fTop) { if (window.__fTop !== undefined && sc >= B_A && sc <= B_B) dispatchEvent(new Event('pl-flick')); window.__fTop = top; }   // 사진 넘김 소리
      const s0 = 272 / 659, grow = s0 + (1 - s0) * ke;
      const pin = Math.min(1, Math.max(0, (sc - (B_A - 0.06)) / 0.12));   // 나머지 문장이 거의 사라지자마자 가운데에 작게 나타나 바로 와다다다 넘어가며 커짐
      fPrints.forEach((im, i) => {
        if (i !== top) { im.style.opacity = 0; return; }   // 맨 위 한 장만 보임 (사진마다 높이가 달라 아래 장이 위아래로 삐져나오지 않게)
        const d = top - i;
        im.style.opacity = (pin * (1 - out)).toFixed(3);
        im.style.zIndex = String(i);
        im.style.transform = `translate(${mdx.toFixed(1)}px, ${mdy.toFixed(1)}px) translateY(${(-oe * 95).toFixed(2)}vh) scale(${(grow * (0.92 + 0.08 * pin)).toFixed(4)})`;   // 기울기 없이 똑바로 정확히 포개짐
        im.style.filter = window.__fl((d > 0 ? `brightness(${(1 - d * 0.2).toFixed(2)}) ` : '') + (oe > 0.01 ? `blur(${(14 * oe).toFixed(1)}px)` : pin < 1 ? `blur(${(8 * (1 - pin)).toFixed(1)}px)` : ''));
      });
    };
    const hlWords = [];
    H.querySelectorAll('.hl').forEach((el) => {
      el.innerHTML = el.textContent.split(/(\s+)/).map((w) => /^\s+$/.test(w) || !w ? w : `<span class="sw">${w}</span>`).join('');
      el.querySelectorAll('.sw').forEach((w) => hlWords.push(w));
    });
  })();

  /* 조리개 목차 — Leica timeline 목차 방식 */
  (function(){
    const wheel = document.getElementById('wheel'), trk = document.getElementById('wheelTrk'); if (!wheel) return;
    // 큰 흐름 4개 (kinoria 처럼): Moment(히어로 · 촬영 · 브랜드 문구) → History(역사 도면) → Camera(컬러 · ZERO/ONE · 부품 · Make a Moment Last · DEVELOPED) → Shot(사용자 경험 · Your Style, Your Film)
    const ITEMS = ['Moment', 'History', 'Now', 'Shot', 'Memory'];   // 01 히어로·From Moment to Memory / 02 카메라 변천 / 03 컬러~DEVELOPED (Polaroid Now) / 04 촬영 체험·Your Style / 05 타임라인 갤러리
    // 링 단위 = CSS 의 --u 와 같은 값(휠 박스 높이 / 1080). 예전엔 창 높이 기준이라 창이 가로로 좁아지면(--u 가 너비 기준이 될 때)
    // 박스보다 링 중심이 아래로 내려가 화면 중앙에서 벗어났음 → 실제 박스 높이를 재서 맞춤 (크기가 바뀔 때만 다시 잼)
    let UNIT = innerHeight / 1080;
    const measure = () => { const h = wheel.offsetHeight; if (h > 0) UNIT = h / 1080; };
    measure(); if (window.ResizeObserver) { const ro = new ResizeObserver(measure); ro.observe(wheel); signal.addEventListener('abort', () => ro.disconnect()); } addEventListener('resize', measure);
    const u = () => UNIT;
    const STEP = 5, EXT = 9;                     // 항목 1칸 = 눈금 5개 (항목 눈금 + 작은 눈금 4개). 첫·마지막 항목 바깥은 눈금 9개
    const ticks = [];
    for (let t = -EXT; t <= (ITEMS.length - 1) * STEP + EXT; t++) {
      const el = document.createElement('i'); el.className = 'tk'; trk.appendChild(el);
      ticks.push({ el, t, major: t % STEP === 0 && t >= 0 && t <= (ITEMS.length - 1) * STEP });
    }
    ITEMS.forEach((name, k) => { const a = document.createElement('a'); a.dataset.k = k; a.textContent = name.toUpperCase(); trk.appendChild(a); });
    const links = [...trk.querySelectorAll('a')];
    let active = 0, pos = 0, vel = 0, hoverOff = 0;
    // 휠·드래그로 링을 돌림 → 손을 떼면 가장 가까운 항목에 맞춰 멈춤
    let peek = 0, peekT = 0, drag = null, moved = false;
    const maxK = ITEMS.length - 1;
    const clampP = (v) => Math.max(-active - 0.4, Math.min(maxK - active + 0.4, v));
    // 섹션 ↔ 스크롤 위치(장면 단위 sc). 항목별 대표 장면
    const SPAN = () => window.__SPAN || 5;
    const GO = [0, 4.3, 9.1, 21.35, 27.0];                 // 각 섹션으로 이동했을 때 멈출 장면 (그 섹션의 대표 장면)
    const sectionAt = (sc) => sc < 3.9 ? 0 : sc < 8.8 ? 1 : sc < 20.9 ? 2 : sc < 26.35 ? 3 : 4;   // History 는 '이어온 시간을 지나, 당신의 NOW로' 까지 · Shot 은 Your Style 사진들이 다 올라갈 때까지
    let tocX = -1, tocHold = 0, tocIn = false, tocTouch = false;
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') { tocTouch = true; return; } tocTouch = false; tocX = e.clientX; }, { passive: true });
    document.addEventListener('pointerleave', () => { tocX = -1; }, { signal });
    let nav = null;                                             // 이동 중인 스크롤 애니메이션
    const go = (k) => {
      if (GO[k] == null) return;
      const from = scrollY, to = Math.round((window.__sc2u ? window.__sc2u(GO[k]) : GO[k]) * innerHeight * SPAN());
      const dist = Math.abs(to - from) / (innerHeight * SPAN());
      nav = { from, to, t0: performance.now(), dur: 900 + Math.min(1300, dist * 260), k };
      active = k; peek = 0;
    };
    const stopNav = () => { nav = null; };
    addEventListener('wheel', (e) => { if (!(e.target instanceof Node && wheel.contains(e.target))) stopNav(); }, { passive: true });
    addEventListener('touchstart', stopNav, { passive: true });
    addEventListener('keydown', stopNav);
    const settle = () => { const k = Math.round(Math.max(0, Math.min(maxK, active + peek))); peek = active + peek - k; if (k !== active && GO[k] != null) go(k); else active = k; };
    wheel.addEventListener('wheel', (e) => { e.preventDefault(); peek = clampP(peek + e.deltaY / 240); peekT = performance.now(); }, { passive: false });
    wheel.addEventListener('pointerdown', (e) => { const a = e.target.closest('a'); drag = { y: e.clientY, p: peek, k: a ? +a.dataset.k : null }; moved = false; wheel.setPointerCapture(e.pointerId); });
    wheel.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dy = e.clientY - drag.y; if (!moved && Math.abs(dy) > 4) { moved = true; wheel.classList.add('drag'); }
      peek = clampP(drag.p - dy / (62 * u())); peekT = performance.now();
    });
    const end = () => { if (!drag) return; const k = drag.k; drag = null; wheel.classList.remove('drag');
      if (!moved && k != null) { peek = 0; go(k); } else settle(); };
    wheel.addEventListener('pointerup', end); wheel.addEventListener('pointercancel', end);
    window.__setSection = (k) => { active = k; };
    let last = performance.now();
    let autoSec = 0;
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (nav) {                                                // 섹션 이동: 부드럽게 가속 → 감속하며 스크롤
        const t = Math.min(1, (now - nav.t0) / nav.dur), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        scrollTo(0, nav.from + (nav.to - nav.from) * e);
        if (t >= 1) nav = null;
      }
      // 현재 스크롤 위치에 맞춰 가운데 항목(글씨)이 자동으로 바뀜
      const sec = sectionAt(window.__scS || 0);
      if (!nav && !drag && sec !== autoSec && Math.abs(peek) < 0.05) active = sec;
      autoSec = sec;
      // 목차 링: 히어로에서는 보이고, 히어로를 지나면 왼쪽으로 들어감. 마우스를 화면 왼쪽 끝(목차 자리)으로 가져가면 나오고, 벗어나면 잠시 뒤 다시 들어감
      {
        const near = tocX >= 0 && tocX < Math.max(90, innerWidth * 0.092), past = (window.__scS || 0) > 0.6;
        if (near || drag || nav) tocHold = now + 500;
        const tin = past && !near && !drag && !nav && now > tocHold && !tocTouch;
        if (tin !== tocIn) { tocIn = tin; if (tin) document.documentElement.dataset.toc = 'in'; else delete document.documentElement.dataset.toc; }
      }
      if (!drag && now - peekT > 220 && Math.abs(peek) > 0.5) settle();      // 휠을 멈추면 가장 가까운 항목으로
      if (!drag) peek += (0 - peek) * (1 - Math.exp(-dt * 6));
      const target = active + peek;
      // 임계 감쇠 스프링 → 부드럽게 도착
      const k = 60, c = 2 * Math.sqrt(k);
      vel += (k * (target - pos) - c * vel) * dt; pos += vel * dt;
      // 피그마 값에서 역산: 눈금 1칸 = 0.05rad, 링 반지름 252.6px, 크기 = cos^1.2, 투명도 = 크기^1.25 (@1080)
      const U = u(), TH = 0.05, R = 252.6 * U, CY = 540 * U, P = pos * STEP;
      const CUT = 0.74;                                        // 보이는 링 길이: 현재 항목 위아래로 눈금 약 15개씩 (처음 길이와 가장 짧았던 길이의 중간)
      const fadeEnd = (a) => 1 - Math.min(1, Math.max(0, (Math.abs(a) - 0.5) / (CUT - 0.5)));
      for (const k of ticks) {
        const ang = (k.t - P) * TH;
        if (Math.abs(ang) > CUT) { if (k.el.style.opacity !== '0') k.el.style.opacity = 0; continue; }
        const sc = Math.pow(Math.cos(ang), 1.2);
        const q = Math.min(1, Math.abs(ang) / CUT);                  // 0 = 가운데, 1 = 양 끝
        const len = 1 - 0.78 * Math.pow(q, 1.15);                    // 양 끝으로 갈수록 선이 점점 짧아짐 (끝에서 가운데의 약 22%)
        const op = Math.pow(1 - q, 1.35);                            // 양 끝으로 갈수록 점점 옅어져 사라짐
        const x = (56 - 40 * sc) * U, y = CY + Math.sin(ang) * R;
        const w = (k.major ? 20 : 7) * len * U;
        k.el.style.width = w.toFixed(2) + 'px';
        k.el.style.transform = `translate3d(${x.toFixed(2)}px, ${(y - 0.5).toFixed(2)}px, 0) scaleY(${Math.max(0.5, sc).toFixed(3)})`;
        k.el.style.opacity = (op * (k.major ? 0.8 : 0.45)).toFixed(3);
      }
      const near = Math.round(pos);
      links.forEach((a, i) => {
        const ang = (i * STEP - P) * TH, d = Math.abs(i - pos);
        if (Math.abs(ang) > CUT) { a.style.opacity = 0; return; }
        const sc = Math.pow(Math.cos(ang), 1.2), op = Math.pow(1 - Math.min(1, Math.abs(ang) / CUT), 1.35) * Math.max(0, Math.min(1, 1.5 - d * 0.5));
        const cx = (56 + 14 * sc) * U, y = CY + Math.sin(ang) * R;    // 라벨 중심: 눈금 행의 x=70 지점
        a.style.transform = `translate3d(${(cx - 28 * U).toFixed(2)}px, ${y.toFixed(2)}px, 0) translateY(-50%) scale(${(sc * (a.matches(':hover') ? 1.1 : 1)).toFixed(3)})`;
        a.style.opacity = (op * (GO[i] == null ? 0.4 : 1)).toFixed(3);   // Parts: 아직 장면이 없어 흐리게 (클릭해도 이동 없음)
        a.classList.toggle('on', i === near);
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* 사운드: 처음엔 꺼짐(브라우저 자동재생 정책). Sound 를 누르면 켜짐/꺼짐 — 선택은 기억함.
     소리는 파일 없이 브라우저에서 합성(배경음 없이 효과음만): 셔터 찰칵(섬광 순간) · 사진 토출 모터음 · 사진 넘김 소리 */
  (function(){
    const btns = [document.querySelector('.ui .meta .sound'), document.querySelector('.sndfix')].filter(Boolean);
    let on = false, ac = null, master = null;
    try { on = localStorage.getItem('pl-sound') === '1'; } catch (e) {}
    const nbCache = {};
    const noiseBuf = (sec) => {   // 잡음은 길이별로 한 번만 만들어 두고 재사용 (셔터 순간에 새로 만드느라 멈칫하지 않게)
      const key = sec.toFixed(2); if (nbCache[key]) return nbCache[key];
      const b = ac.createBuffer(1, Math.floor(ac.sampleRate * sec), ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = 0.97 * l + 0.03 * w; d[i] = 0.6 * w + 4 * l; } return (nbCache[key] = b);
    };
    function ensure() {
      if (ac) return true;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ac = new AC(); signal.addEventListener('abort', () => { try { ac.close(); } catch (e) { /* 이미 닫힘 */ } });   /* 페이지를 떠나면 소리 끔 */ master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      // 배경음(낮은 화음 + 필름 잡음)은 뺌 — 효과음(셔터·모터·사진 넘김·SHOT 촬영)만 남김
      [0.095, 0.11, 1.15, 0.1].forEach(noiseBuf);   // 셔터·모터·넘김 소리용 잡음 미리 준비
      return true;
    }
    function render() {
      btns.forEach((b) => { b.classList.toggle('off', !on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    }
    function set(v) {
      on = v; try { localStorage.setItem('pl-sound', on ? '1' : '0'); } catch (e) {}
      render();
      if (on) { if (!ensure()) return; ac.resume && ac.resume(); const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0.9, t + 1.2); }
      else if (ac) { const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(0, t + 0.6); }
    }
    btns.forEach((b) => {
      b.addEventListener('click', (e) => { e.stopPropagation(); set(!on); });
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(!on); } });
    });
    render();
    // 기억된 '켜짐'은 첫 사용자 입력 때 다시 켬 (그 전에는 브라우저가 소리를 막음)
    if (on) { const go = () => { removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true); removeEventListener('wheel', go, true); set(true); };
      addEventListener('pointerdown', go, true); addEventListener('keydown', go, true); addEventListener('wheel', go, { capture: true, passive: true }); }
    const live = () => on && ac && ac.state === 'running';
    function burst(t, dur, type, freq, q, gain) {
      const s = ac.createBufferSource(); s.buffer = noiseBuf(dur + 0.05);
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
    }
    // 타임라인 갤러리 눈금 '틱': 렌즈 링이 한 칸씩 걸리는 듯한 짧고 마른 소리 (레퍼런스의 효과음 파일을 쓰지 않고 비슷하게 합성). 빠르게 넘기면 너무 촘촘하지 않게 30ms 간격 제한
    let tickAt = 0;
    window.__tick = () => { if (!live()) return; const t = ac.currentTime; if (t - tickAt < 0.03) return; tickAt = t; burst(t, 0.014, 'bandpass', 3000, 2.6, 0.2); burst(t + 0.003, 0.022, 'bandpass', 950, 1.4, 0.07); };
    function click(t, freq, gain) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.4, t + 0.02);
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.04);
    }
    // 셔터: 찰-칵 (두 번 맞물리는 소리) → 0.38초 뒤 사진 토출 모터가 1.1초 동안 윙
    addEventListener('pl-flash', () => {
      if (!live()) return; const t = ac.currentTime + 0.01;
      click(t, 2200, 0.18); burst(t, 0.045, 'highpass', 1800, 0.7, 0.5);
      click(t + 0.07, 1500, 0.14); burst(t + 0.07, 0.06, 'bandpass', 1200, 0.9, 0.35);
      const m0 = t + 0.38, m1 = m0 + 1.1;
      const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; o.frequency.setValueAtTime(70, m0); o.frequency.linearRampToValueAtTime(96, m0 + 0.15); o.frequency.setValueAtTime(96, m1 - 0.2); o.frequency.linearRampToValueAtTime(60, m1);
      o2.frequency.value = 192; f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 1.2;
      g.gain.setValueAtTime(0, m0); g.gain.linearRampToValueAtTime(0.09, m0 + 0.08); g.gain.setValueAtTime(0.09, m1 - 0.2); g.gain.linearRampToValueAtTime(0, m1);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(m0); o2.start(m0); o.stop(m1 + 0.05); o2.stop(m1 + 0.05);
      burst(m0, 1.1, 'lowpass', 600, 0.5, 0.06);
    });
    // SHOT 섹션: 찰칵 (모터 없이) · 줌 링 돌아가는 짧은 틱
    addEventListener('pl-shot', () => { if (!live()) return; const t = ac.currentTime + 0.005; click(t, 2200, 0.16); burst(t, 0.045, 'highpass', 1800, 0.7, 0.45); click(t + 0.06, 1500, 0.12); burst(t + 0.06, 0.05, 'bandpass', 1200, 0.9, 0.3); });
    addEventListener('pl-zoom', () => { if (!live()) return; const t = ac.currentTime + 0.005; click(t, 900, 0.05); burst(t, 0.03, 'bandpass', 2600, 1.2, 0.08); });
    // 사진 넘김(와다다다): 사진이 한 장 바뀔 때마다 종이 스치는 짧은 소리
    addEventListener('pl-flick', () => { if (!live()) return; burst(ac.currentTime + 0.005, 0.05, 'bandpass', 3200 + Math.random() * 900, 1.1, 0.12); });
    // 히어로가 지나가면 오른쪽 아래에 Sound 가 남음
    const fix = document.querySelector('.sndfix');
    (function loop() { const sc = window.__scS || 0; const sh = sc > 0.6; if (fix.classList.contains('show') !== sh) fix.classList.toggle('show', sh); requestAnimationFrame(loop); })();
  })();

  /* 04-0. ZERO PRINTS — kinoria ZERO EXPOSURES 실측 방식
     · 줄마다 아래에서 스크롤에 붙어 올라오고, 처음 보일 때 1.4초 블러 → 또렷 (줄마다 0.1초씩 늦게)
     · 스크롤하면 숫자가 ZERO → ONE … FIFTEEN 으로 빠르게 바뀜 (i-Type 컬러 필름 현상 시간 10~15분). 바뀌는 동안 숫자는 0.905배,
       MINUTES 는 빨강·하늘색 잔상이 좌우로 벌어지고 살짝 흐려짐
     · 다 세면 FIFTEEN MINUTES → ONE MEMORY 로 블러되며 초점이 맞춰짐 (kinoria THIRTY-SIX EXPOSURES → DECISIONS) */
  (function(){
    const Z = [...document.querySelectorAll('.zx')], F = document.querySelector('.zx-front'), B = document.querySelector('.zx-back');
    const L1 = F.querySelector('.zd-1'), L2 = F.querySelector('.zd-2'), LB = F.querySelector('.zb-l'), LS = B.querySelector('.zsub-l'), G = document.querySelector('.zghost');
    const cnt = F.querySelector('.zcnt'), cnt2 = F.querySelector('.zcnt2'), gs = [...F.querySelectorAll('.zd-2 .zg')], gs1 = [...F.querySelectorAll('.zg1')], w1 = F.querySelector('.zw'), w2 = F.querySelector('.zmem');
    const NUM = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN'];
    const ZA = 12.4, UP = [12.55, 13.1], CN = [13.18, 13.62], SW = [13.72, 13.92], OUT = [14.05, 14.33];   // 퇴장을 부품 장면(14.45) 전에 끝냄 → 겹치지 않음   // 숫자 세기는 짧은 스크롤에 16단계 → 와다다 빠르게
    const cl = (x) => Math.min(1, Math.max(0, x)), rg = (a, b, x) => cl((x - a) / (b - a)), eo = (t) => 1 - Math.pow(1 - t, 3), sm = (t) => t * t * (3 - 2 * t);
    let zM = null;
    // 마지막 장면 타이밍: 사진이 위로 빠져나가는 동안(19.5~) 배경 글씨가 바뀌고 → 사진·세 단어가 다 빠진 뒤(19.9~) 밝아지며 빛이 차오름. 카메라 낙하는 scene.js END_A(19.95)
    const AD = [19.5, 19.95, 20.25, 20.5];
    const DVC = [...document.querySelectorAll('.dvcap')];
    const ADJ = document.querySelector('.zadj'), ADJg = ADJ.querySelector('.zadj-g'), ADJa = ADJ.querySelector('.zadj-a');
    let adjM = null;
    const adjFit = () => {   // 글씨 폭 = POLAROID 배경 글씨 폭(화면의 60%), 세로 가운데도 배경 글씨와 같게
      if (adjM && adjM.w === innerWidth && adjM.h === innerHeight) return;
      const r = G.getBoundingClientRect(); if (!r.width) return;
      ADJ.style.fontSize = '100px';
      const wpx = ADJ.querySelector('.zadj-t').offsetWidth; if (!wpx) return;
      // 글자 크기: 배경 POLAROID 글씨의 폭을 넘지 않으면서, 대문자 높이가 배경 글씨 높이의 0.6배를 넘지 않게
      //   (전: 폭만 맞춤 — 9글자 DEVELOPED 에는 맞았지만 3글자 NOW 는 폭에 맞추면 세로로 지나치게 커짐)
      ADJ.style.fontSize = Math.min(100 * r.width / wpx, r.height * 0.6 / 0.7).toFixed(2) + 'px';
      ADJ.style.top = (r.top + r.height / 2).toFixed(1) + 'px';
      adjM = { w: innerWidth, h: innerHeight };
    };
    addEventListener('resize', () => { adjM = null; });
    (window.__fontsReady || Promise.resolve()).then(() => { adjM = null; });
    window.__zx = (sc) => {
      // POLAROID 배경 글씨: ZERO 글씨가 다 올라온 뒤(13.3)부터 아주 천천히(ONE MEMORY 가 자리 잡는 14.05 까지) 배어 나와 — 언제부터 있었는지 모르게 — 이후 장면 내내 은은하게 유지
      // 마지막 장면: POLAROID 배경 글씨가 같은 자리에서 DEVELOPED 로 블러 교차(은은한 밝기 그대로) → 밝아지며 빛남
      const swp = sm(rg(AD[0], AD[1], sc)), lit = sm(rg(AD[1] - 0.05, AD[2], sc)), adjGl = eo(rg(AD[1], AD[3], sc));
      { const go = (0.03 * sm(rg(13.3, 14.05, sc)) * (1 - swp) * (sc < 21.3 ? 1 : 0)).toFixed(3); if (G.style.opacity !== go) { G.style.opacity = go; G.style.visibility = +go > 0 ? 'visible' : 'hidden'; } }   // 투명도만 바꿈 — 블러 필터를 켰다 껐다 하면 일부 GPU 에서 로고가 줄무늬로 다시 그려졌음
      adjFit();
      { // 아래 양쪽 캡션: 카메라가 내려앉고 글씨가 빛나기 시작할 때 살짝 떠오르며 나타나고, 섬광과 함께 사라짐
        const ci = sm(rg(AD[1] + 0.25, AD[3] + 0.05, sc)), co = sm(rg(20.66, 20.86, sc)), cv = sc < 21.3 ? ci * (1 - co) : 0;
        DVC.forEach((el) => { const o = cv.toFixed(3); if (el._o !== o) { el._o = o; el.style.opacity = o; el.style.visibility = cv > 0.001 ? 'visible' : 'hidden'; el.style.transform = `translateY(${(14 * (1 - ci)).toFixed(1)}px)`; } });
      }
      if (swp > 0 && sc < 21.3) {   // SHOT 흰 화면이 덮은 뒤엔 숨김 (마지막 장면에서 다시 보이지 않게)
        ADJ.style.visibility = 'visible';
        ADJ.style.opacity = (0.05 * swp + 0.95 * lit).toFixed(3);
        ADJ.style.filter = window.__fl(swp < 0.999 ? `blur(${(8 * (1 - swp)).toFixed(1)}px)` : '');
        ADJ.style.transform = `translate(-50%, -50%) scale(${(0.985 + 0.015 * lit).toFixed(4)})`;
        ADJg.style.opacity = adjGl.toFixed(3); ADJa.style.opacity = adjGl.toFixed(3);
        // 섬광 (kinoria EXPOSED 끝): 글씨 빛이 더 밝게 부풀며 화면을 하얗게 덮음 → SHOT 섹션 (흰 화면은 __shot)
        const surge = sm(rg(20.66, 20.92, sc));
        if (surge > 0) ADJ.style.transform = `translate(-50%, -50%) scale(${(1 + 0.05 * surge).toFixed(4)})`;   // 글씨는 따뜻한 색 그대로 살짝 부풀기만 함 (밝기 필터를 걸면 차가운 흰색으로 바뀜) — 빛은 .dv-burst 가 맡음
      } else if (ADJ.style.visibility !== 'hidden') ADJ.style.visibility = 'hidden';
      const vis = sc > ZA && sc < OUT[1] + 0.05;
      Z.forEach((z) => { z.style.visibility = vis ? 'visible' : 'hidden'; z.classList.toggle('on', sc > UP[0] + 0.05 && sc < OUT[1]); });
      if (!vis) return;
      const H = innerHeight, mob = innerWidth / H < 0.8;
      if (!zM || zM.w !== innerWidth || zM.h !== innerHeight) zM = { w: innerWidth, h: innerHeight, fs: parseFloat(getComputedStyle(F.querySelector('.zd')).fontSize) || 120 };
      const fs = zM.fs;
      // kinoria 실측(1646×889) 간격: 두 줄 사이 0.93em · 아랫줄 가운데 → ONE PRESS 가운데 0.904em · → 설명글 가운데 1.319em (큰 글씨 크기 기준)
      // 휴대폰(kinoria 모바일 구성): 큰 타이틀은 카메라 위 · ONE PRESS / ONE PRINT 는 카메라 높이에서 카메라 뒤에 깔려 양옆으로 보임 · 설명글은 카메라 아래
      const yW = H * (mob ? 0.305 : 0.515), yC = yW - 0.93 * fs, yS = mob ? H * 0.5 : yW + 0.904 * fs, yB = mob ? H * 0.715 : yW + 1.319 * fs;
      const ho = sm(rg(OUT[0], OUT[1], sc));                                         // 퇴장: 위로 살짝 떠오르며 블러로 사라짐
      const place = (el, y, d) => {                                                 // 아래에서 스크롤에 붙어 올라옴 (줄마다 조금씩 늦게)
        const u = eo(rg(UP[0] + d, UP[1] + d, sc));
        el.style.top = '0px';
        // 휴대폰: 아래에서 올라올 땐 흐릿하다가 초점이 맞고, 위로 올라가 나갈 땐 서서히 흐려짐 (스크롤에 붙어 움직임)
        el.style.transform = `translate3d(0, ${(y - el.offsetHeight / 2 + (1 - u) * 0.42 * H - ho * (mob ? 0.2 : 0.08) * H).toFixed(1)}px, 0)`;
        el.style.opacity = (u * (1 - (mob ? ho * ho : ho))).toFixed(3);
        const bl = 10 * ho + (mob ? 12 * (1 - u) : 0);
        el.style.filter = window.__fl(bl > 0.02 ? `blur(${bl.toFixed(2)}px)` : '');
      };
      place(L1, yC, 0); place(L2, yW, 0.04); place(LS, yS, 0.08); place(LB, yB, 0.12);
      // 숫자 세기
      const NL = NUM.length - 1, c = rg(CN[0], CN[1], sc), n = Math.min(NL, Math.floor(c * NL + 0.0001));
      const word = c >= 1 ? NUM[NL] : NUM[n];
      if (cnt.textContent !== word) cnt.textContent = word;
      const counting = c > 0 && c < 1 ? 1 : 0, ck = Math.min(rg(CN[0] - 0.03, CN[0] + 0.06, sc), 1 - rg(CN[1] - 0.04, CN[1] + 0.06, sc));
      cnt.style.transform = '';   // 숫자 크기는 그대로 (세는 동안 줄었다 커지는 모션 없음)
      const off = 2.4 * (fs / 135) * ck;
      // FIFTEEN MINUTES → ONE MEMORY (kinoria EXPOSURES → DECISIONS): 바뀌는 순간 두 줄이 세게 블러되며 빨강·하늘색이 좌우로 크게 벌어지고
      // 하얀 빛이 번져 홀로그램처럼 일렁였다가, 새 단어로 초점이 맞춰지며 색이 다시 모임
      const sr = rg(SW[0], SW[1], sc), s = sm(sr), pk = Math.sin(Math.PI * sr);   // pk: 바뀌는 한가운데에서 최대
      const bl = 16 * pk;                                                       // 바뀌는 동안의 블러 (가운데 16px)
      const gOff = 2.4 * (fs / 135) * ck + 0.075 * fs * pk, gOp = Math.min(0.95, 0.26 * ck + 0.75 * pk), gBl = 2 + 10 * pk;
      const glow = pk > 0.01 ? `0 0 ${(0.12 * fs * pk).toFixed(1)}px rgba(255,240,226,${(0.45 * pk).toFixed(3)}), 0 0 ${(0.3 * fs * pk).toFixed(1)}px rgba(255,236,214,${(0.25 * pk).toFixed(3)})` : '';
      const ghost = (arr, txtA, txtB, onlySwap) => arr.forEach((g, i) => {
        g.style.opacity = (onlySwap && pk <= 0.01 ? 0 : gOp).toFixed(3);
        g.style.transform = `translate3d(calc(-50% + ${(i ? gOff : -gOff).toFixed(2)}px), 0, 0)`;
        g.style.filter = window.__fl(pk > 0.01 ? `blur(${gBl.toFixed(2)}px)` : (ck > 0.01 ? 'blur(1px)' : ''));
        const t = s > 0.5 ? txtB : txtA; if (g.textContent !== t) g.textContent = t;
      });
      ghost(gs, 'MINUTES', 'MEMORY', false);
      ghost(gs1, cnt.textContent, 'ONE', true);                                // 위 줄 잔상은 바뀌는 순간에만
      cnt.style.opacity = (1 - s).toFixed(3); cnt.style.filter = window.__fl(s > 0.001 ? `blur(${(bl + 6 * s).toFixed(2)}px)` : '');
      cnt2.style.opacity = s.toFixed(3); cnt2.style.filter = window.__fl(s < 0.999 ? `blur(${(bl + 6 * (1 - s)).toFixed(2)}px)` : '');
      cnt.style.textShadow = cnt2.style.textShadow = glow;
      w1.style.opacity = (1 - s).toFixed(3);
      w1.style.filter = window.__fl(ck > 0.01 || s > 0.001 ? `blur(${(1.1 * ck + bl + 6 * s).toFixed(2)}px)` : '');
      w1.style.textShadow = pk > 0.01 ? glow : ck > 0.01 ? `0 0 ${(0.1 * fs * ck).toFixed(1)}px rgba(255,236,214,${(0.06 * ck).toFixed(3)})` : '';
      w2.style.opacity = s.toFixed(3);
      w2.style.filter = window.__fl(s < 0.999 ? `blur(${(bl + 6 * (1 - s)).toFixed(2)}px)` : '');
      w2.style.textShadow = glow;
      void counting;
    };
  })();

  /* 나중 장면 이미지(필름 사진 · 부품 확대샷 · SHOT 썸네일): 카메라가 뜬 뒤 받음 */
  window.__afterReady(() => document.querySelectorAll('img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); }));

  /* =====================================================================
     SHOT — 사용자 경험 섹션 (피그마 레이아웃 · kinoria SHOT 인터랙션)
     · DEVELOPED 가 섬광처럼 터지며 화면이 크림색으로 하얘졌다가, 그 빛이 걷히며 뷰파인더가 드러남
     · 휠(스크롤): 네 장면이 세로 카드처럼 넘어감 — 화면은 그대로이고 경계선만 움직임 (위: 지나가는 장면, 아래: 새 장면). 멈추면 가까운 장면에 맞춰 섬
     · 클릭: 사진 한 장 (필름 한 팩 8장) · 오른쪽 버튼 드래그: 좌우로 구도 잡기
     · 모드 버튼 3개 = Polaroid Now Gen 3 의 실제 기능: 플래시 켜기/끄기 · 셀프타이머(3초 뒤 촬영) · 다중 노출(두 번 찍어 한 장)
       (전에는 줌 1×~6× 와 길게 눌러 셔터 속도를 바꾸는 기능이 있었으나, Now 에 없는 기능이라 뺌)
     · How to use: 4단계 안내 (처음 들어올 때 한 번 자동으로 열림)
     ===================================================================== */
  (() => {
    const SHOTS = [
      { src: '/assets/landing/shot/shot-01.mp4', poster: '/assets/landing/shot/shot-01.webp', loc: 'Living Room', date: '2026.11.18', time: '08:42 AM', cam: 'Polaroid NOW', film: 'Color i-Type' },
      { src: '/assets/landing/shot/shot-02.mp4', poster: '/assets/landing/shot/shot-02.webp', loc: 'Hallway', date: '2026.10.03', time: '06:15 PM', cam: 'Polaroid NOW', film: 'Color i-Type' },
      { src: '/assets/landing/shot/shot-03.mp4', poster: '/assets/landing/shot/shot-03.webp', loc: 'Kitchen Table', date: '2026.12.24', time: '09:30 PM', cam: 'Polaroid NOW', film: 'Color i-Type' },
      { src: '/assets/landing/shot/shot-04.mp4', poster: '/assets/landing/shot/shot-04.webp', loc: 'North Sea Beach', date: '2026.08.09', time: '07:48 PM', cam: 'Polaroid NOW', film: 'Color 600' },
    ];
    // 장면 타이밍 (scene.js 와 같은 값): 섬광 → 흰 화면 → 첫 장면, 이후 장면 하나당 SH_STEP
    const FX_A = 20.7, WH_A = 20.86, WH_B = 21.0, WH_C = 21.32, SH_A = 21.35, SH_STEP = 0.4;
    window.__SHOT = { SH_A, SH_STEP, N: SHOTS.length };
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), rg = (a, b, v) => clamp((v - a) / (b - a)), sm = (t) => t * t * (3 - 2 * t);
    const S = document.querySelector('.shot'), WHT = document.querySelector('.shot-white'), BG = S.querySelector('.sh-bg');
    const BUR = document.querySelector('.dv-burst');
    const IN = S.querySelector('.sh-in'), CV = S.querySelector('.sh-cv'), g = CV.getContext('2d');
    let aimOn = false, aimX = 0, aimY = 0, brkX = 0, brkY = 0, aimMoved = false;
    addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') { aimOn = false; return; } aimOn = true; aimX = e.clientX; aimY = e.clientY; }, { passive: true });
    document.addEventListener('pointerleave', () => { aimOn = false; }, { signal });
    const FL = S.querySelector('.sh-flash'), BRK = S.querySelector('.sh-brk'), SS = S.querySelector('.sh-ss');
    const TH = [...S.querySelectorAll('.sh-thumbs button')], NUM = S.querySelector('.sh-st b'), DL = S.querySelector('.sh-dl'), DD = [...DL.querySelectorAll('dd')];
    const LT = S.querySelector('.sh-left .lt'), DOTS = [...S.querySelectorAll('.sh-left .dots i')], NEW = S.querySelector('.sh-new');
    const TRI = S.querySelector('.sh-dial .tri'), NUMS = S.querySelector('.sh-dial .nums');
    NUMS.innerHTML = [1, 2, 3, 4, 5, 6, 7].map((n) => `<span style="left:${((n - 1) / 6 * 100).toFixed(2)}%">${n}</span>`).join('');
    const NSP = [...NUMS.children];

    // 영상: 화면에 보일 때만 재생 (준비 전에는 포스터를 그림)
    // 영상은 카메라가 뜬 뒤 한 개씩 끝까지 받아 메모리에 올려 둔 다음 연결 (blob) → 섹션에서 재생할 때 버퍼링 없음
    const vids = SHOTS.map(() => { const v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; return v; });
    signal.addEventListener('abort', () => vids.forEach((v) => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) { /* 무시 */ } }));   // 페이지를 떠나면 장면 영상 정지·해제
    const posters = SHOTS.map(() => new Image());
    window.__afterReady(async () => {
      SHOTS.forEach((s, i) => { posters[i].src = s.poster; });
      for (let i = 0; i < SHOTS.length; i++) {
        try { const b = await (await fetch(SHOTS[i].src, { priority: 'low' })).blob(); vids[i].src = URL.createObjectURL(b); }
        catch (e) { vids[i].src = SHOTS[i].src; }   // fetch 가 막힌 환경: 일반 스트리밍
      }
    });

    // 상태
    const PACK = 8;                                                    // Polaroid 필름 한 팩 = 8장
    let vis = false, p = 0, cur = -1, panX = 0, panT = 0, left = PACK;
    const zoom = 1.12;                                                 // 줌 기능은 없음(Now 에 없는 기능). 좌우로 둘러볼 여유만큼만 살짝 크게 그림
    let down = false, downBtn = -1, dragX = 0, panStart = 0, flashT = -1, flashK = 0, brkT = -1, brkDir = 0;
    // Polaroid Now Gen 3 의 실제 기능 세 가지: 플래시(기본 켜짐) · 셀프타이머 · 다중 노출
    const mode = { flash: true, timer: false, dbl: false };
    let timerT = -1, timerN = -1, dblFirst = null;                     // 타이머 시작 시각 · 화면에 띄운 숫자 · 다중 노출의 첫 장(캔버스)
    const TIMER_S = 3;                                                 // 체험용 카운트다운 길이(초)

    // 뷰파인더 유리(.sh-in)의 원래 자리 — 마지막 장면에서 카메라 아이피스 유리를 여기에 맞춰 시작함
    let nat = null;
    function measureNat() {
      const t = IN.style.transform; IN.style.transform = '';
      const r = IN.getBoundingClientRect(); IN.style.transform = t;
      if (r.height > 0) { nat = r; window.__shIn = { cx: (r.left + r.width / 2) / innerWidth, cy: (r.top + r.height / 2) / innerHeight, w: r.width / innerWidth, h: r.height / innerHeight }; }
    }
    addEventListener('resize', () => { nat = null; });
    function fit() {
      const t = IN.style.transform; IN.style.transform = '';
      const r = IN.getBoundingClientRect(), d = Math.min(1.5, devicePixelRatio || 1);
      IN.style.transform = t;
      const w = Math.max(2, Math.round(r.width * d)), h = Math.max(2, Math.round(r.height * d));
      if (CV.width !== w || CV.height !== h) { CV.width = w; CV.height = h; }
    }
    addEventListener('resize', fit);

    function setInfo(i) {
      if (i === cur) return; cur = i;
      TH.forEach((b, k) => b.classList.toggle('on', k === i));
      NUM.style.opacity = DL.style.opacity = 0;
      setTimeout(() => { const s = SHOTS[cur]; NUM.textContent = String(cur + 1).padStart(2, '0'); DD[0].textContent = s.loc; DD[1].textContent = s.date; DD[2].textContent = s.time; DD[3].textContent = s.cam; DD[4].textContent = s.film; NUM.style.opacity = DL.style.opacity = 1; }, 180);
    }
    function setLeft() {
      LT.innerHTML = left > 0 ? `<b>${left}</b> LEFT` : 'PACK EMPTY';
      DOTS.forEach((d, k) => d.classList.toggle('used', k < PACK - left));
      NEW.classList.toggle('on', left === 0); NEW.parentElement.classList.toggle('done', left === 0);
    }
    setLeft();

    // 그리기: 장면 k 위쪽, 장면 k+1 아래쪽 — 둘 다 제자리, 경계선만 위로 올라감. 줌·둘러보기는 화면 가운데 기준
    function drawCard(i, y0, y1, alpha) {
      const v = vids[i], src = v.readyState >= 2 ? v : posters[i];
      const sw = src.videoWidth || src.naturalWidth, sh = src.videoHeight || src.naturalHeight; if (!sw || !sh) return;
      const W = CV.width, H = CV.height, s = Math.max(W / sw, H / sh) * zoom;
      const maxPan = Math.max(0, (sw * s - W) / 2), px = clamp(panX, -1, 1) * maxPan;
      g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip();
      g.globalAlpha = alpha; g.drawImage(src, (W - sw * s) / 2 + px, (H - sh * s) / 2, sw * s, sh * s); g.restore();
    }
    function draw() {
      const W = CV.width, H = CV.height, pp = Math.abs(p - Math.round(p)) < 0.03 ? Math.round(p) : p, k = Math.min(SHOTS.length - 1, Math.floor(pp)), f = pp - k;   // 장면에 거의 맞으면 경계선 없이
      const a = 1; g.clearRect(0, 0, W, H);
      const yb = Math.round(H * (1 - f));
      drawCard(k, 0, f > 0.001 ? yb : H, a);
      if (f > 0.001 && k + 1 < SHOTS.length) {
        drawCard(k + 1, yb, H, a);
        g.fillStyle = 'rgba(255,214,160,.55)'; g.fillRect(0, yb - 1, W, 2);   // 경계선
      }
      if (dblFirst) { g.save(); g.globalAlpha = 0.46; g.drawImage(dblFirst, 0, 0, W, H); g.restore(); }   // 다중 노출: 첫 장이 지금 보는 장면 위에 비쳐 보임 → 두 번째를 찍으면 이대로 한 장이 됨
    }

    function playFor(on) {
      const k = Math.round(p);
      vids.forEach((v, i) => { const want = on && Math.abs(i - p) < 1.01; if (want && v.paused) v.play().catch(() => {}); else if (!want && !v.paused) v.pause(); });
      void k;
    }

    // 촬영
    const GH = S.querySelector('.sh-ghost'), MB = [...S.querySelectorAll('.sh-modes button')];
    const shake = () => BRK.animate([{ transform: 'translate(-50%,-50%) translateX(0)' }, { transform: 'translate(-50%,-50%) translateX(-6px)' }, { transform: 'translate(-50%,-50%) translateX(6px)' }, { transform: 'translate(-50%,-50%) translateX(0)' }], { duration: 260 });
    const setSS = (txt, big) => { if (txt == null) { SS.classList.remove('on'); return; } SS.textContent = txt; SS.classList.toggle('big', !!big); SS.classList.add('on'); };
    const cancelTimer = () => { timerT = -1; timerN = -1; if (!dblFirst) setSS(null); else setSS('1 / 2'); };
    const dropDbl = () => { dblFirst = null; GH.classList.remove('on'); };
    // 셔터를 누름: 타이머가 켜져 있으면 3초를 센 뒤, 아니면 바로 찍음. 세는 중에 다시 누르면 취소
    function press() {
      if (left <= 0) { shake(); return; }
      if (timerT > 0) { cancelTimer(); return; }
      if (mode.timer) { timerT = performance.now(); timerN = -1; return; }
      fire();
    }
    // 실제로 찍히는 순간
    function fire() {
      flashT = performance.now(); flashK = mode.flash ? 0.92 : 0.5; FL.style.background = mode.flash ? '#fff' : '#000';   // 플래시 켬: 흰 빛이 번쩍 · 끔: 셔터가 닫히듯 잠깐 어두워짐
      window.dispatchEvent(new Event('pl-shot'));
      if (mode.dbl && !dblFirst) {                                       // 다중 노출의 첫 장: 필름은 아직 나오지 않음
        const c = document.createElement('canvas'); c.width = CV.width; c.height = CV.height; c.getContext('2d').drawImage(CV, 0, 0);
        dblFirst = c; GH.classList.add('on'); setSS('1 / 2'); return;
      }
      left--; setLeft();
      capture(mode.flash);
      if (dblFirst) { dropDbl(); setSS(null); }
    }
    // 찍은 장면을 정사각형(인스턴트 필름 사진 부분)으로 잘라 보관 → 마지막 장면에서 사진으로 올라옴 (최근 8장)
    function capture(flash) {
      try {
        const W = CV.width, H = CV.height, q = Math.min(W, H), c = document.createElement('canvas'); c.width = c.height = 360;
        const x = c.getContext('2d'); x.drawImage(CV, (W - q) / 2, (H - q) / 2, q, q, 0, 0, 360, 360);
        if (flash) { x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255, 244, 226, .2)'; x.fillRect(0, 0, 360, 360); }      // 플래시를 켜고 찍은 사진: 조금 더 밝게
        else { x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgb(206, 198, 190)'; x.fillRect(0, 0, 360, 360); }              // 끄고 찍은 사진: 그 자리의 빛 그대로, 조금 어둡게
        c.toBlob((b) => { if (!b) return; const R = (window.__rolls = window.__rolls || []); R.unshift(URL.createObjectURL(b)); if (R.length > 8) URL.revokeObjectURL(R.pop()); window.__rollsV = (window.__rollsV || 0) + 1; }, 'image/jpeg', 0.86);
      } catch (e) { /* 그릴 수 없는 영상이면 건너뜀 */ }
    }
    // 모드 버튼
    MB.forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation(); const m = b.dataset.m; mode[m] = !mode[m];
      b.classList.toggle('on', mode[m]); b.setAttribute('aria-pressed', mode[m]);
      if (m === 'timer' && !mode.timer && timerT > 0) cancelTimer();
      if (m === 'dbl' && !mode.dbl && dblFirst) { dropDbl(); setSS(null); }
      window.dispatchEvent(new Event('pl-zoom'));
    }));
    S.querySelector('.sh-modes').addEventListener('pointerdown', (e) => e.stopPropagation());
    NEW.addEventListener('click', () => { left = PACK; setLeft(); });

    // 누르기 · 꾹 누르기 · 오른쪽 드래그
    IN.addEventListener('contextmenu', (e) => e.preventDefault());
    IN.addEventListener('pointerdown', (e) => {
      IN.setPointerCapture(e.pointerId); down = true; downBtn = e.button; dragX = e.clientX; panStart = panT;
    });
    IN.addEventListener('pointermove', (e) => {
      if (!down) return;
      if (downBtn === 0 && e.pointerType === 'touch' && Math.abs(e.clientX - dragX) > 12) downBtn = 2;   // 터치: 손가락으로 옆으로 끌면 둘러보기 (찍히지 않음)
      if (downBtn === 2) { const r = IN.getBoundingClientRect(); panT = clamp(panStart - (e.clientX - dragX) / (r.width * 0.5), -1, 1); }
    });
    const up = () => {
      if (!down) return; down = false;
      if (downBtn === 0) press();
    };
    IN.addEventListener('pointerup', up); IN.addEventListener('pointercancel', () => { down = false; });

    // 썸네일: 그 장면으로 스크롤
    const goShot = (i) => { const sc = SH_A + i * SH_STEP; const u = window.__sc2u ? window.__sc2u(sc) : 0; scrollTo({ top: u * innerHeight * (window.__SPAN || 5), behavior: 'smooth' }); };
    TH.forEach((b, i) => b.addEventListener('click', () => goShot(i)));
    // 스크롤을 멈추면 가장 가까운 장면에 맞춰 섬 (kinoria 스냅)
    let snapTO = 0;
    addEventListener('scroll', () => { clearTimeout(snapTO); snapTO = setTimeout(() => { const sc = window.__scS || 0; if (!vis || sc < SH_A - 0.05) return; const q = (sc - SH_A) / SH_STEP; const n = Math.round(clamp(q, 0, SHOTS.length - 1)); if (Math.abs(q - n) > 0.04 && q < SHOTS.length - 1 + 0.3) goShot(n); }, 170); }, { passive: true });

    // How to use
    // 안내 4단계 — 모두 Polaroid Now Gen 3 에 실제로 있는 기능 (전: 둘러보기 · 줌 · 촬영 · 셔터 속도 — 줌과 셔터 속도 조절은 Now 에 없음)
    const KF = 'Pretendard Variable, Pretendard, Apple SD Gothic Neo, Malgun Gothic, sans-serif';
    const TUT = [
      { t: '구도 잡고, 한 장', x: '마우스 오른쪽 버튼을 누른 채 좌우로 끌어 구도를 잡고, 화면을 클릭해 찍습니다. 필름 한 팩은 여덟 장입니다.',
        ic: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M24 40V26h14M96 40V26H82M24 80v14h14M96 80v14H82"/><text x="60" y="66" text-anchor="middle" fill="currentColor" stroke="none" font-family="Outfit" font-weight="400" font-size="20" letter-spacing="5">][</text><text x="60" y="114" text-anchor="middle" fill="currentColor" stroke="none" font-family="Outfit" font-weight="600" font-size="11" letter-spacing="2">8 LEFT</text></svg>
             <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><path d="M28 60l-8 10 8 10M92 60l8 10-8 10"/><rect x="40" y="30" width="40" height="66" rx="20"/><path d="M60 30v22M40 52h40"/><path d="M41 52v-2a19 19 0 0 1 19-19v21z" fill="currentColor" opacity=".55" stroke="none"/></svg>` },
      { t: '플래시', x: '플래시 버튼으로 켜고 끕니다. 켜 두면 찍는 순간 빛이 터져 사진이 더 밝고 또렷하게 남습니다.',
        ic: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="60" cy="60" r="30"/><path d="M66 38 48 62h11l-3 20 18-25H62z" fill="currentColor" stroke="none"/><path d="M60 14v8M60 98v8M14 60h8M98 60h8M27 27l6 6M87 87l6 6M27 93l6-6M87 33l6-6" stroke-linecap="round"/></svg>
             <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><circle cx="60" cy="60" r="30" opacity=".5"/><path d="M66 38 48 62h11l-3 20 18-25H62z" opacity=".5"/><path d="M30 30l60 60" stroke-linecap="round"/></svg>` },
      { t: '셀프타이머', x: '타이머를 켜고 누르면 3초를 센 뒤에 찍힙니다. 찍는 사람도 사진 안으로 들어갈 시간입니다.',
        ic: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="60" cy="66" r="36"/><path d="M60 46v20l13 9M50 18h20M60 18v12"/></svg>
             <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><text x="60" y="82" text-anchor="middle" fill="currentColor" stroke="none" font-family="Outfit" font-weight="300" font-size="64">3</text></svg>` },
      { t: '다중 노출', x: '다중 노출을 켜고 두 번 찍으면, 두 장면이 한 장에 겹쳐 남습니다. 첫 장면이 화면에 비쳐 보이는 동안 두 번째 장면을 고르세요.',
        ic: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="22" width="56" height="56" rx="4"/><rect x="46" y="44" width="56" height="56" rx="4"/><rect x="46" y="44" width="28" height="34" fill="currentColor" opacity=".35" stroke="none"/></svg>
             <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2"><text x="60" y="72" text-anchor="middle" fill="currentColor" stroke="none" font-family="Outfit" font-weight="500" font-size="30" letter-spacing="2">1 / 2</text></svg>` },
    ];
    if (matchMedia('(pointer: coarse)').matches) {   // 터치 기기 문구
      TUT[0].x = '화면 위에서 좌우로 끌어 구도를 잡고, 한 번 탭해 찍습니다. 필름 한 팩은 여덟 장입니다.';
    }
    const TC = S.querySelector('.sh-tut'), TN = TC.querySelector('.n'), TPG = [...TC.querySelectorAll('.pg i')], TH3 = TC.querySelector('h3'), TIC = TC.querySelector('.ic'), TTX = TC.querySelector('.tx'), TNX = TC.querySelector('.next');
    let tutStep = -1, tutSeen = false;
    function tut(i) {
      tutStep = i;
      if (i < 0 || i >= TUT.length) { S.classList.remove('tut'); tutStep = -1; return; }
      const s = TUT[i]; S.classList.add('tut');
      TN.textContent = `0${i + 1} / 0${TUT.length}`; TPG.forEach((d, k) => d.classList.toggle('on', k <= i));
      TH3.textContent = s.t; TIC.innerHTML = s.ic; TTX.textContent = s.x;
      TNX.textContent = i === TUT.length - 1 ? '촬영 시작 →' : '다음 →';
    }
    TNX.addEventListener('click', () => tut(tutStep + 1));
    TC.querySelector('.skip').addEventListener('click', () => tut(-1));
    S.querySelector('.sh-help').addEventListener('click', () => tut(0));

    // 매 프레임
    let lastT = 0;
    window.__shot = (sc) => {
      // 흰 화면: DEVELOPED 섬광 끝에서 크림색으로 차올랐다가 걷히며 뷰파인더가 드러남
      // 섬광: DEVELOPED 글씨 자리에서 따뜻한 빛이 점점 빠르게 퍼져 화면을 다 덮은 뒤(크림색) 흰 화면으로 이어짐
      const bq = rg(20.66, WH_B, sc);
      const fxOn = bq > 0 && sc < WH_B + 0.06;
      if (window.__dvfx && window.__dvfx(fxOn ? bq : 0)) { if (BUR.style.visibility !== 'hidden') BUR.style.visibility = 'hidden'; }   // WebGL 섬광이 그려지면 그걸 씀
      else if (fxOn) {
        if (!BUR._c || BUR._w !== innerWidth + 'x' + innerHeight) { const r = document.querySelector('.zadj').getBoundingClientRect(); BUR._c = [innerWidth / 2, r.height ? r.top + r.height / 2 : innerHeight * 0.31]; BUR._w = innerWidth + 'x' + innerHeight; }
        const g = Math.pow(bq, 4), s = 0.07 + 0.3 * bq + 5.3 * g;        // 처음엔 글씨 둘레에서 천천히, 끝으로 갈수록 팍
        BUR.style.visibility = 'visible'; BUR.style.opacity = sm(rg(0, 0.22, bq)).toFixed(3);
        BUR.style.transform = `translate3d(${BUR._c[0].toFixed(1)}px, ${BUR._c[1].toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      } else if (BUR.style.visibility !== 'hidden') BUR.style.visibility = 'hidden';
      const w = sc < WH_B ? sm(rg(WH_B - 0.06, WH_B, sc)) : 1 - sm(rg(WH_B + 0.04, WH_C, sc));
      WHT.style.visibility = w > 0.001 ? 'visible' : 'hidden'; WHT.style.opacity = w.toFixed(3);
      if (window.__ysf) window.__ysf(sc);
      if (window.__gal) window.__gal(sc);
      if (window.__fin) window.__fin(sc);
      if (window.__ftPos) window.__ftPos();
      const O = window.__OUT || { OUT_A: 22.7 }, OA = O.OUT_A;
      if (!nat) measureNat();
      const on = sc >= WH_B - 0.005 && sc < OA + 0.16;
      if (on !== vis) { vis = on; S.classList.toggle('on', on); S.style.opacity = on ? 1 : 0; if (on) fit(); else { playFor(false); if (tutStep >= 0) tut(-1); if (timerT > 0) cancelTimer(); if (dblFirst) { dropDbl(); setSS(null); } } }
      if (!vis) return;
      // 마지막 장면으로: SHOT 화면 전체가 살짝 작아지며 어두워져 사라지고(뷰파인더에서 눈을 뗌), 그 뒤에서 카메라 뒷면의 아이피스가 가까이 드러남
      const out = sc > OA;
      if (out !== S.classList.contains('out')) { S.classList.toggle('out', out); if (out && tutStep >= 0) tut(-1); if (!out) { S.style.opacity = 1; } }
      if (out) { const e = sm(rg(OA, OA + 0.14, sc)); S.style.opacity = (1 - e).toFixed(3); }   // 크기·위치는 그대로 둔 채 옅어짐 — 뒤의 실제 유리와 정확히 포개진 상태로 넘어감
      p = clamp((sc - SH_A) / SH_STEP, 0, SHOTS.length - 1);
      setInfo(Math.round(p));
      playFor(true);
      if (!tutSeen && sc > SH_A - 0.02 && w < 0.02 && sc < OA) { tutSeen = true; tut(0); }
      const now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016; lastT = now;
      // 셀프타이머: 3 · 2 · 1 을 화면 가운데에 크게 띄우고(한 칸마다 '틱'), 다 세면 찍힘
      if (timerT > 0) {
        const rem = TIMER_S - (now - timerT) / 1000, n = Math.ceil(rem);
        if (rem <= 0) { timerT = -1; timerN = -1; setSS(dblFirst ? '1 / 2' : null); fire(); }
        else if (n !== timerN) { timerN = n; setSS(String(n), true); window.dispatchEvent(new Event('pl-zoom')); }
      }
      panX += (panT - panX) * (1 - Math.exp(-dt * 10));
      // 초점 브래킷: + 면 커졌다가, − 면 작아졌다가 제자리로 (0.45초)
      const bk = brkT < 0 ? 0 : clamp((now - brkT) / 450);
      const bs = 1 + brkDir * 0.22 * Math.sin(Math.PI * bk) * (1 - bk * 0.3);
      // 초점 프레임은 마우스를 따라 뷰파인더 창 안에서 움직임 (kinoria). 부드럽게 뒤따라오고, 창 밖으로는 나가지 않음. 움직이다 멈추면 초점을 잡듯 살짝 조였다 풀림
      {
        const IN = BRK.parentElement, iw = IN.clientWidth, ih = IN.clientHeight, bw = BRK.offsetWidth, bh = BRK.offsetHeight;
        let gx = 0, gy = 0;
        if (aimOn && iw) { const r = IN.getBoundingClientRect(), mxx = Math.max(0, iw / 2 - bw / 2 - iw * 0.03), mxy = Math.max(0, ih / 2 - bh / 2 - ih * 0.03);
          gx = clamp(aimX - (r.left + r.width / 2), -mxx, mxx); gy = clamp(aimY - (r.top + r.height / 2), -mxy, mxy); }
        const f2 = 1 - Math.exp(-dt * 9), px0 = brkX, py0 = brkY; brkX += (gx - brkX) * f2; brkY += (gy - brkY) * f2;
        const sp = Math.hypot(brkX - px0, brkY - py0) / Math.max(dt, 0.008);
        if (sp > 60) aimMoved = true; else if (aimMoved && sp < 8) { aimMoved = false; if (brkT < 0 || now - brkT > 450) { brkT = now; brkDir = -0.45; } }
      }
      BRK.style.transform = `translate(-50%,-50%) translate(${brkX.toFixed(1)}px, ${brkY.toFixed(1)}px) scale(${bs.toFixed(3)})`;
      // 촬영 섬광 (뷰파인더 안)
      const ft = flashT < 0 ? 1 : (now - flashT) / 380; FL.style.opacity = ft < 1 ? (flashK * (1 - ft) * (1 - ft)).toFixed(3) : '0';
      draw();
    };
  })();

  /* =====================================================================
     Your Style, Your Film — 마지막 장면
     · 카메라가 위로 빠져나가며 화면이 그 아래로 내려가면, 지금까지의 사진이 아래에서 한 장씩 올라와 타이틀 둘레에 자리 잡음
     · 사진: SHOT 에서 직접 찍은 장면(최근 것부터) + 필름 장면의 사진들 / 프레임 색: Polaroid Now 컬러
     · 스크롤에 직접 묶여 있어 올리면 다시 내려감. 자리 잡은 뒤에도 스크롤에 따라 아주 천천히 위로 흐름
     ===================================================================== */
  (() => {
    const Y = document.querySelector('.ysf'); if (!Y) return;
    const PR = Y.querySelector('.ys-prints'), CP = Y.querySelector('.ys-copy');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), rg = (a, b, v) => clamp((v - a) / (b - a)), sm = (t) => t * t * (3 - 2 * t);
    const O = window.__OUT || { OUT_C: 24.25 };
    // 사진 한 장이 화면 아래에서 위로 다 지나가는 데 P_DUR, 다음 장은 P_STEP 뒤. 첫 장은 카메라가 위로 빠져나가는 동안 그 아래에서 올라옴
    const P_A = O.OUT_C - 0.1, P_STEP = 0.17, P_DUR = 1.15, T_A = P_A + 0.3, T_B = P_A + 0.68, PB = (O.OUT_B || 23.5) + 0.3;   // PB: 첫 사진이 카메라 뒤에서 움직이기 시작하는 시각
    // 프레임 색 (Now 컬러: 페블 화이트 · 블랙 · 아틱 블루 · 옐로 · 핑크 · 틸 · 코럴)
    const FC = ['white', 'duo', 'mint', 'black', 'teal', 'duo', 'white', 'mint', 'black'];   // 프레임 이미지 (같은 프레임이 연달아 나오지 않게)
    // 기본 사진: SHOT 장면 + 필름 장면 사진 (직접 찍은 사진이 있으면 그것부터)
    const DEF = [['def-1', 900 / 1297], ['def-2', 900 / 1062], ['def-3', 900 / 1146], ['def-4', 900 / 1135], ['def-5', 900 / 1130]];   // [파일, 가로÷세로] — /assets/landing/ys/
    // 가로 위치(화면 비율) · 기울기(deg) · 크기 — 타이틀 양옆을 번갈아. 크기가 클수록 조금 더 빨리 올라감 (앞에 있는 느낌)
    // 두 줄로 나란히 떨어지지 않게: 가로 위치·크기·기울기·나오는 간격을 모두 들쭉날쭉하게 (가운데 쪽으로도 들어와 타이틀 뒤를 지나감)
    const LAND = [[0.31, -14, 1.25], [0.66, 9, 0.82], [0.19, 5, 0.7], [0.54, -6, 1.4], [0.81, 11, 0.9], [0.4, 3, 0.74], [0.71, -11, 1.18], [0.25, 13, 0.85], [0.6, -4, 1.05]];
    const PORT = [[0.3, -12, 1.2], [0.72, 8, 0.85], [0.46, 4, 0.72], [0.64, -7, 1.3], [0.22, 10, 0.9], [0.78, -3, 0.76], [0.5, -10, 1.15], [0.33, 12, 0.85], [0.68, -5, 1]];
    const OFF = [0, 0.13, 0.36, 0.47, 0.75, 0.84, 1.02, 1.24, 1.36];   // 장마다 나오는 시점 (간격이 일정하지 않게)
    let items = [], builtV = -1, on = false;
    function build() {
      const R = window.__rolls || [];
      PR.textContent = ''; items = [];
      const n = R.length ? Math.min(8, R.length) : DEF.length;            // 직접 찍었으면 찍은 장수만큼만(최대 8장, 최근 것부터) — 4장 찍었으면 4장. 한 장도 안 찍었으면 기본 사진 5장
      for (let i = 0; i < n; i++) {
        const el = document.createElement('div'); let ar = 520 / 636;
        if (i < R.length) { el.className = 'ys-p'; el.style.setProperty('--fr', `url("/assets/landing/frames/frame-${FC[i]}.webp")`); const im = document.createElement('i'); im.style.backgroundImage = `url("${R[i]}")`; el.appendChild(im); }
        else { const [f, a] = DEF[i - R.length]; ar = a; el.className = 'ys-p full'; el.style.setProperty('--ph', `url("/assets/landing/ys/${f}.webp")`); el.style.aspectRatio = String(a); }
        PR.appendChild(el); items.push({ el, last: '', ar });
      }
      builtV = window.__rollsV || 0;
    }
    window.__ysf = (sc) => {
      const want = sc > PB - 0.03;
      if (!want) { if (on) { on = false; Y.classList.remove('on'); } if (sc > 21 && builtV !== (window.__rollsV || 0)) build(); return; }   // 사진은 SHOT 섹션에 들어온 뒤에 준비 (첫 화면 로딩과 겹치지 않게)
      if (!items.length) build();
      if (!on) { on = true; Y.classList.add('on'); }
      const W = innerWidth, H = innerHeight, port = W / H < 0.8, L = port ? PORT : LAND, w0 = items[0].el.offsetWidth || 232;   // 크기는 쓰기 전에 한 번만 읽음
      // 한 장씩: 앞 사진이 올라가기 시작한 뒤 STEP 만큼 스크롤해야 다음 장이 나옴 (전: 0.07~0.18 간격으로 여러 장이 한꺼번에 쏟아졌음). 마지막 장도 갤러리 전에 다 지나가도록 장수에 맞춰 간격을 줄임
      const P_ONE = 1.55, STEP = items.length > 1 ? Math.min(0.42, ((O.GAL_A || 26.5) - 0.05 - PB - P_ONE / 0.94) / (items.length - 1)) : 0;
      items.forEach((it, i) => {
        const [fx, rot, k] = L[i], s0 = PB + i * STEP, h = w0 * k / it.ar;
        const q = (sc - s0) / (P_ONE / (0.75 + 0.25 * k));                  // 0: 카메라 뒤 → 1: 화면 위로 다 빠져나감 (스크롤에 직접 묶임)
        if (sc < PB - 0.1 || it.bw !== W + 'x' + H) { it.born = false; it.bw = W + 'x' + H; }
        // 원근감: 작은(멀리 있는) 사진일수록 흐리고 조금 어둡게, 큰(가까운) 사진 뒤로 지나가게
        if (it.fk !== k + '|' + w0) { it.fk = k + '|' + w0; const far = clamp((1 - k) / 0.3); it.far = far; it.el.style.filter = window.__fl(far > 0.01 ? `blur(${(w0 * 0.02 * far).toFixed(2)}px) brightness(${(1 - 0.3 * far).toFixed(2)})` : ''); it.el.style.zIndex = Math.round(k * 100); }
        if (q <= 0 || q >= 1) { if (it.last !== 'off') { it.el.style.visibility = 'hidden'; it.last = 'off'; } return; }
        // 화면 아래 가장자리 밖에서 자기 자리(가로 위치 고정) 그대로 천천히 위로 올라와 화면 위로 나감
        //   (전: 카메라 밑에서 태어나 옆으로 퍼지며 올라와 좌우로 슉슉 움직여 보였음 — 가로 이동·좌우 흔들림·기울기 변화·크기 변화를 모두 없앰)
        const yB = H + 30 + w0 * k * 0.16, y = yB + (-h - 60 - w0 * k * 0.16 - yB) * Math.pow(q, 1.12), x = fx * W;   // 기울어진 모서리까지 화면 밖에서 시작·끝
        const t = `translate3d(${(x - w0 / 2).toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${k.toFixed(4)})`;
        if (it.last === 'off') it.el.style.visibility = '';
        if (t !== it.last) { it.el.style.transform = t; it.last = t; }
        if (!(it.far > 0.01)) { const g = Math.round(8 + 78 * q); if (g !== it.g) { it.g = g; it.el.style.setProperty('--gl', g + '%'); } }   // 올라오는 동안 광택이 사진 위를 천천히 지나감
      });
      // 타이틀: 첫 사진이 올라오는 동안 흐릿하게 → 초점
      const ta = sm(rg(T_A, T_B, sc)), tt = `translate(-50%, calc(-50% + ${(18 * (1 - ta)).toFixed(1)}px))`;
      const GA = O.GAL_A || 26.5, to = sm(rg(GA - 0.3, GA + 0.05, sc)), tv = ta * (1 - to), tb = 10 * (1 - ta) + 8 * to;   // 갤러리 사진이 올라오기 전에 타이틀은 흐려지며 사라짐
      CP.style.opacity = tv.toFixed(3); CP.style.filter = window.__fl(tb > 0.01 ? `blur(${tb.toFixed(2)}px)` : ''); CP.style.transform = tt;
    };
  })();

  /* =====================================================================
     성장 타임라인 갤러리 (마지막 갤러리 섹션) — betteroff THE LOOKBACK(Timeline) 의 동작을 분석해 같은 방식으로 구현
     레퍼런스 동작: ① 사진 줄은 목표 위치를 매 프레임 10%씩 따라감(늦게 따라붙는 관성) ② 목표와 현재의 차이 × 0.05도 만큼 사진이 세로축으로 돌아감
       ③ 아래 눈금은 11px 간격, 사진 1장 = 9칸, 사진이 시작되는 칸은 긴 눈금(22px)·나머지는 짧은 눈금(12px)·투명도 0.25
       ④ 화면 가운데를 지나는 눈금은 50px 까지 길어지고 진해짐 ⑤ 가운데 눈금이 바뀔 때마다 '틱' 소리 ⑥ 눈금에 마우스를 올리면 주변 눈금이 솟음 ⑦ 좌우 드래그·방향키로도 넘김
     우리 쪽 차이: 줄의 목표 위치는 페이지 스크롤이 정함(휠 = 스크롤). 드래그·방향키는 그만큼 페이지를 스크롤시킴. 월 대신 연도(1990 → 2026), 끝에서 처음으로 이어지지 않음
     ===================================================================== */
  (() => {
    const G = document.querySelector('.gal'); if (!G) return;
    const ROW = G.querySelector('.tl-row'), HEAD = G.querySelector('.tl-head'), DIAL = G.querySelector('.tl-dial'), CV = DIAL.querySelector('canvas');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), rg = (a, b, v) => clamp((v - a) / (b - a)), sm = (t) => t * t * (3 - 2 * t);
    const O = window.__OUT || {}, A = O.GAL_A || 26.5, B = O.GAL_B || 27.0, D = O.GAL_D || 28.2, GX = O.FIN_A || 128.4, GP = O.FIN_P || 128.9;   // 마지막 카메라 섹션은 지금 쓰지 않음(시각이 페이지 끝 뒤) → 갤러리는 끝까지 남아 있다가 푸터에 밀려 올라감
    const N = 18, Y0 = 1990, Y1 = 2026, YEARS = Array.from({ length: N }, (_, i) => Math.round(Y0 + (Y1 - Y0) * i / (N - 1)));   // 사진 18장을 1990~2026 에 고르게 배치 (실제 촬영 연도가 아님)
    const TK = 11, PER = 9, MIN_H = 12, MAJ_H = 22, CEN_H = 50, T_A = 0.25;            // 눈금: 간격 · 사진당 칸 수 · 짧은/긴/가운데 높이 · 기본 투명도 (레퍼런스 값)
    let items = [], on = false, mxp = -1e5, myp = -1e5, lastT = 0, szKey = '', cur = null, step = 1, tw = 1, lastTick = null, hot = -1, cenI = -1;
    let ctx = null, cw = 0, ch = 0, hts = new Map();
    let drag = null;
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') { mxp = e.clientX; myp = e.clientY; }
      if (drag && e.pointerId === drag.id) { const dx = e.clientX - drag.x; drag.x = e.clientX; if (Math.abs(e.clientX - drag.x0) > 4) drag.moved = true; if (drag.moved) scrollBy(0, -dx * drag.k); }
    }, { passive: true });
    // 좌우로 끌어서 넘기기: 끈 거리의 2배만큼 줄이 움직이도록 그에 해당하는 만큼 페이지를 스크롤 (레퍼런스의 끌기 배율 2)
    addEventListener('pointerdown', (e) => {
      if (!on || e.button > 0 || !window.__sc2u || (e.target.closest && e.target.closest('button, a, .ft, .wheel'))) return;
      const sc = window.__scS || 0; if (sc < B - 0.05 || sc > D + 0.25) return;
      const span = (window.__sc2u(D) - window.__sc2u(B)) * (window.__SPAN || 3.9) * innerHeight;   // 첫 장~마지막 장을 넘기는 데 쓰는 스크롤 길이(px)
      drag = { id: e.pointerId, x: e.clientX, x0: e.clientX, moved: false, k: 2 * span / ((N - 1) * step) };
    }, { passive: true });
    const endDrag = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    addEventListener('pointerup', endDrag, { passive: true }); addEventListener('pointercancel', endDrag, { passive: true });
    // 방향키 ← →: 한 장씩
    addEventListener('keydown', (e) => {
      if (!on || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || !window.__sc2u) return;
      const sc = window.__scS || 0; if (sc < B - 0.05 || sc > D + 0.05) return;
      const span = (window.__sc2u(D) - window.__sc2u(B)) * (window.__SPAN || 3.9) * innerHeight;
      e.preventDefault(); scrollBy({ top: (e.key === 'ArrowRight' ? 1 : -1) * span / (N - 1), behavior: 'smooth' });
    });
    function build() {
      ROW.textContent = ''; items = [];
      for (let i = 1; i <= N; i++) {
        const f = document.createElement('figure'); f.className = 'tl-it';
        f.innerHTML = `<span class="lb n"><b>${String(i).padStart(2, '0')}</b></span><img alt="" decoding="async" draggable="false" src="/assets/landing/film/film-${String(i).padStart(2, '0')}.webp"><span class="lb y"><b>${YEARS[i - 1]}</b></span>`;
        ROW.appendChild(f); items.push({ el: f, last: '', show: false });
      }
    }
    function sizeDial() {
      const w = DIAL.clientWidth, h = DIAL.clientHeight, d = Math.min(2, devicePixelRatio || 1); if (!w || !h) return;
      if (w === cw && h === ch && ctx) return; cw = w; ch = h; CV.width = Math.floor(w * d); CV.height = Math.floor(h * d); ctx = CV.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.lineWidth = 1;
    }
    // 눈금 다이얼: fS = 지금 가운데 온 사진 번호(소수, 관성 반영). 가운데 눈금 = round(fS × 9)
    function drawDial(fS, k, alpha) {
      sizeDial(); if (!ctx) return;
      ctx.clearRect(0, 0, cw, ch); if (alpha <= 0.003) return;
      const U = fS * PER * TK - cw / 2, base = 60, X = Math.round((U + cw / 2) / TK), first = Math.floor(U / TK) - 2, last = Math.ceil((U + cw) / TK) + 2, maxT = (N - 1) * PER;
      const dr = DIAL.getBoundingClientRect(), inDial = mxp >= 0 && myp > dr.top - 24 && myp < dr.bottom + 10, hx = mxp;
      const live = new Set();
      ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.font = "400 10px 'Outfit', sans-serif";
      for (let t = Math.max(0, first); t <= Math.min(maxT, last); t++) {
        const x = t * TK - U, major = t % PER === 0, h0 = major ? MAJ_H : MIN_H;
        let want = 0;
        if (t === X) want = CEN_H - h0;
        else if (inDial) { const dd = Math.abs(x - hx), nr = 10 * TK; if (dd < nr) want = 18 * Math.pow(1 - dd / nr, 1 / 0.55); }   // 마우스 주변 눈금이 솟음
        let hv = hts.get(t) || 0; hv = window.__snap ? want : hv + (want - hv) * (1 - Math.pow(1 - (t === X ? 0.2 : 0.1), k)); hts.set(t, hv); live.add(t);
        const hh = h0 + hv, a = t === X ? T_A + clamp((hh - h0) / Math.max(1, CEN_H - h0)) * (1 - T_A) : T_A, px = Math.round(x) + 0.5;
        ctx.globalAlpha = a * alpha; ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px, base - hh); ctx.stroke();
        if (major) { const near = 1 - clamp(Math.abs(t - fS * PER) / PER); ctx.globalAlpha = (0.42 + 0.58 * near) * alpha; ctx.fillText(String(YEARS[t / PER]).split('').join(' '), px, base + 14); }
      }
      if (hts.size > 400) hts.forEach((v, t) => { if (!live.has(t)) hts.delete(t); });
      ctx.globalAlpha = 1;
      if (lastTick !== null && X !== lastTick && X >= 0 && X <= maxT && window.__tick && !window.__snap) window.__tick();   // 가운데 눈금이 바뀔 때마다 '틱'
      lastTick = X;
    }
    window.__gal = (sc) => {
      const want = sc > A - 0.03 && sc < GP;
      if (!want) { if (on) { on = false; G.classList.remove('on'); cur = null; lastTick = null; drag = null; } if (sc > 21 && sc < A && !items.length) build(); return; }
      if (!items.length) build();
      if (!on) { on = true; G.classList.add('on'); }
      const now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0.016, k = dt * 60; lastT = now;
      const W = innerWidth, H = innerHeight, port = W / H < 0.8;
      tw = port ? Math.min(0.53 * W, 0.34 * H) : Math.min(0.1464 * W, 0.3 * H); const gap = port ? W * 0.032 : W * 0.0104, key = tw.toFixed(1) + gap.toFixed(1);   // 레퍼런스: 사진 폭 281/1920, 간격 20/1920 (휴대폰 200/375 · 12/375)
      if (key !== szKey) { szKey = key; ROW.style.setProperty('--tw', tw.toFixed(1) + 'px'); ROW.style.setProperty('--tg', gap.toFixed(1) + 'px'); cur = null; }
      step = tw + gap;
      const e = rg(B, D, sc), f = (N - 1) * e, inn = 1 - sm(rg(A, B, sc)), ex = rg(GX, GP, sc), fo = window.__ftOv || 0;
      const tgt = W / 2 - tw / 2 - f * step + inn * W * 0.9;                             // 목표 위치 (스크롤이 정함)
      cur = cur === null || window.__snap ? tgt : cur + (tgt - cur) * (1 - Math.pow(0.9, k));   // 매 프레임 10%씩 따라감
      if (Math.abs(tgt - cur) < 0.01) cur = tgt;
      const diff = cur - tgt, rot = clamp(diff * 0.05, -14, 14);                         // 차이 × 0.05도 만큼 세로축 회전
      ROW.style.transform = `translate3d(${cur.toFixed(2)}px, 0, 0) translateY(-50%)`;
      const gy = -ex * H - fo, gt = Math.abs(gy) > 0.5 ? `0 ${gy.toFixed(1)}px` : ''; if (G.style.translate !== gt) G.style.translate = gt;   // 푸터가 올라온 높이만큼 갤러리 전체가 같이 위로
      const fS = (W / 2 - tw / 2 - cur + inn * W * 0.9) / step;                          // 관성까지 반영한 '지금 가운데 사진 번호'
      const rr = ROW.getBoundingClientRect(); hot = -1;
      if (myp > rr.top && myp < rr.bottom && fo < 1 && inn < 0.05 && !(drag && drag.moved)) { const q = Math.floor((mxp - cur + gap / 2) / step); if (q >= 0 && q < N && (mxp - cur) - q * step < tw && (mxp - cur) - q * step >= 0) hot = q; }
      cenI = inn < 0.05 ? Math.round(clamp(fS, 0, N - 1)) : -1;
      const tr = Math.abs(rot) > 0.01 ? `perspective(${(tw * 4.2).toFixed(0)}px) rotateY(${rot.toFixed(3)}deg)` : '';
      items.forEach((it, i) => {
        if (tr !== it.last) { it.el.style.transform = tr; it.last = tr; }
        const sh = i === hot || (hot < 0 && i === cenI);                                // 번호·연도: 마우스를 올린 사진, 없으면 가운데 사진
        if (sh !== it.show) { it.show = sh; it.el.classList.toggle('show', sh); }
      });
      const ui = (1 - inn) * (1 - ex);
      const ho = ui.toFixed(3); if (HEAD.style.opacity !== ho) HEAD.style.opacity = ho;
      drawDial(fS, k, ui);
    };
  })();

  /* =====================================================================
     DEVELOPED 섬광 (WebGL) — kinoria 의 빛 번짐 방식을 참고해 새로 만듦
     kinoria 는 밝은 부분(글씨·빛)을 여러 단계로 흐리게 한 것을 겹쳐 빛 번짐을 만들고, 빛이 세질수록 "가는 번짐 → 화면 폭의 넓은 번짐" 쪽으로
     비중을 옮기며, 세기를 느린 사인파 두 개로 숨 쉬듯 흔듦. 그래서 빛이 동그란 원이 아니라 글씨 모양을 따라 번지고 일렁여 보임.
     여기서는: ① DEVELOPED 글씨 + 가운데 빛점을 작은 그림으로 그려 텍스처로 올리고 ② 그 텍스처의 밉맵(단계별 축소본) 6단계를 겹쳐 번짐을 만들고
     ③ 좌표를 느린 물결로 흔들어 가장자리가 아지랑이처럼 일렁이게 하고 ④ 진행(p)에 따라 넓은 번짐·세기를 키워 끝에는 화면 전체가 크림색이 됨.
     __dvfx(p): p = 0 이면 숨김. 그렸으면 true, WebGL2 를 못 쓰면 false (→ .dv-burst 로 대신함)
     ===================================================================== */
  (() => {
    const CV = document.querySelector('.dv-fx'); if (!CV) return;
    let gl = null, prog = null, tex = null, U = {}, dead = false, srcKey = '', shown = false, t0 = performance.now();
    let SW = 512, SH = 256; const src = document.createElement('canvas');   // 근원 그림 크기는 화면 비율에 맞춤 (비율이 다르면 번짐이 한쪽으로 늘어남)
    const VS = `#version 300 es
  in vec2 a; out vec2 v; void main(){ v = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }`;
    const FS = `#version 300 es
  precision highp float; in vec2 v; out vec4 o;
  uniform sampler2D uSrc; uniform float uP, uT, uAsp; uniform vec2 uSz;
  // 한 단계를 네 번 엇갈려 읽어 평균 → 큰 단계에서 번짐이 네모나게 각지지 않고 둥글게 퍼짐
  float tap(vec2 uv, float lod){ vec2 d = exp2(lod) * .5 / uSz; return .25 * (textureLod(uSrc, uv + d, lod).r + textureLod(uSrc, uv - d, lod).r + textureLod(uSrc, uv + vec2(d.x, -d.y), lod).r + textureLod(uSrc, uv + vec2(-d.x, d.y), lod).r); }
  float wv(vec2 p, float s){ return sin(p.x * 1.9 + uT * 1.15 + s) * sin(p.y * 2.6 - uT * .9 + s * 1.7) + .5 * sin(p.x * 4.3 - uT * .75 + s * 2.3) * sin(p.y * 3.4 + uT * 1.4); }
  void main(){
    float p = uP, g = pow(p, 1.8);
    // 일렁임: 빛이 셀수록 크게, 느리게 흔들리는 물결로 좌표를 민다
    // 물결을 잘게(전의 약 3배 촘촘하게), 미는 폭은 작게 → 빛 전체가 한쪽으로 밀리지 않고 글자 자리에서 가장자리만 일렁임 (전: 큰 물결이 빛 전체를 옆·위로 밀어 글자와 어긋나 보였음)
    vec2 q = v * vec2(uAsp, 1.) * 8.;
    vec2 uv = v + vec2(wv(q, 0.), wv(q.yx + 3.1, 2.)) * (.0012 + .0055 * g);
    // 번짐: 가는 단계 → 넓은 단계로 비중이 옮겨 감
    float wide = mix(.25, 1., smoothstep(0., .9, p)), b = 0., ws = 0.;
    for (int i = 0; i < 6; i++) { float f = 1. - float(i) * .17, wg = mix(f, 1.25 - f, wide); b += wg * tap(uv, 1.1 + float(i) * 1.25); ws += wg; }
    b /= ws;
    float breath = (sin(uT * 1.9) * .07 + sin(uT * .7 + .8) * .1) * (1. - p * .6);          // 숨 쉬듯 세기가 흔들림 (끝으로 갈수록 잦아듦)
    float I = b * (.5 + 30. * g + 520. * pow(smoothstep(.68, 1., p), 3.)) * (1. + breath) + pow(smoothstep(.9, 1., p), 2.) * 5.;  // 끝으로 갈수록 가운데에서 바깥으로 번져 화면 전체를 덮음
    float al = 1. - exp(-I);
    vec3 col = mix(vec3(1., .7, .4), vec3(1., .965, .918), smoothstep(.3, .96, al));     // 옅은 곳은 앰버, 짙은 곳은 크림 (처음부터 끝까지 따뜻한 톤)
    al *= smoothstep(0., .07, p);
    o = vec4(col * al, al);
  }`;
    function init() {
      try {
        gl = CV.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
        if (!gl) { dead = true; return; }
        const sh = (ty, s) => { const x = gl.createShader(ty); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
        prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
        gl.useProgram(prog);
        const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        for (const n of ['uSrc', 'uP', 'uT', 'uAsp', 'uSz']) U[n] = gl.getUniformLocation(prog, n);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1i(U.uSrc, 0); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
        CV.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dead = true; CV.style.visibility = 'hidden'; });
      } catch (e) { dead = true; gl = null; console.warn('[dvfx]', e); }
    }
    // 빛의 근원 그림: 화면과 같은 구도로 DEVELOPED 글씨와, 글씨 가운데의 빛점
    function drawSrc() {
      const T = document.querySelector('.zadj-t'), W = innerWidth, H = innerHeight; if (!T) return false;
      const r = T.getBoundingClientRect(); if (!r.width) return false;
      const key = [W, H, Math.round(r.left), Math.round(r.top), Math.round(r.width)].join(',');
      if (key === srcKey) return true; srcKey = key;
      if (W >= H) { SW = 512; SH = Math.max(64, Math.round(512 * H / W / 2) * 2); } else { SH = 512; SW = Math.max(64, Math.round(512 * W / H / 2) * 2); }
      if (src.width !== SW || src.height !== SH) { src.width = SW; src.height = SH; }
      const c = src.getContext('2d'), kx = SW / W, ky = SH / H, cs = getComputedStyle(T);
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#000'; c.fillRect(0, 0, SW, SH);
      c.fillStyle = '#fff'; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      const fpx = parseFloat(cs.fontSize) || r.height; c.font = `${cs.fontWeight} ${fpx}px ${cs.fontFamily}`;
      const mt = c.measureText(T.textContent), tw = mt.width || 1, sy = r.height / fpx;   // sy: 화면에서 글자가 실제로 커진 비율 (줄 높이 = 글자 크기)
      // 세로 위치: 화면의 글자와 같은 기준선에 그림. 줄 상자 안에서 기준선 = 가운데 + (글꼴 위 높이 − 아래 높이) ÷ 2
      //   (전: 'middle' 기준으로 그림 — 글꼴마다 화면 글자보다 글자 크기의 몇 % 위에 그려져 빛이 글자와 어긋났음)
      const fa = mt.fontBoundingBoxAscent, fd = mt.fontBoundingBoxDescent, by = fa > 0 ? (fa - fd) / 2 * sy : fpx * 0.35 * sy;
      c.setTransform(kx * r.width / tw, 0, 0, ky * sy, r.left * kx, (r.top + r.height / 2 + by) * ky); c.globalAlpha = 0.82; c.fillText(T.textContent, 0, 0);
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      // 가운데 빛점: 화면에서 가로로 조금 긴 타원 (반지름은 글씨 폭 기준이라 세로 화면에서도 같은 비율)
      const R = r.width * 0.115, gd = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      gd.addColorStop(0, 'rgba(255,255,255,1)'); gd.addColorStop(0.45, 'rgba(255,255,255,.75)'); gd.addColorStop(1, 'rgba(255,255,255,0)');
      c.save(); c.translate((r.left + r.width / 2) * kx, (r.top + r.height * 0.56) * ky); c.scale(1.5 * R * kx, R * ky); c.fillStyle = gd; c.fillRect(-1, -1, 2, 2); c.restore();
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D);
      return true;
    }
    window.__dvfx = (p) => {
      if (dead) return false;
      if (!(p > 0)) { if (shown) { shown = false; CV.style.visibility = 'hidden'; } return !!gl; }
      if (!gl) { init(); if (dead) return false; }
      const W = innerWidth, H = innerHeight, cw = Math.max(2, Math.round(W / 2)), ch = Math.max(2, Math.round(H / 2));   // 번진 빛이라 절반 해상도로 충분
      if (CV.width !== cw || CV.height !== ch) { CV.width = cw; CV.height = ch; }
      if (!drawSrc()) return false;
      if (!shown) { shown = true; CV.style.visibility = 'visible'; }
      gl.viewport(0, 0, cw, ch); gl.useProgram(prog); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(U.uP, p); gl.uniform1f(U.uT, (performance.now() - t0) / 1000); gl.uniform1f(U.uAsp, W / H); gl.uniform2f(U.uSz, SW, SH);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return true;
    };
  })();




  /* =====================================================================
     마지막 카메라 장면의 문구: 카메라가 내려앉을 때 흐릿한 상태에서 초점이 맞으며 나타남 (카메라 움직임은 scene.js)
     ===================================================================== */
  (() => {
    const F = document.querySelector('.fin'); if (!F) return;
    const T = F.querySelector('.fin-t'), L = F.querySelector('.fin-l'), R = F.querySelector('.fin-r');
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), rg = (a, b, v) => clamp((v - a) / (b - a)), sm = (t) => t * t * (3 - 2 * t);
    const BG = document.querySelector('.finbg');
    const O = window.__OUT || {}, FA = O.FIN_A || 128.4, FP = O.FIN_P || 128.9, FC = O.FIN_C || 129.45, FL = O.FIN_L1 || 131.6;
    let on = false, last = '';
    const put = (el, k, tx, y, bl) => { el.style.opacity = k.toFixed(3); el.style.filter = window.__fl(bl > 0.02 ? `blur(${bl.toFixed(2)}px)` : ''); el.style.transform = `${tx} translateY(${y.toFixed(1)}px)`; };
    window.__fin = (sc) => {
      const want = sc > FA;
      if (!want) { if (on) { on = false; F.classList.remove('on'); BG.style.visibility = 'hidden'; last = ''; } return; }
      if (!on) { on = true; F.classList.add('on'); BG.style.visibility = 'visible'; }
      const H = innerHeight, a = rg(FA, FP, sc), y = (1 - a) * H;           // 어두운 섹션이 올라온 정도 — 양옆 카피는 섹션에 놓인 채 같이 올라옴
      const ov = window.__ftOv || 0;                                         // 푸터가 올라온 높이만큼 이 섹션 전체가 위로 올라감
      const out = sm(rg(FP + 0.08, FC - 0.05, sc)), t = sm(rg(FL - 0.4, FL - 0.02, sc)), key = y.toFixed(1) + out.toFixed(3) + t.toFixed(3) + ov.toFixed(1);
      if (key === last) return; last = key;
      BG.style.transform = `translate3d(0, ${(y - ov).toFixed(1)}px, 0)`; F.style.transform = ov ? `translate3d(0, ${(-ov).toFixed(1)}px, 0)` : '';
      const cx = innerWidth / innerHeight < 0.8 ? 'translateX(-50%)' : '';
      put(L, 1 - out, '', y - 14 * out, 8 * out); put(R, 1 - out, cx, y - 14 * out, 8 * out);   // 카메라가 화면 가운데로 오면 흐려지며 사라짐
      put(T, t, 'translateX(-50%)', 18 * (1 - t), 10 * (1 - t));                              // 카메라가 내려앉을 때 핵심 문구
    };
  })();

  /* SHOT 뷰파인더 유리 안에서는 공통 커서(SiteCursor)를 숨김 — 마우스를 따라다니는 초점 프레임과 겹치지 않게 (버튼 위·안내 중·빠져나가는 중에는 보임).
     커서 자체는 공통 컴포넌트라 건드리지 않고, <html> 에 vf-in 을 달아 landing.css 가 숨긴다 */
  (() => {
    const HOT = 'a,button,select,summary,textarea,label[for],input:not([type=hidden]),[role=button],[role=link],[role=tab],[role=menuitem],[role=switch],[role=checkbox],[role=radio],[role=option]';
    const inVf = (t) => !!(t && t.closest && t.closest('.sh-in') && !t.closest(HOT) && !t.closest('.shot.tut, .shot.out'));
    const root = document.documentElement; let on = false;
    const set = (e) => { const v = e.pointerType !== 'touch' && inVf(e.target); if (v !== on) { on = v; root.classList.toggle('vf-in', v); } };
    addEventListener('pointermove', set, { capture: true, passive: true });
    addEventListener('pointerover', set, { capture: true, passive: true });
    signal.addEventListener('abort', () => root.classList.remove('vf-in', 'lite'));
  })();
}
