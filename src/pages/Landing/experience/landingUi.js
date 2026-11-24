/**
 * Landing 화면 UI 엔진 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)의 화면 스크립트를 그대로 옮긴 1차 이식본.
 * - 뷰파인더 인트로(현재 SKIP_INTRO 로 숨김), 히어로 타이포 등장·퇴장, 사진 뒤 문구(블러→초점),
 *   역사 연도·도면, NOW·컬러 타이포, 왼쪽 목차 링(섹션 이동)을 담당한다.
 * - 3D 장면(@/features/landing-camera/engine)과는 window.__* 값으로 주고받는다 (프로토타입 구조 유지).
 *   계약(cameraContract.js) 기반으로 나누는 작업은 다음 단계에서 한다.
 *
 * @param {AbortSignal} signal 페이지를 떠날 때 abort → 이벤트·루프 정리
 */
export function mountLandingUi(signal) {
  // ── 프로토타입(아티팩트) 코드를 그대로 옮기기 위한 범위 한정 ──
  // 창(window)에 다는 이벤트는 페이지를 떠날 때 signal 로 한 번에 해제되고, 애니메이션 루프도 함께 멈춘다.
  const withSignal = (o) => (o && typeof o === 'object' ? { ...o, signal } : { capture: !!o, signal });
  const addEventListener = (type, fn, o) => window.addEventListener(type, fn, withSignal(o));
  const requestAnimationFrame = (fn) => (signal.aborted ? 0 : window.requestAnimationFrame((t) => { if (!signal.aborted) fn(t); }));
  const setTimeout = (fn, ms) => { const id = window.setTimeout(() => { if (!signal.aborted) fn(); }, ms); signal.addEventListener('abort', () => window.clearTimeout(id)); return id; };

  /* 글자 블러: CSS filter 대신 text-shadow 로 — iOS 사파리에서 글자에 filter:blur 를 걸면 가장자리에 검은 테두리가 생김 (Kinoria 처럼 깨끗하게) */
  window.__tb = (el, px, extra) => { const s = el.style; s.filter = '';
    if (!(px > 0.05)) { s.color = ''; s.textShadow = extra || ''; return; }
    const k = Math.min(1, px / 5);
    s.color = `rgba(255,255,255,${(1 - 0.92 * k).toFixed(3)})`;
    s.textShadow = `0 0 ${px.toFixed(2)}px rgba(255,255,255,${(0.45 + 0.55 * k).toFixed(3)})` + (extra ? ', ' + extra : ''); };
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
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setPart('fonts', 1));

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
  // [임시] 인트로(로딩 → 영상 → 뷰파인더 빠져나오기) 숨김 — 히어로부터 개발. 되살리려면 SKIP_INTRO = false
  const SKIP_INTRO = true;
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
    function yearAt(sc) {
      if (sc <= MS[0][1]) return MS[0][0];
      for (let i = 0; i < MS.length - 1; i++) {
        const a = MS[i], b = MS[i + 1];
        if (sc < a[2]) return a[0];
        if (sc < b[1]) { const t = (sc - a[2]) / (b[1] - a[2]); return a[0] + (b[0] - a[0]) * (i === MS.length - 2 ? easeOutQuart(t) : ease(t)); }
      }
      return MS[MS.length - 1][0];
    }
    // 4자리 드럼
    const drums = [], drumEls = [];
    for (let d = 0; d < 4; d++) {
      const dg = document.createElement('span'); dg.className = 'dg';
      for (let n = 0; n < 10; n++) { const f = document.createElement('i'); f.textContent = n; dg.appendChild(f); }
      yearEl.appendChild(dg); drums.push([...dg.children]); drumEls.push(dg);
    }
    // 숫자별 실제 글자폭(em) — 연도 폰트(Outfit) 로드 후 캔버스로 측정
    let ADV = null;
    const measureAdv = () => {
      const cs = getComputedStyle(yearEl), c = document.createElement('canvas').getContext('2d');
      c.font = `${cs.fontWeight} 100px ${cs.fontFamily}`;
      ADV = [...'0123456789'].map((ch) => c.measureText(ch).width / 100);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { measureAdv(); lastSc = -1; });
    function setYear(Y) {                                  // 주행거리계 방식: 1의 자리는 연속 회전, 윗자리는 아래 자리가 9→0 넘어갈 때만 함께 굴러감
      for (let d = 0; d < 4; d++) {
        const k = 3 - d, P = Math.pow(10, k);
        let v = Math.floor(Y / P) % 10;
        if (k === 0) v = Y % 10;
        else { const low = Y % P; if (low > P - 1) v += low - (P - 1); }
        if (ADV) {   // 칸 너비: 지금 보이는 숫자(굴러가는 중이면 두 숫자 사이 보간)의 글자폭 + 자간
          const a = Math.floor(v) % 10, b2 = (a + 1) % 10, t = v - Math.floor(v);
          const fs = parseFloat(getComputedStyle(yearEl).fontSize), ls = parseFloat(getComputedStyle(yearEl).getPropertyValue('--ls')) || 0;
          const w = (ADV[a] * (1 - t) + ADV[b2] * t) * fs + (d < 3 ? ls : 0);
          drumEls[d].style.width = w.toFixed(2) + 'px';
        }
        drums[d].forEach((f, n) => {
          let d = n - v; d = ((d + 5) % 10 + 10) % 10 - 5;              // -5..5 (0 = 현재 숫자)
          if (Math.abs(d) > 1.2) { f.style.opacity = 0; return; }
          // 아래에서 올라와 위로 넘어감: 위쪽으로 빠지는 숫자는 뒤로 눕고(rotateX), 아래 숫자는 앞으로 세워지며 들어옴
          f.style.transform = `translateY(${(d * 92).toFixed(2)}%) rotateX(${(-d * 62).toFixed(2)}deg) scale(${(1 - 0.12 * Math.abs(d)).toFixed(3)})`;
          f.style.opacity = Math.max(0, 1 - Math.abs(d) * 0.85).toFixed(3);
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
    let lastSc = -1;
    window.__hist = (sc, W, Hh) => {
      { const pj = window.__nowProj; if (pj) H.style.setProperty('--tb', (pj.oy - 0.5687 * pj.ppu - Math.max(18, 40 * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1))) + 'px'); }
      window.__colorIn && window.__colorIn(sc);
      if (Math.abs(sc - lastSc) < 0.0004) return; lastSc = sc;
      const U = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
      // 앞 장면 카피 퇴장 (블러 아웃)
      const so = Math.min(1, Math.max(0, (sc - 3.65) / 0.35));
      if (so > 0 || story.dataset.out) { story.querySelectorAll('.sw').forEach((w) => window.__tb(w, so > 0 ? 10 * so : 0)); if (so > 0) story.dataset.out = 1; else delete story.dataset.out; }
      story.style.opacity = (1 - so).toFixed(3);
      // 섹션 등장/퇴장
      const inK = Math.min(1, Math.max(0, (sc - 3.9) / 0.3));
      const outK = Math.min(1, Math.max(0, (sc - 7.25) / 0.35));
      const Y = yearAt(sc);
      setYear(Y);
      const focus = (k) => `blur(${(9 * (1 - k)).toFixed(2)}px)`;
      yearEl.style.opacity = (inK * (1 - outK)).toFixed(3); window.__tb(yearEl, inK < 1 ? 9 * (1 - inK) : 8 * outK);
      const sinceK = inK * (1 - Math.min(1, Math.max(0, (sc - 4.3) / 0.2)));
      sinceEl.style.opacity = sinceK.toFixed(3); window.__tb(sinceEl, 9 * (1 - sinceK));
      // 현재 마일스톤
      let m = null, mi = -1;
      for (let i = 1; i < MS.length; i++) if (sc >= MS[i][1] - 0.18 && sc < MS[i][2] + 0.12) { m = MS[i]; mi = i; }
      if (m) {
        showDrawing(m[4], U, W);
        const draw = Math.min(1, Math.max(0, (sc - (m[1] - 0.18)) / 0.32));            // 선이 그려짐
        const leave = m[2] > 90 ? Math.min(1, Math.max(0, (sc - 7.5) / 0.55)) : Math.min(1, Math.max(0, (sc - m[2]) / 0.12));
        const w = +drawEl.dataset.w || 600, h = +drawEl.dataset.h || 500;
        // 2026 도면과 같은 크기: 2026 도면은 실물 카메라에 맞춰 화면 폭의 (39.27%×0.886) 폭, 세로/가로 0.5955 비율.
        // 다른 도면도 화면에서 차지하는 면적이 2026 도면과 같도록 맞춤 → 모양(가로·세로 비율)은 달라도 체감 크기가 같음
        const w26 = (W / Hh < 0.8 ? 0.84 : 0.3927) * (0.31 / 0.35) * W * (1204 / 1156), A26 = w26 * w26 * 0.5955;
        const S = Math.min(Math.sqrt(A26 / (w * h)), 0.86 * W / w);
        if (m[4] !== '2026' || !window.__nowProj) { drawEl.style.width = (w * S) + 'px'; drawEl.style.height = (h * S) + 'px'; }
        drawEl.style.opacity = (1 - leave).toFixed(3);
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
      } else { drawEl.style.opacity = 0; modelEl.style.opacity = 0; }
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
      cname.style.opacity = (0.85 * e0 * dip).toFixed(3);
      window.__tb(cname, 8 * (1 - e0) + 6 * (1 - dip));
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
    const ITEMS = ['Details', 'Shot', 'About', 'Archive', 'Colors'];   // 히어로(제품) · 플래시·사진 출력 · 브랜드 문구 · 역사 도면 · 컬러
    const u = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || (innerHeight / 1080);
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
    const SPAN = () => window.__SPAN || 6;
    const GO = [0, 1.25, 3.45, 4.3, 9.1];                 // 각 섹션으로 이동했을 때 멈출 장면 (그 섹션의 대표 장면)
    const sectionAt = (sc) => sc < 0.5 ? 0 : sc < 2.45 ? 1 : sc < 3.9 ? 2 : sc < 7.3 ? 3 : 4;
    let nav = null;                                             // 이동 중인 스크롤 애니메이션
    const go = (k) => {
      if (GO[k] == null) return;
      const from = scrollY, to = Math.round(GO[k] * innerHeight * SPAN());
      const dist = Math.abs(to - from) / (innerHeight * SPAN());
      nav = { from, to, t0: performance.now(), dur: 900 + Math.min(1300, dist * 260), k };
      active = k; peek = 0;
    };
    const stopNav = () => { nav = null; };
    addEventListener('wheel', (e) => { if (!wheel.contains(e.target)) stopNav(); }, { passive: true });
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
}
