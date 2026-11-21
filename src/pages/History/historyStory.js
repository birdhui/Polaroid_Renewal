import { asset0, asset1, asset2, asset3, asset4, asset5, asset6, asset7, asset8, asset9, asset10, asset11, asset12, asset13, asset14, asset15, asset16, asset17, asset18, asset19, asset20, asset21, asset22, asset23, asset24, asset25, asset26, asset27, asset28 } from './storyAssets.js';
export function initHistoryStory(root) {
 let disposed = false;
 const controller = new AbortController();
 const timers = new Set();
 let frameId = null;
 const listen = (target, type, listener, options = {}) => target.addEventListener(type, listener, { ...options, signal: controller.signal });
 const addEventListener = (type, listener, options) => listen(window, type, listener, options);
 const requestAnimationFrame = callback => { frameId = window.requestAnimationFrame(callback); return frameId; };
 const setTimeout = (callback, delay) => { const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay); timers.add(id); return id; };
 const clearTimeout = id => { window.clearTimeout(id); timers.delete(id); };
 const storyTop = () => root.querySelector('#story').getBoundingClientRect().top + window.scrollY;

const CH = [
  { year: 1937, img: asset12, hl: ['편광 기술에서 시작된', '혁신의 역사'],
    bd: '1937년, 에드윈 랜드는 편광 기술을 기반으로 폴라로이드 코퍼레이션을 출범시켰습니다.<br>빛을 연구하던 작은 시작은 훗날 사진의 역사를 바꾸는 혁신으로 이어졌습니다.' },
  { year: 1943, img: asset23, hl: ['작은 바램에서 시작된', '순간을 담는 새로운 방식'],
    bd: '“찍은 사진을 왜 바로 볼 수 없나요?” 딸의 질문에서 영감을 얻은 에드윈 랜드는<br>촬영한 사진을 그 자리에서 볼 수 있는 새로운 방식을 구상했습니다.<br>그렇게 즉석사진을 향한 폴라로이드의 여정이 시작됐습니다.' },
  { year: 1948, img: asset24, hl: ['폴라로이드', '즉석사진의 탄생'],
    bd: '에드윈 랜드와 조지 휠라이트가 세운 연구소는 1937년 폴라로이드의 설립으로 이어졌습니다.<br>1947년 즉석사진 기술을 공개한 데 이어, 이듬해 첫 상용 카메라인 랜드 카메라 모델 95를<br>선보였습니다. 촬영한 자리에서 사진을 확인할 수 있는, 즉석사진의 시대가 열린 것입니다.' },
  { year: 1981, img: asset25, hl: ['사람들의 일상으로', '이어진 즉석사진의 혁신'],
    bd: '1963년 컬러 즉석사진에 이어, 1972년에는 필름을 분리할 필요 없는<br>SX-70이 등장했습니다. 이후 One Stop과 600시리즈는 즉석사진의 경험을 넓혔습니다.<br>폴라로이드는 일상의 추억을 남기는 카메라이자, 예술가들의 표현 도구로 자리 잡았습니다.' },
  { year: 2008, img: asset26, hl: ['시대의 변화 속', '멈춰 선 폴라로이드'],
    bd: '디지털 사진의 확산 속에서 폴라로이드는 2001년 파산보호를 신청하고 2008년 즉석필름<br>생산을 중단했습니다. 오랜 시간 이어온 폴라로이드 즉석사진의 미래는 불확실해졌습니다.' },
  { year: 2017, img: asset27, hl: ['한 장의 사진을', '포기하지 않은 사람들'],
    bd: '2008년, 즉석사진을 지키려는 사람들이 ‘임파서블 프로젝트’라는 이름으로 네덜란드의<br>마지막 폴라로이드 필름 공장을 살렸습니다. 끊어진 생산 기반 속에서 필름을 다시 개발한<br>이들의 도전은 2017년 폴라로이드 오리지널스의 출범으로 이어졌습니다.' },
  { year: 2026, img: asset28, hl: ['다시 쓰는 폴라로이드 역사', '그리고 NOW'],
    bd: '2020년, 폴라로이드 오리지널스는 다시 폴라로이드라는 이름으로 돌아와<br>Now를 선보였습니다. 사진이 서서히 나타나는 기다림과 손에 남는 한 장의 감각.<br>폴라로이드의 이야기는 오늘 우리가 남기는 순간 속에서 계속됩니다.' }
];
const RULE_ASSETS = [asset19, asset20, asset20, asset20, asset20, asset20, asset20];
const n = CH.length;
const header = root.closest('main')?.previousElementSibling;
const $ = id => id === 'gnb' ? header : root.querySelector(`#${id}`);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const bellAt = (x, c, w) => Math.exp(-Math.pow((x - c) / w, 2));
const B = reduced ? 0 : 1;               // 블러 사용 여부
let U = 1, vh = innerHeight, vw = innerWidth;

/* ================= DOM 생성 ================= */
const digitCol = extra => `<div class="dg"><div class="col">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}${extra ? '<span>0</span>' : ''}</div></div>`;
$('odo').innerHTML = [0, 1, 2, 3].map(() => digitCol(true)).join('');
$('yr').innerHTML = [0, 1, 2, 3].map(() => digitCol(false)).join('');
// Since + 연도는 한 자리에 고정하고, 숫자만 다이얼처럼 굴러가며 바뀐다.
$('titles').innerHTML = `<div class="ch on title-fixed"><p class="since">Since</p><p class="year" id="titleYear" aria-label="${CH[0].year}">${[0, 1, 2, 3].map(() => `<span class="dg" aria-hidden="true"><span class="col">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}</span></span>`).join('')}</p></div>`;
$('bodies').innerHTML = CH.map((c, i) => `<div class="ch${i ? '' : ' on'}"><h3 class="hl">${c.hl.join('<br>')}</h3><p class="bd">${c.bd}</p></div>`).join('');
$('pics').innerHTML = CH.map((c, i) => `<div class="pic${i ? '' : ' on'}" data-year="${c.year}"><img src="${c.img}" alt="${c.year}년 아카이브 사진"></div>`).join('');
const titleCols = [...$('titleYear').querySelectorAll('.col')];
const bodies = [...$('bodies').children], pics = [...$('pics').children];
const odoCols = [...$('odo').querySelectorAll('.col')], yrCols = [...$('yr').querySelectorAll('.col')];
$('dial').setAttribute('aria-valuemin', 0); $('dial').setAttribute('aria-valuemax', n - 1);

/* 다이얼 눈금: 연도 사이 작은 눈금 4개 (Wheel/Tick) */
const M = 5, STEP = 18.5;
const ticks = [];
for (let k = -6 * M; k <= (n + 5) * M; k++) {
  const el = document.createElement('div');
  el.className = 'tk';
  const major = k % M === 0;
  el.style.background = major ? 'rgba(21,21,21,.8)' : 'rgba(21,21,21,.45)';
  $('ticks').appendChild(el);
  ticks.push({ el, k, major });
}
const photos = [...root.querySelectorAll('#heroFrame .ph')].map(el => {
  const d = el.dataset;
  return { el, x: +d.x, y: +d.y, w: +d.w, h: +d.h, f: +d.f };
});

/* ================= 레이아웃 · 타임라인 =================
   하나의 고정 무대(#story) 안에서 스크롤 위치(px)로 장면을 전환한다. 단위 k = 화면 높이
   0 ─ Hero(연도) ─ 1.4k ─ Film ─ 4.4k ─ 질문 ─ F0 ─ 플래시 ─ Why ─ chStart ─ 연도 7개 ─ Q0 ─ 인용 ─ C0 ─ 클로징 ─ END */
const HOLD_PX = 500;                               // 2026 화면 고정 유지 거리 (휠 한 칸 ≈ 100px × 5)
let F0, flashLen, introLen, chStart, step, Q0, QLEN, C0, END, R;
function layout() {
  vh = innerHeight; vw = innerWidth;
  U = vw <= 820 ? vw / 820 : Math.min(vw / 1920, vh / 1080);
  const k = vh;
  // 사진이 모두 사라진 뒤(≈0.67화면) 휠 다섯 번만큼 고정 → 그 뒤 긴 페이지처럼 위로 올라가며 Film 등장
  RELEASE = 0.67 + HOLD_PX / k;
  FILM_A = RELEASE + 0.9; FILM_B = RELEASE + 4.1; FILM_OUT = RELEASE + 3.6;
  F0 = (RELEASE + 4.7) * k; flashLen = 2.0 * k; introLen = 1.3 * k; step = 0.9 * k;
  chStart = F0 + flashLen + introLen;
  Q0 = chStart + (n - 1) * step + 0.5 * k; QLEN = 2.6 * k;
  C0 = Q0 + k + QLEN; END = C0 + 1.6 * k;
  $('story').style.height = (END + vh) + 'px';
  R = $('dial').clientHeight / 2;
  photos.forEach(p => Object.assign(p.el.style, { left: p.x * U + 'px', top: p.y * U + 'px', width: p.w * U + 'px', height: p.h * U + 'px' }));
  const row = $('row');                 // 텍스트+이미지 행을 정수 px로 중앙 배치
  if (vw <= 820) { row.style.transform = 'none'; row.style.left = '72px'; row.style.top = Math.round(Math.max(90, (vh - row.offsetHeight) / 2)) + 'px'; }
  else { row.style.left = '0'; row.style.top = '0'; row.style.transform = 'none'; }   // Figma 1396:9917: 이미지는 오른쪽 절반을 꽉 채우고, 글은 왼쪽에 고정
  $('ruleAsset').style.transform = `scale(${U})`;
  marqW = $('marq').scrollWidth;
  lastCur = 99; dirty = true;
}
const show = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden'; };

/* ================= 1. Hero (polaroid-history_40) ================= */
function setOdometer(cols, v) {
  // 실제 주행거리계처럼: 아래 자리가 9→0으로 넘어갈 때만 윗자리가 같이 굴러감
  const s = Math.floor(v), frac = v - s;
  const digits = String(s).padStart(4, '0').split('').map(Number);
  let carry = frac;
  for (let i = 3; i >= 0; i--) {
    const pos = digits[i] + carry;
    cols[i].style.transform = `translateY(${-pos}em)`;
    carry = digits[i] === 9 ? carry : 0;
  }
}
/* 진입 연출(시간 기반): 아웃포커스 → 포커스 인 → 잠시 멈춤 → 1937→2026 카운트 → 사진이 한 장씩 등장 */
const T_FOCUS = 1400, T_HOLD = 700, T_COUNT = 2800;
const hero = { t0: performance.now(), focus: 0, v: 1937, tc: 0, c: 0, arr: -1, done: false };
const ORDER = [2, 0, 3, 1];                          // 2026 도착 후 등장 순서 (photos 인덱스)
const STAGGER = 140, DUR = 620;
const easeOutBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
function styleCards() {
  ORDER.forEach((i, k) => {
    const card = photos[i].el.querySelector('.card');
    const t = clamp((hero.arr - k * STAGGER) / DUR);
    const m = easeOutBack(t), a = clamp(t * 2.2);
    card.style.opacity = a.toFixed(3);
    card.style.transform = `translate3d(0,${((1 - m) * 220 * U).toFixed(1)}px,0) scale(${(0.9 + 0.1 * m).toFixed(4)})`;
    card.style.filter = B && t < 1 ? `blur(${((1 - clamp(t * 1.6)) * 10).toFixed(2)}px) brightness(${(1 + (1 - t) * 0.35).toFixed(3)})` : 'none';
  });
}
function heroIntro(now) {
  if (hero.done) return false;
  const el = now - hero.t0;
  hero.focus = easeOut(clamp(el / T_FOCUS));
  hero.tc = clamp((el - T_FOCUS - T_HOLD) / T_COUNT);
  hero.c = easeInOut(hero.tc);
  hero.v = 1937 + 89 * hero.c;
  hero.arr = el - T_FOCUS - T_HOLD - T_COUNT - 150;
  styleCards();
  if (hero.arr >= (ORDER.length - 1) * STAGGER + DUR) {
    hero.done = true;
    $('cue').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 200, fill: 'forwards' });
  }
  return true;
}
function skipIntro() {                              // 동작 줄이기 or 중간에서 새로고침한 경우
  Object.assign(hero, { focus: 1, v: 2026, tc: 1, c: 1, arr: 1e5, done: true });
  styleCards(); $('cue').style.opacity = 1;
}
// 사진별 깊이: depth 1 = 가장 앞(빠름), 0 = 가장 뒤(느림)
const PAR = [
  { depth: 0.6,  dist: 1180, delay: 0.00, span: 0.58, inner: 90 },
  { depth: 1.0,  dist: 1450, delay: 0.00, span: 0.48, inner: 120 },
  { depth: 0.15, dist: 1020, delay: 0.05, span: 0.62, inner: 50 },
  { depth: 0.75, dist: 1350, delay: 0.02, span: 0.56, inner: 100 }
];
let hs = 0, RELEASE = 0.75;
function heroUpdate(sk) {
  // 스크롤해도 2026 유지. 멈췄을 때 숫자가 반쯤 걸쳐 보이지 않도록 각 칸의 마지막 35%에서만 굴러감
  let yv = hero.v;
  if (hero.done) yv = 2026;
  setOdometer(odoCols, yv);
  // 문구는 제자리, 사진만 위로 빠져나감 (사진마다 속도가 달라 깊이감)
  photos.forEach((ph, i) => {
    const d = PAR[i];
    const t = clamp((Math.max(hs, sk - 0.08) - d.delay) / d.span);
    const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
    const y = -e * d.dist * U;
    const sc = 1 - 0.05 * e * (1 - d.depth);
    ph.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
    ph.el.style.opacity = (1 - clamp((t - 0.7) / 0.3) * 0.6).toFixed(3);
    ph.el.querySelector('img').style.setProperty('--iy', (e * d.inner * U).toFixed(1) + 'px');
  });
  const c = $('heroCopy');
  c.style.filter = hero.focus < 1 ? `blur(${(18 * (1 - hero.focus) * B).toFixed(2)}px)` : 'none';
  c.style.transform = `scale(${(1 + 0.04 * (1 - hero.focus) * B).toFixed(4)})`;
  c.style.opacity = clamp(hero.focus * 1.4).toFixed(3);
  const sa = easeOut(clamp((hero.arr - 250) / 700));
  const sub = $('heroSub');
  sub.style.opacity = sa.toFixed(3);
  sub.style.transform = `translateY(${((1 - sa) * 10).toFixed(1)}px)`;
  $('yblock').style.transform = `translateY(${((1 - sa) * (37 + 10) * U).toFixed(1)}px)`;
  $('cue').style.visibility = sk > 0.08 ? 'hidden' : 'visible';
}

/* ================= 2. Film (k 단위 위치 sk) =================
   레퍼런스(ILKWANG about) 방식: 큰 문장이 줄 단위로 아래에서 마스크 리빌 →
   줄마다 다른 속도로 가로로 흘러 서로 엇갈림 → 가운데 영상 컷은 작게 열리며 커지고 어둠이 걷힘 → 빛 번짐이 지나감 */
let marqW = 0;
let FILM_A = 1.65, FILM_B = 4.85, FILM_OUT = 4.35;                    // 장면 구간 (화면 높이 배수)
const filmWords = [...root.querySelectorAll('#sFilm .w')];   // 띄어쓰기 기준 단어 12개
const W0 = 0.1, W1 = 0.78, WDUR = 0.11;              // 단어가 나타나는 구간과 한 단어 등장 길이(진행률)
const filmS = root.querySelector('#sFilm .still'), filmDim = root.querySelector('#sFilm .dim');
function filmUpdate(sk) {
  const p = clamp((sk - FILM_A) / (FILM_B - FILM_A));          // 0~1 장면 진행
  const sc = $('sFilm');
  // 나가는 구간: 흐려지며 사라지지 않고, 긴 페이지처럼 위로 올라가며 다음 문구가 아래에서 올라옴
  const out = clamp(sk - FILM_OUT);
  sc.style.opacity = '1';
  $('pre').style.transform = out < 1 ? `translate3d(0,${((1 - out) * vh).toFixed(1)}px,0)` : 'none';
  // 2026 화면이 위로 밀려 올라가고, 다음 장면이 아래에서 올라와 자리를 잡음
  // 하나의 페이지처럼: 2026 화면과 다음 장면이 이어 붙어 스크롤과 똑같은 속도로 함께 올라감
  const up = clamp(sk - RELEASE);
  $('sHero').style.transform = `translate3d(0,${(-up * vh).toFixed(1)}px,0)`;
  sc.style.transform = up < 1 ? `translate3d(0,${((1 - up) * vh).toFixed(1)}px,0)` : `translate3d(0,${(-out * vh).toFixed(1)}px,0)`;
  sc.style.filter = 'none';
  show(sc, sk > RELEASE && out < 1);
  // 단어가 스크롤에 맞춰 한 단어씩 천천히: 흐리고 아래에 있던 단어가 떠오르며 초점이 맞음
  const gap = (W1 - W0 - WDUR) / (filmWords.length - 1);
  filmWords.forEach((w, i) => {
    const r = easeOut(clamp((p - W0 - i * gap) / WDUR));
    w.style.opacity = r.toFixed(3);
    w.style.filter = r < 1 ? `blur(${((1 - r) * 10 * B).toFixed(2)}px)` : 'none';
    w.style.transform = `translate3d(0,${((1 - r) * 18 * U).toFixed(1)}px,0)`;
  });
  // 영상 컷: 가운데 좁은 틈으로 열리며(클립) 커지고, 어둠이 걷혔다가 끝에서 다시 살짝 어두워짐
  const e = easeOut(clamp((sk - RELEASE - 0.4) / 1.4));          // 올라오는 도중부터 열리기 시작
  const cx = (1 - e) * 34, cy = (1 - e) * 46;
  filmS.style.clipPath = `inset(${cy.toFixed(2)}% ${cx.toFixed(2)}% ${cy.toFixed(2)}% ${cx.toFixed(2)}%)`;
  const scale = 0.86 + 0.14 * e;
  filmS.style.transform = (vw <= 820 ? 'translate(-50%,-50%) ' : '') + `scale(${scale.toFixed(4)})`;
  filmS.style.filter = 'none';
  filmDim.style.opacity = (0.75 * (1 - e)).toFixed(3);

}

/* ================= 3. 질문 → 플래시 → Why ================= */
let focusIn = 0, reveal = 0, preIn = 0;
const easeOutBack2 = t => t <= 0 ? 0 : 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
function applyFlash(f) {
  // Figma 1396:4280 → 4283: 선명한 두 줄 문구 뒤로 원형 섬광이 번진다.
  // 중간 지점은 시안 원본 크기(1604px), 이후 확장하며 밝은 배경으로 연결한다.
  const appear = easeOut(clamp(f / 0.18));
  const growIn = easeInOut(clamp(f / 0.45));
  const fill = easeInOut(clamp((f - 0.45) / 0.43));
  const scale = 0.12 + 0.88 * growIn + 2.5 * fill;
  const fl = $('flash');
  fl.style.transform = `scale(${(U * (B ? scale : 1 + 2.5 * fill)).toFixed(4)})`;
  fl.style.opacity = appear.toFixed(3);
  fl.style.filter = 'none';
  $('pop').style.opacity = 0;
  $('ivory').style.opacity = easeInOut(clamp((f - 0.65) / 0.25)).toFixed(3);
  const pp = $('pre').querySelector('p');
  pp.style.opacity = (preIn * (1 - easeInOut(clamp((f - 0.55) / 0.25)))).toFixed(3);
  pp.style.filter = 'none';
  pp.style.color = f > 0 ? '#fff9e8' : '#fff';
  show($('pre'), preIn > 0 && f < 0.81);
  show(fl, f > 0 && f < 0.95);
  focusIn = easeOut(clamp((f - 0.8) / 0.2));
}
// 선명한 Why 문구를 읽는 시간과 퇴장 시간을 스크롤 진행과 분리한다.
const WHY_HOLD = 5000, WHY_OUT = 1200, WHY_STEPS = 3;   // 5초가 지나거나 아래로 스크롤 3번 하면 다음으로
const why = { started: null, done: false, active: false, progress: 0, count: 0, leaveAt: null };
function updateWhy(now, sy) {
  const start = F0 + flashLen;
  const readableAt = F0 + flashLen * 0.96;
  why.active = false;
  if (sy < readableAt - 4) {
    Object.assign(why, { started: null, done: false, progress: 0, count: 0, leaveAt: null });
    return sy;
  }
  if (why.done) return sy;
  if (why.started === null) why.started = now;
  if (why.leaveAt === null && (now - why.started >= WHY_HOLD || why.count >= WHY_STEPS)) why.leaveAt = now;
  why.progress = why.leaveAt === null ? 0 : clamp((now - why.leaveAt) / WHY_OUT);
  if (why.progress >= 1) {
    why.done = true;
    scrollTo({ top: storyTop() + chStart, behavior: 'instant' });
    return chStart;
  }
  why.active = true;
  // 앞으로 스크롤해도 문구가 선명해진 위치에서 읽기 시간을 확보한다. 위로는 돌아갈 수 있다.
  if (Math.abs(scrollY - storyTop() - start) > 0.5) scrollTo({ top: storyTop() + start, behavior: 'instant' });
  return start;
}
function applyIntro(t) {
  // Why 문구: 포커스 인 → 2초 읽기 → 1.2초에 걸쳐 역사 화면으로 전환
  const qFade = easeInOut(clamp((t - 0.08) / 0.65));
  const q = $('intro');
  q.style.filter = focusIn < 1 ? `blur(${(18 * (1 - focusIn) * B).toFixed(2)}px)` : 'none';
  q.style.transform = `scale(${(1 + 0.05 * (1 - focusIn) * B).toFixed(4)})`;
  q.style.opacity = Math.min(clamp(focusIn * 1.6), 1 - qFade).toFixed(3);
  q.style.visibility = (qFade >= 1 || focusIn <= 0) ? 'hidden' : 'visible';
  const a = clamp((t - 0.3) / 0.3), h = $('hist');
  h.style.opacity = a;
  h.style.filter = a >= 1 ? 'none' : `blur(${(14 * (1 - a) * B).toFixed(2)}px)`;
  h.style.transform = a >= 1 ? 'none' : `scale(${(1 - 0.04 * (1 - a) * B).toFixed(4)})`;
  reveal = clamp((t - 0.55) / 0.4);
  $('yr').style.opacity = clamp((t - 0.75) / 0.25);
  // 구분선은 연도와 함께 흐린 상태에서 한 번에 나타남 (가운데에서 펼쳐지는 효과 없음)
}

/* ================= 다이얼 ================= */
let lastCur = 99, lastReveal = -1, dirty = true;
function drawTicks(cur) {
  for (const tk of ticks) {
    const deg = (tk.k / M - cur) * STEP;
    if (Math.abs(deg) > 88) { tk.el.style.opacity = 0; continue; }
    const r = deg * Math.PI / 180, c = Math.cos(r), y = R * Math.sin(r);
    const len = (tk.major ? 20 : 7) * U * (0.49 + 0.51 * c);
    const x = (1 - c) * 22 * U;                          // 원통 측면으로 돌아가며 밀려남
    const pos = (y + R) / (2 * R);
    const rv = reveal >= 1 ? 1 : clamp((reveal * 1.25 - pos) * 6);
    tk.el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scaleX(${Math.max(len, 2).toFixed(2)})`;
    tk.el.style.opacity = ((0.35 + 0.65 * c) * rv).toFixed(3);
  }
}
const setYear = y => {
  String(y).split('').forEach((d, i) => {
    yrCols[i].style.transform = `translateY(${-d * 1.15}em)`;
    titleCols[i].style.transform = `translateY(${-d * 0.89}em)`;
  });
  $('titleYear').setAttribute('aria-label', String(y));
};

/* ================= 챕터 전환: 랙 포커스 크로스페이드 ================= */
const anim = (el, kf, o) => el.animate(kf, Object.assign({ fill: 'backwards' }, o));
let active = 0;
function change(from, to) {
  const dir = to > from ? 1 : -1;
  active = to;
  $('hist').dataset.year = CH[to].year;
  setYear(CH[to].year);
  $('dial').setAttribute('aria-valuenow', to);
  $('dial').setAttribute('aria-valuetext', CH[to].year + '년');
  const groups = [bodies, pics];
  groups.flat().forEach(e => e.getAnimations().forEach(x => x.cancel()));
  groups.forEach(g => g.forEach((e, i) => e.classList.toggle('on', i === to)));
  const olds = groups.map(g => g[from]), news = groups.map(g => g[to]);
  if (reduced) { news.forEach(e => anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })); return; }
  olds.forEach(e => anim(e, [
    { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' },
    { opacity: 0, filter: 'blur(12px)', transform: `translateY(${-6 * dir}px)` }
  ], { duration: 420, easing: 'cubic-bezier(.4,0,.6,1)' }));
  news.forEach(e => anim(e, [
    { opacity: 0, filter: 'blur(14px)', transform: `translateY(${12 * dir}px)` },
    { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0px)' }
  ], { duration: 640, delay: 120, easing: 'cubic-bezier(.25,.8,.3,1)' }));
}

/* ================= 5. 인용 → 6. 클로징 ================= */
function quoteUpdate(sy) {
  // 2026 화면이 페이지처럼 위로 올라가고, 바로 아래 그라데이션 화면(Figma 1396:4762)이 이어 올라옴
  const u = clamp((sy - Q0) / vh), p = clamp((sy - Q0 - vh) / QLEN);
  $('hist').style.translate = `0 ${(-u * vh).toFixed(1)}px`;
  $('dial').style.opacity = (1 - easeOut(clamp(u / 0.35))).toFixed(3);     // 연도 다이얼은 자연스럽게 사라짐
  const sc = $('sQuote');
  sc.style.opacity = u > 0 ? 1 : 0;
  sc.style.translate = `0 ${((1 - u) * vh).toFixed(1)}px`;
  show(sc, u > 0 && sy < C0 + 0.7 * vh);
  const cIn = easeOut(clamp((sy - Q0 - 1.05 * vh) / (0.6 * vh)));
  $('qGrad').style.opacity = (1 - cIn).toFixed(3);
  $('sQuote').querySelector('.frame').style.opacity = cIn.toFixed(3);
  const travel = marqW - (1920 - 164) * U;
  $('marq').style.transform = `translate3d(${((1 - p) * 520 * U - p * travel).toFixed(1)}px,0,0)`;
  const a = easeOut(clamp(p / 0.4));
  $('land').style.transform = `translate3d(0,${((1 - a) * 160 * U).toFixed(1)}px,0)`;
  $('land').style.opacity = 0.2 + 0.8 * a;
  [$('qEn'), $('qKr')].forEach((el, i) => {
    const qq = easeOut(clamp((p - 0.28 - i * 0.06) / 0.25));
    el.style.opacity = qq;
    el.style.filter = `blur(${((1 - qq) * 10 * B).toFixed(2)}px)`;
  });
}
const closeSpans = [...root.querySelectorAll('#sClose span')];
function closeUpdate(sy) {
  const cIn = clamp((sy - C0) / (0.5 * vh)), sc = $('sClose');
  sc.style.opacity = cIn.toFixed(3);
  show(sc, cIn > 0);
  closeSpans.forEach((el, i) => {
    const a = easeOut(clamp((sy - C0 - (0.25 + 0.22 * i) * vh) / (0.5 * vh)));
    el.style.opacity = a.toFixed(3);
    el.style.filter = a < 1 ? `blur(${((1 - a) * 12 * B).toFixed(2)}px)` : 'none';
    el.style.transform = `translateY(${((1 - a) * 14).toFixed(1)}px)`;
  });
}

/* ================= GNB 테마 ================= */
function gnbTheme(f, sy) {
  const inStory = scrollY < storyTop() + $('story').offsetHeight - 40;
  if (!header) return;
  header.dataset.historyTheme = lastF > 0.65 && sy < Q0 + 1.2 * vh ? 'light' : 'dark';
  // 아래로 스크롤하면 숨기고, 위로 스크롤하면 다시 내려온다. 맨 위에서는 항상 보인다.
  const hidden = scrollY > 40 && headerDir > 0;
  if ((header.dataset.historyHidden === 'true') !== hidden) header.dataset.historyHidden = String(hidden);
}

/* ================= 메인 루프 ================= */
let cur = 0, vel = 0, lastF = -1, lastT = -1, lastH = -1, lastFi = -1, lastPre = -1;
const near = (a, b) => Math.abs(a - b) < 0.0004;
// 마우스 휠은 한 칸에 100px 이상 뚝뚝 끊겨 움직이므로, 장면은 실제 스크롤 값을 부드럽게 따라가는 값(ss)으로 그린다.
let ss = null, lastNow = performance.now();
const follow = (dt, rate) => (reduced ? 1 : 1 - Math.pow(1 - rate, dt / 16.667));
function frame() {
  if (disposed) return;
  const now = performance.now(), dt = Math.min(64, now - lastNow); lastNow = now;
  const raw = scrollY - storyTop();
  if (ss === null || Math.abs(raw - ss) > 2.5 * vh) ss = raw;      // 첫 프레임·앵커 이동처럼 큰 점프는 그대로 반영
  else { ss += (raw - ss) * follow(dt, 0.16); if (Math.abs(raw - ss) < 0.3) ss = raw; }
  const locked = updateWhy(now, ss);
  if (locked !== ss) ss = locked;                                  // Why 고정·통과 시점은 정확한 위치로 맞춤
  const sy = ss, sk = sy / vh;
  const hp = clamp(sk, 0, 3);
  const playing = heroIntro(now);
  const hsPrev = hs; hs += (hp - hs) * follow(dt, 0.085);
  if (playing || dirty || !near(hp, lastH) || Math.abs(hs - hsPrev) > 1e-4) { heroUpdate(hp); lastH = hp; show($('sHero'), sk < RELEASE + 1.05); }
  if (dirty || !near(sk, lastFi)) {
    filmUpdate(sk); quoteUpdate(sy); closeUpdate(sy); lastFi = sk;
    preIn = sk > FILM_OUT ? 1 : 0;                                // 문구는 처음부터 선명하게, 위치만 아래에서 올라옴
  }
  const f = clamp((sy - F0) / flashLen), t = why.active ? why.progress : clamp((sy - F0 - flashLen) / introLen);
  const fc = dirty || !near(f, lastF) || preIn !== lastPre;
  if (fc) { applyFlash(f); lastF = f; lastPre = preIn; }
  if (fc || why.active || !near(t, lastT)) { applyIntro(t); lastT = t; }
  show($('hist'), t > 0.3 && sy < Q0 + vh);
  const target = clamp((sy - chStart) / step, 0, n - 1);
  if (reduced) cur = target;
  else {
    // 프레임이 느려도 튀지 않도록 60fps 기준 고정 간격으로 나눠서 계산 (큰 간격 한 번에 계산하면 발산함)
    const steps = Math.max(1, Math.min(4, Math.round(dt / 16.667)));
    for (let i = 0; i < steps; i++) { vel += (target - cur) * 0.085; vel *= 0.74; cur += vel; }
    if (!Number.isFinite(cur)) { cur = target; vel = 0; }
  }
  if (dirty || Math.abs(cur - lastCur) > 1e-4 || reveal !== lastReveal) { drawTicks(cur); lastCur = cur; lastReveal = reveal; }
  const idx = Math.round(clamp(cur, 0, n - 1));
  if (idx !== active) change(active, idx);
  gnbTheme(f, sy);
  dirty = false;
  requestAnimationFrame(frame);
}

/* ================= 스냅 (질문 화면 ~ 마지막 연도 구간만) ================= */
let tmr, dragging = false, lastSy = 0, dir = 1;
const stops = () => { const b = storyTop(); return [b + F0 + flashLen, ...CH.map((_, i) => b + chStart + i * step)]; };
function snap() {
  if (dragging || why.active) return;
  if (performance.now() - whyLastWheel < 220) { tmr = setTimeout(snap, 120); return; }   // 관성 스크롤 중엔 기다림
  const sy = scrollY, st = stops(), last = st[st.length - 1];
  if (sy < st[0] || sy >= last) return;
  let j = 0;
  while (j < st.length - 2 && sy >= st[j + 1]) j++;
  const a = st[j], b = st[j + 1], p = (sy - a) / (b - a);
  const tgt = dir > 0 ? (p > 0.15 ? b : a) : (p < 0.85 ? a : b);
  if (Math.abs(tgt - sy) > 2) scrollTo({ top: tgt, behavior: reduced ? 'auto' : 'smooth' });
}
addEventListener('scroll', () => {
  const sy = scrollY;
  if (Math.abs(sy - lastSy) > 1) dir = sy > lastSy ? 1 : -1;
  lastSy = sy;
  clearTimeout(tmr); tmr = setTimeout(snap, 240);
}, { passive: true });
/* 헤더 표시: 사용자가 스크롤하는 방향(휠·터치·키보드)을 기준으로 정한다 */
let headerDir = 0, headerTouchY = null;
addEventListener('wheel', e => { if (Math.abs(e.deltaY) > 2) headerDir = e.deltaY > 0 ? 1 : -1; }, { passive: true });
addEventListener('touchstart', e => { headerTouchY = e.touches[0]?.clientY ?? null; }, { passive: true });
addEventListener('touchmove', e => {
  const y = e.touches[0]?.clientY;
  if (headerTouchY === null || y === undefined || Math.abs(y - headerTouchY) < 8) return;
  headerDir = y < headerTouchY ? 1 : -1; headerTouchY = y;
}, { passive: true });
addEventListener('keydown', e => {
  if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End'].includes(e.key)) headerDir = 1;
  if (['ArrowUp', 'PageUp', 'Home'].includes(e.key)) headerDir = -1;
});
/* Why 화면: 아래로 스크롤하는 동작을 한 번씩 센다 (트랙패드 관성 이벤트는 한 번으로 묶음) */
let whyLastWheel = 0, whyLastCount = 0, whyTouchY = null;
const whyStep = now => {
  if (why.started === null || why.done || why.leaveAt !== null) return;
  if (now - whyLastCount < 300) return;
  whyLastCount = now; why.count += 1;
};
const whyHolding = () => why.started !== null && !why.done;
addEventListener('wheel', e => {
  const now = performance.now(), gap = now - whyLastWheel;
  whyLastWheel = now;
  if (e.deltaY > 0 && whyHolding()) e.preventDefault();          // 아래로는 고정, 위로는 돌아갈 수 있음
  if (e.deltaY > 0 && gap > 120) whyStep(now);
}, { passive: false });
addEventListener('touchmove', e => {
  const y = e.touches[0]?.clientY;
  if (whyHolding() && whyTouchY !== null && y !== undefined && y < whyTouchY) e.preventDefault();
}, { passive: false });
addEventListener('touchstart', e => { whyTouchY = e.touches[0]?.clientY ?? null; }, { passive: true });
addEventListener('touchend', e => {
  const y = e.changedTouches[0]?.clientY;
  if (whyTouchY !== null && y !== undefined && whyTouchY - y > 30) whyStep(performance.now());
  whyTouchY = null;
}, { passive: true });
addEventListener('keydown', e => {
  if (!['ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(e.key)) return;
  if (whyHolding() && !e.target.closest?.('input,textarea,select,[contenteditable]')) e.preventDefault();
  whyStep(performance.now());
});
addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (e.key === 'ArrowDown' && whyHolding()) return;        // Why 화면에서는 위 핸들러가 횟수만 셈
  const sy = scrollY, st = stops();
  if (sy < st[0] - 4 || sy > st[st.length - 1] + 4) return;
  e.preventDefault();
  const d = e.key === 'ArrowDown' ? 1 : -1;
  let i = 0, best = Infinity;
  st.forEach((v, k) => { if (Math.abs(v - sy) < best) { best = Math.abs(v - sy); i = k; } });
  scrollTo({ top: st[clamp(i + d, 0, st.length - 1)], behavior: reduced ? 'auto' : 'smooth' });
});

/* ================= 다이얼 드래그 / 클릭 / 키보드 ================= */
const dial = $('dial');
let startY = 0, startScroll = 0, lastY = 0, lastTime = 0, flick = 0, moved = 0;
const pxPerYear = () => R * STEP * Math.PI / 180;
const chTop = i => storyTop() + chStart + clamp(i, 0, n - 1) * step;
const goTo = i => scrollTo({ top: chTop(i), behavior: reduced ? 'auto' : 'smooth' });
listen(dial, 'pointerdown', e => {
  if (scrollY < chTop(0) - 4) return;
  dragging = true; moved = 0; flick = 0;
  startY = lastY = e.clientY; lastTime = e.timeStamp; startScroll = scrollY;
  dial.setPointerCapture(e.pointerId); dial.classList.add('drag'); e.preventDefault();
});
listen(dial, 'pointermove', e => {
  if (!dragging) return;
  const dy = e.clientY - startY;
  moved = Math.max(moved, Math.abs(dy));
  const dt = Math.max(1, e.timeStamp - lastTime);
  flick = flick * 0.6 + ((e.clientY - lastY) / dt) * 0.4;
  lastY = e.clientY; lastTime = e.timeStamp;
  const pos = clamp((startScroll - chTop(0)) / step - dy / pxPerYear(), 0, n - 1);
  scrollTo({ top: chTop(0) + pos * step, behavior: 'auto' });
});
function endDrag(e) {
  if (!dragging) return;
  dragging = false; dial.classList.remove('drag');
  if (moved < 4 && e.type === 'pointerup') {
    const rect = dial.getBoundingClientRect();
    const y = clamp((e.clientY - (rect.top + rect.height / 2)) / R, -0.999, 0.999);
    goTo(Math.round(cur + Math.asin(y) * 180 / Math.PI / STEP));
    return;
  }
  const pos = (scrollY - chTop(0)) / step;
  goTo(Math.round(pos + (Math.abs(flick) > 0.5 ? -Math.sign(flick) * 0.5 : 0)));
}
listen(dial, 'pointerup', endDrag);
listen(dial, 'pointercancel', endDrag);
listen(dial, 'keydown', e => {
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
});

addEventListener('resize', layout);
document.fonts?.ready.then(() => { if (!disposed) layout(); });
$('ruleAsset').src = RULE_ASSETS[0];
layout();
setYear(CH[0].year);
if (reduced || scrollY > innerHeight * 0.5) skipIntro();
requestAnimationFrame(frame);

 return () => {
  disposed = true;
  controller.abort();
  window.cancelAnimationFrame(frameId);
  timers.forEach(window.clearTimeout);
  root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  if (header) { delete header.dataset.historyTheme; delete header.dataset.historyHidden; }
 };
}
