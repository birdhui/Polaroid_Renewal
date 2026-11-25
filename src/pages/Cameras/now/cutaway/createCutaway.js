// Polaroid Now 내부 구조 연출 (three.js 실시간 3D) — 담당: 정준혁
// CameraNowPage 의 '내부 구조' 섹션에서 createCutaway() 로 한 번 만들고, 페이지를 떠나면 destroy() 로 정리한다.
// 모델: Blender 원본(흰색 Now)을 그래파이트로 바꾸고 내부 부품을 더해 GLB로 내보냄
//   src/assets/cameras/now/now-graphite.glb
// 스크롤 진행률(p)에 따른 장면
//   0.00 → 0.12  닫힌 카메라가 오른쪽에서 왼쪽으로 돈다
//   0.10 → 0.22  왼쪽 몸체가 잘려 나가며 내부가 열린다
//   0.22 → 0.52  스펙트럼이 렌즈로 들어와 거울을 거쳐 필름에 닿는다 (천천히)
//   0.56 → 0.76  롤러가 돌며 사진이 배출된다 (현상 시작)
//   0.76 → 0.86  몸체가 다시 닫히고 카메라가 위로 올라간다
//   0.86 → 0.95  사진 아래에 설명 문구와 영상 카드가 나타난다

/*
 * three.js 는 아직 package.json 에 없어서(새 패키지는 PM 승인 필요) jsDelivr CDN 의 ES 모듈로 불러온다.
 * 승인 후 `npm i three` 를 하면 loadThree() 를 아래 정적 import 로 바꾸면 된다.
 *   import * as THREE from 'three';
 *   import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; ...
 */
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.187.0';
let threePromise = null;
function loadThree() {
  threePromise ??= Promise.all([
    import(/* @vite-ignore */ `${THREE_CDN}/+esm`),
    import(/* @vite-ignore */ `${THREE_CDN}/examples/jsm/loaders/GLTFLoader.js/+esm`),
    import(/* @vite-ignore */ `${THREE_CDN}/examples/jsm/libs/meshopt_decoder.module.js/+esm`),
    import(/* @vite-ignore */ `${THREE_CDN}/examples/jsm/environments/RoomEnvironment.js/+esm`),
  ]).then(([THREE, gltf, meshopt, room]) => ({
    THREE,
    GLTFLoader: gltf.GLTFLoader,
    MeshoptDecoder: meshopt.MeshoptDecoder,
    RoomEnvironment: room.RoomEnvironment,
  }));
  threePromise.catch(() => { threePromise = null; }); // 실패하면 다음 방문 때 다시 시도
  return threePromise;
}

/**
 * @param {object} o
 * @param {HTMLElement} o.section  스크롤 길이를 가진 섹션
 * @param {HTMLElement} o.stage    화면에 고정되는 무대
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} [o.copy]   설명 문구 + 영상 카드 (사진 아래로 따라 내려간다)
 * @param {HTMLElement} [o.glowL]
 * @param {HTMLElement} [o.glowR]
 * @param {string} o.modelUrl
 * @param {string} o.printUrl      인화 사진
 * @param {boolean} o.reduce       동작 줄이기: 마지막 장면만 그린다
 * @param {number} [o.head]        화면 위 고정 헤더 높이(px)
 * @param {() => void} [o.onReady]
 * @param {() => void} [o.onFail]  WebGL·모델·three.js 를 쓸 수 없을 때
 * @returns {{ destroy: () => void }}
 */
export function createCutaway(o) {
  let destroyed = false;
  let cleanup = () => {};
  loadThree()
    .then((lib) => { if (!destroyed) cleanup = init(lib, o); })
    .catch(() => { if (!destroyed) o.onFail?.(); });
  return { destroy() { destroyed = true; cleanup(); } };
}

function init({ THREE, GLTFLoader, MeshoptDecoder, RoomEnvironment }, { section: sec, stage, canvas, copy: text, glowL, glowR, modelUrl, printUrl, reduce, head = 0, onReady, onFail }) {
  const MODEL = modelUrl;
  const PRINT = printUrl;
  let disposed = false;

  const clamp = (v) => Math.min(1, Math.max(0, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;
  // Blender 좌표(앞 = -Y, 위 = +Z) → three.js 좌표(앞 = +Z, 위 = +Y)
  const bl = (x, y, z) => new THREE.Vector3(x, z, -y);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance' });
  } catch (e) {
    onFail?.();
    return () => {};
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(18, 1, 0.01, 10);
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(-1.2, 1.8, 2.0);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.6); rim.position.set(1.6, 1.0, -1.4);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(1.4, 0.2, 1.8);
  scene.add(key, rim, fill);
  // 스펙트럼이 닿을 때 내부를 비추는 빛
  const beamLight = new THREE.PointLight(0xffffff, 0, 0.25, 1.6);
  scene.add(beamLight);

  const root = new THREE.Group();
  scene.add(root);

  // ---------- 잘라 내는 평면 + 단면(캡) ----------
  const CAPS = !/nocap/.test(location.search);
  const CLOSED = 0.095;
  const OPEN = 0.0095;
  const clip = new THREE.Plane(new THREE.Vector3(1, -0.25, 0).normalize(), CLOSED);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2c2c2e, roughness: 0.8, metalness: 0,
    stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
  });
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), capMat);
  cap.renderOrder = 1.1;
  cap.onAfterRender = (r) => r.clearStencil();
  scene.add(cap);

  const stencilFor = (mesh) => {
    const base = new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, clippingPlanes: [clip] });
    const back = base.clone(); back.side = THREE.BackSide;
    back.stencilFail = back.stencilZFail = back.stencilZPass = THREE.IncrementWrapStencilOp;
    const front = base.clone(); front.side = THREE.FrontSide;
    front.stencilFail = front.stencilZFail = front.stencilZPass = THREE.DecrementWrapStencilOp;
    [back, front].forEach((m) => { const s = new THREE.Mesh(mesh.geometry, m); s.renderOrder = 1; mesh.add(s); });
  };

  // ---------- 스펙트럼 ----------
  const beamMat = (intensity) => new THREE.ShaderMaterial({
    uniforms: { uProg: { value: 0 }, uAlpha: { value: 0 }, uI: { value: intensity } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform float uProg, uAlpha, uI; varying vec2 vUv;
      vec3 hue(float t){ return clamp(abs(mod(t*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); }
      void main(){
        if (vUv.y > uProg) discard;
        float head = smoothstep(uProg, uProg - 0.12, vUv.y);
        float tail = smoothstep(0.0, 0.08, vUv.y);
        float side = pow(sin(vUv.x * 3.14159), 0.7);
        vec3 c = hue(0.02 + vUv.x * 0.78) * 1.15 + 0.12;
        gl_FragColor = vec4(c * side * head * tail * uAlpha * uI, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  // 시작 사각형(a0..a3)에서 끝 사각형(b0..b3)으로 이어지는 빛기둥. uv.x = 가로, uv.y = 진행 방향
  const frustum = (a, b) => {
    const pos = []; const uv = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const q = [a[i], a[j], b[j], b[i]];
      const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
      [0, 1, 2, 0, 2, 3].forEach((k) => { pos.push(q[k].x, q[k].y, q[k].z); uv.push(u[k][0], u[k][1]); });
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    return g;
  };
  const rectAround = (c, u, v, w, h) => [
    c.clone().addScaledVector(u, -w / 2).addScaledVector(v, -h / 2),
    c.clone().addScaledVector(u, w / 2).addScaledVector(v, -h / 2),
    c.clone().addScaledVector(u, w / 2).addScaledVector(v, h / 2),
    c.clone().addScaledVector(u, -w / 2).addScaledVector(v, h / 2),
  ];
  const ribbon = (p0, p1, w0, w1, across) => {
    const a = [p0.clone().addScaledVector(across, -w0 / 2), p0.clone().addScaledVector(across, w0 / 2)];
    const b = [p1.clone().addScaledVector(across, -w1 / 2), p1.clone().addScaledVector(across, w1 / 2)];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([a[0], a[1], b[1], a[0], b[1], b[0]].flatMap((v) => [v.x, v.y, v.z]), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    return g;
  };

  const LENS_FRONT = bl(0.0025, -0.05, 0.0704);
  const LENS_BACK = bl(0.0025, -0.026, 0.0704);
  const MIRROR_HIT = bl(0.0025, 0.0215, 0.0704);
  const FILM_C = bl(0, -0.0125, 0.0172);
  const SOURCE = bl(0.13, -0.32, 0.135);

  const beams = new THREE.Group(); root.add(beams);
  // 바깥: 넓게 퍼진 빛이 렌즈로 모인다 (교차한 리본 2장)
  const inDir = LENS_FRONT.clone().sub(SOURCE).normalize();
  const acrossA = new THREE.Vector3().crossVectors(inDir, new THREE.Vector3(0, 1, 0)).normalize();
  const acrossB = new THREE.Vector3().crossVectors(inDir, acrossA).normalize();
  const outerMat = beamMat(1.0);
  beams.add(new THREE.Mesh(ribbon(SOURCE, LENS_FRONT, 0.075, 0.015, acrossA), outerMat));
  beams.add(new THREE.Mesh(ribbon(SOURCE, LENS_FRONT, 0.045, 0.011, acrossB), outerMat));
  // 안: 렌즈 → 거울
  const X = new THREE.Vector3(1, 0, 0); const Y = new THREE.Vector3(0, 1, 0); const Z = new THREE.Vector3(0, 0, 1);
  const lensMat = beamMat(0.75);
  beams.add(new THREE.Mesh(frustum(rectAround(LENS_BACK, X, Y, 0.012, 0.012), rectAround(MIRROR_HIT, X, Y, 0.03, 0.026)), lensMat));
  // 거울 → 필름
  const filmMat = beamMat(0.6);
  beams.add(new THREE.Mesh(frustum(rectAround(MIRROR_HIT, X, Z, 0.03, 0.026), rectAround(FILM_C, X, Z, 0.074, 0.074)), filmMat));
  // 필름에 닿은 빛
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const filmFlash = new THREE.Mesh(new THREE.PlaneGeometry(0.076, 0.076), flashMat);
  filmFlash.rotation.x = -Math.PI / 2; filmFlash.position.copy(FILM_C).add(new THREE.Vector3(0, 0.0012, 0));
  beams.add(filmFlash);

  // ---------- 인화 사진 ----------
  const PW = 0.084; const PL = 0.102; // 88 × 107mm 비율
  const IMG = { x: 4.5 / 88, y: 6 / 107, w: 79 / 88, h: 79 / 107 }; // 위쪽 기준 이미지 영역
  const printCanvas = document.createElement('canvas');
  printCanvas.width = 1408; printCanvas.height = Math.round(1408 * 107 / 88);
  const printTex = new THREE.CanvasTexture(printCanvas);
  printTex.colorSpace = THREE.SRGBColorSpace;
  printTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const drawPrint = (img) => {
    const c = printCanvas.getContext('2d'); const W = printCanvas.width; const H = printCanvas.height;
    c.fillStyle = '#f3f1ea'; c.fillRect(0, 0, W, H);
    const ix = IMG.x * W; const iy = IMG.y * H; const iw = IMG.w * W; const ih = IMG.h * H;
    if (img) {
      const s = Math.max(iw / img.naturalWidth, ih / img.naturalHeight);
      const sw = iw / s; const sh = ih / s;
      c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * 0.42, sw, sh, ix, iy, iw, ih);
    } else {
      const g = c.createLinearGradient(ix, iy, ix + iw, iy + ih);
      g.addColorStop(0, '#2f6f8f'); g.addColorStop(0.5, '#e7b56a'); g.addColorStop(1, '#c4553f');
      c.fillStyle = g; c.fillRect(ix, iy, iw, ih);
    }
    printTex.needsUpdate = true;
  };
  drawPrint(null);
  const photo = new Image();
  photo.crossOrigin = 'anonymous';
  photo.decoding = 'async';
  photo.onload = () => { drawPrint(photo); needsRender = true; };
  photo.src = PRINT;

  const develop = { value: 0 };
  // 광택 인화지: 반사는 좁고 약하게 (넓은 반사광이 덮으면 현상 전 어두운 필름이 회색으로 뜬다)
  const printTop = new THREE.MeshPhysicalMaterial({ map: printTex, color: 0xd6d6d6, roughness: 0.3, metalness: 0, specularIntensity: 0.3, envMapIntensity: 0.5 });
  printTop.onBeforeCompile = (sh) => {
    sh.uniforms.uDev = develop;
    sh.uniforms.uImg = { value: new THREE.Vector4(IMG.x, 1 - IMG.y - IMG.h, IMG.w, IMG.h) };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDev; uniform vec4 uImg;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 iu = (vMapUv - uImg.xy) / uImg.zw;
        if (iu.x > 0.0 && iu.x < 1.0 && iu.y > 0.0 && iu.y < 1.0) {
          float d = smoothstep(0.0, 1.0, uDev);
          vec3 latent = vec3(0.012, 0.016, 0.02);
          vec3 mid = mix(latent, diffuseColor.rgb * vec3(0.78, 0.9, 1.0), smoothstep(0.0, 0.7, d));
          diffuseColor.rgb = mix(mid, diffuseColor.rgb, smoothstep(0.45, 1.0, d));
        }`);
  };
  const print = new THREE.Group();
  const topFace = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), printTop);
  topFace.rotation.x = -Math.PI / 2; topFace.position.y = 0.00034; topFace.rotation.z = Math.PI;
  const backFace = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), new THREE.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.6 }));
  backFace.rotation.x = Math.PI / 2; backFace.position.y = -0.00034;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.0002, 0.0005, PL - 0.0002), new THREE.MeshStandardMaterial({ color: 0xeeece4, roughness: 0.5 }));
  print.add(edge, topFace, backFace);
  root.add(print);
  const PRINT_START = bl(0, -0.0125, 0.0177);
  const PRINT_TRAVEL = 0.1085; // 뒤쪽 끝이 배출구에 살짝 물릴 때까지

  // ---------- 모델 ----------
  const spinners = [];
  let bodyBox = null;
  let ready = false;
  let needsRender = true;

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  loader.load(MODEL, (gltf) => {
    if (disposed) return;
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      const n = o.name;
      const m = o.material;
      if (/^INT_/.test(n)) {
        if (!/Chrome|Mirror|Brass|Gold|Steel|Copper/.test(m.name)) m.envMapIntensity = 0.35;
        // 기어열: 롤러 기어 → 아이들러(+작은 기어) → 중간 기어 → 구동 기어(모터). 반지름 비로 속도를 맞춘다
        const spin = { INT_Roller_Top: [1, 1], INT_Gear_Roller: [1, 1], INT_Roller_Bottom: [-1, 1], INT_Gear_Idler: [-1, 0.765], INT_Gear_Small: [-1, 0.765], INT_Gear_Mid: [1, 0.478], INT_Gear_Drive: [-1, 0.527], INT_Motor: [-1, 0.527] }[n];
        if (spin) spinners.push({ o, dir: spin[0], k: spin[1] });
        if (/Mirror$/.test(m.name) || n === 'INT_Mirror') { m.envMapIntensity = 1.4; }
        return;
      }
      // 플래시 커버: 은색 반사판
      if (/Flash_Fresnel_Cover|Flash_Cup/.test(n)) {
        o.material = new THREE.MeshPhysicalMaterial({ color: 0xc9cdd1, metalness: 0.85, roughness: 0.3, clearcoat: 0.5, envMapIntensity: 2.4 });
      }
      if (/FilmExit_Guide/.test(m.name)) { m.color.set(0x1b1b1c); }
      if (/Lens|Front_Lens/.test(n)) return; // 렌즈는 자르지 않는다
      o.material = o.material.clone();
      o.material.clippingPlanes = [clip];
      o.material.clipShadows = true;
      if (CAPS && /^Body_(Front_White|Rear_Housing|Film_Tray)$/.test(n)) { o.renderOrder = 2; stencilFor(o); }
      else o.material.side = THREE.DoubleSide;
    });
    // 회전하는 부품의 회전축(Blender X축)을 기억
    spinners.forEach((s) => { s.base = s.o.rotation.x; });
    root.add(model);
    bodyBox = new THREE.Box3().setFromObject(model);
    ready = true;
    needsRender = true;
    onReady?.();
  }, undefined, () => { if (!disposed) onFail?.(); });

  // ---------- 화면 맞춤 ----------
  const tmp = new THREE.Vector3();
  const corners = (box) => {
    const out = [];
    for (let i = 0; i < 8; i++) out.push(new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    return out;
  };
  const project = (pts) => {
    let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
    pts.forEach((p) => { tmp.copy(p).project(camera); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); });
    return { x0, x1, y0, y1 };
  };
  let W = 1; let H = 1;
  const placeCamera = (az, el, dist, target) => {
    const a = THREE.MathUtils.degToRad(az); const e = THREE.MathUtils.degToRad(el);
    camera.position.set(target.x + dist * Math.sin(a) * Math.cos(e), target.y + dist * Math.sin(e), target.z + dist * Math.cos(a) * Math.cos(e));
    camera.lookAt(target);
    camera.updateMatrixWorld();
  };
  // pts가 화면의 [top, bottom] 사이(px)에 들어오도록 거리와 위치를 맞춘다.
  const fit = (pts, az, el, top, bottom, maxW) => {
    const target = new THREE.Vector3(); pts.forEach((p) => target.add(p)); target.multiplyScalar(1 / pts.length);
    camera.clearViewOffset();
    let lo = 0.05; let hi = 3; let d = 1;
    for (let i = 0; i < 18; i++) {
      d = (lo + hi) / 2; placeCamera(az, el, d, target);
      const b = project(pts);
      const wpx = (b.x1 - b.x0) / 2 * W; const hpx = (b.y1 - b.y0) / 2 * H;
      if (wpx > maxW || hpx > bottom - top) lo = d; else hi = d;
    }
    d = hi; placeCamera(az, el, d, target);
    const b = project(pts);
    const cx = (b.x0 + b.x1) / 2 * W / 2; // px, 화면 중앙 기준
    const topPx = (1 - b.y1) / 2 * H;
    const hpx = (b.y1 - b.y0) / 2 * H;
    const want = top + (bottom - top - hpx) / 2;
    camera.setViewOffset(W, H, cx, topPx - want, W, H);
    camera.updateProjectionMatrix();
    return project(pts);
  };

  // ---------- 장면 ----------
  const printPts = (travel) => {
    const c = PRINT_START.clone().add(new THREE.Vector3(0, -travel * 0.03, travel));
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new THREE.Vector3(c.x + sx * PW / 2, c.y, c.z + sz * PL / 2));
  };
  let lastP = -1;
  let rafId = 0;

  const render = (p) => {
    if (!ready) return;
    const rot = ease(seg(p, 0.0, 0.13));
    const open = ease(seg(p, 0.1, 0.22));
    const close = ease(seg(p, 0.76, 0.86));
    const beamIn = seg(p, 0.22, 0.52);
    const beamOut = seg(p, 0.52, 0.58);
    const eject = ease(seg(p, 0.56, 0.78));
    const dev = seg(p, 0.6, 0.92);
    const txt = easeOut(seg(p, 0.86, 0.95));

    // 자르기
    clip.constant = lerp(CLOSED, OPEN, open * (1 - close));
    clip.coplanarPoint(cap.position);
    cap.lookAt(cap.position.clone().sub(clip.normal));
    cap.visible = CAPS && clip.constant < CLOSED - 0.001;

    // 스펙트럼 (바깥 → 렌즈 → 거울 → 필름 순서로 천천히)
    const fade = 1 - beamOut;
    outerMat.uniforms.uProg.value = easeOut(seg(beamIn, 0.0, 0.42)) * 1.0;
    lensMat.uniforms.uProg.value = seg(beamIn, 0.38, 0.6);
    filmMat.uniforms.uProg.value = easeOut(seg(beamIn, 0.56, 0.86));
    const on = beamIn > 0 ? fade : 0;
    outerMat.uniforms.uAlpha.value = on * 0.7;
    lensMat.uniforms.uAlpha.value = on * 0.55 * (open > 0.5 ? 1 : 0);
    filmMat.uniforms.uAlpha.value = on * 0.5 * (open > 0.5 ? 1 : 0);
    flashMat.opacity = seg(beamIn, 0.8, 1) * fade * 0.16;
    flashMat.color.setHSL((p * 7) % 1, 0.6, 0.6);
    beams.visible = beamIn > 0 && beamOut < 1;
    beamLight.position.copy(FILM_C).add(new THREE.Vector3(0, 0.03, 0));
    beamLight.intensity = seg(beamIn, 0.5, 1) * fade * 0.06;
    beamLight.color.setHSL(0.08 + 0.5 * seg(beamIn, 0.5, 1), 0.7, 0.6);

    // 사진 배출 + 현상
    const travel = eject * PRINT_TRAVEL;
    print.position.copy(PRINT_START).add(new THREE.Vector3(0, -eject * 0.003, travel));
    develop.value = dev;
    const roll = travel / 0.0028; // 롤러 반지름만큼 굴러간 각도
    spinners.forEach((s) => { s.o.rotation.x = s.base + s.dir * roll * s.k; });

    // 글로우
    const glow = 0.25 + 0.55 * seg(beamIn, 0.1, 0.6) * fade + 0.15 * dev;
    if (glowL) glowL.style.opacity = glow.toFixed(3);
    if (glowR) glowR.style.opacity = glow.toFixed(3);

    // 카메라: 오른쪽 → 왼쪽으로 돌고, 마지막엔 살짝 정면으로
    const az = lerp(lerp(34, -40, rot), -30, close);
    const el = lerp(lerp(18, 27, rot), 21, close);
    const textH = text ? text.offsetHeight : 0;
    const top = head + H * 0.05;
    const bodyPts = corners(bodyBox);
    // 사진이 나오는 만큼 화면 맞춤 기준을 늘려 사진이 잘리지 않게 한다
    const pts = eject > 0 ? bodyPts.concat(printPts(travel)) : bodyPts;
    const bottomFinal = H - textH - Math.max(48, H * 0.08) - 28;
    const bottom = lerp(H * 0.9, bottomFinal, Math.max(eject, close));
    const maxW = Math.min(W * 0.86, 980);
    const scr = fit(pts, az, el, top, bottom, maxW);

    // 문구: 사진 맨 아래보다 아래에 둔다 (사진이 길어진 만큼 내려간다)
    if (text) {
      const printBottom = (1 - scr.y0) / 2 * H;
      text.style.top = `${Math.round(printBottom + 28)}px`;
      text.style.opacity = txt.toFixed(3);
      text.style.visibility = txt > 0.01 ? 'visible' : 'hidden'; // 안 보일 때는 영상 카드에 포커스가 가지 않게
      text.style.transform = `translateY(${((1 - txt) * 14).toFixed(1)}px)`;
    }

    renderer.render(scene, camera);
  };

  const progress = () => {
    if (reduce) return 1;
    const r = sec.getBoundingClientRect();
    const total = sec.offsetHeight - window.innerHeight;
    return clamp(-r.top / Math.max(1, total));
  };

  const resize = () => {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    needsRender = true;
  };

  let visible = false;
  const loop = () => {
    rafId = 0;
    const p = progress();
    if (needsRender || Math.abs(p - lastP) > 1e-5) {
      lastP = p; needsRender = false;
      render(p);
    }
    if (visible && !reduce) rafId = requestAnimationFrame(loop);
  };
  const kick = () => { if (!rafId) rafId = requestAnimationFrame(loop); };

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }, { rootMargin: '100px 0px' });
  io.observe(sec);
  const onResize = () => { resize(); kick(); };
  window.addEventListener('resize', onResize);
  resize();
  const wait = setInterval(() => { if (ready) { clearInterval(wait); needsRender = true; kick(); } }, 60);

  // 페이지를 떠나면 화면 갱신을 멈추고 GPU 자원을 돌려준다.
  return () => {
    disposed = true;
    visible = false;
    clearInterval(wait);
    if (rafId) cancelAnimationFrame(rafId);
    io.disconnect();
    window.removeEventListener('resize', onResize);
    photo.onload = null;
    scene.traverse((obj) => {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      mats.forEach((m) => { m.map?.dispose(); m.dispose(); });
    });
    printTex.dispose();
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
