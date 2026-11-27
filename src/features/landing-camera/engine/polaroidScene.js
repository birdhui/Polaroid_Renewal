/**
 * Polaroid Now 3D 장면 엔진 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)의 three.js 장면을 그대로 옮긴 이식본 (3차: 아티팩트 최신본 전체).
 * 히어로(책상 위에서 내려다보는 구도 → 스크롤하면 정면) · 플래시와 사진 출력 · 역사 · NOW 도면 정합 · 8가지 컬러 회전 →
 * ZERO MINUTES → 부품 목록 · Make a Moment Last · NOW 장면 · 사용자 경험 설계(SHOT) 전후의 카메라까지, 오로라 배경과 함께 그린다.
 *
 * 주의 (다음 단계 정리 대상): 프로토타입 구조를 유지하느라 지금은 window 스크롤을 직접 읽고
 * window.__* 값으로 Landing UI 엔진과 주고받는다. cameraContract.js 의 props 계약으로 나누는 작업은 따로 진행한다.
 *
 * @param {AbortSignal} signal 페이지를 떠날 때 abort → 이벤트·루프 정리
 * @returns {() => void} 렌더러·GPU 자원 정리 함수
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* =====================================================================
   메인에 다시 들어와도 버벅이지 않게: 무거운 준비는 한 번만 하고 페이지를 오가는 동안 재사용한다.
   · 모델 파일(.glb)은 한 번만 받아 메모리에 둔다
   · Draco 압축 풀기는 Web Worker + WebAssembly 로 (메인 스레드를 막지 않음, 워커는 계속 살려 둠)
   · 플래시 렌즈·바디 그레인 텍스처는 처음 한 번만, 그것도 잘게 나눠 그려서 화면이 멈추지 않게
   ===================================================================== */
const MODEL_URL = '/assets/landing-camera/polaroid-now.glb';
let sharedDraco = null;
function getDraco() {
  if (!sharedDraco) {
    sharedDraco = new DRACOLoader().setDecoderPath('/assets/landing-camera/draco/').setDecoderConfig({ type: 'wasm' });
    sharedDraco.preload();
  }
  return sharedDraco;
}
let glbBytes = null;
function loadGlbBytes() {
  if (!glbBytes) {
    glbBytes = fetch(MODEL_URL)
      .then((res) => {
        if (!res.ok) throw new Error('model ' + res.status);
        return res.arrayBuffer();
      })
      .catch((e) => {
        glbBytes = null; // 실패하면 다음에 다시 시도
        throw e;
      });
  }
  return glbBytes;
}
/** 메인 스레드를 잠깐 양보 (긴 계산을 조각내 화면이 멈추지 않게) */
const yieldFrame = () => new Promise((res) => setTimeout(res, 0));
/** rows 줄을 몇 줄씩 나눠 계산 — 한 조각이 약 8ms 를 넘지 않게 */
async function forRowsChunked(rows, fn) {
  let t = performance.now();
  for (let j = 0; j < rows; j++) {
    fn(j);
    if (performance.now() - t > 8) {
      await yieldFrame();
      t = performance.now();
    }
  }
}

/* 정면 플래시: 프레넬 렌즈(동심원 홈) 텍스처 — 블렌더 절차적 셰이더를 구운 것. 세션 동안 한 번만 만든다 */
let flashCanvases = null;
function getFlashCanvases() {
  if (flashCanvases) return flashCanvases;
  flashCanvases = (async () => {
    const N = 1024, R = 34; // R: 동심원 개수
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return [c, c.getContext('2d')]; };
    const [cc, cx] = mk(), [nc, nx] = mk(), [mc, mx] = mk();
    const col = cx.createImageData(N, N), nor = nx.createImageData(N, N), mr = mx.createImageData(N, N);
    const H = (x, y) => { const r = Math.hypot(x, y); return (r * R) % 1; }; // 프레넬 톱니 높이
    await forRowsChunked(N, (j) => {
      for (let i = 0; i < N; i++) {
        const x = (i + 0.5) / N * 2 - 1, y = 1 - (j + 0.5) / N * 2, r = Math.hypot(x, y), k = (j * N + i) * 4;
        const strip = Math.abs(y) < 0.27 && Math.abs(x) < 0.86; // 가로 반사판이 비치는 띠
        const ring = 0.5 + 0.5 * Math.cos(r * R * Math.PI * 2);
        let c;
        if (strip) { const g = 0.46 + 0.14 * ring + 0.2 * Math.exp(-r * r * 9) - 0.12 * Math.abs(x); c = [g * 0.97, g * 0.98, g]; }
        else { const g = 0.66 + 0.06 * ring - 0.05 * r; c = [g * 0.97, g * 0.99, g * 1.02]; }
        col.data[k] = c[0] * 255; col.data[k + 1] = c[1] * 255; col.data[k + 2] = c[2] * 255; col.data[k + 3] = 255;
        // 노멀: 동심원 톱니의 반경 방향 기울기
        const e = 1.5 / N; const dx = (H(x + e, y) - H(x - e, y)), dy = (H(x, y + e) - H(x, y - e));
        const gx = Math.abs(dx) > 0.5 ? 0 : dx / (2 * e) * 0.012, gy = Math.abs(dy) > 0.5 ? 0 : dy / (2 * e) * 0.012;
        const l = Math.hypot(gx, gy, 1);
        nor.data[k] = (-gx / l * 0.5 + 0.5) * 255; nor.data[k + 1] = (-gy / l * 0.5 + 0.5) * 255; nor.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; nor.data[k + 3] = 255;
        // metalness(B) / roughness(G)
        mr.data[k] = 0; mr.data[k + 1] = (strip ? 0.3 : 0.42) * 255; mr.data[k + 2] = (strip ? 0.55 : 0.08) * 255; mr.data[k + 3] = 255;
      }
    });
    cx.putImageData(col, 0, 0); nx.putImageData(nor, 0, 0); mx.putImageData(mr, 0, 0);
    return { map: cc, normalMap: nc, mr: mc };
  })();
  return flashCanvases;
}

/* 바디 질감: 절차적 그레인 노멀맵 (블렌더 노이즈 범프 대체). 세션 동안 한 번만 만든다 */
let grainCanvas = null;
function getGrainCanvas() {
  if (grainCanvas) return grainCanvas;
  grainCanvas = (async () => {
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const cx = cv.getContext('2d'), img = cx.createImageData(N, N), hgt = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) hgt[i] = Math.random();
    for (let k = 0; k < 2; k++) {
      const t = hgt.slice();
      await forRowsChunked(N, (y) => {
        for (let x = 0; x < N; x++) {
          let a = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += t[((y + dy + N) % N) * N + ((x + dx + N) % N)]; hgt[y * N + x] = a / 9;
        }
      });
    }
    const h = (xx, yy) => hgt[((yy + N) % N) * N + ((xx + N) % N)];
    await forRowsChunked(N, (y) => {
      for (let x = 0; x < N; x++) {
        const nx = (h(x - 1, y) - h(x + 1, y)) * 6, ny = (h(x, y - 1) - h(x, y + 1)) * 6, l = Math.hypot(nx, ny, 1), i = (y * N + x) * 4;
        img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
      }
    });
    cx.putImageData(img, 0, 0);
    return cv;
  })();
  return grainCanvas;
}

/** 다른 페이지에 있을 때 미리 불러 둘 수 있게 (모델 파일 받기 + 텍스처 미리 만들기 + 디코더 준비) */
export function preloadPolaroidScene() {
  loadGlbBytes().catch(() => {});
  getDraco();
  getFlashCanvases();
  getGrainCanvas();
}

export function mountPolaroidScene(signal) {
  // ── 프로토타입(아티팩트) 코드를 그대로 옮기기 위한 범위 한정 ──
  // 창(window)·문서(document)에 다는 이벤트는 페이지를 떠날 때 signal 로 한 번에 해제되고, 애니메이션 루프·타이머도 함께 멈춘다.
  const withSignal = (o) => (o && typeof o === 'object' ? { ...o, signal } : { capture: !!o, signal });
  const addEventListener = (type, fn, o) => window.addEventListener(type, fn, withSignal(o));
  const requestAnimationFrame = (fn) => (signal.aborted ? 0 : window.requestAnimationFrame((t) => { if (!signal.aborted) fn(t); }));
  const setTimeout = (fn, ms) => { const id = window.setTimeout(() => { if (!signal.aborted) fn(); }, ms); signal.addEventListener('abort', () => window.clearTimeout(id)); return id; };

  /* =====================================================================
     뷰파인더에서 빠져나옴 → Now 카메라(블렌더 모델) 시계방향 회전 → 히어로
     · 로딩이 끝난 직후 영상이 100% 보이는 상태에서 시작 (스크롤로 진행)
     · 0 → .14  : 화면 전체가 두꺼운 유리판이 됨 (굴절·색수차·볼록)
     · .08 → .46 : 유리판이 줄어들며 Now 뒷면 아이피스 안으로 들어감 (영상은 아이피스 화면이 됨)
     · .46 → .60 : 뒤로 물러나며 카메라 뒷모습 전체
     · .60 → .90 : 시계방향으로 부드럽게 돌아 정면 → POLAROID 로고 · 카피 = 히어로
     ===================================================================== */

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const range = (v, a, b) => clamp((v - a) / (b - a));
  const ss = (a, b, v) => { const t = range(v, a, b); return t * t * (3 - 2 * t); };
  const eio = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerpBox = (A, B, t) => A.map((v, i) => lerp(v, B[i], t));
  const cover = ([x, y, w, h], a = 1920 / 1080) => { const cw = Math.max(w, h * a), ch = cw / a; return [x + (w - cw) / 2, y + (h - ch) / 2, cw, ch]; };

  const root = document.documentElement;
  const TM = (window.__tm = window.__tm || []), mark = (n) => TM.push([n, Math.round(performance.now())]);   // 로딩 단계별 시각 (콘솔에서 __tm 으로 확인)
  mark('bundle');
  const track = document.getElementById('track');
  const video = document.getElementById('video');

  /* ---------------- 1. 배경: kinoria 처럼 화면 뒤에서 오로라(빛 커튼)가 살아 움직임.
     색은 폴라로이드 무지개 다섯 색(레드 · 오렌지 · 옐로 · 그린 · 블루)을 필름 사진처럼 따뜻하고 낮게 — 카메라보다 밝지 않게.
     스크롤하면 그 속도만큼 커튼이 더 빨리 흐르고 밝아졌다 가라앉고, 마우스 쪽으로 살짝 몰림 */
  const bgCanvas = document.getElementById('bg');
  const bgl = bgCanvas.getContext('webgl2', { alpha: false, antialias: false });
  const bgProg = (() => {
    const vs = `#version 300 es
    in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;
    const fs = `#version 300 es
    precision highp float; uniform vec2 uRes, uP; uniform float uT, uReveal, uS, uFlow, uVel, uDark, uRise; out vec4 o;
    float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    // 부드러운 노이즈: 격자(칸) 없이 사인파를 서로 휘어 겹침 → 어디서도 끊기지 않아 선·네모난 칸이 생길 수 없음.
    // (전: 격자 값 노이즈 — 일부 GPU 에서 칸 경계가 가로·세로 선과 네모난 덩어리로 드러났음)
    float vn(vec2 p){
      p*=2.3;
      float a=sin(p.x*1.31+1.7*sin(p.y*.83+.6)+.9), b=sin(p.y*1.57+1.5*sin(p.x*.71+2.1)+4.2), c=sin((p.x+p.y)*.93+1.2*sin((p.x-p.y)*.67+1.4));
      return .5+(a+b+c)*(1./6.);
    }
    float fbm(vec2 p){ float v=0., a=.5; mat2 r=mat2(.8,.6,-.6,.8); for(int i=0;i<3;i++){ v+=a*vn(p); p=r*p*1.93+vec2(3.7,1.9); a*=.5; } return v*1.14; }
    void main(){
      vec2 uv=gl_FragCoord.xy/uRes; float asp=uRes.x/uRes.y, x=uv.x*asp;
      vec3 base=vec3(9.,8.,8.)/255.;
      vec3 col[5];
      col[0]=vec3(.86,.30,.20);   // 폴라로이드 레드 (코랄)
      col[1]=vec3(.95,.55,.22);   // 오렌지 (앰버)
      col[2]=vec3(.92,.76,.36);   // 옐로 (허니)
      col[3]=vec3(.36,.66,.42);   // 그린 (세이지)
      col[4]=vec3(.24,.50,.80);   // 블루
      float t=uT*.55+uFlow;                                  // 시간 + 스크롤로 쌓인 흐름
      vec3 c=vec3(0.);
      for(int i=0;i<5;i++){
        float fi=float(i), sg=mod(fi,2.)<.5?1.:-1.;
        float cx=asp*(.1+.2*fi) + .38*sin(t*(.21+.05*fi)+fi*2.3+uS*.12) + .14*sin(t*.47+fi*5.1) + sg*uP.x*.18*asp;
        float wob=(fbm(vec2(uv.y*1.5+fi*3.7, t*.16+fi))-.5)*.75 + sin(uv.y*3.1+t*.6+fi)*.06;   // 커튼 자락이 물결치며 휨
        float dx=x-cx-wob, w=.09+.045*fi+.04*sin(t*.33+fi);
        float band=exp(-dx*dx/(w*w));
        float rays=.72+.28*fbm(vec2(dx*2.6+fi*9., uv.y*.5+t*.1));                                 // 커튼 안의 밝기가 넓고 부드럽게 흐름 (가는 세로 줄이 보이지 않게)
        float bot=.05+.25*fbm(vec2(x*1.4+fi*4., t*.14));
        float vert=smoothstep(bot,.95,uv.y)*(.5+.5*uv.y) + .25*smoothstep(.55,1.,uv.y)*band;
        float pulse=.6+.4*sin(t*(.5+.13*fi)+fi*1.7);                                                // 커튼마다 숨 쉬듯 밝아졌다 어두워짐
        c+=col[i]*band*rays*vert*pulse;
      }
      c*=.2*(1.+.2*uVel);                                   // 스크롤 중엔 더 밝게 (멈추면 서서히 가라앉음)
      // 화면 전체 오로라 (kinoria): 모양이 정해지지 않은 큰 빛 덩어리가 겹겹이 휘며 천천히 일렁임 (도메인 워핑 fbm).
      // 따뜻한 코랄·오렌지가 주를 이루고 옐로·그린·블루가 섞여 지나감. 카메라가 있는 화면 가운데 뒤가 가장 밝아 블랙 카메라 실루엣이 드러남
      {
        vec2 q=vec2(x,uv.y)*.72, tt=vec2(t*.05,-t*.04);   // 낮은 주파수 → 크고 부드러운 덩어리
        vec2 w1=vec2(fbm(q+tt), fbm(q+vec2(5.2,1.3)-tt));
        vec2 w2=vec2(fbm(q*1.2+1.35*w1+vec2(1.7,9.2)+tt*1.3), fbm(q*1.2+1.35*w1+vec2(8.3,2.8)-tt*1.1));
        float n=fbm(q*1.1+1.45*w2+vec2(uP.x,uP.y)*.25);
        float hue=fract(w2.x*1.1+w1.y*.6+t*.025)*6.;
        vec3 pal[6]; pal[0]=col[0]; pal[1]=col[1]; pal[2]=col[2]; pal[3]=col[1]; pal[4]=col[3]; pal[5]=col[4];
        int hi=int(floor(hue)); float hf=fract(hue);   // 색 사이를 고르게 섞음 (색 경계에 띠가 생기지 않게)
        vec3 pc=mix(pal[hi], pal[(hi+1)%6], hf);
        float m=smoothstep(.36,.88,n); m*=m;                                          // 넓고 완만하게 → 덩어리 경계가 선으로 보이지 않음
        float edge=1.;
        vec2 cd=(uv-vec2(.5,.47))*vec2(asp*.62,1.);
        float cen=exp(-dot(cd,cd)*3.2);                                              // 카메라 뒤 후광
        float amp=mix(.16,.42,uDark)*(1.+.12*uVel);
        c+=pc*m*edge*(.45+1.1*cen)*amp + pc*cen*mix(.015,.06,uDark)*(.7+.3*sin(t*.4));
      }
      // 가장자리·아래쪽을 어둡게 → 가운데 카메라가 떠 보이게
      float vg=smoothstep(1.3,.3,length((uv-vec2(.5,.65))*vec2(asp*.75,1.)));
      c*=mix(.3,1.,vg);
      // 아지랑이 (kinoria): 화면 가운데 아래에서 빛이 피어올라 위로 갈수록 퍼지며 옅어짐. 무늬가 계속 위로 흘러 올라가고,
      // 가끔 한 덩이씩 더 크게 솟았다 가라앉음. 블랙 카메라부터 뚜렷해짐 (그 전에는 아주 옅게만)
      {
        float y=uv.y, tr=uT*.11+uFlow*.35;                                    // 위로 올라가는 양
        float sway=.10*y*sin(y*2.6-uT*.33)+(fbm(vec2(y*1.1-tr*.8,uT*.045))-.5)*.34*y;   // 올라가며 좌우로 흔들림
        float px=(x-asp*.5-sway)/min(asp,1.25);
        float wd=.17+.52*y;                                                   // 아래는 좁고 위로 갈수록 넓게
        float env=exp(-px*px/(wd*wd));
        vec2 rq=vec2(px/wd*.8, y*1.25-tr);
        vec2 rw=vec2(fbm(rq+vec2(2.3,-tr*.4)), fbm(rq*1.1+vec2(7.1,4.4)));
        float n=fbm(vec2(rq.x+1.2*(rw.x-.5), rq.y*1.15+.9*(rw.y-.5)));
        float wisp=smoothstep(.3,.78,n); wisp*=wisp;
        float gust=.55+.45*sin(uT*.21+1.3)*sin(uT*.083+.4);                   // 가끔 크게 솟음
        float top=mix(.5,.86,gust);                                          // 솟는 높이
        float vfade=(1.-smoothstep(top-.42,top,y))*(.5+.5*smoothstep(-.02,.2,y));
        float hue2=fract(rw.x*.8+y*.35-uT*.02)*4.;
        vec3 rp[4]; rp[0]=col[0]; rp[1]=col[1]; rp[2]=col[2]; rp[3]=col[1];
        int ri=int(floor(hue2)); vec3 rc=mix(rp[ri], rp[(ri+1)%4], fract(hue2));
        c+=rc*env*vfade*(.22+1.1*wisp)*(.55+.45*gust)*mix(.05,.5,uRise)*(1.+.15*uVel);
      }
      c=base+c*uReveal;
      c+=(h(gl_FragCoord.xy+fract(uT*7.)*211.)-.5)*(1.6/255.); // 밴딩 방지 디더
      o=vec4(c,1.);
    }`;
    const mk = (t, src) => { const s = bgl.createShader(t); bgl.shaderSource(s, src); bgl.compileShader(s); if (!bgl.getShaderParameter(s, bgl.COMPILE_STATUS)) console.error(bgl.getShaderInfoLog(s)); return s; };
    const p = bgl.createProgram(); bgl.attachShader(p, mk(bgl.VERTEX_SHADER, vs)); bgl.attachShader(p, mk(bgl.FRAGMENT_SHADER, fs));
    bgl.bindAttribLocation(p, 0, 'aPos'); bgl.linkProgram(p);
    const vao = bgl.createVertexArray(); bgl.bindVertexArray(vao);
    bgl.bindBuffer(bgl.ARRAY_BUFFER, bgl.createBuffer());
    bgl.bufferData(bgl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), bgl.STATIC_DRAW);
    bgl.enableVertexAttribArray(0); bgl.vertexAttribPointer(0, 2, bgl.FLOAT, false, 0, 0);
    const u = (n) => bgl.getUniformLocation(p, n);
    return { p, vao, uRes: u('uRes'), uT: u('uT'), uReveal: u('uReveal'), uS: u('uS'), uFlow: u('uFlow'), uVel: u('uVel'), uP: u('uP'), uDark: u('uDark'), uRise: u('uRise') };
  })();
  const bgDyn = { flow: 0, vel: 0, px: 0, py: 0, last: 0 };
  function drawBg(t, reveal, sc, scVel, px, py) {
    const dt = bgDyn.last ? Math.min(0.05, t - bgDyn.last) : 0; bgDyn.last = t;
    const v = Math.min(1.5, Math.abs(scVel || 0) * 1.2);
    bgDyn.vel += (v - bgDyn.vel) * (1 - Math.exp(-dt * (v > bgDyn.vel ? 6 : 1.6)));   // 빨리 밝아지고 천천히 가라앉음
    bgDyn.flow += Math.min(1.2, Math.abs(scVel || 0)) * dt * 0.22;                     // 스크롤하면 아주 조금만 더 흐름 (전: 빠르게 스크롤하면 무늬가 한꺼번에 밀려 배경이 일그러져 보였음)
    bgDyn.px += ((px || 0) - bgDyn.px) * (1 - Math.exp(-dt * 1.2)); bgDyn.py += ((py || 0) - bgDyn.py) * (1 - Math.exp(-dt * 1.2));
    const dpr = 0.5;   // 흐린 빛이라 화면의 절반 해상도로 그려 늘려도 차이 없음 (픽셀 수 1/4 → GPU 부담 크게 감소)
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (bgCanvas.width !== w || bgCanvas.height !== h) { bgCanvas.width = w; bgCanvas.height = h; }
    bgl.viewport(0, 0, w, h); bgl.useProgram(bgProg.p); bgl.bindVertexArray(bgProg.vao);
    bgl.uniform2f(bgProg.uRes, w, h); bgl.uniform1f(bgProg.uT, t); bgl.uniform1f(bgProg.uReveal, reveal); bgl.uniform1f(bgProg.uS, sc || 0);
    bgl.uniform1f(bgProg.uDark, ss(11.8, 12.25, sc || 0));   // 블랙 카메라 장면부터 오로라를 더 밝고 크게
    bgl.uniform1f(bgProg.uRise, ss(12.0, 12.7, sc || 0));    // 컬러가 black 으로 바뀐 뒤부터 가운데 아래에서 아지랑이가 피어오름
    bgl.uniform1f(bgProg.uFlow, bgDyn.flow); bgl.uniform1f(bgProg.uVel, bgDyn.vel); bgl.uniform2f(bgProg.uP, bgDyn.px, bgDyn.py);
    bgl.drawArrays(bgl.TRIANGLES, 0, 3);
  }

  /* ---------------- 2. Now 카메라 (블렌더 파일에서 추출한 GLB) */
  const threeCanvas = document.getElementById('three');
  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  // 휴대폰(터치·작은 화면): GPU 메모리·셰이더 한도가 작아 가벼운 설정으로
  const LITE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LITE ? 1.5 : 2));   // 휴대폰 1.75 → 1.5: 그리는 픽셀 수 약 27% 감소 (아이폰 13 등 메모리가 작은 기기 대비)   // 실제 픽셀 밀도로 렌더 + MSAA → 모델·사진 가장자리 계단현상 제거
  // 3D 오류를 화면에 표시 (휴대폰에서 카메라가 안 보일 때 원인 확인용)
  const report = (msg) => { console.error('[now]', msg); window.dispatchEvent(new ErrorEvent('error', { message: '[3D] ' + msg })); };
  renderer.debug.onShaderError = (gl, prog, vs, fs) => report('shader compile failed: ' + (gl.getProgramInfoLog(prog) || '').slice(0, 160));
  threeCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (signal.aborted) return; report('WebGL context lost'); });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = LITE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;

  // Figma 스틸 톤: 왼쪽 위 골든 키, 뒤쪽 웜 림, 약한 쿨 필
  const key = new THREE.DirectionalLight(0xffe6cf, 5.0); key.position.set(-2.6, 3.2, 0.6);
  key.castShadow = true; key.shadow.mapSize.setScalar(LITE ? 1024 : 4096); key.shadow.radius = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
  Object.assign(key.shadow.camera, { left: -0.8, right: 0.8, top: 0.8, bottom: -0.8, near: 0.1, far: 12 });
  const rim = new THREE.DirectionalLight(0xffd2a8, 1.8); rim.position.set(-2.8, 1.2, -2.2);
  const rim2 = new THREE.DirectionalLight(0xffd8b4, 1.2); rim2.position.set(2.6, 1.0, -2.4);
  const fill = new THREE.DirectionalLight(0xd8dcff, 0.22); fill.position.set(2.6, 0.4, 1.8);
  const hemi = new THREE.HemisphereLight(0xf2ece4, 0x141210, 0.16);
  // 블랙 카메라부터: 배경 오로라 빛이 카메라에도 비침 — 뒤·위에서 오로라 색 빛이 천천히 돌며 몸체 모서리에 색이 어림. 평소엔 꺼져 있음
  const rim3 = new THREE.DirectionalLight(0xffffff, 0); rim3.position.set(0.4, 2.8, -2.6);
  const RIM0 = [rim.color.clone(), rim2.color.clone()];
  scene.add(key, rim, rim2, rim3, fill, hemi);
  // 오로라 다섯 색 (배경 셰이더와 같은 색): 코랄 · 오렌지 · 옐로 · 그린 · 블루 — 시간에 따라 부드럽게 돌아감
  const AUR = [[1.0, 0.42, 0.3], [1.0, 0.62, 0.26], [0.98, 0.84, 0.42], [0.42, 0.86, 0.56], [0.34, 0.62, 1.0]];
  const aurCol = (t) => { const n = AUR.length, x = ((t % n) + n) % n, i = Math.floor(x), f = x - i, e = f * f * (3 - 2 * f), a = AUR[i], b = AUR[(i + 1) % n];
    return [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e]; };
  const _ac = new THREE.Color();
  function auroraRim(sc, now) {
    const dk = ss(11.8, 12.25, sc);   // 블랙으로 바뀌는 동안 켜져서 끝까지 유지
    const t = now / 2600;
    if (dk <= 0) {
      if (rim3.intensity) { rim.color.copy(RIM0[0]); rim2.color.copy(RIM0[1]); rim.intensity = 1.8; rim2.intensity = 1.2; rim3.intensity = 0; rim.position.set(-2.8, 1.2, -2.2); rim2.position.set(2.6, 1.0, -2.4); }
      return;
    }
    const c1 = aurCol(t), c2 = aurCol(t + 1.7), c3 = aurCol(t + 3.3);
    rim.color.copy(RIM0[0]).lerp(_ac.setRGB(c1[0], c1[1], c1[2]), dk);
    rim2.color.copy(RIM0[1]).lerp(_ac.setRGB(c2[0], c2[1], c2[2]), dk);
    rim3.color.setRGB(c3[0], c3[1], c3[2]);
    // 빛이 카메라 뒤를 천천히 돌아 하이라이트가 모서리를 따라 흐름
    const o = now / 3100;
    rim.position.set(-2.8 * Math.cos(0.5 * Math.sin(o)), 1.2 + 0.9 * Math.sin(o * 1.3), -2.2 + 0.6 * Math.cos(o));
    rim2.position.set(2.6 * Math.cos(0.5 * Math.sin(o + 2)), 1.0 + 0.9 * Math.sin(o * 1.1 + 1), -2.4 + 0.6 * Math.cos(o + 1.5));
    rim.intensity = 1.8 + dk * (2.6 + 1.0 * Math.sin(now / 900));
    rim2.intensity = 1.2 + dk * (2.4 + 1.0 * Math.sin(now / 1100 + 1.7));
    rim3.intensity = dk * (1.6 + 0.7 * Math.sin(now / 1300 + 0.6));
  }

  const pivot = new THREE.Group(); scene.add(pivot);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 100);

  let model = null, eye = null, eyeMat = null, modelH = 1, modelW = 1;
  // 마지막 장면에서 보이는 아이피스 유리: 영상 대신 어두운 유리 (뷰파인더 속 화면이 빠져나간 뒤 남는 실제 유리 광택)
  const eyeGlass = new THREE.MeshPhysicalMaterial({ color: 0x07080a, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, reflectivity: 0.6 });
  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;

  // 블렌더 glTF 익스포터로 그대로 뽑은 모델 (Draco 압축 · WebP 텍스처)
  // 모델 파일은 한 번만 받고, Draco 는 워커에서 풀어 메인 스레드를 막지 않는다 (위 getDraco · loadGlbBytes)
  const gltfLoader = new GLTFLoader().setDRACOLoader(getDraco());
  let GRAIN_CANVAS = null, FLASH_CANVASES = null;
  Promise.all([
    loadGlbBytes().then((bytes) => gltfLoader.parseAsync(bytes.slice(0), '/assets/landing-camera/')),
    getGrainCanvas(),
    getFlashCanvases(),
  ]).then(([gltf, grainCv, flashCv]) => {
    if (signal.aborted) return;
    GRAIN_CANVAS = grainCv; FLASH_CANVASES = flashCv;
    mark('parsed');
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    const s = 1 / size.y;
    model.scale.setScalar(s); model.position.copy(c).multiplyScalar(-s);
    modelW = size.x * s;
    pivot.add(model);
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      const m = o.material;
      if (LITE && m.isMeshPhysicalMaterial && !m.userData.lite) {   // 투과·클리어코트는 휴대폰에서 셰이더가 무거움 → 비슷한 불투명 재질로
        m.userData.lite = true;
        if (m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity, 0.35); }
        m.clearcoat = 0; m.sheen = 0; m.iridescence = 0; m.needsUpdate = true;
      }
      if (/ABS|Ivory/i.test(m.name) && !o.geometry.attributes.uv) boxUV(o.geometry);
      if (/ABS|Ivory/i.test(m.name) && !m.userData.tuned) {
        m.userData.tuned = true;
        // 실제 Now 바디: 미세한 샌드 텍스처의 무광 ABS, 살짝 웜그레이
        m.roughness = 0.62; m.color.multiply(new THREE.Color(0.94, 0.935, 0.92));
        m.normalMap = grainTex(); m.normalScale.set(0.1, 0.1);
        if (!LITE && 'sheen' in m) { m.sheen = 0.25; m.userData.sheen0 = 0.25; m.sheenRoughness = 0.8; m.sheenColor = new THREE.Color(0xf6f2ec); }
        m.needsUpdate = true;
      }
    });
    // 렌즈·뷰파인더 유리: 멀티코팅 유리처럼 주변이 비치고(높은 반사), 가장자리에 보라·초록 코팅 빛이 돌게
    model.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.isMeshPhysicalMaterial) return;
      const m = o.material, n = m.name;
      if (m.userData.glass) return;
      if (/Lens_Photo_MulticoatedGlass|Lens_Photo_InternalBlueGlass|Optics_Viewfinder_InnerOptic/.test(n)) {
        m.userData.glass = true;
        m.roughness = 0.02; m.metalness = 0;
        m.clearcoat = 1; m.clearcoatRoughness = 0.02;
        m.envMap = scene.environment; m.envMapIntensity = /Viewfinder/.test(n) ? 0.22 : 0.32;   // 주변 형체가 비치지 않을 만큼만 — 어두운 렌즈에 은은한 유리 광택
        m.specularIntensity = 1; m.ior = 1.52;
        m.color.setRGB(0.012, 0.016, 0.02); if (/InternalBlue/.test(n)) m.color.setRGB(0.01, 0.02, 0.035);   // 투과 대신 어두운 유리 바탕
        m.transmission = 0;   // 투과(굴절) 렌더 끔: 매 프레임 장면을 한 번 더 그려야 해서 카메라가 움직일 때 렌즈가 버벅임. 어두운 유리 광택만으로 충분
        m.needsUpdate = true;
      }
    });
    mark('mats');
    setupFlash();
    mark('flash');
    setupPrint();
    mark('print');
    // 필름 슬롯 위 'i-Type FILM' 양각 텍스트 — 웹에서는 직사각형 돌기로 보여 숨김
    model.traverse((o) => { if (/Tray_Text_iType/i.test(o.name)) o.visible = false; });
    // 뒷면 아이피스 컵 안쪽의 검은 창(블렌더 Rear_Viewfinder_Cap 의 Mat_Rubber_Black 면) = 영상이 비치는 뷰파인더 창
    const cap = model.getObjectByName('Rear_Viewfinder_Cap');
    cap && cap.traverse((o) => { if (o.isMesh && /Rubber_Black/.test(o.material.name)) eye = o; });
    if (eye) setupEye();
    setupNow();
    window.__T = { THREE, model, pivot, camera, scene, print };
    window.__dbgP = () => [renderer.info.programs.length, renderer.info.memory.textures, BL.allocs || 0];
    mark('setup');
    return prewarm().then(() => {
      if (signal.aborted) return;
      mark('prewarm');
      readyT = performance.now();   // 카메라 등장 시작 시각
      root.dataset.model = 'ready';
    });
  }).catch((e) => { report('model load failed: ' + (e && e.message || e)); root.dataset.model = 'error'; });



  /* ---- 정면 플래시: 프레넬 렌즈(동심원 홈) + 뒤쪽 알루미늄 반사판 ----
     블렌더의 절차적 셰이더는 glTF 로 옮겨지지 않아 평면처럼 보였음 → 같은 모양을 텍스처로 구워 재현 */
  function flashTextures() {
    // 캔버스는 세션 동안 한 번만 만든 것을 쓰고(getFlashCanvases), 이 렌더러용 텍스처만 새로 만든다
    const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
    return { map: T(FLASH_CANVASES.map, true), normalMap: T(FLASH_CANVASES.normalMap, false), mr: T(FLASH_CANVASES.mr, false) };
  }
  function setupFlash() {
    let cover = null; model.traverse((o) => { if (o.isMesh && /Fresnel_Cover/i.test(o.name + (o.material && o.material.name))) cover = o; });
    if (!cover) return;
    model.updateMatrixWorld(true);
    const toModel = new THREE.Matrix4().copy(model.matrixWorld).invert().multiply(cover.matrixWorld);
    const g = cover.geometry, pos = g.attributes.position, v = new THREE.Vector3(), pts = [];
    const bb = new THREE.Box3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(toModel); pts.push(v.x, v.y); bb.expandByPoint(v); }
    const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), rad = Math.max(sz.x, sz.y) / 2;
    flash.pos.set(c.x, c.y, bb.max.z + 0.002); flash.r = rad; flash.cover = cover;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) { uv[i * 2] = (pts[i * 2] - c.x) / rad * 0.5 + 0.5; uv[i * 2 + 1] = (pts[i * 2 + 1] - c.y) / rad * 0.5 + 0.5; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const tx = flashTextures();
    cover.material = new THREE.MeshPhysicalMaterial({
      map: tx.map, normalMap: tx.normalMap, normalScale: new THREE.Vector2(1, 1),
      metalnessMap: tx.mr, roughnessMap: tx.mr, metalness: 1, roughness: 1,
      clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.6,
    });
    cover.castShadow = false; cover.receiveShadow = true;
    // 커버 뒤 부품은 텍스처에 구워 넣었으므로 숨김 (겹쳐 깜빡이지 않게)
    model.traverse((o) => { if (o.isMesh && /Flash_Cup|Flash_Reflector|Reflective_?Foil|SilverBacking/i.test(o.name)) o.visible = false; });
  }


  /* ---- 다음 장면(피그마 print_1): 플래시 → 필름 슬롯에서 사진이 나옴 ----
     Polaroid Now 는 렌즈 아래 정면 필름 슬롯(블렌더 Tray_Film_Slot, 폭 84mm · 높이 ≈16mm)으로 사진을 앞으로 밀어냄.
     i-Type 필름 실물 크기: 88 × 107mm, 사진 79 × 79mm (위 6mm · 좌우 4.5mm · 아래 22mm 흰 테두리) */
  const tmpV1 = new THREE.Vector3();
  const flash = { pos: new THREE.Vector3(), r: 0.012, cover: null, sprite: null, t: -1, fired: false };
  const print = { group: null, photo: null, k: 0, target: 0, t0: -1 };
  const PH = { W: 0.0805, L: 0.0979 };        // i-Type 비율(88×107) 유지, 폭은 모델 토출구 안쪽(가이드 폭 83.8mm)에 맞춤
  function starburstTex() {
    // 광선(별 모양) 없이 부드럽게 번지는 빛 덩어리 — 모양이 의식되지 않고 '번쩍'으로만 읽히게
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    const core = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    core.addColorStop(0, 'rgba(255,255,252,1)'); core.addColorStop(0.08, 'rgba(255,252,244,.95)'); core.addColorStop(0.25, 'rgba(255,244,226,.45)');
    core.addColorStop(0.55, 'rgba(255,236,210,.12)'); core.addColorStop(1, 'rgba(255,230,200,0)');
    g.fillStyle = core; g.fillRect(0, 0, N, N);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // 실제 필름 프레임 이미지(사용자 제공, 바깥·사진 칸 투명) 기준 사진 칸 위치 — 프레임 741×899 중 사진 칸 x 34~705, y 52~709
  const FRAME = { w: 741, h: 899, wx: 34, wy: 52, ww: 672, wh: 658 };
  function photoTex(img, frame) {
    // 위쪽(카메라 안쪽) = 사진 윗부분, 바깥쪽 = 두꺼운 아래 테두리 (피그마 print_1 과 같은 방향)
    const W = 880, Hh = 1070, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d');
    const kx = W / FRAME.w, ky = Hh / FRAME.h;
    // 사진 칸: 프레임 이미지의 투명한 칸 위치에 맞춤 (테두리 아래로 2px 씩 숨겨 틈이 안 보이게)
    const x = FRAME.wx * kx - 2, y = FRAME.wy * ky - 2, SW = FRAME.ww * kx + 4, SH = FRAME.wh * ky + 4;
    g.fillStyle = '#e9e8e5'; g.fillRect(0, 0, W, Hh);
    if (img) {                                                  // 칸 비율(거의 정사각)에 맞춰 가운데를 잘라 채움
      const r = SW / SH, sh = img.height, sw = Math.min(img.width, sh * r), sx = Math.min(img.width - sw, Math.max(0, img.width * 0.56 - sw / 2));
      g.filter = 'brightness(1.12) contrast(1.04)'; /* 전 사진(어두운 영상 장면)에 맞춘 1.3 → 히어로 장면은 이미 밝아서 조금만 */ g.drawImage(img, sx, 0, sw, sh, x, y, SW, SH); g.filter = 'none';
    } else { g.fillStyle = '#2a2018'; g.fillRect(x, y, SW, SH); }
    const v = g.createRadialGradient(x + SW / 2, y + SH / 2, SW * 0.3, x + SW / 2, y + SH / 2, SW * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,25,10,.28)');
    g.fillStyle = v; g.fillRect(x, y, SW, SH);
    if (frame) g.drawImage(frame, 0, 0, W, Hh);                // 종이 질감이 살아 있는 실제 프레임을 그대로 위에 얹음
    else { const id = g.getImageData(0, 0, W, Hh); for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - 0.5) * 7; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  // 프레임 종이 결을 빛에 반응하는 요철로: 밝기의 미세한 차이만 남긴 범프맵 (사진 칸은 평평)
  function frameBump(frame) {
    const W = 880, Hh = 1070, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d');
    g.drawImage(frame, 0, 0, W, Hh);
    const id = g.getImageData(0, 0, W, Hh), d = id.data, lum = new Float32Array(W * Hh);
    for (let i = 0, j = 0; j < lum.length; i += 4, j++) lum[j] = d[i + 3] > 200 ? (d[i] + d[i + 1] + d[i + 2]) / 3 : -1;
    let sum = 0, n = 0; for (const L of lum) if (L >= 0) { sum += L; n++; }
    const mean = n ? sum / n : 128;
    for (let i = 0, j = 0; j < lum.length; i += 4, j++) { const v = lum[j] < 0 ? 128 : Math.max(0, Math.min(255, 128 + (lum[j] - mean) * 6)); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; return t;
  }
  function setupPrint() {
    // 플래시 광선
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starburstTex(), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.position.copy(flash.pos); sp.scale.setScalar(flash.r * 9); sp.renderOrder = 20; model.add(sp); flash.sprite = sp;
    if (flash.cover) { flash.cover.material.emissive = new THREE.Color(0xfff1d6); flash.cover.material.emissiveIntensity = 0; }
    // 사진: 슬롯 중심(정면 z 0.075, 높이 y 0.016)에서 +Z 로 밀려나옴.
    // 사진은 장면 루트에 두고(나중에 카메라를 떠나 화면 중앙으로 날아가야 하므로) 매 프레임 월드 행렬을 계산.
    // 휘어지며 말려 올라가야 해서 길이 방향 48분할 평면 + 매 프레임 CPU 에서 휨 계산
    const grp = new THREE.Group(); grp.position.set(0, 0.016, 0.0735); model.add(grp);
    const SEG = 48, geo = new THREE.PlaneGeometry(PH.W, PH.L, 16, SEG); geo.rotateX(-Math.PI / 2);   // XZ 평면, 사진 면 = +Y, 바깥(아래 테두리) = +Z
    const face = new THREE.MeshStandardMaterial({ roughness: 0.5, map: photoTex(null, null), side: THREE.FrontSide });
    const back = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.8, side: THREE.BackSide });   // i-Type 뒷면은 검은 필름
    const ph = new THREE.Mesh(geo, face), pb = new THREE.Mesh(geo, back);
    const holder = new THREE.Group(); holder.add(ph, pb); holder.visible = false; holder.matrixAutoUpdate = false; scene.add(holder);
    ph.castShadow = pb.castShadow = true;
    ph.frustumCulled = pb.frustumCulled = false;   // CPU 로 휘어 올리는 평면이라 원래 경계구 기준으로 컬링되면 화면을 다 빠져나가기 전에 툭 사라짐
    // 사진과 프레임 이미지가 각각 도착하는 대로 텍스처를 다시 만듦 (data URL: 출처가 다른 이미지로 WebGL 텍스처를 만들면 막히는 환경 대비)
    let pImg = null, fImg = null;
    const rebuild = () => {
      const old = face.map; face.map = photoTex(pImg, fImg);
      if (fImg && !face.bumpMap) { face.bumpMap = frameBump(fImg); face.bumpScale = 0.9; }
      face.needsUpdate = true; try { renderer.initTexture(face.map); if (face.bumpMap) renderer.initTexture(face.bumpMap); renderer.compile(scene, camera); } catch (e) {} old && old.dispose();
    };
    const im = new Image(); im.onload = () => { pImg = im; rebuild(); }; im.src = '/assets/landing-camera/print-photo.jpg';   // 출력되는 사진 = 히어로 장면(책상 위 카메라)
    const fr = new Image(); fr.onload = () => { fImg = fr; rebuild(); }; fr.src = '/assets/landing-camera/print-frame.webp';
    print.group = grp; print.photo = holder; print.geo = geo; print.base = geo.attributes.position.array.slice(); print.SEG = SEG;
  }
  const leanM = new THREE.Matrix4(), slotM = new THREE.Matrix4(), ctrM = new THREE.Matrix4(), tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpV3 = new THREE.Vector3();
  const pa = new THREE.Vector3(), pb3 = new THREE.Vector3(), sa = new THREE.Vector3(), sb = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const easeIn = (t) => t * t * t;
  // 사진 휨: 위쪽(카메라 쪽 끝)은 평평하게, 아래로 갈수록 뒤(−Y)로 말림. 길이 방향으로 각도를 적분해 종이처럼 길이 유지
  const PHOTO_RISE = 1.25;   // 사진이 위로 올라가는 거리(화면 높이 배수) — 화면 위로 완전히 빠져나갈 때까지
  function bendPhoto(k, droop = 0, out = 1) {
    const pos = print.geo.attributes.position, base = print.base, N = print.SEG, L = PH.L;
    const cut = 1 - out;                                      // 슬롯 밖으로 나온 부분(아래 끝 쪽)만 자연스럽게 처짐
    // 올라가며 사라질 때: 윗부분(카메라 쪽 끝, t0=0)만 뒤(화면 안쪽)로 아주 살짝 말리며 완만한 곡선이 됨
    // (예전: 아래쪽이 앞으로 크게 말렸음). 뒷면(검정)이 보이지 않을 만큼만
    const kc = Math.min(1, k / 0.55), curl = 0.07 * kc * kc * (3 - 2 * kc);   // 윗변 전체가 일직선으로 젖혀지는 휨은 거의 없앰 (0.2 → 0.07) — 대각선 휨이 주가 됨   // 올라가기 시작하면서 바로 휘기 시작 (화면 밖에서만 휘면 안 보임)
    let y = 0, z = -L / 2; const ys = [0], zs = [z];
    for (let i = 1; i <= N; i++) {
      const t0 = (i - 0.5) / N, f = out > 0.02 ? Math.max(0, (t0 - cut) / out) : 0;
      const th = curl * Math.pow(1 - t0, 2) - droop * Math.pow(f, 1.6);   // 종이가 제 무게로 아주 살짝 휘며 나옴
      y += Math.sin(th) * L / N; z += Math.cos(th) * L / N; ys.push(y); zs.push(z);
    }
    if (k > 0) {   // 아래 끝을 제자리에 고정 → 위쪽만 뒤로 젖혀짐 (k=0 일 땐 평평해서 기준점이 바뀌어도 차이 없음)
      const dy = -ys[N], dz = L / 2 - zs[N];
      for (let i = 0; i <= N; i++) { ys[i] += dy; zs[i] += dz; }
    }
    // 올라가는 동안 오른쪽 위 모퉁이에서부터 대각선 방향으로 아주 살짝 휨 (실제 인스턴트 사진처럼):
    // 대각선(왼쪽 아래 → 오른쪽 위)을 따라 잰 거리가 중간(45%)을 넘는 부분만, 모퉁이로 갈수록 점점 더 뒤(화면 안쪽)로 젖혀짐.
    // 휘는 선이 대각선에 수직이라 세로·가로 어느 쪽으로도 '일직선으로 말린' 모양이 되지 않음. 휨 각은 모퉁이에서 최대 약 23°
    // (전: 폭 전체가 세로 원통처럼 최대 43° 말렸음)
    const Wd = PH.W, bq = Math.min(1, Math.max(0, (k - 0.1) / 0.7)), B = 0.4 * bq * bq * (3 - 2 * bq);
    const dg = Math.hypot(Wd, L), ex = Wd / dg, ey = L / dg, a0 = 0.45 * dg, S = dg - a0;
    for (let i = 0; i < pos.count; i++) {
      const xb = base[i * 3], zb = base[i * 3 + 2], idx = Math.round((zb + L / 2) / L * N);
      let x = xb, z = zs[idx], y = ys[idx];
      if (B > 0.0005) {
        const sd = (xb + Wd / 2) * ex + (L / 2 - zb) * ey - a0;                    // 대각선 방향 거리 (오른쪽 위 모퉁이에서 최대 S)
        if (sd > 0) { const q = sd / S; y -= B * S * q * q * q / 3; const sh = B * B * S * q * q * q * q * q / 10; x -= sh * ex; z += sh * ey; }   // 각도 = B·q² (서서히 시작 → 접힌 자국 없음), 길이 유지 보정
      }
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true; print.geo.computeVertexNormals();
  }
  const veil = document.querySelector('.flash-veil'), veilIn = veil && veil.firstElementChild;
  function updatePrint(sc, dt, now, W, H) {
    if (!print.group) return;
    // 플래시: 스크롤이 지점(1.0 화면)을 넘는 순간 한 번 터짐, 다시 위로 올라가면 장전
    // 히어로 타이포가 다 사라진 직후(0.55 화면) 그 자리의 카메라에서 플래시 → 사진 배출. 위로 되돌리면 다시 장전
    if (!flash.fired && sc > 0.72) {
      if (sc < 1.3) { if (hfS > 0.965) { flash.fired = true; flash.t = now; print.t0 = now + 380; window.dispatchEvent(new Event('pl-flash')); } }   /* 카메라가 정면으로 다 돌아온 뒤에 터짐 (전: 0.55) */
      else { flash.fired = true; flash.t = now - 30000; print.t0 = now - 30000; }   /* 히어로를 한 번에 건너뛴 경우(목차 이동·빠른 스크롤): 다른 섹션에 도착한 뒤에 뒤늦게 섬광·셔터 소리가 나지 않도록 소리·빛 없이 '이미 찍힘'으로만 표시 */
    }   // 셔터 소리 신호
    if (flash.fired && sc < 0.55) { flash.fired = false; print.t0 = -1; }
    const ft = window.__flashFT ?? (flash.t < 0 ? 9 : (now - flash.t) / 1000);   // __flashFT: 점검용으로 섬광 시점 고정
    // kinoria EXPOSED 처럼 확실하게 터지는 섬광: 0.04초 만에 최대 → 0.16초까지 화면이 하얗게 타 버린 채 유지 → 빠르게 걷히고 따뜻한 잔광이 천천히 남음
    const env = ft < 0.04 ? ft / 0.04 : ft < 0.16 ? 1 : 0.72 * Math.exp(-(ft - 0.16) * 5.5) + 0.28 * Math.exp(-(ft - 0.16) * 1.5);
    const fk = flash.fired ? env : 0;
    flash.sprite.material.opacity = Math.min(1, fk * 1.2);
    flash.sprite.scale.setScalar(flash.r * (18 + 90 * fk));          // 크게 번진 빛 — 터지는 순간 화면 밖까지 뻗는 광선
    if (flash.cover) flash.cover.material.emissiveIntensity = 14 * fk;
    if (fk > 0.002) {                                                 // 화면 전체 섬광이 플래시 위치에서 퍼지도록
      const v = flash.sprite.getWorldPosition(tmpV1).project(camera);
      const fx = Math.round((v.x * 0.5 + 0.5) * W), fy = Math.round((-v.y * 0.5 + 0.5) * H);
      if (fx !== updatePrint.fx || fy !== updatePrint.fy) { updatePrint.fx = fx; updatePrint.fy = fy; if (veilIn) veilIn.style.transform = `translate3d(${fx}px, ${fy}px, 0)`; }   // 위치는 transform 으로만 (다시 그리기 없음)
    }
    { const fv = Math.min(1, 1.05 * Math.pow(fk, 0.9)).toFixed(3); if (fv !== updatePrint.fv) { updatePrint.fv = fv; if (veil) veil.style.opacity = fv; } }   // 섬광 막의 투명도만 바꿈 (문서 전체 변수 → 섬광 막 하나: 스타일 재계산이 페이지 전체로 번지지 않음)
    // 사진 배출: 모터로 밀어내듯 1.8s, 끝에서 살짝 처짐 / 위로 올리면 빠르게 다시 들어감
    // 사진 배출도 스크롤 위치에 직접 묶음 — 내릴 때 혼자(시간 기준으로) 튀어나오지 않고, 올릴 때와 똑같이 스크롤한 만큼만 나오고 들어감
    // 출력 → 낙하를 한 번의 연속 동작으로: 예전에는 '배출(끝에서 감속해 멈춤)' → '미끄러져 빠짐(다시 가속)'의 두 단계라
    // 배출이 끝나는 지점에서 속도가 0이 돼 살짝 멈췄음. 이제 슬롯 이동량 하나(tr: 0 → 1.06)가 천천히 시작해
    // 속도를 유지한 채 슬롯을 빠져나가고, 그 속도 그대로 낙하(ck)로 이어짐
    print.k = range(sc, 0.78, 1.5);   /* 플래시(0.72) 뒤에 나오기 시작 (전: 0.6 — 플래시 시점을 늦추면서 사진이 플래시보다 먼저 나오게 됐었음) */
    const tq = print.k, tq2 = 0.35 * (1 - Math.exp(-Math.max(0, (sc - 1.5) / 0.9) / 0.35));   // 빠져나온 속도 그대로 시작해 서서히 잦아듦
    const tr = 1.06 * (tq * tq * (2 - tq) + tq2);              // 시작은 0속도, 슬롯을 빠져나간 뒤에도 같은 속도로 계속 미끄러지며 낙하로 넘어감
    const e2 = Math.min(1, tr / 0.86);
    print.photo.visible = print.k > 0.001;
    // 스크롤하면 사진이 슬롯을 따라 끝까지 미끄러져 빠져나옴(꼬리가 슬롯을 떠나는 순간까지) → 그 다음에 떨어지며 중앙으로
    const slide = Math.min(1, Math.max(0, (tr - 0.86) / 0.2));
    print.slide = slide;
    const sx2 = (tr - 0.86) / 0.2, tilt = sx2 <= 0 ? 0 : sx2 <= 1 ? sx2 * sx2 : 2 * sx2 - 1;   // 빠져나간 뒤에도 기울던 속도 그대로 이어서 (멈칫 방지)
    print.group.rotation.x = 0.07 * e2 * e2 + 0.16 * tilt;                   // 빠져나올수록 앞쪽이 자연스럽게 아래로
    // 사진 경로는 카메라가 떠오르기 전 위치 기준으로 계산 — 카메라가 올라가며 사진을 같이 끌어올리면 떨어지던 사진이 순간 멈칫했음
    pivot.position.set(0, 0, 0); pivot.updateMatrixWorld(true);
    print.group.updateMatrixWorld(true);
    // (1) 슬롯에 물린 상태의 월드 행렬 — 사진 중심 기준
    slotM.copy(print.group.matrixWorld).multiply(tmpM.makeTranslation(0, 0, -PH.L / 2 + PH.L * tr));
    // (2) 화면 중앙(피그마 print_2: 사진 높이 = 화면 높이의 64.5%) · 카메라를 정면으로 봄
    const ckr = range(sc, 1.32, 2.3), ck = ckr * ckr * ckr * (ckr * (ckr * 6 - 15) + 10);   // 다 빠진 뒤 떨어지며 중앙으로 (시작·끝 모두 가속도 0 → 툭 끊기지 않음)
    const rk = range(sc, 2.55, 3.6);                                                      // 위로 말려 올라감
    let M = slotM;
    if (ck > 0) {
      const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const worldL = PH.L * model.matrixWorld.getMaxScaleOnAxis();
      const frac = Math.min(0.645, 0.8 * (W / H) * (PH.L / PH.W));          // 피그마: 화면 높이의 64.5% · 휴대폰은 폭의 80%
      const dist = worldL / (2 * tanH * frac);
      camera.updateMatrixWorld();
      const cx = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0), cy = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1), cz = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
      const visH = 2 * tanH * dist;
      const c = new THREE.Vector3().copy(camera.position).addScaledVector(cz, -dist).addScaledVector(cy, visH * PHOTO_RISE * easeIn(rk)).addScaledVector(cx, visH * 0.07 * rk * rk * rk);   // 처음엔 곧게 올라가다 끝으로 갈수록 아주 살짝 오른쪽으로
      const sc3 = model.matrixWorld.getMaxScaleOnAxis();
      ctrM.makeBasis(cx, cz, cy.clone().negate()).scale(tmpV3.set(sc3, sc3, sc3)).setPosition(c);
      // 블렌드: 위치는 살짝 아래로 떨어졌다 올라오는 호, 회전은 구면 보간
      slotM.decompose(pa, qa, sa); ctrM.decompose(pb3, qb, sb);
      const arc = Math.sin(Math.PI * ck) * visH * 0.05;   // 아래로 처지는 호를 줄임 — 크면 내려가다 올라오는 방향 전환점에서 멈칫해 보였음
      pa.lerp(pb3, ck).addScaledVector(cy, -arc); qa.slerp(qb, ck); sa.lerp(sb, ck);
      M = tmpM2.compose(pa, qa, sa);
    }
    if (rk > 0) {
      // 올라가며 사진 전체가 오른쪽(시계 방향)으로 살짝 틀어짐 — kinoria(왼쪽)의 반대. 최대 약 13°
      const rq = Math.min(1, Math.max(0, (rk - 0.3) / 0.6)), roll = 0.06 * rq * rq * (3 - 2 * rq);   // 기울기는 아주 살짝(최대 약 3.5°), 중반 이후부터
      M = leanM.copy(M).multiply(tmpM.makeRotationY(-roll)).multiply(tmpM2.makeRotationX(-0.06 * Math.min(1, rk / 0.6) * Math.min(1, rk / 0.6)));   // + 위쪽이 아주 살짝 뒤로
    }
    print.photo.matrix.copy(M); print.photo.matrixWorldNeedsUpdate = true;
    bendPhoto(rk, (0.22 * Math.sin(Math.PI * 0.5 * Math.min(1, e2 * 1.15)) + 0.08 * slide) * (1 - ck), Math.min(1, 0.86 * e2 + 0.2 * slide));
    // 카메라 본체는 사진이 떠나면 아래로 빠짐
    // 사진이 떨어지는 걸 화면이 따라 내려감 → 카메라는 공중에 살짝 뜬 것처럼 기울고 떠돌면서 위로 흘러 사라짐
    // 카메라: 사진이 떨어질 때 떠오르기 시작해, 화면 밖으로 완전히 빠져나갈 때까지 계속 올라감
    // (예전: 정해진 높이까지만 올라가고 그 지점에서 숨김 → 화면에 일부가 남은 채 툭 사라졌음)
    const dkr = Math.max(0, (sc - 1.5) / 1.0), dk = Math.min(1, dkr);
    const de = dk * dk * (3 - 2 * dk);
    const rise = dkr < 1 ? dkr * dkr * (2 - dkr) : dkr;          // 천천히 출발 → 속도를 유지한 채 계속 위로 (멈추지 않음)
    const bob = Math.sin(now * 0.0014) * 0.012 + Math.sin(now * 0.0009 + 1.7) * 0.008;   // 공중 부양 느낌의 잔잔한 흔들림
    if (sc < 4.2) {                                                                      // 이 장면에서만 — 이후(NOW 도면) 에선 원래 자리·각도로
      pivot.position.y = 2.05 * rise + bob * dk;
      pivot.position.x = 0.24 * de + Math.sin(now * 0.0011) * 0.006 * dk;                 // 올라가며 옆으로 살짝 흘러감
      pivot.position.z = -0.28 * de;                                                      // 멀어지면서
      pivot.rotation.z += 0.11 * de;                                                      // 몸이 기우뚱 떠오르는 롤
      pivot.rotation.x -= 0.15 * de;                                                      // 코가 살짝 들리며
      pivot.rotation.y += 0.18 * de;
      // 블러로 번진 가장자리까지 화면 위로 완전히 넘어간 뒤에만 숨김
      pivot.visible = dkr < 0.5 || !camOffTop(H, 18 * eio(range(sc, 1.5, 2.3)));
    } else { pivot.position.set(0, 0, 0); pivot.visible = false; }
  }
  const camBox = new THREE.Box3(), camCorner = new THREE.Vector3();
  function camOffTop(H, blurPx) {
    pivot.updateMatrixWorld(true);
    camBox.setFromObject(model);
    if (camBox.isEmpty()) return true;
    let minY = Infinity;
    for (let i = 0; i < 8; i++) {
      camCorner.set(i & 1 ? camBox.max.x : camBox.min.x, i & 2 ? camBox.max.y : camBox.min.y, i & 4 ? camBox.max.z : camBox.min.z).project(camera);
      minY = Math.min(minY, camCorner.y);
    }
    return minY > 1 + (3 * blurPx + 8) * 2 / H;                  // 박스 아래 끝이 화면 윗선 + 블러 번짐(3σ) 위에 있음
  }


  /* ---- 03. 역사 → Now 실물 ----
     도면(선화) 뒤에서 화면 좌→우로 쓸어가며 실물이 드러남(클리핑 평면 = 화면의 세로선) → 엑스레이(반투명 회색 + 흰 윤곽선)
     → 윤곽선이 걷히며 실제 재질로 채워짐 → 180° 회전하면서 바디 컬러가 부드럽게 바뀜 */
  const NOW = { x: { value: 0 }, plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e5), edges: null, edgeMat: null, body: [], front: [] };
  const NOW_TINT = [ // 바디 색 (기본 퍼블 화이트 대비 곱)
    new THREE.Color(1, 1, 1),            // pebble white
    new THREE.Color(0.36, 0.5, 0.68),    // blue
    new THREE.Color(0.5, 0.6, 0.46),     // green
    new THREE.Color(0.13, 0.125, 0.12),  // black
    new THREE.Color(1, 1, 1),            // pebble white (도착)
  ];
  function setupNow() {
    model.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
      const m = o.material;
      if (m.userData.now) return; m.userData.now = true;
      if (/Rear_Housing|Emboss_GreyIvory/i.test(m.name)) { m.userData.base = m.color.clone(); NOW.body.push(m); }   // 뒤 하우징 = 컬러 바디
      if (/Mat_White_ABS/i.test(m.name)) { m.userData.base = m.color.clone(); NOW.front.push(m); }                  // 앞판(기본 흰색)
      const prev = m.onBeforeCompile;
      m.onBeforeCompile = (sh, r) => {
        prev && prev.call(m, sh, r);
        sh.uniforms.uX = NOW.x;
        sh.fragmentShader = 'uniform float uX;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', `
          { float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 1.6);
            vec3 xr = vec3(0.3, 0.285, 0.27) + vec3(0.62, 0.6, 0.57) * fr;   // 엑스레이: 정면은 회색, 가장자리로 갈수록 밝게
            gl_FragColor.rgb = mix(gl_FragColor.rgb, xr, uX); }
          #include <dithering_fragment>`);
      };
      m.customProgramCacheKey = () => 'now-xray';
      m.needsUpdate = true;
    });
  }
  function nowEdges() {
    if (NOW.edges) return;
    NOW.edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    NOW.edges = [];
    model.traverse((o) => {
      if (!o.isMesh || !o.visible || o.geometry.attributes.position.count > 120000) return;
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 32), NOW.edgeMat);
      l.renderOrder = 2; o.add(l); NOW.edges.push(l);
    });
  }
  const nowA = new THREE.Vector3(), nowB = new THREE.Vector3();
  // 피그마 color_main → color_black 순서 그대로: 이름 · 바디색 · 앞판(null = 기본 흰색) · 회전(도면 시점 대비 rotY)
  // 흰 앞판 투톤(블루·옐로·퍼플·코랄) → 원톤(틸·핑크·블랙), 코랄에서 정면으로 돌고 틸부터 반대쪽 3/4 로 넘어감
  // 공식 Polaroid Now Gen 3 8색 (Pebble White · Arctic Blue · Yellow · Purple · Coral · Teal · Pink · Black)
  // 블렌더 polaroid_now.blend 에 만든 재질 NowGen3_Body_* / NowGen3_Front_* 의 Base Color(선형값)와 동일
  const NOW_COLS = [
    { n: 'pebble white', b: null, f: null },
    { n: 'arctic blue', b: [0.3916, 0.6105, 0.6584], f: null },
    { n: 'yellow', b: [0.8714, 0.624, 0.0782], f: null },
    { n: 'purple', b: [0.3325, 0.2384, 0.4793], f: null },
    { n: 'coral', b: [0.7454, 0.162, 0.0782], f: null },
    { n: 'teal', b: [0.1144, 0.3763, 0.305], f: [0.1144, 0.3763, 0.305] },
    { n: 'pink', b: [0.8632, 0.3372, 0.4564], f: [0.8632, 0.3372, 0.4564] },
    { n: 'black', b: [0.005, 0.005, 0.0052], f: [0.085, 0.087, 0.095] },   // 공식 블랙: 앞면은 차콜 그레이, 아래 띠·렌즈 링·뒤 하우징은 블랙 (같은 색이면 배경에 묻힘)
  ].map((c) => ({ ...c, bc: c.b ? new THREE.Color().setRGB(...c.b) : null, fc: c.f ? new THREE.Color().setRGB(...c.f) : null }));
  const COL_A = 9.05, COL_STEP = 0.45;   // 컬러 장면 시작(sc)과 색 하나당 스크롤 길이
  const ZX_SY = 0.465, ZX_H = 1.0;   // ZERO 장면 카메라 세로 위치 (pose 기준점이 실루엣 중심보다 위라 0.5 보다 작게 → 실루엣이 화면 정중앙)
  const ZX_A = 12.4;
  // 블랙 → ZERO 자세 전환 구간: 블랙이 되기 직전(12.0)부터 ZERO 글자가 다 올라온 뒤(13.3)까지 길게 — 회전·숙임·기울기·높이가 한꺼번에 짧게 바뀌지 않게
  const ZX_T0 = 12.0, ZX_T1 = 13.3;
  const zxT = (sc) => { const k = range(sc, ZX_T0, ZX_T1); return k * k * k * (k * (k * 6 - 15) + 10); };      // ZERO PRINTS 장면 시작 — 블랙이 된 카메라가 정면을 보며 공중에 둥둥 뜸 (kinoria ZERO EXPOSURES)
  const PART_A = 14.45;   // 부품(확대샷) 장면 시작 — 블랙 카메라가 블러되며 위로 빠져나감
  const MSG_A = 17.0, MSG_T = 1.15, MSG_OUT = 18.3, MSG_OUT_E = 18.75;
  const END_A = 19.95, END_T = 0.72;   // 마지막 장면: 사진이 다 빠져나간 뒤 카메라가 위에서 DEVELOPED 아래로 폭신하게 내려앉음 (kinoria EXPOSED 뒤 손 위 안착)   // Make a Moment Last 앞 문장: 카메라 낙하 시작 · 낙하 길이 · 사라짐 시작 · 끝 (index.html 과 같은 값)
  // 아주 천천히 부드럽게 내려앉음 (kinoria): 살며시 출발 → 천천히 감속해 가운데에 닿음 (smootherstep 을 끝쪽으로 늘린 곡선)
  // DEVELOPED 장면의 낙하: 전보다 약 1.5배 긴 스크롤에 걸쳐 천천히 내려오며 끝에서 길게 감속해 살며시 내려앉음
  let fallF = 0, fallT = 0;   // DEVELOPED 낙하의 현재 진행도(시간으로 뒤따라감)와 마지막 갱신 시각
  function softFall(t) { const x = Math.min(1, Math.max(0, t)), u = 1 - Math.pow(1 - x, 1.4); return u * u * u * (u * (u * 6 - 15) + 10); }
  function softLand(t) { const x = Math.min(1, Math.max(0, t)), u = 1 - Math.pow(1 - x, 1.6); return u * u * u * (u * (u * 6 - 15) + 10); }
  function colorPhase(sc) {             // 색마다 잠깐 머물렀다가(hold) 다음 색으로 부드럽게 넘어감
    const P = range(sc, COL_A, COL_A + COL_STEP * (NOW_COLS.length - 1)) * (NOW_COLS.length - 1);
    const i = Math.min(NOW_COLS.length - 2, Math.floor(P)), t = clamp((P - i - 0.3) / 0.6);
    return { i, e: t * t * t * (t * (t * 6 - 15) + 10) };
  }
  const colA = new THREE.Color(), colB = new THREE.Color();
  let hopY = 0;   // 컬러 전환 때 카메라가 떠오른 높이 (타이틀 위치 계산에서 제외)
  function updateNow(sc, W, H) {
    const cv = threeCanvas.style;
    if (sc < 6.2) { if (NOW.masked) { cv.webkitMaskImage = ''; cv.maskImage = ''; NOW.masked = false; } if (cv.opacity !== '') { cv.opacity = ''; cv.transition = ''; } NOW.x.value = 0; if (NOW.edges) NOW.edges.forEach((l) => (l.visible = false)); window.__nowProj = null; window.__nowCol = null; return; }
    nowEdges();
    // 모델 원점의 화면 위치와 1 월드 단위당 픽셀 → 2026 도면을 모델과 정확히 겹쳐 놓는 데 사용
    camera.updateMatrixWorld();
    pivot.position.y -= hopY; pivot.updateMatrixWorld(true); pivot.getWorldPosition(nowA); pivot.position.y += hopY; pivot.updateMatrixWorld(true);   // 위 타이틀·도면 기준점은 떠오르는 움직임(hop)을 빼고 계산 → 글자는 제자리
    const o = nowA.clone().project(camera);
    nowB.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(0.5).add(nowA).project(camera);
    window.__nowProj = { ox: (o.x + 1) / 2 * W, oy: (1 - o.y) / 2 * H, ppu: Math.abs(nowB.x - o.x) / 2 * W / 0.5 };
    // 도면 위로 실물이 페이드인 (엑스레이 상태로) → 실제 재질로 채워짐
    const fade = eio(range(sc, 7.25, 8.05));   // 도면 위에 옅게 겹쳐 나타나 → 서서히 진해짐
    cv.transition = 'none'; cv.opacity = Math.min(1, fade * 1.6).toFixed(3);
    // 도면이 완성된 뒤 카메라 가운데에서부터 바깥으로 번지듯 진해짐: 가운데가 먼저 채워지고 가장자리는 나중에 (원형 마스크가 점점 커짐)
    if (fade > 0 && fade < 1) {
      const pj = window.__nowProj, r0 = (2.3 * fade - 0.5) * pj.ppu, r1 = r0 + 1.0 * pj.ppu;
      const m = `radial-gradient(circle at ${pj.ox.toFixed(1)}px ${(pj.oy + 0.05 * pj.ppu).toFixed(1)}px, #000 ${Math.max(0, r0).toFixed(1)}px, transparent ${r1.toFixed(1)}px)`;
      cv.webkitMaskImage = m; cv.maskImage = m; NOW.masked = true;
    } else if (NOW.masked) { cv.webkitMaskImage = ''; cv.maskImage = ''; NOW.masked = false; }
    const fill = eio(range(sc, 7.6, 8.1));     // 엑스레이(반투명 회색) → 실제 재질
    NOW.x.value = 1 - fill;
    NOW.edgeMat.opacity = 0.5 * (1 - fill);
    NOW.edges.forEach((l) => (l.visible = fill < 1));
    // 180° 회전하면서 바디 컬러가 부드럽게 바뀜
    const { i: ci, e: ce } = colorPhase(sc), c0 = NOW_COLS[ci], c1 = NOW_COLS[ci + 1];   // 블랙이 된 뒤로는 끝까지 블랙 (뷰파인더에서 빠져나올 때 보이는 뒷면도 블랙 — 앞 장면들과 같은 카메라)
    NOW.body.forEach((m) => { colA.copy(c0.bc || m.userData.base); colB.copy(c1.bc || m.userData.base); m.color.copy(colA).lerp(colB, ce); });
    NOW.front.forEach((m) => { colA.copy(c0.fc || m.userData.base); colB.copy(c1.fc || m.userData.base); m.color.copy(colA).lerp(colB, ce); });
    // 밝은 바디의 부드러운 광택(sheen)이 어두운 색(블랙)에선 회갈색으로 떠 보이므로 밝기에 비례해 줄임
    for (const m of NOW.body.concat(NOW.front)) if (m.sheen !== undefined && m.userData.sheen0 !== undefined) { const L = 0.2126 * m.color.r + 0.7152 * m.color.g + 0.0722 * m.color.b; m.sheen = m.userData.sheen0 * clamp(L * 2.2); }
    // 블랙 뒤 하우징: 따뜻한 조명의 반사광 때문에 회갈색으로 떠 보여서, 아주 어두운 색일 때만 반사를 줄여 무광 블랙처럼
    for (const m of NOW.body) if (m.specularIntensity !== undefined) {
      if (m.userData.spec0 === undefined) m.userData.spec0 = m.specularIntensity;
      const L = 0.2126 * m.color.r + 0.7152 * m.color.g + 0.0722 * m.color.b;
      m.specularIntensity = m.userData.spec0 * (0.35 + 0.65 * clamp(L * 25));
    }
    window.__nowCol = { name: (ce > 0.5 ? c1 : c0).n };
  }
  const tmpCol = new THREE.Color();

  /* ---- 바디 질감: 절차적 그레인 노멀맵 (블렌더 노이즈 범프 대체) ---- */
  let _grain = null;
  function grainTex() {
    if (_grain) return _grain;
    _grain = new THREE.CanvasTexture(GRAIN_CANVAS); _grain.wrapS = _grain.wrapT = THREE.RepeatWrapping; _grain.repeat.set(1, 1);
    return _grain;
  }
  function boxUV(g) { // UV 가 없는 바디용 박스 투영 (그레인만 쓰므로 이음새는 무관)
    g.computeBoundingBox(); const pos = g.attributes.position, nor = g.attributes.normal, uv = new Float32Array(pos.count * 2), S = 40 / Math.max(...g.boundingBox.getSize(new THREE.Vector3()).toArray());
    for (let i = 0; i < pos.count; i++) { const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
      const [a, b] = ax > ay && ax > az ? [pos.getY(i), pos.getZ(i)] : ay > az ? [pos.getX(i), pos.getZ(i)] : [pos.getX(i), pos.getY(i)];
      uv[i * 2] = a * S; uv[i * 2 + 1] = b * S; }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }

  /* ---- 아이피스 유리 = 영상 화면 ----
     처음엔 화면 전체(로딩 마지막 프레임과 픽셀 단위로 동일)로 매핑되다가, 카메라가 빠져나오면서
     유리면 좌표로 넘어감. 두꺼운 유리의 굴절·색수차·안쪽 그림자를 같은 셰이더에서 처리 */
  const eyeAxis = { n: new THREE.Vector3(0, 0, 1), w: 0.07, h: 0.06 };
  const vidTex = new THREE.VideoTexture(video); vidTex.colorSpace = THREE.NoColorSpace;
  function setupEye() {
    pivot.rotation.set(K[0].rotX, K[0].rotY, 0); pivot.updateMatrixWorld(true);
    const mesh = []; eye.traverse((o) => { if (o.isMesh) mesh.push(o); });
    // 유리판 법선(두께가 가장 얇은 축) → 월드, 바깥쪽을 향하게
    const g0 = mesh[0].geometry; g0.computeBoundingBox(); const ext = g0.boundingBox.getSize(new THREE.Vector3());
    const ax = ext.x <= ext.y && ext.x <= ext.z ? 0 : ext.y <= ext.z ? 1 : 2;
    const nLocal = new THREE.Vector3().setComponent(ax, 1);
    const nW = nLocal.transformDirection(mesh[0].matrixWorld);
    const ec = new THREE.Box3().setFromObject(eye).getCenter(new THREE.Vector3());
    if (nW.dot(tmpV.copy(ec).sub(new THREE.Vector3().setFromMatrixPosition(pivot.matrixWorld)).setY(0)) < 0) nW.negate(); // 모델 중심에서 바깥으로
    // 바깥에서 유리를 볼 때의 화면 오른쪽/위 방향
    // 유리판 자체의 세로 변 방향(판의 두 긴 축 중 더 위를 향한 쪽)을 '위'로 삼음 — 월드의 위(0,1,0)를 쓰면 판이 살짝 돌아가 있을 때 창이 기울어 보임
    const upG = [0, 1, 2].filter((i) => i !== ax).map((i) => new THREE.Vector3().setComponent(i, 1).transformDirection(mesh[0].matrixWorld)).sort((p, q) => Math.abs(q.y) - Math.abs(p.y))[0];
    if (upG.y < 0) upG.negate();
    const right = new THREE.Vector3().crossVectors(nW.clone().negate(), upG).normalize();
    const up = new THREE.Vector3().crossVectors(right, nW.clone().negate()).normalize();
    let ru0 = 1e9, ru1 = -1e9, rv0 = 1e9, rv1 = -1e9; const v = new THREE.Vector3(), all = [];
    for (const o of mesh) { const pos = o.geometry.attributes.position; const arr = [];
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).sub(ec);
        const a = v.dot(right), b = v.dot(up); arr.push(a, b); ru0 = Math.min(ru0, a); ru1 = Math.max(ru1, a); rv0 = Math.min(rv0, b); rv1 = Math.max(rv1, b); }
      all.push([o, arr]); }
    for (const [o, arr] of all) { const uv = new Float32Array(arr.length);
      for (let i = 0; i < arr.length; i += 2) { uv[i] = 1 - (arr[i] - ru0) / (ru1 - ru0); uv[i + 1] = (arr[i + 1] - rv0) / (rv1 - rv0); }
      o.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
    // 모델 로컬 기준으로 저장 (회전해도 따라감)
    const inv = new THREE.Matrix4().copy(pivot.matrixWorld).invert();
    eyeAxis.nLocal = nW.clone().transformDirection(inv);
    eyeAxis.w = ru1 - ru0; eyeAxis.h = rv1 - rv0;
    // 유리판의 정확한 중심·오른쪽·위 방향 (모델 로컬) — 마지막 장면에서 유리를 SHOT 화면의 뷰파인더 자리에 정확히 겹쳐 놓는 데 사용
    eyeAxis.cL = ec.clone().addScaledVector(right, (ru0 + ru1) / 2).addScaledVector(up, (rv0 + rv1) / 2).applyMatrix4(inv);
    eyeAxis.uL = up.clone().transformDirection(inv);
    // 마지막 장면: 아이피스 유리를 정면으로 마주 보는 회전 (카메라가 PITCH 만큼 위에서 내려다봄)
    { const n = eyeAxis.nLocal, ry = Math.atan2(-n.x, n.z), hz = Math.hypot(n.x, n.z);
      eyeAxis.face = { rotY: ry, rotX: Math.atan2(n.y, hz) - PITCH }; }
    eyeAxis.mesh = mesh;
    eyeMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: vidTex }, uRes: { value: new THREE.Vector2(1, 1) }, uK: { value: 0 }, uRefr: { value: 0 },
        uVA: { value: 16 / 9 }, uGA: { value: eyeAxis.w / eyeAxis.h }, uOp: { value: 1 }, uShade: { value: 0 }, uRest: { value: 0 }, uT: { value: 0 }, uSS: { value: 0 }, uDim: { value: 0 }, uRad: { value: 0.2 }, uRect: { value: new THREE.Vector4(0, 0, 1, 1) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `precision highp float; varying vec2 vUv;
        uniform sampler2D uMap; uniform vec2 uRes; uniform vec4 uRect; uniform float uK, uRefr, uVA, uGA, uOp, uShade, uRest, uT, uSS, uDim, uRad;
        vec2 coverUV(vec2 c, float boxA){ float r=boxA/uVA; if(r>1.) c.y/=r; else c.x*=r; return c*.5+.5; }
        // 두꺼운 유리 블록의 표면 높이: 가운데가 볼록한 쿠션 + 미세한 유리 물결(제조 결)
        float H(vec2 c){
          float d=pow(pow(abs(c.x),4.)+pow(abs(c.y),4.),.25);
          float pillow=1.-d*d*d;
          float ripple=.008*sin(c.x*4.1+c.y*2.3+uT*.25)+.006*sin(c.y*5.7-c.x*3.1-uT*.18);
          return pillow+ripple;
        }
        vec3 samp(vec2 uv, vec2 off, float disp, float blur){
          vec3 s=vec3(0.);
          for(int i=0;i<4;i++){
            float a=float(i)*2.3998; vec2 j=vec2(cos(a),sin(a))*sqrt((float(i)+.5)/4.)*blur;
            s.r+=texture2D(uMap,uv+off*(1.-disp)+j).r;
            s.g+=texture2D(uMap,uv+off+j).g;
            s.b+=texture2D(uMap,uv+off*(1.+disp)+j).b;
          }
          return s/4.;
        }
        void main(){
          vec2 c=vUv*2.-1.;                                   // 창(유리) 좌표 -1..1
          vec2 sc=(gl_FragCoord.xy/uRes)*2.-1.;              // 화면 -1..1
          // 유리 전체 면의 굴절: 통과하는 순간(uRefr) 가장 강하고, 이후에도 두꺼운 유리답게 남음(uRest)
          float T=uRefr*.16+uRest*.06;
          vec2 e=vec2(.004,0.);
          vec2 n=vec2(H(c+e.xy)-H(c-e.xy), H(c+e.yx)-H(c-e.yx))/(2.*e.x);
          float mag=1.-.16*uRefr-.05*uRest;                  // 볼록 유리 블록의 확대
          vec2 uvS=coverUV(sc*mag, uRes.x/uRes.y), uvG=coverUV(c*mag, uGA);
          if(uSS>.5) uvS=((sc-uRect.xy)/uRect.zw)*mag*.5+.5;   // 마지막 장면: 화면의 뷰파인더 자리(uRect)에 그대로 → SHOT 화면과 같은 그림에서 출발
          vec2 uv=mix(uvS,uvG,uK);
          vec2 off=-n*T*.12;
          vec3 col=samp(uv, off, .09*(uRefr+.4*uRest), .004*uRefr);
          if(uSS>.5){ vec2 e2=smoothstep(vec2(0.),vec2(.012),uv)*smoothstep(vec2(0.),vec2(.012),1.-uv); col*=e2.x*e2.y; }   // 그림 바깥(유리가 더 넓은 부분)은 어둡게 — 가장자리 픽셀이 늘어나 보이지 않게
          // 유리 두께로 생기는 내부 반사(살짝 어긋난 2중상)
          float dw=.10*(uRefr+uRest)*smoothstep(.5,1.,length(c));
          if(dw>.004) col=mix(col, samp(uv, off*-1.8+c*.02, .15, .01), dw);
          // 프레넬: 비스듬한 가장자리일수록 반사가 강하고 화면이 옅어짐
          float fr=pow(clamp(length(n)*.35,0.,1.),2.)*(.5*uRefr+.35*uRest);
          vec3 refl=mix(vec3(.16,.12,.09),vec3(1.,.93,.82),smoothstep(-.8,.9,c.y*.8-c.x*.5+sc.x*.2));
          col=mix(col,refl,fr*.5);
          // 유리 위를 지나가는 사선 반사광 (카메라가 움직이면 흐름)
          float band=exp(-pow((c.x*.6+c.y*.8-.35+ (1.-uK)*.9)/.12,2.));
          col+=vec3(1.,.95,.86)*band*(.14*uRefr+.07*uRest);
          col*=1.+.10*uK;
          // 마지막 장면: 카메라가 돌아 나가면 유리 속 장면이 어두운 유리(비스듬한 반사광)로 바뀜
          if(uDim>0.) col=mix(col, vec3(.016,.018,.022)+vec3(1.,.96,.9)*.07*smoothstep(.1,1.,c.y*.8-c.x*.5), uDim);
          // 창 테두리: 둥근 검은 고무 + 안쪽 그림자
          vec2 q=abs(c)-vec2(1.-uRad); float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-uRad;
          float rimW=.16*uK;
          float rim=smoothstep(-rimW-.02,-rimW+.02,sd);
          float inner=smoothstep(-rimW-.34,-rimW,sd)*uK;
          col*=1.-.55*inner*inner*uShade;
          col=mix(col,vec3(.012,.01,.009),rim);
          col+=vec3(1.,.96,.9)*.2*pow(max(0.,1.-abs(sd+rimW)/.04),3.)*smoothstep(0.,.8,c.y-c.x*.4)*uK; // 유리 모서리 하이라이트
          gl_FragColor=vec4(col,uOp);
        }`,
      transparent: true, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide, toneMapped: false,
    });
    for (const o of mesh) { o.material = eyeMat; o.castShadow = o.receiveShadow = false; o.renderOrder = 10; }
    video.addEventListener('loadedmetadata', () => { if (video.videoWidth) eyeMat.uniforms.uVA.value = video.videoWidth / video.videoHeight; });
    if (video.videoWidth) eyeMat.uniforms.uVA.value = video.videoWidth / video.videoHeight;
  }

  /* ---------------- 3. 유리 레이어: 로딩 캔버스(같은 WebGL)를 이어받아 그림 */
  const GLASS_FS = `#version 300 es
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uRes; uniform float uDpr;
  uniform vec4 uRect, uContent; uniform float uRadius, uBevel, uRefract, uBulge, uShade, uAlpha;
  out vec4 o;
  float sdRB(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
  vec2 toUV(vec2 px){ vec2 uv=(px-uContent.xy)/uContent.zw; uv=1.-abs(1.-mod(uv,2.)); return clamp(uv,vec2(.0015),vec2(.9985)); }
  void main(){
    vec2 px=vec2(gl_FragCoord.x, uRes.y*uDpr-gl_FragCoord.y)/uDpr;
    vec2 hs=uRect.zw*.5, c=uRect.xy+hs, p=px-c; float r=min(uRadius,min(hs.x,hs.y));
    float d=sdRB(p,hs,r); float mask=1.-smoothstep(-1./uDpr,1./uDpr,d);
    if(mask<=0.||uAlpha<=0.){ o=vec4(0.); return; }
    vec2 e=vec2(1.,0.);
    vec2 g=vec2(sdRB(p+e.xy,hs,r)-sdRB(p-e.xy,hs,r), sdRB(p+e.yx,hs,r)-sdRB(p-e.yx,hs,r));
    float glen=length(g); g=glen>1e-5?g/glen:vec2(0.);
    float bevel=max(uBevel,1.); float rim=1.-clamp(-d/bevel,0.,1.); float slope=rim*rim;
    vec2 off=g*slope*bevel*.9*uRefract;
    vec2 q=p/max(hs,vec2(1.)); float r2=clamp(dot(q,q)*.5,0.,1.);
    off+=-p*(.16*(1.-r2))*uBulge;
    vec2 ca=(off*.035+g*slope*3.*uRefract+p*.008*uBulge)*1.2;
    vec2 s=px+off; vec3 col;
    col.r=texture(uTex,toUV(s+ca)).r; col.g=texture(uTex,toUV(s)).g; col.b=texture(uTex,toUV(s-ca)).b;
    col*=1.-.5*smoothstep(.45,1.,rim)*max(uRefract,uShade);
    col*=1.-.28*r2*uShade;
    float spec=pow(slope,2.2)*max(dot(g,normalize(vec2(-.65,-.76))),0.);
    col+=vec3(1.,.93,.82)*(spec*.55+smoothstep(.86,1.,rim)*.14)*uRefract;
    float a=mask*uAlpha; o=vec4(col*a,a);
  }`;
  let glassProg = null;
  function initGlass(gl) {
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, `#version 300 es
    in vec2 aPos; void main(){ gl_Position=vec4(aPos,0.,1.); }`));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, GLASS_FS));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    const U = {}; ['uTex', 'uRes', 'uDpr', 'uRect', 'uContent', 'uRadius', 'uBevel', 'uRefract', 'uBulge', 'uShade', 'uAlpha'].forEach((n) => { U[n] = gl.getUniformLocation(p, n); });
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    glassProg = { p, U, vao };
  }
  let glassState = null;
  window.__exitRender = ({ gl, texVid, dpr, vw, vh, cw, ch }) => {
    if (!glassProg) initGlass(gl);
    gl.viewport(0, 0, cw, ch);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const g = glassState;
    if (!g || g.alpha <= 0) return;
    const { p, U, vao } = glassProg;
    gl.useProgram(p); gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texVid); gl.uniform1i(U.uTex, 0);
    gl.uniform2f(U.uRes, vw, vh); gl.uniform1f(U.uDpr, dpr);
    gl.uniform4f(U.uRect, ...g.rect); gl.uniform4f(U.uContent, ...g.content);
    gl.uniform1f(U.uRadius, g.radius); gl.uniform1f(U.uBevel, g.bevel); gl.uniform1f(U.uRefract, g.refract);
    gl.uniform1f(U.uBulge, g.bulge); gl.uniform1f(U.uShade, g.shade); gl.uniform1f(U.uAlpha, g.alpha);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ---------------- 4. 카메라 연출 (스크롤) */
  // 장면 키: anchor 0 = 아이피스, 1 = 모델 중심 · h = 화면 높이 대비 크기 · sx/sy = 화면 위치
  const K = [
    { p: 0.34, anchor: 0, rotY: Math.PI - 0.32, rotX: 0.05, h: 0.14, sx: 0.46, sy: 0.54 },
    { p: 0.60, anchor: 1, rotY: Math.PI - 0.45, rotX: 0.06, h: 0.55, sx: 0.5, sy: 0.54 },
    { p: 0.90, anchor: 1, rotY: -0.5, rotX: 0.5, h: 0.33, sx: 0.506, sy: 0.5 },   // 책상 위에 놓인 카메라를 위쪽 대각선에서 내려다보는 구도 (kinoria 히어로). 전: rotX 0 — 정면 눈높이   // 히어로: 카메라 실루엣 중심이 화면 정중앙에 오도록
  ];
  const PITCH = 0.14;
  const P_TUN = 0.46; // 0 → P_TUN: 아이피스 축을 따라 뒤로 빠지는 구간 (끝부분은 회전 동선과 겹쳐 끊김 없이 이어짐)
  const camA = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  const tmpBox = new THREE.Box3(), tmpV = new THREE.Vector3(), eyeC = new THREE.Vector3(), eyeSize = new THREE.Vector3();
  function poseAt(p) {
    if (p <= K[0].p) return { ...K[0] };
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (p <= b.p) {
        const t = eio(range(p, a.p, b.p));
        return {
          anchor: lerp(a.anchor, b.anchor, t), rotY: lerp(a.rotY, b.rotY, t), rotX: lerp(a.rotX, b.rotX, t),
          h: Math.exp(lerp(Math.log(a.h), Math.log(b.h), t)), sx: lerp(a.sx, b.sx, t), sy: lerp(a.sy, b.sy, t),
        };
      }
    }
    return { ...K[K.length - 1] };
  }
  function placeCamera(pose, W, H, idle) {
    pivot.rotation.set(pose.rotX + idle.x, pose.rotY + idle.y, 0);
    pivot.updateMatrixWorld(true);
    // 아이피스 위치·크기 (현재 회전 기준)
    let eyeH = 0.12;
    if (eye) { tmpBox.setFromObject(eye); tmpBox.getCenter(eyeC); tmpBox.getSize(eyeSize); eyeH = Math.max(eyeSize.y, 0.02); }
    else eyeC.set(0, 0.3, -0.3);
    const anchor = tmpV.copy(eyeC).lerp(new THREE.Vector3(0, 0, 0), pose.anchor);
    const sizeWorld = lerp(eyeH, 1.0, pose.anchor);
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    let D = sizeWorld / (pose.h * 2 * tanH);
    if (pose.anchor > 0.5 && !pose.close) D = Math.max(D, modelW / (0.78 * 2 * tanH * (W / H))); // 세로 화면에서도 잘리지 않게 (마지막 장면의 가까운 뒷면 샷은 제외)
    if (pose.anchor > 0.5 && W / H < 0.8 && !pose.close) D = Math.max(D, 1.65 / (0.8 * 2 * tanH * (W / H))); // 휴대폰 세로: 3/4 각도의 깊이까지 포함해 화면 폭의 86% 안에
    // 16:10 노트북(1646×1029 등)처럼 16:9 보다 세로가 긴 가로 화면: 텍스트(--u)가 폭 기준으로 줄어드는 만큼 카메라도 같은 비율로 → 16:9 와 같은 구도
    const asp = W / H; if (asp < 16 / 9 && asp >= 0.8 && !pose.close) D *= (16 / 9) / asp;
    if (pose.fit) D *= pose.fit;
    camera.position.set(anchor.x, anchor.y + Math.sin(PITCH) * D, anchor.z + Math.cos(PITCH) * D);
    camera.lookAt(anchor);
    camera.aspect = W / H;
    camera.setViewOffset(W, H, -(pose.sx - 0.5) * W, -(pose.sy - 0.5) * H, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }
  function eyeGlassRect(W, H) {   // 유리판 네 모서리(모델 로컬 면 기준)를 화면에 투영한 사각형
    if (!eyeAxis.mesh) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const o of eyeAxis.mesh) {
      const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 64));
      for (let i = 0; i < pos.count; i += step) {
        tmpV.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).project(camera);
        const x = (tmpV.x + 1) / 2 * W, y = (1 - tmpV.y) / 2 * H;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    return [x0, y0, x1 - x0, y1 - y0];
  }
  function eyeRect(W, H) {
    if (!eye) return null;
    tmpBox.setFromObject(eye);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) {
      tmpV.set(i & 1 ? tmpBox.max.x : tmpBox.min.x, i & 2 ? tmpBox.max.y : tmpBox.min.y, i & 4 ? tmpBox.max.z : tmpBox.min.z).project(camera);
      const x = (tmpV.x + 1) / 2 * W, y = (1 - tmpV.y) / 2 * H;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    return [x0, y0, x1 - x0, y1 - y0];
  }

  /* ---------------- 5. 루프 */
  let started = false, pS = 0, last = performance.now(), titleOn = false, autoT = -0.6, readyT = 0;
  const AUTO_DUR = 11; // 로딩 끝 → 유리 → 아이피스 → 회전 → 히어로까지 자동 재생 (초)
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  let userScrolled = false, exitK = 0, scS = 0, scV = 0;
  const SPAN = 3.9; window.__SPAN = SPAN;   // 장면 1 단위 = 화면 3.9배 스크롤 (6 → 5 → 4.4 → 3.9: 전체 스크롤 길이를 다시 약 11% 짧게)
  // 역사 구간(1937 도착 직후 ~ 2026 도착)만 스크롤 1칸에 장면이 1.5배 진행 — 모델이 바뀔 때마다 오래 멈춰 있던 느낌 줄임
  const HS_A = 4.35, HS_B = 7.05, HS_R = 1.5;
  // 스크롤 속도 구간: [시작 sc, 끝 sc, 속도] — 속도 > 1 이면 같은 스크롤에 장면이 더 빨리, < 1 이면 더 오래 머묾
  //  · Capture the Moment 문구가 다 보이는 구간(3.3~3.8)은 0.7배 → 약 한 화면만큼 더 오래 머묾
  //  · 역사 구간(4.35~7.05)은 1.5배 빠르게
  const PS_A = 14.45, PS_B = 16.85, PS_R = 3.5;   // 부품 장면: 스크롤이 5배 빨리 넘어감 → 목록이 가볍게 움직임 (항목 하나에 화면 3.5개 → 0.7개 분량)
  // ONE MEMORY 가 자리 잡은 뒤(13.92) ~ 부품 장면 시작(14.45): 0.5배 → 문장이 다 지나가고 조금 더 내려야 부품 목록이 나옴
  // 스크롤 속도 구간 [시작 sc, 끝 sc, 배속] (배속 > 1 = 빠르게 지나감). 설명은 배열 밖에 둠 — 배열 안에 // 주석을 넣었다가 뒤 항목이 주석에 먹혀 빌드가 깨졌었음
  //  2.6~3.8    From Moment to Memory 문구가 다 나타난 뒤~사라지기 시작할 때까지: 스크롤을 더 써서 오래 머묾
  //  7.95~8.6   '이어온 시간을 지나, 당신의 NOW로' 가 다 뜬 뒤 머무는 구간을 1.5배 빠르게
  //  9.05~12.15 컬러 장면 1.25배 빠르게 · 12.15~12.55 블랙이 된 직후는 0.55배 → 블랙 카메라만 보이는 여유 뒤에 ZERO 글씨 등장
  //  13.92~PS_A ONE MEMORY 가 자리 잡은 뒤 ~ 부품 장면 시작: 0.5배
  //  17.0~19.95 Make a Moment Last(문장 → 가운데 낱말만 남음 → 사진이 넘어가며 커짐): 0.72배 → 스크롤을 약 39% 더 써서 천천히
  //  19.95~20.65 DEVELOPED 카메라 낙하: 스크롤을 1.6배 더 써서 천천히 · 20.65~22.7 마지막 섬광·SHOT 섹션
  //  22.7~27.0  뷰파인더에서 빠져나와 사진이 올라옴: 1.6배 · 27.0~28.2 성장 타임라인 갤러리: 사진 18장을 한 장씩 넘기도록 넉넉히 · 28.2~28.4 갤러리 마지막 장에서 잠깐 머문 뒤 푸터
  const SPD = [[2.6, 3.8, 0.62], [HS_A, HS_B, HS_R], [7.95, 8.6, 1.5], [9.05, 12.15, 1.25], [12.15, 12.55, 0.55], [13.92, PS_A, 0.5],
    [PS_A, PS_B, PS_R], [17.0, 19.95, 0.72], [19.95, 20.65, 0.62], [20.65, 22.7, 2], [22.7, 27.0, 1.6], [27.0, 28.2, 0.42], [28.2, 28.4, 1.6]];
  function u2sc(u) {
    let sc = 0, uu = 0;
    for (const [a, b, r] of SPD) {
      if (u <= uu + (a - sc)) return sc + (u - uu);
      uu += a - sc; sc = a;
      const len = (b - a) / r;
      if (u <= uu + len) return sc + (u - uu) * r;
      uu += len; sc = b;
    }
    return sc + (u - uu);
  }
  // 마지막 장면 (Your Style, Your Film): SHOT 뷰파인더에서 뒤로 빠져나오며 카메라 뒷면이 드러나고 → 카메라가 위로 빠져나가며 화면이 그 아래로 내려감
  // → 지금까지의 사진들이 아래에서 한 장씩 올라옴 (kinoria SHOT 끝). index.html __ysf 와 같은 값
  const OUT_A = 22.7, OUT_B = 23.5, OUT_C = 24.25, OUT_D = 24.85, YSF_END = 26.2;
  // 필름 사진 갤러리: 사진들이 다 올라간 뒤 한 장이 올라와 멈춤(GAL_A~GAL_B) → 뒤에 겹쳐 있던 사진들이 펼쳐짐(GAL_C~GAL_D). index.html __gal 과 같은 값
  const GAL_A = 26.5, GAL_B = 27.0, GAL_C = 27.2, GAL_D = 28.2, GAL_X = 28.4;   // GAL_X: 갤러리가 위로 빠져나가기 시작
  // 마지막 장면 (oryzo): 갤러리 아래에서 푸터와 같은 색의 어두운 섹션이 직선 경계로 올라옴(FIN_A~FIN_P) — 블랙 카메라는 그 섹션 안에서 기운 채 기다리고 있음
  // → 카메라가 화면 가운데로 오며 양옆 카피가 사라짐(FIN_P~FIN_C) → 천천히 한 바퀴 돌고(FIN_R0~FIN_R1) → 섹션 바닥 쪽으로 내려앉음(FIN_L0~FIN_L1) → 푸터
  // ※ 지금은 이 섹션을 쓰지 않음 — 갤러리가 끝나면 바로 푸터로 이어짐. 시각을 페이지 끝(SC_END) 뒤로 밀어 두어 장면이 시작되지 않게 함 (되살리려면 FIN_OFF 를 0 으로, SC_END 를 FIN_END 로)
  const FIN_OFF = 100;
  const FIN_A = 28.4 + FIN_OFF, FIN_P = 28.9 + FIN_OFF, FIN_C = 29.45 + FIN_OFF, FIN_R0 = 29.3 + FIN_OFF, FIN_R1 = 31.5 + FIN_OFF, FIN_L0 = 30.7 + FIN_OFF, FIN_L1 = 31.6 + FIN_OFF, FIN_END = 31.9 + FIN_OFF;
  window.__OUT = { OUT_A, OUT_B, OUT_C, OUT_D, YSF_END, GAL_A, GAL_B, GAL_C, GAL_D, GAL_X, FIN_A, FIN_P, FIN_C, FIN_L1 };
  const SC_END = GAL_X;   // 페이지(스크롤 장면) 끝 = 타임라인 갤러리 끝. 그 아래에 바로 푸터가 이어짐 (전: 마지막 카메라 장면 끝)
  function fitTrack() { const t = document.getElementById('track'); if (t) t.style.height = ((sc2u(SC_END) * SPAN + 1) * 100).toFixed(1) + 'vh'; }   // 페이지 끝 = 마지막 장면 끝
  function sc2u(sc) {
    let s0 = 0, uu = 0;
    for (const [a, b, r] of SPD) {
      if (sc <= a) return uu + (sc - s0);
      uu += a - s0; s0 = a;
      if (sc <= b) return uu + (sc - a) / r;
      uu += (b - a) / r; s0 = b;
    }
    return uu + (sc - s0);
  }
  fitTrack();
  window.__sc2u = sc2u;   // 목차 이동(장면 → 스크롤 위치)용
  // 원인: 사용자가 아직 휠을 안 굴렸을 때(userScrolled=false)는 장면을 히어로(sc=0)에 묶어 두고 있었는데,
  // 그 사이 브라우저/뷰어가 이전 스크롤 위치를 복원하면 scrollY 는 이미 아래(NOW 근처)에 가 있음.
  // 그 상태에서 휠을 한 칸 내리는 순간 묶임이 풀리면서 장면이 그 위치까지 한 번에 달려감 → 내려갈 때만 튐.
  // 해결: 장면은 항상 실제 스크롤 위치를 따르고, 사용자가 직접 입력하기 전에 생긴 스크롤은 맨 위로 되돌림.
  const markUser = () => { userScrolled = true; };
  addEventListener('wheel', markUser, { passive: true });
  addEventListener('touchstart', markUser, { passive: true });
  addEventListener('mousedown', markUser, { passive: true });   // 스크롤바 드래그
  addEventListener('keydown', markUser);
  addEventListener('scroll', () => { if (!userScrolled && scrollY !== 0) scrollTo(0, 0); }, { passive: true });
  addEventListener('pageshow', () => { if (!userScrolled) scrollTo(0, 0); });
  addEventListener('pointermove', (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  addEventListener('intro:done', () => {
    started = true;
    scrollTo(0, 0);
    if ('skipIntro' in root.dataset) { autoT = AUTO_DUR; pS = 0.92; } // 인트로 숨김: 히어로에서 바로 시작
    document.body.classList.add('scrollable');
    root.dataset.phase = 'hero';
  });


  /* ---- 카메라만 흐리게 (레이어 블러): 사진이 나와 중앙으로 오는 동안 위로 떠나는 카메라만 점점 흐려져 시선이 사진에 고정됨 ----
     카메라(사진 제외)를 MSAA 렌더 타깃에 그림 → 박스 필터로 1/2 씩 단계 축소(밉 체인, 계단·깨짐 없음)
     → 블러 반경에 맞는 단계에서 실제 가우시안(가중치를 σ 로 계산, 15탭 분리 2패스) → 부드럽게 확대 합성 → 그 위에 사진만 선명하게 */
  const BL = { rt: null, lv: [], w: 0, h: 0, scene: new THREE.Scene(), cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  const BL_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const downMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null }, uTexel: { value: new THREE.Vector2() } }, vertexShader: BL_VS, depthTest: false, depthWrite: false, toneMapped: false,
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uTexel; varying vec2 vUv;
      void main() { vec2 o = uTexel * 0.5;   // 4 개의 이중선형 샘플 = 원본 4×4 영역 평균 → 축소해도 깨짐 없음
        gl_FragColor = 0.25 * (texture2D(tMap, vUv + vec2(-o.x, -o.y)) + texture2D(tMap, vUv + vec2(o.x, -o.y)) + texture2D(tMap, vUv + vec2(-o.x, o.y)) + texture2D(tMap, vUv + vec2(o.x, o.y))); }` });
  const gaussMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null }, uDir: { value: new THREE.Vector2() }, uSigma: { value: 1 } }, vertexShader: BL_VS, depthTest: false, depthWrite: false, toneMapped: false,
    fragmentShader: `uniform sampler2D tMap; uniform vec2 uDir; uniform float uSigma; varying vec2 vUv;
      void main() { vec4 c = vec4(0.0); float ws = 0.0;
        for (int i = -7; i <= 7; i++) { float x = float(i); float w = exp(-0.5 * x * x / (uSigma * uSigma)); c += texture2D(tMap, vUv + uDir * x) * w; ws += w; }
        gl_FragColor = c / ws; }` });
  const outMat = new THREE.ShaderMaterial({ uniforms: { tMap: { value: null } }, vertexShader: BL_VS, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D tMap; varying vec2 vUv;
      void main() { vec4 c = texture2D(tMap, vUv); vec3 rgb = c.a > 0.0001 ? c.rgb / c.a : vec3(0.0);
        gl_FragColor = vec4(rgb, c.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb *= gl_FragColor.a; }` });
  const blQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), downMat); blQuad.frustumCulled = false; BL.scene.add(blQuad);
  // 버벅임 원인 제거: 사진이 처음 보이는 순간(셰이더·텍스처 첫 업로드)과 레이어 블러가 처음 켜지는 순간
  // (블러용 렌더 타깃 생성 + 렌더 타깃 전용 셰이더 13개 컴파일)이 스크롤 도중에 한꺼번에 일어나 프레임이 멈췄음.
  // → 모델이 준비된 직후, 카메라가 화면에 나타나기 전에 이 작업을 미리 다 해 둠
  // 셰이더 미리 준비 — 화면을 멈추지 않고(비동기) 컴파일: 브라우저가 여러 셰이더를 다른 스레드에서 동시에 컴파일하고(KHR_parallel_shader_compile),
  // 그동안 메인 스레드는 히어로 글자 등장 애니메이션을 계속 그림. 전: 30개 프로그램을 한 줄로 세워 컴파일하는 동안 화면 전체가 멈춰 있었음
  async function prewarm() {
    const ph = print.photo, pv = ph ? ph.visible : false;
    let dummy = null;
    try {
      if (ph) ph.visible = true;
      renderer.getDrawingBufferSize(blSize); blurTargets(blSize.x, blSize.y);
      renderer.setRenderTarget(BL.rt); const pB = renderer.compileAsync(scene, camera);   // 블러 경로(렌더 타깃에 그릴 때)의 셰이더 변형
      renderer.setRenderTarget(null); const pA = renderer.compileAsync(scene, camera);
      await Promise.race([Promise.all([pA, pB]), new Promise((r) => setTimeout(r, 10000))]);
      if (signal.aborted) return;
      mark('compiled');
    } catch (e) { /* 미리 준비 실패해도 정상 동작에는 지장 없음 */ }
    if (dummy) dummy.removeFromParent();
    try {
      if (ph) ph.visible = true;
      renderCamBlurred(2); renderCamBlurred(12);      // 전체·반 해상도 블러 경로 둘 다 (셰이더는 이미 준비됨 → 텍스처 올리기·렌더 타깃 만들기만)
      renderer.render(scene, camera);
    } catch (e) { /* 위와 같음 */ }
    if (ph) ph.visible = pv;
    renderer.setRenderTarget(null);
  }
  function blurTargets(w, h) {
    if (BL.w === w && BL.h === h) return;
    // 전체/반 해상도 타깃을 둘 다 보관 → 블러 세기가 바뀌어도 새로 만들지 않음 (만들 때마다 프레임이 멈췄음)
    BL.sets = BL.sets || new Map();
    const key = w + 'x' + h;
    let set = BL.sets.get(key);
    if (!set) {
      if (BL.sets.size >= 4) { for (const st of BL.sets.values()) { st.rt.dispose(); st.lv.forEach((l) => { l.a.dispose(); l.b.dispose(); }); } BL.sets.clear(); }   // 창 크기가 바뀐 경우만 정리
      BL.allocs = (BL.allocs || 0) + 1;
      const o = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
      set = { rt: new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true, samples: LITE ? 0 : 4 }), lv: [] };
      for (let i = 1; i <= 6; i++) { const lw = Math.max(1, w >> i), lh = Math.max(1, h >> i); set.lv.push({ a: new THREE.WebGLRenderTarget(lw, lh, o), b: new THREE.WebGLRenderTarget(lw, lh, o) }); }
      BL.sets.set(key, set);
    }
    BL.rt = set.rt; BL.lv = set.lv; BL.w = w; BL.h = h;
  }
  const blSize = new THREE.Vector2();
  function quad(mat, target) { blQuad.material = mat; renderer.setRenderTarget(target); renderer.render(BL.scene, BL.cam); }
  function renderCamBlurred(sigmaPx) {
    renderer.getDrawingBufferSize(blSize);
    const half = sigmaPx > 4;   // 이미 4px 이상 흐려지는 구간은 반 해상도로 그려도 차이가 안 보임 → 프레임 부담 1/4
    blurTargets(half ? blSize.x >> 1 : blSize.x, half ? blSize.y >> 1 : blSize.y);
    if (half) sigmaPx *= 0.5;
    const photoVis = print.photo ? print.photo.visible : false;
    if (print.photo) print.photo.visible = false;
    renderer.setRenderTarget(BL.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera);
    // 블러 단계: 그 단계에서 σ 가 1.5~3 텍셀이 되도록 (탭 간격 1텍셀 → 띠·격자 무늬 없음)
    const L = Math.max(1, Math.min(6, Math.floor(Math.log2(Math.max(1, sigmaPx / 1.5))) ));
    let src = BL.rt;
    for (let i = 0; i < L; i++) {
      downMat.uniforms.tMap.value = src.texture; downMat.uniforms.uTexel.value.set(1 / src.width, 1 / src.height);
      quad(downMat, BL.lv[i].a); src = BL.lv[i].a;
    }
    const lv = BL.lv[L - 1], sig = Math.min(3.4, Math.max(0.35, sigmaPx / Math.pow(2, L)));
    gaussMat.uniforms.uSigma.value = sig;
    gaussMat.uniforms.tMap.value = lv.a.texture; gaussMat.uniforms.uDir.value.set(1 / lv.a.width, 0); quad(gaussMat, lv.b);
    gaussMat.uniforms.tMap.value = lv.b.texture; gaussMat.uniforms.uDir.value.set(0, 1 / lv.a.height); quad(gaussMat, lv.a);
    // 축소 단계를 거꾸로 올라오며 이중선형으로 부드럽게 확대 (한 번에 크게 늘리면 마름모 무늬가 생김)
    src = lv.a;
    for (let i = L - 2; i >= 0; i--) { downMat.uniforms.tMap.value = src.texture; downMat.uniforms.uTexel.value.set(1 / src.width, 1 / src.height); quad(downMat, BL.lv[i].b); src = BL.lv[i].b; }
    renderer.setRenderTarget(null); renderer.clear();
    outMat.uniforms.tMap.value = src.texture; quad(outMat, null);
    if (print.photo && photoVis) {
      const pv = pivot.visible; pivot.visible = false; print.photo.visible = true;
      const ac = renderer.autoClear; renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = ac;
      pivot.visible = pv;
    }
  }
  let ftS = 0;   // 푸터가 올라온 높이(부드럽게 뒤따르는 값)
  let hfS = 0;   // 히어로 카메라가 정면으로 돌아온 정도(0~1) — 스크롤을 천천히 뒤따르는 값
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const W = innerWidth, H = innerHeight;
    const len = Math.max(1, track.offsetHeight - H);
    // 스크롤 장면이 끝난 뒤 더 내려간 양 = 푸터가 올라온 높이. 마지막 섹션(갤러리)은 이만큼 같이 위로 올라감
    // 장면들이 스크롤을 0.2~0.3초 뒤따라가는 것처럼 이 값도 같은 식으로 뒤따라가게 함 — 전에는 스크롤 값에 그대로 붙어 있어 휠 한 칸마다 푸터와 갤러리가 뚝뚝 끊겨 올라왔음
    const ftRaw = Math.max(0, scrollY - (track.offsetHeight - H));
    ftS = window.__snap ? ftRaw : ftS + (ftRaw - ftS) * (1 - Math.exp(-dt * 9)); if (Math.abs(ftRaw - ftS) < 0.3) ftS = ftRaw;
    const ftOv = ftS; window.__ftOv = ftOv;
    // 자동 재생: 모델이 준비되면 스크롤 없이 히어로(p .92)까지 진행. 스크롤은 그 이상으로만 영향
    if (started && (root.dataset.model === 'ready' || root.dataset.model === 'error')) autoT += dt;
    const autoP = clamp(autoT / AUTO_DUR) * 0.92;
    const p = started ? Math.max(autoP, clamp(scrollY / len)) : 0;
    pS += (p - pS) * (1 - Math.exp(-dt * 4.5));               // 항상 부드럽게 따라감 (출발·정지에 튐 없음)

    // 배경
    const shotCover = (window.__scS || 0) > 21.06 && (window.__scS || 0) < OUT_A;   // SHOT 섹션이 화면을 다 덮으면 배경·3D 를 그리지 않음 (GPU 절약) — 마지막 장면에서 다시 그림
    if (!shotCover) drawBg(now / 1000, started ? ss(0.04, 0.6, pS) : 0, window.__scS || 0, scV, pointer.x, pointer.y);

    // 3D
    if (renderer.domElement.width !== Math.round(W * renderer.getPixelRatio())) renderer.setSize(W, H, false);
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    const idleK = ss(0.86, 1, pS);
    const idle = { x: (Math.sin(now / 1430) * 0.012 + pointer.sy * 0.06) * idleK, y: (Math.sin(now / 2220) * 0.03 + pointer.sx * 0.12) * idleK };
    let pose = poseAt(pS);
    if (innerWidth / innerHeight < 0.8) pose.sy += 0.13;   // 휴대폰 히어로: 위에 사양 한 줄 + 큰 로고가 놓이므로 카메라를 그 아래(화면 가운데쯤)로 내림 — Kinoria 모바일 구도
    // 스크롤 → 다음 장면(print_1): 히어로 포즈에서 위에서 내려다보는 정면 3/4 포즈로
    // 스크롤 진행(화면 단위) — 휠·트랙패드의 계단식 입력을 관성 보간으로 매끈하게 (Lenis 방식)
    // SPAN: 장면 1 단위 = 화면 높이 × SPAN 만큼 스크롤 (휠 몇 칸에 장면이 훅 지나가지 않게, 일반적인 스크롤 길이)
    // 방어: 뷰어가 프레임 높이를 잠깐 0 근처로 바꾸거나 스크롤 값이 비정상이어도 장면이 끝으로 튀지 않게
    const Hs = Math.max(300, H), sy = Number.isFinite(scrollY) ? scrollY : 0;
    const scRaw = window.__S ?? (started ? Math.min(SC_END, u2sc(sy / (Hs * SPAN))) : 0);
    // 관성 보간 + 속도 제한: 트랙패드·휴대폰을 세게 튕겨도 장면이 한 번에 휙 지나가지 않고 일정한 속도 이하로 재생됨
    // 임계감쇠 스프링: 장면이 스크롤바 위치를 짧게(0.2~0.3초) 뒤따라감 — 속도 제한 없이 위치에 직접 묶여 있어서
    // 스크롤을 멈추면 그 자리 모션에서 부드럽게 멎고(oryzo), 혼자 끝까지 재생되는 일이 없음
    {
      const k = 42, c = 2 * Math.sqrt(k);
      scV += (k * (scRaw - scS) - c * scV) * dt;
      scS += scV * dt;
      if (Math.abs(scRaw - scS) < 0.0003 && Math.abs(scV) < 0.01) { scS = scRaw; scV = 0; }
      if (!Number.isFinite(scS) || !Number.isFinite(scV)) { scS = scRaw; scV = 0; }
      window.__scS = scS;
    }
    if (window.__S != null && window.__snap) scS = scRaw;   // 테스트 렌더용
    const sc = scS;
    // 히어로 → 첫 스크롤: 책상 위에서 내려다보던 구도가 배경이 사라지는 동안 정면 눈높이 구도(전의 히어로 구도)로 천천히 돌아옴 → 그 뒤(0.55)에 플래시가 터지고 사진이 나옴
    //   더 긴 스크롤 구간(0.05~0.66, 전: 0.06~0.5)에 걸쳐 돌고, 스크롤을 곧장 따르지 않고 시간을 두고 뒤따라가므로 휠을 빨리 굴려도 카메라는 제 속도로 천천히 돌아옴
    { const hT = range(sc, 0.05, 0.66), hE = hT * hT * hT * (hT * (hT * 6 - 15) + 10);   // 출발과 도착이 아주 완만한 곡선
      hfS = window.__snap ? hE : hfS + (hE - hfS) * (1 - Math.exp(-dt * 2.2)); if (Math.abs(hE - hfS) < 0.0008) hfS = hE;
      const hf = hfS;
      if (hf > 0 && pS > 0.6) { pose.rotY = lerp(pose.rotY, -0.42, hf); pose.rotX = lerp(pose.rotX, 0, hf); pose.h = Math.exp(lerp(Math.log(pose.h), Math.log(0.31), hf)); pose.sy = lerp(pose.sy, pose.sy - 0.02, hf); } }
    // 히어로 조명: 책상 사진의 빛(왼쪽 위 창에서 들어오는 따뜻한 빛)에 맞춰 주광을 더 따뜻하게, 카메라는 조금 더 밝게. 책상이 사라지면 원래 조명으로
    { const dk = model ? (window.__deskOp || 0) : 0; if (tick.dk !== dk) { tick.dk = dk; key.color.setHex(0xffe6cf).lerp(tick.kc || (tick.kc = new THREE.Color(0xffcf9a)), dk); fill.intensity = 0.22 * (1 - 0.3 * dk); key.intensity = 5.0 * (1 + 0.16 * dk); renderer.toneMappingExposure = 0.86 * (1 + 0.1 * dk);   /* 카메라는 빛을 받아 주변보다 밝게 — 시선이 카메라에 머물도록 (전: 밝기를 10% 낮췄음) */ } }
    const k1 = 0;   // 히어로 카메라는 그대로 유지 (타이포만 사라짐)
    if (k1 > 0) {
      const PR = { anchor: 1, rotY: -0.5, rotX: 0.34, h: 0.4, sx: 0.5, sy: 0.4 };
      pose = { anchor: lerp(pose.anchor, PR.anchor, k1), rotY: lerp(pose.rotY, PR.rotY, k1), rotX: lerp(pose.rotX, PR.rotX, k1),
        h: Math.exp(lerp(Math.log(pose.h), Math.log(PR.h), k1)), sx: lerp(pose.sx, PR.sx, k1), sy: lerp(pose.sy, PR.sy, k1) };
    }
    if (W / H < 0.8) pose.sy -= 0.15 * (1 - k1);                            // 휴대폰 세로: 히어로에서 카메라를 텍스트 위로
    const k2r = range(sc, 1.32, 2.3), k2 = k2r * k2r * k2r * (k2r * (k2r * 6 - 15) + 10);   // 사진이 중앙으로 갈 때(같은 타이밍·곡선) 화면 오프셋도 중앙으로
    if (k2 > 0) { pose.sx = lerp(pose.sx, 0.5, k2); pose.sy = lerp(pose.sy, 0.5, k2); }
    // 03. 역사 → Now: 2026 도면과 같은 시점(오른쪽 측면이 보이는 3/4 정면, 도면 실루엣에 맞춰 찾은 각도) → 컬러 장면 위치로 → 180° 회전
    const hk = range(sc, 6.8, 6.9);
    if (hk > 0) {
      const port = W / H < 0.8;
      const fw = (port ? 0.84 : 0.3927) * (0.31 / 0.35);      // 실루엣 폭 = 화면 폭 대비 (피그마 도면 754/1920) × 히어로와 같은 축소 비율(약 11%)
      const HP = { anchor: 1, rotY: -1.0, rotX: -0.15, h: clamp(fw / 1.883 * W / H, 0.05, 0.6), sx: 0.5, sy: port ? 0.53 : 0.54 };   // 위 타이포와 여백이 생기도록 화면 가운데보다 살짝 아래
      if (!port) HP.h = Math.min(HP.h, Math.max(0.22, (0.5 - (205 * (W / 1920) + 58) / H) / 0.583));   // 짧은 창: 카메라 위 타이포 블록 자리를 먼저 확보 (잘림 방지)
      if (!port) HP.h *= 0.85;                                  // Now 카메라(와 겹쳐 놓이는 2026 도면) 15% 작게 (모바일은 fit 로 약 7% 작게)
      // 도면과 겹친 그 자리·그 크기 그대로, 컬러가 바뀌는 동안 왼쪽으로 천천히 회전하고, 그 회전이 멈추거나 되돌아가지 않고
      // 그대로 이어져 ZERO 장면(ZX_A + 0.6)에서 정면에 부드럽게 도착 (ZX_T1 까지, 전: 블랙에서 반대쪽 3/4 로 멈췄다가 ZERO 에서 정면으로 되돌아와 갑자기 돌아보는 느낌)
      // 회전 속도: 짧게 가속(처음 10%) → 일정한 속도 → 끝에서 감속. 화이트에서 첫 색으로 바뀌기 시작할 때 이미 돌고 있어
      // '색 전환 + 회전 + 떠 있음'이 하나의 움직임으로 보임 (전: 아주 천천히 출발해서, 제자리에서 먼저 떠오른 뒤 나중에야 도는 것처럼 보였음)
      const rk = range(sc, COL_A, ZX_T1), ra = 0.1, rot = 1.1 * (rk < ra ? rk * rk / (2 * ra * (1 - ra)) : rk < 1 - ra ? (rk - ra / 2) / (1 - ra) : 1 - (1 - rk) * (1 - rk) / (2 * ra * (1 - ra)));
      pose = { ...HP, rotY: HP.rotY + rot, fit: port ? 1.2 : 1 };
      const still = 1 - range(sc, 8.6, 9.05);                   // 도면과 겹치는 동안은 흔들림 없이 정확히
      idle.x *= 0.4 * (1 - still); idle.y *= 0.4 * (1 - still);
    }
    // 04-0. ZERO PRINTS: 블랙으로 바뀐 카메라가 반대쪽 3/4 에서 정면으로 돌아와, 살짝 기운 채 화면 정중앙에 떠 있음 (카메라 실루엣 중심 = 화면 중심)
    if (sc > ZX_T0 && (sc < MSG_A || W / H >= 0.8)) {   // 웹: 부품 장면 → 문장 장면까지 카메라는 같은 자리에 계속 떠 있음
      const zt = zxT(sc);
      pose = { ...pose, rotY: lerp(pose.rotY, 0.1, zt), rotX: lerp(pose.rotX, 0.08, zt), h: pose.h * lerp(1, ZX_H, zt), sy: lerp(pose.sy, W / H < 0.8 ? 0.55 : ZX_SY, zt) };
      idle.x *= 1 - 0.6 * zt; idle.y *= 1 - 0.6 * zt;
    }
    // 05-0. Make a Moment Last 앞 문장: 부품 장면에서 위로 빠져나간 블랙 카메라가 위에서 화면 가운데로 폭신하게 떨어져 문장 뒤에 놓임 (kinoria)
    if (sc > MSG_A && W / H < 0.8) {   // 휴대폰 세로만: 문장 뒤 가운데에 떠 있는 자세
      pose = { anchor: 1, rotY: -0.3 + 0.16 * (sc - MSG_A), rotX: 0.05, h: 0.2, sx: 0.5, sy: 0.5 };   // 떨어지며 돌던 동작 없이, 처음부터 아주 느리게만 돎
      idle.x *= 0.3; idle.y *= 0.3;
    }
    if (sc <= END_A) { fallF = 0; fallT = 0; }   // 장면 전으로 돌아가면 다시 위에서부터
    if (sc > END_A) {   // 마지막 장면: 빛나는 DEVELOPED 아래 자리로 떨어지며 돌던 각도가 펴지고, 내려앉은 뒤엔 아주 느리게 계속 돎
      // 낙하 진행도: 스크롤 위치를 곧장 따르지 않고 시간을 두고 뒤따라감 → 휠을 빨리 굴려도 카메라는 제 속도로 천천히 떨어져 내려앉음
      const fT = softFall((sc - END_A) / END_T), dtF = fallT ? Math.min(0.05, (now - fallT) / 1000) : 0; fallT = now;
      fallF = window.__snap ? fT : fallF + (fT - fallF) * (1 - Math.exp(-dtF * 2.6));
      const f = fallF;
      pose = { anchor: 1, rotY: -0.3 - 0.9 * (1 - f) + 0.12 * Math.max(0, sc - END_A - END_T), rotX: 0.06 + 0.3 * (1 - f), h: W / H < 0.8 ? 0.22 : 0.3, sx: 0.5, sy: W / H < 0.8 ? 0.6 : 0.565 };
      idle.x *= 0.3; idle.y *= 0.3;
    }
    // 마지막 장면: 뷰파인더(SHOT 화면의 유리)와 같은 자리·크기의 아이피스 유리를 정면으로 마주 본 채 뒤로 빠져나옴
    // → 기준점이 아이피스에서 카메라 몸체로 옮겨 가며 뒷면이 크게 보이고 → 카메라가 위로 빠져나가며 화면이 그 아래로 내려감
    if (sc > OUT_A - 0.02 && eyeAxis.face) {
      // 뷰파인더(아이피스)를 아주 가까이서 마주 본 데서 시작 → 눈을 떼며 점점 멀어지는 동시에 그대로 아래로 내려감.
      // 옆으로는 움직이지 않음(전: 기준점이 아이피스에서 몸체 가운데로 옮겨 가며 화면이 오른쪽으로 갔다가 내려갔음) — 아이피스가 화면 가운데 세로선을 따라 위로 빠져나가고
      // 뒷면이 이어서 지나간 뒤 밑 모서리 아래에서 사진이 나옴. 멀어짐과 내려감이 겹쳐 하나의 움직임으로 이어짐
      const port = W / H < 0.8;
      const a = eio(range(sc, OUT_A + 0.14, OUT_B + 0.4)), c = range(sc, OUT_B - 0.5, OUT_D + (port ? 0.1 : 0)), cs = c * c * (3 - 2 * c);
      const h = Math.exp(lerp(Math.log(0.52), Math.log(port ? 0.1 : 0.085), a));   // 유리 높이 기준 — 다 물러나면 카메라 전체 높이가 화면보다 조금 큰 정도
      pose = { anchor: 0, rotY: eyeAxis.face.rotY - 0.1 * cs, rotX: eyeAxis.face.rotX + 0.05 * cs, h, sx: 0.5, sy: 0.5 - (port ? 2.0 : 1.8) * cs - 2.6 * Math.pow(range(sc, OUT_D - 0.2, OUT_D + 0.75), 1.6), close: 1 };   // 끝까지 계속 올라가 화면 위로 완전히 빠져나감 (전: 아랫부분이 아직 보이는데 툭 사라졌음)
      idle.x *= 0.1 * cs; idle.y *= 0.1 * cs;
    }
    // 마지막 카메라 장면 (oryzo): 어두운 섹션이 올라오는 동안 카메라는 그 섹션 안 제자리에서(섹션과 함께 올라옴) 기운 채 기다림
    // → 화면 가운데로 → 아주 천천히 한 바퀴 → 섹션 바닥 쪽으로 살짝 지나쳤다 돌아오며 내려앉음
    let finR = -1;
    if (sc > FIN_A - 0.05) {
      const port = W / H < 0.8;
      const a = range(sc, FIN_A, FIN_P), c = eio(range(sc, FIN_P, FIN_C)), r = range(sc, FIN_R0, FIN_R1), rs = r * r * r * (r * (r * 6 - 15) + 10);
      const l = range(sc, FIN_L0, FIN_L1), ob = l > 0 ? 1 + 2.4 * Math.pow(l - 1, 3) + 1.4 * Math.pow(l - 1, 2) : 0;
      finR = rs;
      pose = { anchor: 1, rotY: -0.55 - (Math.PI * 2 - 0.25) * rs, rotX: lerp(0.12, 0.07, rs),
        h: port ? 0.22 : lerp(0.27, 0.31, c) - 0.02 * Math.min(1, ob), sx: 0.5, sy: (1 - a) + lerp(port ? 0.45 : 0.62, 0.5, c) + (port ? 0.06 : 0.15) * ob - ftOv / H };   // 푸터가 올라오면 섹션째로 위로 밀려 올라감 (푸터가 덮지 않음)
      idle.x *= 0.3; idle.y *= 0.3;
    }
    if (window.__fit) { pose = { ...window.__HP }; idle.x = idle.y = 0; }
    placeCamera(pose, W, H, idle);
    updatePrint(sc, dt, now, W, H);
    if (model) {
      if (hk > 0) { pivot.visible = true; pivot.position.set(0, 0, 0); }
      // 공중에 둥둥 (kinoria): ZERO → 부품 → 문장 장면까지 장면이 바뀌어도 똑같은 움직임이 끊김 없이 계속됨.
      // 시간에만 따라 아주 느리게 위아래로 떠다니고, 좌우·앞뒤로 살짝씩 일렁이며, 늘 조금 기운 채. 블랙→ZERO 전환(zxT) 동안 서서히 시작
      // 컬러 장면: 색이 바뀔 때마다 따로 움직이지 않고, 장면 내내 하나의 움직임으로 공중에 떠 있음 (천천히 도는 회전 + 아주 느린 둥둥).
      // 아래 ZERO 장면의 둥둥 움직임과 같은 식 → 블랙에서 ZERO 로 넘어갈 때 끊김 없이 그대로 이어짐. 색은 그 위에서 부드럽게만 바뀜
      hopY = 0;
      if (sc > COL_A - 0.15 && sc < ZX_T1) {
        const k = range(sc, COL_A, COL_A + 1.1) * (1 - zxT(sc)), ks = k * k * (3 - 2 * k);   // 회전이 시작될 때 같이, 아주 서서히 (먼저 떠오르지 않게)
        hopY = (0.035 * Math.sin(now / 1150) + 0.012 * Math.sin(now / 1730 + 0.8)) * ks;
        pivot.position.y += hopY;
        pivot.rotation.y += (0.045 * Math.sin(now / 2300) + 0.025 * Math.sin(now / 1450 + 1.3)) * ks;
        pivot.rotation.x += (0.025 * Math.sin(now / 1900 + 0.4) + 0.012 * Math.sin(now / 1210 + 2.0)) * ks;
        pivot.rotation.z += (0.022 * Math.sin(now / 2700 + 2.1) + 0.01 * Math.sin(now / 1600)) * ks;
      }
      if (sc > ZX_T0 && (sc < MSG_A || (W / H >= 0.8 && sc < END_A))) {
        const zt = zxT(sc);
        pivot.position.y += (0.035 * Math.sin(now / 1150) + 0.012 * Math.sin(now / 1730 + 0.8)) * zt;
        pivot.rotation.y += (0.045 * Math.sin(now / 2300) + 0.025 * Math.sin(now / 1450 + 1.3)) * zt;
        pivot.rotation.x += (0.025 * Math.sin(now / 1900 + 0.4) + 0.012 * Math.sin(now / 1210 + 2.0)) * zt;
        pivot.rotation.z += (-0.1 + 0.022 * Math.sin(now / 2700 + 2.1) + 0.01 * Math.sin(now / 1600)) * zt;
      }
      const xr = Math.max(0, (sc - PART_A) / 0.85);
      if (finR >= 0) {   // 마지막 카메라 장면: 기울어진 채 기다리다가, 도는 동안 서서히 바로 섬. 아주 느리게 둥둥
        pivot.position.set(0, 0.014 * Math.sin(now / 1300), 0);
        pivot.rotation.z += -0.3 * (1 - finR) + 0.006 * Math.sin(now / 2100);
        pivot.visible = true;
      }
      else if (sc > OUT_A - 0.02) {   // 마지막 장면: 제자리 (뷰파인더 유리를 정확히 맞추기 위해 둥둥 움직임 없이 시작 → 몸체가 보이면 아주 살짝)
        const b = range(sc, OUT_B, OUT_C);
        pivot.position.set(0, 0.012 * Math.sin(now / 1300) * b, 0);
        pivot.rotation.z += 0.006 * Math.sin(now / 2100) * b;
        pivot.visible = sc < OUT_D + 0.75;
      }
      else if (sc > END_A) {
        const f = fallF;
        pivot.position.set(0, 2.6 * (1 - f) + 0.025 * Math.sin(now / 1150) * f, 0);
        pivot.rotation.z += 0.18 * (1 - f) - 0.07 * f;
        pivot.visible = true;
      }
      else if (sc > MSG_A && W / H < 0.8) {
        // 휴대폰 세로: 위에서 떨어지지 않음 (바로 뒤 DEVELOPED 장면에서도 카메라가 떨어져, 떨어지는 장면이 연달아 나왔음)
        // → 그 자리에 떠 있는 채로, 살짝 뒤에서 앞으로 다가오며 흐릿한 상태에서 초점이 맞아 나타남. 이후엔 아주 느리게 둥둥
        const f = eio(range(sc, MSG_A, MSG_A + 0.55));
        const xo = eio(range(sc, MSG_OUT, MSG_OUT_E));                                  // 나머지 문장이 사라질 때 뒤로 물러나며 블러로 사라짐 (사진 장면엔 카메라 없음)
        pivot.position.set(0, 0.03 * Math.sin(now / 1150) + 0.01 * Math.sin(now / 1730 + 0.8), -0.3 * (1 - f) - 0.5 * xo);
        pivot.rotation.z += -0.13 + 0.015 * Math.sin(now / 2700 + 2.1);
        pivot.visible = xo < 0.999;
      }
      else if (xr > 0 && W / H < 0.8) {   // 휴대폰 세로: 확대샷이 화면 가운데 띠를 채우므로 카메라는 자리를 비켜 줌 — 위로 올라가지 않고, 제자리에서 살짝 뒤로 물러나며 블러로 옅어져 사라짐
        const xk = Math.min(1, xr / 0.7), xe = xk * xk * (3 - 2 * xk);
        pivot.position.z -= 0.3 * xe;
        pivot.visible = xk < 0.999;
      }
      else if (xr > 0) {
        // 04. 부품 장면 (웹): 카메라는 위 '공중에 둥둥' 움직임을 그대로 이어감 — 장면이 바뀐다고 각도나 흔들림이 달라지지 않음
        // 문장 장면까지 그대로 떠 있다가, 문장 장면 끝에서만 뒤로 물러나며 블러로 사라짐 (위로 빠져나가거나 다시 떨어지는 모션 없음)
        const xo = eio(range(sc, MSG_OUT, MSG_OUT_E));
        if (xo > 0) pivot.position.z -= 0.5 * xo;
        pivot.visible = xo < 0.999;
      }
      if (print.photo && sc > 3.7) print.photo.visible = false;
      updateNow(sc, W, H);
      auroraRim(sc, now);
      if (sc > OUT_A - 0.02) threeCanvas.style.opacity = '1';   // 마지막 장면: SHOT 화면 뒤에서 카메라 뒷면이 드러남
      else if (sc > END_A) threeCanvas.style.opacity = (eio(range(sc, END_A, END_A + 0.2)) * (1 - range(sc, 20.96, 21.02))).toFixed(3);   // 흰 화면이 다 덮은 뒤 카메라 숨김
      else if (sc > MSG_OUT) threeCanvas.style.opacity = (1 - eio(range(sc, MSG_OUT, MSG_OUT_E))).toFixed(3);
      else if (sc > MSG_A && W / H < 0.8) threeCanvas.style.opacity = eio(range(sc, MSG_A, MSG_A + 0.4)).toFixed(3);   // 휴대폰: 제자리에서 서서히 나타남
      else if (sc > PART_A && W / H < 0.8) threeCanvas.style.opacity = (1 - eio(range(sc, PART_A, PART_A + 0.6))).toFixed(3);   // 휴대폰: 부품 장면이 시작되면 제자리에서 옅어짐   // 문장 장면 끝: 카메라가 블러되며 옅어져 사라짐
    }
    if (window.__hist) window.__hist(sc, W, H);
    if (window.__shot) window.__shot(sc);
    if (window.__storyIn) {
      // 사진 아래 가장자리의 화면 y: 중앙(세로 frac) → easeIn 으로 화면 높이 ×1.05 만큼 올라감 (updatePrint 와 같은 식)
      const frac = Math.min(0.645, 0.8 * (W / H) * (PH.L / PH.W)), rk = range(sc, 2.55, 3.6);
      const edgeY = H * (0.5 + frac / 2 - PHOTO_RISE * easeIn(rk));
      window.__storyIn(eio(range(sc, 2.3, 2.58)), rk > 0 ? edgeY : 1e9);
    }
    // 마지막 장면 시작: 카메라(시점)를 아이피스 유리 정면에 정확히 놓아, 유리 안쪽 창이 SHOT 화면의 뷰파인더(.sh-in)와 위치·크기·기울기까지 똑같이 겹치게 함
    // (kinoria: 화면 속 뷰파인더와 카메라의 뷰파인더가 그대로 포개짐). 이후 눈을 떼는 동안(wO 0 → 1) 원래 동선으로 부드럽게 합류
    if (eye && eyeAxis.cL && sc > OUT_A - 0.02 && sc < OUT_B && window.__shIn) {
      const wO = eio(range(sc, OUT_A + 0.14, OUT_B));
      if (wO < 1) {
        const si = window.__shIn, tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), WIN = 0.84;   // WIN: 유리 중 검은 고무 테두리 안쪽 창의 비율
        camA.p.copy(camera.position); camA.q.copy(camera.quaternion);
        pivot.updateMatrixWorld(true);
        const ec = tmpV1.copy(eyeAxis.cL).applyMatrix4(pivot.matrixWorld);
        const n = tmpV.copy(eyeAxis.nLocal).transformDirection(pivot.matrixWorld);
        const D = Math.min(eyeAxis.h * WIN / (2 * tanH * si.h), eyeAxis.w * WIN * H / (2 * tanH * si.w * W));
        camera.position.copy(ec).addScaledVector(n, D);
        camera.up.copy(eyeAxis.uL).transformDirection(pivot.matrixWorld); camera.lookAt(ec); camera.up.set(0, 1, 0);
        camera.position.lerp(camA.p, wO); camera.quaternion.slerp(camA.q, wO);
        camera.setViewOffset(W, H, lerp(-(si.cx - 0.5) * W, -(pose.sx - 0.5) * W, wO), lerp(-(si.cy - 0.5) * H, -(pose.sy - 0.5) * H, wO), W, H);
        camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      }
    }
    const u = range(pS, 0, P_TUN);
    if (eye && u < 1) {
      // 목표(포즈) 카메라 저장
      camA.p.copy(camera.position); camA.q.copy(camera.quaternion);
      const offX = -(pose.sx - 0.5) * W, offY = -(pose.sy - 0.5) * H;
      tmpBox.setFromObject(eye); tmpBox.getCenter(eyeC);
      const n = tmpV.copy(eyeAxis.nLocal).transformDirection(pivot.matrixWorld);
      const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), asp = W / H;
      const D0 = Math.min(eyeAxis.w / 2 / (tanH * asp), eyeAxis.h / 2 / tanH) * 0.9; // 유리가 화면을 꽉 채우는 거리
      const D1 = camA.p.distanceTo(eyeC);
      const e = u * u * u * (u * (u * 6 - 15) + 10);         // smootherstep: 천천히 출발 → 부드럽게 감속
      const D = D0 * Math.pow(D1 / D0, e);                    // 지수 돌리 (원근이 일정하게 풀림)
      camera.position.copy(eyeC).addScaledVector(n, D);
      camera.up.set(0, 1, 0); camera.lookAt(eyeC);
      const w = ss(0.35, 1, u);                               // 축 시점 → 회전 동선으로 서서히 합류
      camera.position.lerp(camA.p, w); camera.quaternion.slerp(camA.q, w);
      camera.setViewOffset(W, H, offX * w, offY * w, W, H);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    }
    const live = started && !!eyeMat;
    if (eyeMat) {
      const U2 = eyeMat.uniforms;
      renderer.getDrawingBufferSize(U2.uRes.value);
      U2.uK.value = ss(0.04, 0.5, u);
      U2.uRefr.value = ss(0, 0.07, u) * (1 - ss(0.3, 0.7, u));   // 유리를 통과하는 순간
      U2.uRest.value = ss(0.05, 0.4, u);                          // 통과 후에도 남는 두꺼운 유리 느낌
      U2.uT.value = now / 1000;
      U2.uShade.value = ss(0.15, 0.7, u);
      U2.uOp.value = 1 - ss(0.55, 0.63, pS);
      // 마지막 장면: 아이피스 유리는 영상 없이 어두운 유리(비스듬한 반사광)로 보임
      const outro = sc > OUT_A - 0.02 && model && pivot.visible;
      U2.uRad.value = outro ? 0.34 : 0.2;   // 마지막 장면: 창 모서리를 SHOT 화면의 뷰파인더와 같은 둥글기로
      if (outro) { U2.uSS.value = 0; U2.uDim.value = 1; U2.uK.value = 1; U2.uRefr.value = 0; U2.uRest.value = 0.6; U2.uShade.value = 1; U2.uOp.value = 1; }
      else if (U2.uDim.value) U2.uDim.value = 0;
      window.__eyeR = outro ? eyeGlassRect(W, H) : null;
      eye.visible = U2.uOp.value > 0.001;   // 인트로가 끝나면 영상 텍스처를 아예 그리지 않음
    }
    // 카메라가 떠오르는 동안 점점 흐려짐 (사진은 선명)
    const camBlur = model && pivot.visible ? (sc > END_A ? 0.3 * (1 - eio(range(sc, END_A, END_A + END_T * 0.55))) : sc < 4.2 ? eio(range(sc, 1.5, 2.3)) : sc > MSG_A ? (W / H < 0.8 ? Math.max(1 - eio(range(sc, MSG_A, MSG_A + 0.55)), eio(range(sc, MSG_OUT, MSG_OUT_E))) : eio(range(sc, MSG_OUT, MSG_OUT_E))) : sc > PART_A ? (W / H < 0.8 ? eio(range(sc, PART_A, PART_A + 0.6)) : 0) : 0) : 0;   // 부품 장면에선 또렷 — 다음 장면으로 떠날 때만 블러   // 사진 장면 · 부품 장면에서 카메라가 떠오르며 블러
    if (!shotCover && (readyT > 0 || !model)) try { // 뷰파인더에서 빠져나오는 동안 카메라가 화면에서 차지하는 네모(px) — 'Your Style' 사진들이 카메라 뒤에서 나오도록 index.html(__ysf)이 씀
    if (model && pivot.visible && sc > OUT_B && sc < OUT_D + 0.75) {
      pivot.updateMatrixWorld(true); camBox.setFromObject(model);
      let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
      for (let i = 0; i < 8; i++) { camCorner.set(i & 1 ? camBox.max.x : camBox.min.x, i & 2 ? camBox.max.y : camBox.min.y, i & 4 ? camBox.max.z : camBox.min.z).project(camera);
        const px = (camCorner.x + 1) / 2 * W, py = (1 - camCorner.y) / 2 * H; l = Math.min(l, px); r = Math.max(r, px); t = Math.min(t, py); b = Math.max(b, py); }
      window.__camBox = { l, r, t, b };
    } else window.__camBox = null;
    // 히어로: 카메라가 책상에 드리우는 그림자 모양(px) — index.html __desk 가 그림
    //   책상 면 = 카메라 바닥면. 카메라 상자의 윗면 네 꼭짓점을 빛 방향(왼쪽 위·앞 → 오른쪽 아래)으로 책상 면까지 내리고, 바닥 네 꼭짓점과 합쳐 바깥 테두리를 구함
    if (model && pivot.visible && sc < 0.72) {
      pivot.updateMatrixWorld(true);
      if (!tick.lb) { const inv = new THREE.Matrix4().copy(model.matrixWorld).invert(), lb = new THREE.Box3(), tb = new THREE.Box3(), mm = new THREE.Matrix4();
        model.traverse((o) => { if (o.isMesh && o.geometry && o.visible) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tb.copy(o.geometry.boundingBox).applyMatrix4(mm.multiplyMatrices(inv, o.matrixWorld)); lb.union(tb); } });
        tick.lb = lb; tick.sn = new THREE.Vector3(); tick.sp = new THREE.Vector3(); tick.sl = new THREE.Vector3(); }
      const lb = tick.lb, n = tick.sn.set(0, 1, 0).transformDirection(model.matrixWorld), p0 = tick.sp.set(0, lb.min.y, 0).applyMatrix4(model.matrixWorld);
      // 빛 방향은 책상 기준(카메라가 좌우로 살짝 돌아도 그림자 방향은 그대로): 책상 면의 기울기(rotX)만 따라감
      const L = tick.sl.set(0.78, -1, -0.12).normalize().applyAxisAngle(camCorner.set(1, 0, 0), pivot.rotation.x), Ln = L.dot(n);
      const pts = [], foot = [], ix = 0.9;                                  // ix: 상자 모서리는 둥글므로 조금 안쪽으로
      const cxm = (lb.min.x + lb.max.x) / 2, czm = (lb.min.z + lb.max.z) / 2, hx = (lb.max.x - lb.min.x) / 2 * ix, hz = (lb.max.z - lb.min.z) / 2 * ix;
      for (let i = 0; i < 8; i++) {
        camCorner.set(cxm + (i & 1 ? hx : -hx), i & 4 ? lb.min.y + (lb.max.y - lb.min.y) * 0.94 : lb.min.y, czm + (i & 2 ? hz : -hz)).applyMatrix4(model.matrixWorld);
        if (i & 4 && Math.abs(Ln) > 0.05) { const d = camCorner.clone().sub(p0).dot(n) / Ln; camCorner.addScaledVector(L, -d); }
        camCorner.project(camera); const q = [(camCorner.x + 1) / 2 * W, (1 - camCorner.y) / 2 * H]; pts.push(q); if (!(i & 4)) foot.push(q);
      }
      // 바깥 테두리(볼록 껍질)
      const hullOf = (P) => { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
        for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        return lo.slice(0, -1).concat(up.slice(0, -1)); };
      window.__camSh = { hull: hullOf(pts), foot: hullOf(foot), k: clamp(1 - hfS * 2.2) };   // k: 카메라가 정면으로 돌기 시작하면 책상 그림자는 먼저 옅어짐 (책상 면이 눕혀지며 그림자 모양이 어색하게 늘어나기 전에)
    } else window.__camSh = null;
    const cbl = Math.max(camBlur, model ? (window.__ldBlur || 0) : 0); if (cbl > 0.004) renderCamBlurred(18 * renderer.getPixelRatio() * cbl);   /* __ldBlur: 시작 로딩 화면이 정하는 흐림 */ else renderer.render(scene, camera); } catch (e) { if (!tick.err) { tick.err = 1; report('render: ' + (e && e.message || e)); } }

    // 2D 영상판: 3D 아이피스가 준비되기 전까지만 화면을 덮음 (준비되면 같은 프레임에서 3D 로 교대)
    const screen = [0, 0, W, H];
    glassState = live ? null : { rect: screen, content: cover(screen), radius: 0, bevel: 1, refract: 0, bulge: 0, shade: 0, alpha: 1 };

    { const ho = (1 - ss(0, 0.04, pS)).toFixed(3); if (ho !== tick.ho) { tick.ho = ho; root.style.setProperty('--hero-o', ho); } }   // 바뀔 때만
    // 히어로 텍스트: 등장은 한 번(시간 기반), 퇴장은 사용자가 직접 스크롤한 양에 연동(스크럽)
    // Kinoria 처럼: 카메라가 먼저 나타나 자리 잡고(약 1.3초) → 그 뒤 로고가 카메라 뒤에서 초점 맞춰지며 등장 → 오른쪽 텍스트
    // 인트로를 건너뛰는 동안: 헤더·글자는 카메라(3D 모델)를 기다리지 않고 글꼴만 준비되면 바로 등장
    const wantTitle = pS > 0.84 && ('skipIntro' in root.dataset || (readyT > 0 && now - readyT > 750)) && window.__fontsOk !== false && !window.__loaderHold;   // 글꼴이 다 준비되기 전엔 글자를 띄우지 않음 · 시작 로딩 화면이 지나가는 동안에도 기다림
    exitK = clamp(sc / 0.45);
    if (window.__heroExit) window.__heroExit(exitK < 0.0005 ? 0 : exitK);
    if (window.__desk) window.__desk(sc);
    if (wantTitle !== titleOn) { titleOn = wantTitle; root.dataset.title = titleOn ? 'on' : 'off'; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return () => {
    try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* 이미 정리됨 */ }
    ['__OUT', '__SPAN', '__T', '__camBox', '__camSh', '__dbgP', '__exitRender', '__eyeR', '__ftOv', '__nowCol', '__nowProj', '__sc2u', '__scS', '__tm'].forEach((k) => { delete window[k]; });
  };
}
