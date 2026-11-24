/**
 * Polaroid Now 3D 장면 엔진 (담당: 곽세희)
 *
 * 아티팩트 프로토타입(Polaroid Renewal)의 three.js 장면을 그대로 옮긴 1차 이식본.
 * 히어로 카메라 · 플래시와 사진 출력·낙하·상승 · 레이어 블러 · NOW 도면 정합 · 8가지 컬러 회전을 그린다.
 *
 * 주의 (다음 단계 정리 대상): 프로토타입 구조를 유지하느라 지금은 window 스크롤을 직접 읽고
 * window.__* 값으로 Landing UI 엔진과 주고받는다. cameraContract.js 의 props 계약으로 나누는 작업은 따로 진행한다.
 *
 * @param {AbortSignal} signal 페이지를 떠날 때 abort → 이벤트·루프 정리
 * @returns {() => void} 렌더러·GPU 자원 정리 함수
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function mountPolaroidScene(signal) {
  // ── 프로토타입(아티팩트) 코드를 그대로 옮기기 위한 범위 한정 ──
  // 창(window)에 다는 이벤트는 페이지를 떠날 때 signal 로 한 번에 해제되고, 애니메이션 루프도 함께 멈춘다.
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
  const track = document.getElementById('track');
  const video = document.getElementById('video');

  /* ---------------- 1. 배경: 좌측 하단 모서리부터 번지는 그라데이션 (Figma title 배경색) */
  const bgCanvas = document.getElementById('bg');
  const bgl = bgCanvas.getContext('webgl2', { alpha: false, antialias: false });
  const bgProg = (() => {
    const vs = `#version 300 es
    in vec2 aPos; void main(){ gl_Position = vec4(aPos,0.,1.); }`;
    // oryzo.ai 배경과 같은 구조: 단색 베이스 + 좌측 하단 모서리에서 번지는 웜 글로우 (지수 감쇠, 화면 높이 기준)
    // 레퍼런스 픽셀 측정값: 베이스 #191613, 모서리 #513420, 감쇠 exp(-(d/a)^1.3), a≈0.59H → 반경을 줄여 0.46H
    const fs = `#version 300 es
    precision highp float; uniform vec2 uRes; uniform float uT, uReveal; out vec4 o;
    float h(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
    void main(){
      vec2 p=gl_FragCoord.xy/uRes.y;                       // 좌하단 원점, 화면 높이 = 1
      float d=length(vec2(p.x, p.y*.9));                    // 위쪽으로 살짝 더 길게 (레퍼런스와 동일)
      float a=.46*(1.+.025*sin(uT*.35))*mix(.0001,1.,uReveal);
      float t=exp(-pow(d/a,1.3));
      vec3 base=vec3(25.,22.,19.)/255., warm=vec3(64.,48.,36.)/255.;   // 빛 색: 81,52,32 → 64,48,36 (덜 밝고 덜 브라운)
      vec3 c=mix(base,warm,t);
      c+=(h(gl_FragCoord.xy+fract(uT*7.)*211.)-.5)*(1.6/255.); // 밴딩 방지 디더
      o=vec4(c,1.);
    }`;
    const mk = (t, src) => { const s = bgl.createShader(t); bgl.shaderSource(s, src); bgl.compileShader(s); return s; };
    const p = bgl.createProgram(); bgl.attachShader(p, mk(bgl.VERTEX_SHADER, vs)); bgl.attachShader(p, mk(bgl.FRAGMENT_SHADER, fs));
    bgl.bindAttribLocation(p, 0, 'aPos'); bgl.linkProgram(p);
    const vao = bgl.createVertexArray(); bgl.bindVertexArray(vao);
    bgl.bindBuffer(bgl.ARRAY_BUFFER, bgl.createBuffer());
    bgl.bufferData(bgl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), bgl.STATIC_DRAW);
    bgl.enableVertexAttribArray(0); bgl.vertexAttribPointer(0, 2, bgl.FLOAT, false, 0, 0);
    return { p, vao, uRes: bgl.getUniformLocation(p, 'uRes'), uT: bgl.getUniformLocation(p, 'uT'), uReveal: bgl.getUniformLocation(p, 'uReveal') };
  })();
  function drawBg(t, reveal) {
    const dpr = Math.min(devicePixelRatio || 1, 1.25);
    const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
    if (bgCanvas.width !== w || bgCanvas.height !== h) { bgCanvas.width = w; bgCanvas.height = h; }
    bgl.viewport(0, 0, w, h); bgl.useProgram(bgProg.p); bgl.bindVertexArray(bgProg.vao);
    bgl.uniform2f(bgProg.uRes, w, h); bgl.uniform1f(bgProg.uT, t); bgl.uniform1f(bgProg.uReveal, reveal);
    bgl.drawArrays(bgl.TRIANGLES, 0, 3);
  }

  /* ---------------- 2. Now 카메라 (블렌더 파일에서 추출한 GLB) */
  const threeCanvas = document.getElementById('three');
  const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, alpha: true, antialias: true });
  // 휴대폰(터치·작은 화면): GPU 메모리·셰이더 한도가 작아 가벼운 설정으로
  const LITE = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LITE ? 1.75 : 2));   // 실제 픽셀 밀도로 렌더 + MSAA → 모델·사진 가장자리 계단현상 제거
  // 3D 오류를 화면에 표시 (휴대폰에서 카메라가 안 보일 때 원인 확인용)
  const report = (msg) => { console.error('[now]', msg); window.dispatchEvent(new ErrorEvent('error', { message: '[3D] ' + msg })); };
  renderer.debug.onShaderError = (gl, prog, vs, fs) => report('shader compile failed: ' + (gl.getProgramInfoLog(prog) || '').slice(0, 160));
  threeCanvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (!signal.aborted) report('WebGL context lost'); });   // 페이지를 떠나며 직접 정리한 경우는 오류 아님
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
  scene.add(key, rim, rim2, fill, hemi);

  const pivot = new THREE.Group(); scene.add(pivot);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 100);

  let model = null, eye = null, eyeMat = null, modelH = 1, modelW = 1;
  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;

  // 블렌더 glTF 익스포터로 그대로 뽑은 모델 (Draco 압축 · WebP 텍스처).
  // Draco 디코더를 메인 스레드에서 실행 (워커·외부 wasm 없이 같은 출처의 JS 디코더만 사용)
  const dracoReady = new Promise((res, rej) => {
    if (window.DracoDecoderModule) { window.DracoDecoderModule().then(res, rej); return; }
    const sc = document.createElement('script'); sc.src = '/assets/landing-camera/draco/draco_decoder.js';
    sc.onload = () => window.DracoDecoderModule().then(res, rej); sc.onerror = rej; document.head.appendChild(sc);
  });
  const dracoLite = {
    preload() { return this; },
    decodeDracoFile(buffer, onLoad, ids, types, _cs, onError) {
      dracoReady.then((draco) => {
        const dec = new draco.Decoder(), arr = new Int8Array(buffer), mesh = new draco.Mesh();
        const st = dec.DecodeArrayToMesh(arr, arr.byteLength, mesh);
        if (!st.ok() || mesh.ptr === 0) throw new Error('draco: ' + st.error_msg());
        const geo = new THREE.BufferGeometry();
        for (const name in ids) {
          const T = globalThis[types[name]]; const att = dec.GetAttributeByUniqueId(mesh, ids[name]);
          const n = att.num_components(), cnt = mesh.num_points() * n, bytes = cnt * T.BYTES_PER_ELEMENT;
          const dt = { Float32Array: draco.DT_FLOAT32, Int8Array: draco.DT_INT8, Int16Array: draco.DT_INT16, Int32Array: draco.DT_INT32, Uint8Array: draco.DT_UINT8, Uint16Array: draco.DT_UINT16, Uint32Array: draco.DT_UINT32 }[types[name]];
          const ptr = draco._malloc(bytes); dec.GetAttributeDataArrayForAllPoints(mesh, att, dt, bytes, ptr);
          geo.setAttribute(name, new THREE.BufferAttribute(new T(draco.HEAPF32.buffer, ptr, cnt).slice(), n)); draco._free(ptr);
        }
        const ni = mesh.num_faces() * 3, ptr = draco._malloc(ni * 4);
        dec.GetTrianglesUInt32Array(mesh, ni * 4, ptr);
        geo.setIndex(new THREE.BufferAttribute(new Uint32Array(draco.HEAPF32.buffer, ptr, ni).slice(), 1)); draco._free(ptr);
        draco.destroy(mesh); draco.destroy(dec);
        onLoad(geo);
      }).catch(onError);
    },
  };
  const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLite);
  // 블렌더에서 내보낸 웹용 모델 (Draco 압축) — 아티팩트 프로토타입과 같은 바이너리
  gltfLoader.loadAsync('/assets/landing-camera/polaroid-now.glb').then((gltf) => {
    if (signal.aborted) return;
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
    setupFlash();
    setupPrint();
    // 필름 슬롯 위 'i-Type FILM' 양각 텍스트 — 웹에서는 직사각형 돌기로 보여 숨김
    model.traverse((o) => { if (/Tray_Text_iType/i.test(o.name)) o.visible = false; });
    // 뒷면 아이피스 컵 안쪽의 검은 창(블렌더 Rear_Viewfinder_Cap 의 Mat_Rubber_Black 면) = 영상이 비치는 뷰파인더 창
    const cap = model.getObjectByName('Rear_Viewfinder_Cap');
    cap && cap.traverse((o) => { if (o.isMesh && /Rubber_Black/.test(o.material.name)) eye = o; });
    if (eye) setupEye();
    setupNow();
    window.__T = { THREE, model, pivot, camera, scene, print };
    window.__dbgP = () => [renderer.info.programs.length, renderer.info.memory.textures, BL.allocs || 0];
    prewarm();
    readyT = performance.now();   // 카메라 등장 시작 시각 → 로고·텍스트는 카메라가 자리 잡은 뒤에
    root.dataset.model = 'ready';
  }).catch((e) => { report('model load failed: ' + (e && e.message || e)); root.dataset.model = 'error'; });



  /* ---- 정면 플래시: 프레넬 렌즈(동심원 홈) + 뒤쪽 알루미늄 반사판 ----
     블렌더의 절차적 셰이더는 glTF 로 옮겨지지 않아 평면처럼 보였음 → 같은 모양을 텍스처로 구워 재현 */
  function flashTextures() {
    const N = 1024, R = 34;                                   // R: 동심원 개수
    const mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return [c, c.getContext('2d')]; };
    const [cc, cx] = mk(), [nc, nx] = mk(), [mc, mx] = mk();
    const col = cx.createImageData(N, N), nor = nx.createImageData(N, N), mr = mx.createImageData(N, N);
    const H = (x, y) => { const r = Math.hypot(x, y); return (r * R) % 1; };   // 프레넬 톱니 높이
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N * 2 - 1, y = 1 - (j + 0.5) / N * 2, r = Math.hypot(x, y), k = (j * N + i) * 4;
      const strip = Math.abs(y) < 0.27 && Math.abs(x) < 0.86;               // 가로 반사판이 비치는 띠
      const ring = 0.5 + 0.5 * Math.cos(r * R * Math.PI * 2);
      let c;
      if (strip) { const g = 0.46 + 0.14 * ring + 0.2 * Math.exp(-r * r * 9) - 0.12 * Math.abs(x); c = [g * 0.97, g * 0.98, g]; }
      else { const g = 0.66 + 0.06 * ring - 0.05 * r; c = [g * 0.97, g * 0.99, g * 1.02]; }
      col.data[k] = c[0] * 255; col.data[k + 1] = c[1] * 255; col.data[k + 2] = c[2] * 255; col.data[k + 3] = 255;
      // 노멀: 동심원 톱니의 반경 방향 기울기
      const e = 1.5 / N; const dx = (H(x + e, y) - H(x - e, y)), dy = (H(x, y + e) - H(x, y - e));
      let gx = Math.abs(dx) > 0.5 ? 0 : dx / (2 * e) * 0.012, gy = Math.abs(dy) > 0.5 ? 0 : dy / (2 * e) * 0.012;
      const l = Math.hypot(gx, gy, 1);
      nor.data[k] = (-gx / l * 0.5 + 0.5) * 255; nor.data[k + 1] = (-gy / l * 0.5 + 0.5) * 255; nor.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; nor.data[k + 3] = 255;
      // metalness(B) / roughness(G)
      mr.data[k] = 0; mr.data[k + 1] = (strip ? 0.3 : 0.42) * 255; mr.data[k + 2] = (strip ? 0.55 : 0.08) * 255; mr.data[k + 3] = 255;
    }
    cx.putImageData(col, 0, 0); nx.putImageData(nor, 0, 0); mx.putImageData(mr, 0, 0);
    const T = (c, srgb) => { const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
    return { map: T(cc, true), normalMap: T(nc, false), mr: T(mc, false) };
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
  const flash = { pos: new THREE.Vector3(), r: 0.012, cover: null, sprite: null, t: -1, fired: false };
  const print = { group: null, photo: null, k: 0, target: 0, t0: -1 };
  const PH = { W: 0.0805, L: 0.0979 };        // i-Type 비율(88×107) 유지, 폭은 모델 토출구 안쪽(가이드 폭 83.8mm)에 맞춤
  function starburstTex() {
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d');
    g.translate(N / 2, N / 2); g.globalCompositeOperation = 'lighter';
    const core = g.createRadialGradient(0, 0, 0, 0, 0, N * 0.18);
    core.addColorStop(0, 'rgba(255,250,235,1)'); core.addColorStop(0.35, 'rgba(255,214,150,.75)'); core.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = core; g.beginPath(); g.arc(0, 0, N * 0.18, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 46; i++) {                              // 피그마처럼 길이가 제각각인 광선
      const a = (i / 46) * Math.PI * 2 + Math.random() * 0.08, L = N * (0.18 + Math.random() * (i % 3 === 0 ? 0.32 : 0.16)), w = N * (0.006 + Math.random() * 0.01);
      const gr = g.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L);
      gr.addColorStop(0, 'rgba(255,236,190,.9)'); gr.addColorStop(1, 'rgba(255,170,70,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(Math.cos(a + Math.PI / 2) * w, Math.sin(a + Math.PI / 2) * w);
      g.lineTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a - Math.PI / 2) * w, Math.sin(a - Math.PI / 2) * w); g.fill();
    }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function photoTex(img) {
    // 위쪽(카메라 안쪽) = 사진 윗부분, 바깥쪽 = 두꺼운 아래 테두리 (피그마 print_1 과 같은 방향)
    const W = 880, Hh = 1070, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d');
    g.fillStyle = '#f3f0ea'; g.fillRect(0, 0, W, Hh);
    const id = g.getImageData(0, 0, W, Hh); for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - 0.5) * 7; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; } g.putImageData(id, 0, 0);
    const x = 45, y = 60, S = 790;                              // 4.5mm · 6mm · 79mm (×10)
    if (img) { const sh = img.height, sw = sh, sx = img.width * 0.56 - sw / 2; g.filter = 'brightness(1.3) contrast(1.06) saturate(1.08)'; g.drawImage(img, Math.max(0, sx), 0, sw, sh, x, y, S, S); g.filter = 'none'; }
    else { g.fillStyle = '#2a2018'; g.fillRect(x, y, S, S); }
    const v = g.createRadialGradient(x + S / 2, y + S / 2, S * 0.3, x + S / 2, y + S / 2, S * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,25,10,.28)');
    g.fillStyle = v; g.fillRect(x, y, S, S);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
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
    const face = new THREE.MeshStandardMaterial({ roughness: 0.5, map: photoTex(null), side: THREE.FrontSide });
    const back = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.8, side: THREE.BackSide });   // i-Type 뒷면은 검은 필름
    const ph = new THREE.Mesh(geo, face), pb = new THREE.Mesh(geo, back);
    const holder = new THREE.Group(); holder.add(ph, pb); holder.visible = false; holder.matrixAutoUpdate = false; scene.add(holder);
    ph.castShadow = pb.castShadow = true;
    ph.frustumCulled = pb.frustumCulled = false;   // CPU 로 휘어 올리는 평면이라 원래 경계구 기준으로 컬링되면 화면을 다 빠져나가기 전에 툭 사라짐
    const im = new Image(); im.onload = () => { const old = face.map; face.map = photoTex(im); face.needsUpdate = true; try { renderer.initTexture(face.map); renderer.compile(scene, camera); } catch (e) {} old && old.dispose(); }; im.src = '/assets/landing-camera/print-photo.jpg';   // data URL: 출처가 다른 이미지로 WebGL 텍스처를 만들면 막히는 환경 대비
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
    const kc = Math.min(1, k / 0.55), curl = 0.2 * kc * kc * (3 - 2 * kc);   // 올라가기 시작하면서 바로 휘기 시작 (화면 밖에서만 휘면 안 보임)
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
    // 올라가는 중반부터 사진 전체가 오른쪽으로 말리며 곡선이 됨: 왼쪽 끝은 그대로, 오른쪽으로 갈수록 뒤(화면 안쪽)로 휘는
    // 일정한 곡률의 원통형 휨. 위쪽이 아래보다 조금 더 휨 (예전: 오른쪽 위 모서리만 접히듯 말림)
    const Wd = PH.W, bq = Math.min(1, Math.max(0, (k - 0.2) / 0.65)), B = 0.75 * bq * bq * (3 - 2 * bq);   // 폭 전체 휨 각 최대 약 43°
    for (let i = 0; i < pos.count; i++) {
      const xb = base[i * 3], zb = base[i * 3 + 2], idx = Math.round((zb + L / 2) / L * N);
      let x = xb, z = zs[idx], y = ys[idx];
      if (B > 0.0005) {
        const v = 1 - (zb + L / 2) / L, Bv = B * (0.8 + 0.2 * v), R = Wd / Bv, l = xb + Wd / 2;   // v: 위쪽 1 → 아래 0
        x = -Wd / 2 + R * Math.sin(l / R); y -= R * (1 - Math.cos(l / R));
      }
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true; print.geo.computeVertexNormals();
  }
  function updatePrint(sc, dt, now, W, H) {
    if (!print.group) return;
    // 플래시: 스크롤이 지점(1.0 화면)을 넘는 순간 한 번 터짐, 다시 위로 올라가면 장전
    // 히어로 타이포가 다 사라진 직후(0.55 화면) 그 자리의 카메라에서 플래시 → 사진 배출. 위로 되돌리면 다시 장전
    if (!flash.fired && sc > 0.55) { flash.fired = true; flash.t = now; print.t0 = now + 380; }
    if (flash.fired && sc < 0.4) { flash.fired = false; print.t0 = -1; }
    const ft = flash.t < 0 ? 9 : (now - flash.t) / 1000;
    const env = ft < 0.06 ? ft / 0.06 : Math.exp(-(ft - 0.06) * 5.5);                   // 순간 점등 → 빠른 감쇠
    const fk = flash.fired ? env : 0;
    flash.sprite.material.opacity = fk;
    flash.sprite.scale.setScalar(flash.r * (7 + 5 * fk));
    if (flash.cover) flash.cover.material.emissiveIntensity = 3.5 * fk;
    { const fv = (0.55 * fk * fk).toFixed(3); if (fv !== updatePrint.fv) { updatePrint.fv = fv; document.documentElement.style.setProperty('--flash', fv); } }   // 값이 바뀔 때만 (매 프레임 문서 전체 스타일 재계산 방지)
    // 사진 배출: 모터로 밀어내듯 1.8s, 끝에서 살짝 처짐 / 위로 올리면 빠르게 다시 들어감
    // 사진 배출도 스크롤 위치에 직접 묶음 — 내릴 때 혼자(시간 기준으로) 튀어나오지 않고, 올릴 때와 똑같이 스크롤한 만큼만 나오고 들어감
    // 출력 → 낙하를 한 번의 연속 동작으로: 예전에는 '배출(끝에서 감속해 멈춤)' → '미끄러져 빠짐(다시 가속)'의 두 단계라
    // 배출이 끝나는 지점에서 속도가 0이 돼 살짝 멈췄음. 이제 슬롯 이동량 하나(tr: 0 → 1.06)가 천천히 시작해
    // 속도를 유지한 채 슬롯을 빠져나가고, 그 속도 그대로 낙하(ck)로 이어짐
    print.k = range(sc, 0.6, 1.5);
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
  function colorPhase(sc) {             // 색마다 잠깐 머물렀다가(hold) 다음 색으로 부드럽게 넘어감
    const P = range(sc, COL_A, COL_A + COL_STEP * (NOW_COLS.length - 1)) * (NOW_COLS.length - 1);
    const i = Math.min(NOW_COLS.length - 2, Math.floor(P)), t = clamp((P - i - 0.3) / 0.6);
    return { i, e: t * t * t * (t * (t * 6 - 15) + 10) };
  }
  const colA = new THREE.Color(), colB = new THREE.Color();
  function updateNow(sc, W, H) {
    const cv = threeCanvas.style;
    if (sc < 6.2) { if (cv.opacity !== '') { cv.opacity = ''; cv.transition = ''; } NOW.x.value = 0; if (NOW.edges) NOW.edges.forEach((l) => (l.visible = false)); window.__nowProj = null; window.__nowCol = null; return; }
    nowEdges();
    // 모델 원점의 화면 위치와 1 월드 단위당 픽셀 → 2026 도면을 모델과 정확히 겹쳐 놓는 데 사용
    camera.updateMatrixWorld();
    pivot.getWorldPosition(nowA); const o = nowA.clone().project(camera);
    nowB.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(0.5).add(nowA).project(camera);
    window.__nowProj = { ox: (o.x + 1) / 2 * W, oy: (1 - o.y) / 2 * H, ppu: Math.abs(nowB.x - o.x) / 2 * W / 0.5 };
    // 도면 위로 실물이 페이드인 (엑스레이 상태로) → 실제 재질로 채워짐
    const fade = eio(range(sc, 7.25, 8.05));   // 도면 위에 옅게 겹쳐 나타나 → 서서히 진해짐
    cv.transition = 'none'; cv.opacity = fade.toFixed(3);
    const fill = eio(range(sc, 7.6, 8.1));     // 엑스레이(반투명 회색) → 실제 재질
    NOW.x.value = 1 - fill;
    NOW.edgeMat.opacity = 0.5 * (1 - fill);
    NOW.edges.forEach((l) => (l.visible = fill < 1));
    // 180° 회전하면서 바디 컬러가 부드럽게 바뀜
    const { i: ci, e: ce } = colorPhase(sc), c0 = NOW_COLS[ci], c1 = NOW_COLS[ci + 1];
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
    const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const cx = cv.getContext('2d'), img = cx.createImageData(N, N), hgt = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) hgt[i] = Math.random();
    for (let k = 0; k < 2; k++) { const t = hgt.slice(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let a = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += t[((y + dy + N) % N) * N + ((x + dx + N) % N)]; hgt[y * N + x] = a / 9; } }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const h = (xx, yy) => hgt[((yy + N) % N) * N + ((xx + N) % N)];
      const nx = (h(x - 1, y) - h(x + 1, y)) * 6, ny = (h(x, y - 1) - h(x, y + 1)) * 6, l = Math.hypot(nx, ny, 1), i = (y * N + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    _grain = new THREE.CanvasTexture(cv); _grain.wrapS = _grain.wrapT = THREE.RepeatWrapping; _grain.repeat.set(1, 1);
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
    const right = new THREE.Vector3().crossVectors(nW.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
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
    eyeMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: vidTex }, uRes: { value: new THREE.Vector2(1, 1) }, uK: { value: 0 }, uRefr: { value: 0 },
        uVA: { value: 16 / 9 }, uGA: { value: eyeAxis.w / eyeAxis.h }, uOp: { value: 1 }, uShade: { value: 0 }, uRest: { value: 0 }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: `precision highp float; varying vec2 vUv;
        uniform sampler2D uMap; uniform vec2 uRes; uniform float uK, uRefr, uVA, uGA, uOp, uShade, uRest, uT;
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
          vec2 uv=mix(uvS,uvG,uK);
          vec2 off=-n*T*.12;
          vec3 col=samp(uv, off, .09*(uRefr+.4*uRest), .004*uRefr);
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
          // 창 테두리: 둥근 검은 고무 + 안쪽 그림자
          vec2 q=abs(c)-vec2(.8); float sd=length(max(q,0.))+min(max(q.x,q.y),0.)-.2;
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
    { p: 0.90, anchor: 1, rotY: -0.42, rotX: 0.0, h: 0.31, sx: 0.506, sy: 0.48 },   // 히어로: 카메라 실루엣 중심이 화면 정중앙에 오도록
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
    if (pose.anchor > 0.5) D = Math.max(D, modelW / (0.78 * 2 * tanH * (W / H))); // 세로 화면에서도 잘리지 않게
    if (pose.anchor > 0.5 && W / H < 0.8) D = Math.max(D, 1.65 / (0.8 * 2 * tanH * (W / H))); // 휴대폰 세로: 3/4 각도의 깊이까지 포함해 화면 폭의 86% 안에
    // 16:10 노트북(1646×1029 등)처럼 16:9 보다 세로가 긴 가로 화면: 텍스트(--u)가 폭 기준으로 줄어드는 만큼 카메라도 같은 비율로 → 16:9 와 같은 구도
    const asp = W / H; if (asp < 16 / 9 && asp >= 0.8) D *= (16 / 9) / asp;
    if (pose.fit) D *= pose.fit;
    camera.position.set(anchor.x, anchor.y + Math.sin(PITCH) * D, anchor.z + Math.cos(PITCH) * D);
    camera.lookAt(anchor);
    camera.aspect = W / H;
    camera.setViewOffset(W, H, -(pose.sx - 0.5) * W, -(pose.sy - 0.5) * H, W, H);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
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
  const SPAN = 6; window.__SPAN = SPAN;   // 장면 1 단위 = 화면 6배 스크롤 (히어로 문구가 다 사라지려면 화면 약 2.7개 분량을 내려야 함)
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
  function prewarm() {
    const ph = print.photo, pv = ph ? ph.visible : false;
    try {
      if (ph) ph.visible = true;
      renderer.compile(scene, camera);
      renderCamBlurred(2); renderCamBlurred(12);      // 전체·반 해상도 블러 경로 둘 다
      renderer.render(scene, camera);
    } catch (e) { /* 미리 준비 실패해도 정상 동작에는 지장 없음 */ }
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
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const W = innerWidth, H = innerHeight;
    const len = Math.max(1, track.offsetHeight - H);
    // 자동 재생: 모델이 준비되면 스크롤 없이 히어로(p .92)까지 진행. 스크롤은 그 이상으로만 영향
    if (started && (root.dataset.model === 'ready' || root.dataset.model === 'error')) autoT += dt;
    const autoP = clamp(autoT / AUTO_DUR) * 0.92;
    const p = started ? Math.max(autoP, clamp(scrollY / len)) : 0;
    pS += (p - pS) * (1 - Math.exp(-dt * 4.5));               // 항상 부드럽게 따라감 (출발·정지에 튐 없음)

    // 배경
    drawBg(now / 1000, started ? ss(0.04, 0.6, pS) : 0);

    // 3D
    if (renderer.domElement.width !== Math.round(W * renderer.getPixelRatio())) renderer.setSize(W, H, false);
    pointer.sx += (pointer.x - pointer.sx) * (1 - Math.exp(-dt * 3));
    pointer.sy += (pointer.y - pointer.sy) * (1 - Math.exp(-dt * 3));
    const idleK = ss(0.86, 1, pS);
    const idle = { x: (Math.sin(now / 1430) * 0.012 + pointer.sy * 0.06) * idleK, y: (Math.sin(now / 2220) * 0.03 + pointer.sx * 0.12) * idleK };
    let pose = poseAt(pS);
    // 스크롤 → 다음 장면(print_1): 히어로 포즈에서 위에서 내려다보는 정면 3/4 포즈로
    // 스크롤 진행(화면 단위) — 휠·트랙패드의 계단식 입력을 관성 보간으로 매끈하게 (Lenis 방식)
    // SPAN: 장면 1 단위 = 화면 높이 × 2 만큼 스크롤 (휠 몇 칸에 장면이 훅 지나가지 않게, 일반적인 스크롤 길이)
    // 방어: 뷰어가 프레임 높이를 잠깐 0 근처로 바꾸거나 스크롤 값이 비정상이어도 장면이 끝으로 튀지 않게
    const Hs = Math.max(300, H), sy = Number.isFinite(scrollY) ? scrollY : 0;
    const scRaw = window.__S ?? (started ? Math.min(12.6, sy / (Hs * SPAN)) : 0);
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
      const HP = { anchor: 1, rotY: -1.0, rotX: -0.15, h: clamp(fw / 1.883 * W / H, 0.05, 0.6), sx: 0.5, sy: port ? 0.5 : 0.479 };
      if (!port) HP.h = Math.min(HP.h, Math.max(0.22, (0.5 - (205 * (W / 1920) + 58) / H) / 0.583));   // 짧은 창: 카메라 위 타이포 블록 자리를 먼저 확보 (잘림 방지)
      // 도면과 겹친 그 자리·그 크기 그대로, 컬러가 바뀌는 동안 왼쪽으로 천천히 회전 — 마지막 블랙은 반대쪽 3/4 측면(공식 제품컷 각도)에서 멈춤
      const rk = range(sc, COL_A, COL_A + COL_STEP * (NOW_COLS.length - 1)), rot = 1.95 * rk * rk * rk * (rk * (rk * 6 - 15) + 10);
      pose = { ...HP, rotY: HP.rotY + rot, fit: port ? 1.12 : 1 };
      const still = 1 - range(sc, 8.6, 9.05);                   // 도면과 겹치는 동안은 흔들림 없이 정확히
      idle.x *= 0.4 * (1 - still); idle.y *= 0.4 * (1 - still);
    }
    if (window.__fit) { pose = { ...window.__HP }; idle.x = idle.y = 0; }
    placeCamera(pose, W, H, idle);
    updatePrint(sc, dt, now, W, H);
    if (model) {
      if (hk > 0) { pivot.visible = true; pivot.position.set(0, 0, 0); }
      if (print.photo && sc > 3.7) print.photo.visible = false;
      updateNow(sc, W, H);
    }
    if (window.__hist) window.__hist(sc, W, H);
    if (window.__storyIn) {
      // 사진 아래 가장자리의 화면 y: 중앙(세로 frac) → easeIn 으로 화면 높이 ×1.05 만큼 올라감 (updatePrint 와 같은 식)
      const frac = Math.min(0.645, 0.8 * (W / H) * (PH.L / PH.W)), rk = range(sc, 2.55, 3.6);
      const edgeY = H * (0.5 + frac / 2 - PHOTO_RISE * easeIn(rk));
      window.__storyIn(eio(range(sc, 2.3, 2.58)), rk > 0 ? edgeY : 1e9);
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
      eye.visible = U2.uOp.value > 0.001;   // 인트로가 끝나면 영상 텍스처를 아예 그리지 않음
    }
    // 카메라가 떠오르는 동안 점점 흐려짐 (사진은 선명)
    const camBlur = model && pivot.visible && sc < 4.2 ? eio(range(sc, 1.5, 2.3)) : 0;   // 사진 장면에서만
    try { if (camBlur > 0.004) renderCamBlurred(18 * renderer.getPixelRatio() * camBlur); else renderer.render(scene, camera); } catch (e) { if (!tick.err) { tick.err = 1; report('render: ' + (e && e.message || e)); } }

    // 2D 영상판: 3D 아이피스가 준비되기 전까지만 화면을 덮음 (준비되면 같은 프레임에서 3D 로 교대)
    const screen = [0, 0, W, H];
    glassState = live ? null : { rect: screen, content: cover(screen), radius: 0, bevel: 1, refract: 0, bulge: 0, shade: 0, alpha: 1 };

    root.style.setProperty('--hero-o', (1 - ss(0, 0.04, pS)).toFixed(3));
    // 히어로 텍스트: 등장은 한 번(시간 기반), 퇴장은 사용자가 직접 스크롤한 양에 연동(스크럽)
    // Kinoria 처럼: 카메라가 먼저 나타나 자리 잡고(약 1.3초) → 그 뒤 로고가 카메라 뒤에서 초점 맞춰지며 등장 → 오른쪽 텍스트
    const wantTitle = pS > 0.84 && readyT > 0 && now - readyT > 750;
    exitK = clamp(sc / 0.45);
    if (window.__heroExit) window.__heroExit(exitK < 0.0005 ? 0 : exitK);
    if (wantTitle !== titleOn) { titleOn = wantTitle; root.dataset.title = titleOn ? 'on' : 'off'; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  return () => {
    try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) { /* 이미 정리됨 */ }
    ['__T', '__dbgP', '__nowProj', '__nowCol', '__exitRender', '__SPAN', '__scS'].forEach((k) => { delete window[k]; });
  };
}
