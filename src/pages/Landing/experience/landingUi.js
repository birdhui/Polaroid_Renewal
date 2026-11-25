/**
 * Landing 화면 UI 엔진 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)의 화면 스크립트를 그대로 옮긴 이식본 (2차: 아티팩트 최신본 전체).
 * - 글꼴 준비, 히어로 타이포 등장·퇴장, 사진 뒤 문구, 역사 연도(실측 칸 너비)·도면, NOW·컬러 타이포,
 *   ZERO MINUTES, 부품 목록, Make a Moment Last · 필름 사진, 마지막 DEVELOPED, 커서, 사운드, 왼쪽 목차 링을 담당한다.
 * - 3D 장면(@/features/landing-camera/engine)과는 window.__* 값으로 주고받는다 (프로토타입 구조 유지).
 *   계약(cameraContract.js) 기반으로 나누는 작업은 다음 단계에서 한다.
 *
 * @param {AbortSignal} signal 페이지를 떠날 때 abort → 이벤트·루프 정리
 */
export const LANDING_UI_GLOBALS = ['__colorIn', '__fTop', '__film', '__fontsOk', '__fontsReady', '__heroExit', '__heroWheel', '__hist', '__introDone', '__parts', '__setSection', '__storyIn', '__tb', '__zx'];

export function mountLandingUi(signal) {
  // ── 프로토타입(아티팩트) 코드를 그대로 옮기기 위한 범위 한정 ──
  // 창(window)·문서(document)에 다는 이벤트는 페이지를 떠날 때 signal 로 한 번에 해제되고, 애니메이션 루프·타이머도 함께 멈춘다.
  const withSignal = (o) => (o && typeof o === 'object' ? { ...o, signal } : { capture: !!o, signal });
  const addEventListener = (type, fn, o) => window.addEventListener(type, fn, withSignal(o));
  const requestAnimationFrame = (fn) => (signal.aborted ? 0 : window.requestAnimationFrame((t) => { if (!signal.aborted) fn(t); }));
  const setTimeout = (fn, ms) => { const id = window.setTimeout(() => { if (!signal.aborted) fn(); }, ms); signal.addEventListener('abort', () => window.clearTimeout(id)); return id; };

  /* 쓰는 글꼴·굵기를 처음부터 전부 불러 둠 (아직 안 나온 장면의 글꼴까지) → 다 준비되면 히어로 글자 등장. 네트워크가 막히면 4초 뒤 그냥 진행 */
  window.__fontsOk = !document.fonts;
  window.__fontsReady = !document.fonts ? Promise.resolve() : Promise.race([
    Promise.all(['200','300','400','500','600','700','800'].map(w => document.fonts.load(w + ' 16px Outfit', 'Aa09')).concat(
      ['400','500'].map(w => document.fonts.load(w + ' 16px "Noto Sans KR"', '우리는')))).catch(() => {}),
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

  // [임시] 인트로(로딩 → 영상 → 뷰파인더 빠져나오기) 숨김 — 히어로부터 개발. 되살리려면 SKIP_INTRO = false
  // 인트로를 숨기는 동안에는 인트로 영상(hero.mp4, 약 3.5MB)을 아예 받지 않는다 → 3D 모델·글꼴이 먼저 받아져 메인이 빨리 뜬다
  const SKIP_INTRO = true;

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
  if (!SKIP_INTRO) {
    video.src = video.dataset.src;
    video.preload = 'auto';
    video.play().catch(() => {});
  }
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
  // SKIP_INTRO 는 위쪽(영상 불러오기 전)에서 정한다
  // 새로고침 시 브라우저가 이전 스크롤 위치를 복원하면 히어로가 '스크롤됨' 상태로 시작해 텍스트가 안 보임 → 항상 맨 위에서 시작
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  if (SKIP_INTRO) {
    document.documentElement.dataset.skipIntro = '';
    video.pause();
    window.__introDone = true;
    // intro:done 은 LandingPage 가 장면(3D) 엔진을 붙인 뒤 보낸다 (원래는 DOMContentLoaded)
  } else {
    requestAnimationFrame(frame);
  }




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
      if (logo) { const q = fade(0.05, 0.9); logo.style.filter = q > 0 ? `blur(${(22 * q).toFixed(2)}px)` : ''; logo.style.opacity = (1 - q).toFixed(3); logo.style.transform = `scale(${(1 + 0.04 * q).toFixed(4)})`; }
      if (cue) { cue.style.opacity = (1 - fade(0, 0.5)).toFixed(3); window.__tb(cue, 4 * fade(0, 0.5)); }
      window.__heroWheel = 1 - fade(0.1, 0.7);   // 목차 링: 히어로 글씨와 함께 사라짐 (이후엔 마우스를 왼쪽 끝에 가져가면 다시 펼쳐짐 — 목차 코드에서 처리)
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
    if (window.ResizeObserver) { const ro = new ResizeObserver(remeasure); yRefs.forEach((el) => ro.observe(el)); }
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
    ['1948', '1972', '1977', '1981', '2026'].forEach((k) => { const im = new Image(); im.src = `/assets/landing/history/line-${k}.webp`; });   // 미리 받아둠
    fetch('/assets/landing/history/drawings.json').then((r) => r.json()).then((j) => { D = j; }).catch(() => {});   // 연도별 도면 (선 경로·래스터 정보)
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
        drawEl.style.filter = leave > 0.002 ? `blur(${(8 * leave).toFixed(2)}px)` : '';   // 다음 해로 넘어갈 때 블러되며 사라짐
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
    let cnameCur = 'pebble white', cnameT = -1;
    window.__colorIn = (sc) => {
      const base = Math.min(1, Math.max(0, (sc - 8.8) / 0.4));
      cWords.forEach((w, i) => {
        const t = Math.min(1, Math.max(0, (sc - 8.85 - i * 0.04) / 0.38)), e = 1 - Math.pow(1 - t, 3);
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
      const out = Math.min(1, Math.max(0, (sc - 12.4) / 0.4)), oe = out * out * (3 - 2 * out);   // 부품 장면으로 넘어가며 카메라와 함께 블러로 사라짐
      cname.style.opacity = (0.85 * e0 * dip * (1 - oe)).toFixed(3);
      window.__tb(cname, 8 * (1 - e0) + 6 * (1 - dip) + 10 * oe);
      if (out > 0) cWords.forEach((w) => { w.style.opacity = (parseFloat(w.style.opacity) * (1 - oe)).toFixed(3); window.__tb(w, 10 * oe); });
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
    pBox.innerHTML = P_INFO.map((d) => `<img src="/assets/landing/parts/part-${d.img}.webp" alt="" decoding="async">`).join('');
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
      if (t <= 0 || sc >= P_OUT + 0.6) { pImgCur = -1; if (pLit.some(Boolean)) pIns.forEach((el, i) => { pLit[i] = false; el.style.transitionDelay = ''; el.classList.remove('on'); }); return; }
      const now = performance.now();
      const U = innerHeight / 1080;
      // 확대샷: 카메라가 떠오르기 시작하면 아래에서 블러된 채 올라와 서서히 초점
      const it = Math.min(1, Math.max(0, (t - 0.15) / 0.85)), ie = 1 - Math.pow(1 - it, 3);
      // 퇴장: 다음 장면(필름)으로 넘어가며 확대샷이 블러되며 위로 빠져나감
      const xo = Math.min(1, Math.max(0, (sc - P_OUT) / 0.6)), xe = xo * xo * (3 - 2 * xo);
      pBox.style.transform = `translate3d(0, ${((1 - ie) * 42 - xe * 60).toFixed(2)}vh, 0)`;
      pBox.style.filter = ie >= 0.999 && xe <= 0.001 ? '' : `blur(${(22 * (1 - ie) + 20 * xe).toFixed(2)}px)`;
      pBox.style.opacity = (Math.min(1, it * 1.6) * (1 - Math.max(0, xo - 0.55) / 0.45)).toFixed(3);
      const xY = -xe * 22 * innerHeight / 100;   // 퇴장: 전체가 위로 22vh
      PT.style.opacity = Math.max(0, 1 - Math.max(0, (xo - 0.1) / 0.55)).toFixed(3);   // 가운데 문구가 뜨기 전에 사라짐
      PT.style.filter = xe > 0.001 ? `blur(${(10 * xe).toFixed(2)}px)` : '';
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
        r.style.filter = mt >= 0.999 ? '' : `blur(${((1 - mt) * 10).toFixed(2)}px)`;
      });
      const tt = Math.min(1, Math.max(0, (t - 0.45) / 0.55));
      pFades.forEach((el, i) => {
        const ti = Math.min(1, Math.max(0, tt * 1.4 - (pFades.length - 1 - i) * 0.06)), te = 1 - Math.pow(1 - ti, 3);
        el.dataset.base = te; el.style.opacity = te.toFixed(3);
        if (el.classList.contains('pmrow')) el.style.filter = te >= 0.999 ? '' : `blur(${(5 * (1 - te)).toFixed(2)}px)`;   // N·O·W 글자는 각자 색(회색/흰색)을 그대로 두고 흐림만
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
        pCount.textContent = `(${cc}/${nn})`;
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
          b.style.filter = bb < 0.999 ? `blur(${(9 * (1 - bb)).toFixed(2)}px)` : '';
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
    let fGapM = null;
    window.__film = (sc) => {
      // ── 문장 장면 ──
      const mOn = sc > M_UP[0] - 0.05 && sc < M_OUT[1] + 0.05;
      MSG.style.visibility = mOn ? 'visible' : 'hidden';
      mLines.classList.toggle('on', sc > M_UP[0] + 0.02);           // kinoria 처럼 처음 보일 때 1.4초에 걸쳐 블러 → 또렷 (스크롤을 올려 사라지면 다시)
      const up = Math.min(1, Math.max(0, (sc - M_UP[0]) / (M_UP[1] - M_UP[0]))), ue = 1 - Math.pow(1 - up, 3);
      mLines.style.transform = `translateY(calc(-50% + ${((1 - ue) * 78).toFixed(2)}vh))`;   // 아래 화면 밖에서 스크롤에 붙어 올라와 가운데에 멈춤
      const ho = Math.min(1, Math.max(0, (sc - M_OUT[0]) / (M_OUT[1] - M_OUT[0]))), he = ho * ho * (3 - 2 * ho);
      mOthers.forEach((el) => {                                          // 나머지 문장: 살짝 위로 뜨며 블러되며 사라짐
        el.style.opacity = (1 - sm(0, 0.8, ho)).toFixed(3);                            // 서서히 블러되며 위로 떠올라 사라짐
        el.style.filter = ho > 0.001 ? `blur(${(12 * sm(0, 0.8, ho)).toFixed(2)}px)` : '';
        el.style.transform = ho > 0.001 ? `translateY(${(-1.1 * he).toFixed(3)}em)` : '';
      });
      mKeys.forEach((el) => { el.style.opacity = sc >= M_OUT[0] ? '0' : ''; });   // 퇴장이 시작되면 다음 장면의 세 단어가 같은 자리에서 이어받음
      // ── Make a Moment Last ──
      const on = sc >= M_OUT[0];
      FL.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
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
      const sp = 1 - Math.pow(1 - k, 2.4), lsEm = 0.3 * sp;
      const fsz = gap / 0.45, lsPx = lsEm * fsz;
      [fW[0], fW[2]].forEach((w) => { w.style.letterSpacing = sp > 0.0005 ? `calc(-.01em + ${lsEm.toFixed(4)}em)` : ''; });
      const sp0 = Math.max((mob ? 0.45 : 1) * 404 * U, fW[1].offsetWidth / 2 + Math.max(fW[0].offsetWidth, fW[2].offsetWidth) / 2 + gap);
      const cx = innerWidth / 2, cy = innerHeight / 2, edge = innerWidth * 0.04;
      fW.forEach((w, i) => {
        const vw = w.offsetWidth - (i === 1 ? 0 : lsPx);                     // 보이는 글자 폭 (마지막 글자 뒤 자간 제외)
        const s1 = innerWidth / 2 - edge - vw / 2;                           // 가장자리에 닿았을 때 가운데까지 거리
        const lim = innerWidth / 2 - vw / 2 - 14;                            // 좁은 화면에서도 단어가 화면 밖으로 나가지 않게
        let dx = i === 1 ? 0 : (i === 0 ? -1 : 1) * Math.min(sp0 + Math.max(0, s1 - sp0) * sp, lim) + (i === 1 ? 0 : lsPx / 2), dy = 0;
        if (he < 1) {                                                        // 문장 속 위치 → 가운데 자리
          const r = mKeys[i].getBoundingClientRect();
          dx = (r.left + r.width / 2 - cx) * (1 - he) + dx * he; dy = (r.top + r.height / 2 - cy) * (1 - he);
        }
        w.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px - ${(oe * 6).toFixed(2)}vh))`;
        const base = 1 - oe;
        if (i === 1) {   // 사진이 거의 다 커졌을 때 a Moment → a Memory 로 블러 교차 (kinoria opens → needs)
          const sw = Math.min(1, Math.max(0, (k - 0.8) / 0.1)), se = sw * sw * (3 - 2 * sw);
          w.style.opacity = (base * (1 - se)).toFixed(3); window.__tb(w, 10 * oe + 9 * se);
          fWx.style.transform = w.style.transform; fWx.style.opacity = (base * se).toFixed(3); window.__tb(fWx, 10 * oe + 9 * (1 - se));
        } else { w.style.opacity = base.toFixed(3); window.__tb(w, 10 * oe); }
      });
      // 사진: 나머지 문장이 사라지면 가운데에 작게 나타나고, 넘김 동안 맨 위 사진이 바뀌며 커짐 (272 → 659px, 1920 기준)
      const n = fPrints.length, top = sc < B_A ? 0 : Math.min(n - 1, Math.floor(k * n));
      if (top !== window.__fTop) { if (window.__fTop !== undefined && sc >= B_A && sc <= B_B) dispatchEvent(new Event('pl-flick')); window.__fTop = top; }   // 사진 넘김 소리
      const s0 = 272 / 659, grow = s0 + (1 - s0) * ke;
      const pin = Math.min(1, Math.max(0, (sc - (B_A - 0.06)) / 0.12));   // 나머지 문장이 거의 사라지자마자 가운데에 작게 나타나 바로 와다다다 넘어가며 커짐
      fPrints.forEach((im, i) => {
        if (i > top || i < top - 2) { im.style.opacity = 0; return; }
        const d = top - i;
        im.style.opacity = (pin * (1 - out)).toFixed(3);
        im.style.zIndex = String(i);
        im.style.transform = `translateY(${(-oe * 95).toFixed(2)}vh) scale(${(grow * (0.92 + 0.08 * pin)).toFixed(4)})`;   // 기울기 없이 똑바로 정확히 포개짐
        im.style.filter = (d > 0 ? `brightness(${(1 - d * 0.2).toFixed(2)}) ` : '') + (oe > 0.01 ? `blur(${(14 * oe).toFixed(1)}px)` : pin < 1 ? `blur(${(8 * (1 - pin)).toFixed(1)}px)` : '');
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
    const ITEMS = ['Details', 'Shot', 'About', 'Archive', 'Colors', 'Parts', 'Film'];   // 히어로(제품) · 플래시·사진 출력 · 브랜드 문구 · 역사 도면 · 컬러 · 부품 확대샷 · 필름 사진
    const u = () => innerHeight / 1080;
    const STEP = 5, EXT = 9;                     // 항목 1칸 = 눈금 5개 (항목 눈금 + 작은 눈금 4개). 첫·마지막 항목 바깥은 눈금 9개
    const ticks = [];
    for (let t = -EXT; t <= (ITEMS.length - 1) * STEP + EXT; t++) {
      const el = document.createElement('i'); el.className = 'tk'; trk.appendChild(el);
      ticks.push({ el, t, major: t % STEP === 0 && t >= 0 && t <= (ITEMS.length - 1) * STEP });
    }
    ITEMS.forEach((name, k) => { const a = document.createElement('a'); a.dataset.k = k; a.textContent = name.toUpperCase(); trk.appendChild(a); });
    const links = [...trk.querySelectorAll('a')];
    let active = 0, pos = 0, vel = 0, hoverOff = 0, hid = 0, lastScrT = -1e9;
    addEventListener('scroll', () => { lastScrT = performance.now(); }, { passive: true });
    // 휠·드래그로 링을 돌림 → 손을 떼면 가장 가까운 항목에 맞춰 멈춤
    let peek = 0, peekT = 0, drag = null, moved = false;
    const maxK = ITEMS.length - 1;
    const clampP = (v) => Math.max(-active - 0.4, Math.min(maxK - active + 0.4, v));
    // 섹션 ↔ 스크롤 위치(장면 단위 sc). 항목별 대표 장면
    const SPAN = () => window.__SPAN || 5;
    const GO = [0, 1.25, 3.45, 4.3, 9.1, 15.4, 17.95];                 // 각 섹션으로 이동했을 때 멈출 장면 (그 섹션의 대표 장면)
    const sectionAt = (sc) => sc < 0.5 ? 0 : sc < 2.45 ? 1 : sc < 3.9 ? 2 : sc < 7.3 ? 3 : sc < 14.6 ? 4 : sc < 16.95 ? 5 : 6;   // Colors 에 ZERO PRINTS 장면 포함
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
    // 히어로 이후: 평소엔 숨기고, 마우스를 화면 왼쪽 끝으로 가져가면 링이 다시 펼쳐짐 (링 위에 있는 동안은 유지)
    let mx = 1e9, reveal = 0, autoSec = 0;
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') mx = e.clientX; }, { passive: true });
    document.addEventListener('pointerleave', () => { mx = 1e9; }, { signal });
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
      const U0 = u(), heroV = window.__heroWheel ?? 1;
      const want = reveal > 0.5 ? mx < 260 * U0 + 40 : mx < 60 * U0 + 24;   // 들어올 땐 좁게, 펼쳐진 뒤엔 링 폭만큼 넉넉하게
      reveal += ((want ? 1 : 0) - reveal) * (1 - Math.exp(-dt * (want ? 9 : 4)));
      const vis = Math.max(heroV, heroV < 0.99 ? reveal : 0);
      wheel.style.filter = vis >= 0.999 ? '' : `opacity(${vis.toFixed(3)})`;
      wheel.style.pointerEvents = vis > 0.3 ? '' : 'none';   // 숨어 있을 땐 페이지 스크롤을 막지 않게
      if (!drag && now - peekT > 220 && Math.abs(peek) > 0.5) settle();      // 휠을 멈추면 가장 가까운 항목으로
      if (!drag) peek += (0 - peek) * (1 - Math.exp(-dt * 6));
      const target = active + peek;
      // 임계 감쇠 스프링 → 부드럽게 도착
      const k = 60, c = 2 * Math.sqrt(k);
      vel += (k * (target - pos) - c * vel) * dt; pos += vel * dt;
      // 피그마 값에서 역산: 눈금 1칸 = 0.05rad, 링 반지름 252.6px, 크기 = cos^1.2, 투명도 = 크기^1.25 (@1080)
      // 스크롤 중엔 왼쪽으로 부드럽게 빠졌다가, 멈추면 다시 나옴
      const scrolling = now - lastScrT < 160;
      hid += ((scrolling ? 1 : 0) - hid) * (1 - Math.exp(-dt * 6));
      const U = u(), TH = 0.05, R = 252.6 * U, CY = 540 * U, P = pos * STEP;
      wheel.style.transform = `translate3d(${(-hid * (260 * U)).toFixed(1)}px, -50%, 0)`;
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


  /* 커서는 공통 SiteCursor(@/shared/components/SiteCursor)로 옮겨 모든 페이지에서 쓴다 */


  /* 사운드: 처음엔 꺼짐(브라우저 자동재생 정책). Sound 를 누르면 켜짐/꺼짐 — 선택은 기억함.
     소리는 파일 없이 브라우저에서 합성: 잔잔한 배경음 · 셔터 찰칵(섬광 순간) · 사진 토출 모터음 · 사진 넘김 소리 */
  (function(){
    const btns = [document.querySelector('.ui .meta .sound'), document.querySelector('.sndfix')].filter(Boolean);
    let on = false, ac = null, master = null, amb = null;
    try { on = localStorage.getItem('pl-sound') === '1'; } catch (e) {}
    const nbCache = {};
    const noiseBuf = (sec) => {   // 잡음은 길이별로 한 번만 만들어 두고 재사용 (셔터 순간에 새로 만드느라 멈칫하지 않게)
      const key = sec.toFixed(2); if (nbCache[key]) return nbCache[key];
      const b = ac.createBuffer(1, Math.floor(ac.sampleRate * sec), ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = 0.97 * l + 0.03 * w; d[i] = 0.6 * w + 4 * l; } return (nbCache[key] = b);
    };
    function ensure() {
      if (ac) return true;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ac = new AC(); signal.addEventListener('abort', () => { try { ac.close(); } catch (e) { /* 이미 닫힘 */ } });   // 페이지를 떠나면 소리 끔
      master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
      // 배경음: 낮은 화음(A2 · E3 · A3)이 천천히 숨 쉬듯 + 아주 옅은 필름 잡음
      amb = ac.createGain(); amb.gain.value = 0.05;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4;
      const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 260; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
      [[110, 'triangle', 0.5], [164.81, 'sine', 0.35], [220.4, 'sine', 0.22], [109.6, 'sine', 0.3]].forEach(([f, t, g]) => {
        const o = ac.createOscillator(), og = ac.createGain(); o.type = t; o.frequency.value = f; og.gain.value = g; o.connect(og); og.connect(lp); o.start();
      });
      const nz = ac.createBufferSource(); nz.buffer = noiseBuf(4); nz.loop = true;
      const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 2400; nf.Q.value = 0.6;
      const ng = ac.createGain(); ng.gain.value = 0.05; nz.connect(nf); nf.connect(ng); ng.connect(amb); nz.start();
      lp.connect(amb); amb.connect(master);
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
    const ZA = 12.4, UP = [12.55, 13.1], CN = [13.18, 13.62], SW = [13.72, 13.92], OUT = [14.15, 14.5];   // 숫자 세기는 짧은 스크롤에 16단계 → 와다다 빠르게
    const cl = (x) => Math.min(1, Math.max(0, x)), rg = (a, b, x) => cl((x - a) / (b - a)), eo = (t) => 1 - Math.pow(1 - t, 3), sm = (t) => t * t * (3 - 2 * t);
    let zM = null;
    // 마지막 장면 타이밍: 사진이 위로 빠져나가는 동안(19.5~) 배경 글씨가 바뀌고 → 사진·세 단어가 다 빠진 뒤(19.9~) 밝아지며 빛이 차오름. 카메라 낙하는 scene.js END_A(19.95)
    const AD = [19.5, 19.95, 20.25, 20.5];
    const ADJ = document.querySelector('.zadj'), ADJg = ADJ.querySelector('.zadj-g'), ADJa = ADJ.querySelector('.zadj-a');
    let adjM = null;
    const adjFit = () => {   // 글씨 폭 = POLAROID 배경 글씨 폭(화면의 60%), 세로 가운데도 배경 글씨와 같게
      if (adjM && adjM.w === innerWidth && adjM.h === innerHeight) return;
      const r = G.getBoundingClientRect(); if (!r.width) return;
      ADJ.style.fontSize = '100px';
      const wpx = ADJ.querySelector('.zadj-t').offsetWidth; if (!wpx) return;
      ADJ.style.fontSize = (100 * r.width / wpx).toFixed(2) + 'px';
      ADJ.style.top = (r.top + r.height / 2).toFixed(1) + 'px';
      adjM = { w: innerWidth, h: innerHeight };
    };
    addEventListener('resize', () => { adjM = null; });
    (window.__fontsReady || Promise.resolve()).then(() => { adjM = null; });
    window.__zx = (sc) => {
      // POLAROID 배경 글씨: 카메라가 블랙이 된 뒤(12.2)부터 서서히 나타나 이후 장면 내내 은은하게 유지
      // 마지막 장면: POLAROID 배경 글씨가 같은 자리에서 DEVELOPED 로 블러 교차(은은한 밝기 그대로) → 밝아지며 빛남
      const swp = sm(rg(AD[0], AD[1], sc)), lit = sm(rg(AD[1] - 0.05, AD[2], sc)), adjGl = eo(rg(AD[1], AD[3], sc));
      { const go = (0.04 * eo(rg(12.2, 12.7, sc)) * (1 - swp)).toFixed(3); if (G.style.opacity !== go) G.style.opacity = go; G.style.filter = swp > 0.001 && swp < 0.999 ? `blur(${(8 * swp).toFixed(1)}px)` : ''; }
      adjFit();
      if (swp > 0) {
        ADJ.style.visibility = 'visible';
        ADJ.style.opacity = (0.05 * swp + 0.95 * lit).toFixed(3);
        ADJ.style.filter = swp < 0.999 ? `blur(${(8 * (1 - swp)).toFixed(1)}px)` : '';
        ADJ.style.transform = `translate(-50%, -50%) scale(${(0.985 + 0.015 * lit).toFixed(4)})`;
        ADJg.style.opacity = adjGl.toFixed(3); ADJa.style.opacity = adjGl.toFixed(3);
      } else if (ADJ.style.visibility !== 'hidden') ADJ.style.visibility = 'hidden';
      const vis = sc > ZA && sc < OUT[1] + 0.05;
      Z.forEach((z) => { z.style.visibility = vis ? 'visible' : 'hidden'; z.classList.toggle('on', sc > UP[0] + 0.05 && sc < OUT[1]); });
      if (!vis) return;
      const H = innerHeight, mob = innerWidth / H < 0.8;
      if (!zM || zM.w !== innerWidth || zM.h !== innerHeight) zM = { w: innerWidth, h: innerHeight, fs: parseFloat(getComputedStyle(F.querySelector('.zd')).fontSize) || 120 };
      const fs = zM.fs;
      // kinoria 실측(1646×889) 간격: 두 줄 사이 0.93em · 아랫줄 가운데 → ONE PRESS 가운데 0.904em · → 설명글 가운데 1.319em (큰 글씨 크기 기준)
      const yW = H * (mob ? 0.47 : 0.515), yC = yW - 0.93 * fs, yS = mob ? H * 0.66 : yW + 0.904 * fs, yB = mob ? H * 0.74 : yW + 1.319 * fs;
      const ho = sm(rg(OUT[0], OUT[1], sc));                                         // 퇴장: 위로 살짝 떠오르며 블러로 사라짐
      const place = (el, y, d) => {                                                 // 아래에서 스크롤에 붙어 올라옴 (줄마다 조금씩 늦게)
        const u = eo(rg(UP[0] + d, UP[1] + d, sc));
        el.style.top = '0px';
        el.style.transform = `translate3d(0, ${(y - el.offsetHeight / 2 + (1 - u) * 0.42 * H - ho * 0.08 * H).toFixed(1)}px, 0)`;
        el.style.opacity = (u * (1 - ho)).toFixed(3);
        el.style.filter = ho > 0.002 ? `blur(${(10 * ho).toFixed(2)}px)` : '';
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
        g.style.filter = pk > 0.01 ? `blur(${gBl.toFixed(2)}px)` : (ck > 0.01 ? 'blur(1px)' : '');
        const t = s > 0.5 ? txtB : txtA; if (g.textContent !== t) g.textContent = t;
      });
      ghost(gs, 'MINUTES', 'MEMORY', false);
      ghost(gs1, cnt.textContent, 'ONE', true);                                // 위 줄 잔상은 바뀌는 순간에만
      cnt.style.opacity = (1 - s).toFixed(3); cnt.style.filter = s > 0.001 ? `blur(${(bl + 6 * s).toFixed(2)}px)` : '';
      cnt2.style.opacity = s.toFixed(3); cnt2.style.filter = s < 0.999 ? `blur(${(bl + 6 * (1 - s)).toFixed(2)}px)` : '';
      cnt.style.textShadow = cnt2.style.textShadow = glow;
      w1.style.opacity = (1 - s).toFixed(3);
      w1.style.filter = ck > 0.01 || s > 0.001 ? `blur(${(1.1 * ck + bl + 6 * s).toFixed(2)}px)` : '';
      w1.style.textShadow = pk > 0.01 ? glow : ck > 0.01 ? `0 0 ${(0.1 * fs * ck).toFixed(1)}px rgba(255,236,214,${(0.06 * ck).toFixed(3)})` : '';
      w2.style.opacity = s.toFixed(3);
      w2.style.filter = s < 0.999 ? `blur(${(bl + 6 * (1 - s)).toFixed(2)}px)` : '';
      w2.style.textShadow = glow;
      void counting;
    };
  })();
}
