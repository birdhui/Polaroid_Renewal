import { asset12, asset14, asset15, asset18, asset29, asset30, asset31 } from './storyAssets.js';
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
 // #story의 문서 기준 위치는 layout()에서 한 번만 재서 저장한다. (매 프레임 getBoundingClientRect를 부르면 강제 레이아웃이 생김)
 let storyTopY = 0;
 const storyTop = () => storyTopY;

const CH = [
  { year: 1937, img: asset12, hl: '편광 기술에서 시작된 혁신의 역사',
    bd: '1937년, 에드윈 랜드는 편광 기술을 기반으로 폴라로이드 코퍼레이션을 출범시켰습니다.<br>빛을 연구하던 작은 시작은 훗날 사진의 역사를 바꾸는 혁신으로 이어졌습니다.' },
  { year: 1943, img: asset29, hl: '작은 바램에서 시작된 순간을 담는 새로운 방식',
    bd: '“찍은 사진을 왜 바로 볼 수 없나요?” 딸의 질문에서 영감을 얻은 에드윈 랜드는 촬영한 사진을<br>그 자리에서 볼 수 있는 새로운 방식을 구상했습니다. 그렇게 즉석사진을 향한 폴라로이드의 여정이 시작됐습니다.' },
  { year: 1948, img: asset14, hl: '폴라로이드 즉석사진의 탄생',
    bd: '1947년 즉석사진 기술을 공개한 데 이어, 이듬해 첫 상용 카메라인 랜드 카메라 모델 95를 선보였습니다.<br>촬영한 자리에서 사진을 확인할 수 있는, 즉석사진의 시대가 열린 것입니다.' },
  { year: 1981, img: asset15, hl: '사람들의 일상으로 이어진 즉석사진의 혁신',
    bd: '1972년, 필름을 분리할 필요 없는 SX-70이 등장 후 One Stop과 600시리즈는 즉석사진의 경험을 넓혔습니다.<br>폴라로이드는 일상의 추억을 남기는 카메라이자, 예술가들의 표현 도구로 자리 잡았습니다.' },
  { year: 2008, img: asset30, hl: '시대의 변화 속 멈춰 선 폴라로이드',
    bd: '디지털 사진의 확산 속에서 폴라로이드는 2001년 파산보호를 신청하고 2008년 즉석필름 생산을 중단했습니다.<br>오랜 시간 이어온 폴라로이드 즉석사진의 미래는 불확실해졌습니다.' },
  { year: 2017, img: asset31, hl: '한 장의 사진을 포기하지 않은 사람들',
    bd: '2008년, ‘임파서블 프로젝트’는 네덜란드의 마지막 폴라로이드 필름 공장을 되살리고 필름 재개발에 도전했습니다.<br>그 노력은 2017년 ‘폴라로이드 오리지널스’의 출범으로 이어졌습니다.' },
  { year: 2026, img: asset18, hl: '다시 쓰는 폴라로이드 역사 그리고 NOW',
    bd: '2020년, 폴라로이드는 본래의 이름으로 돌아와 ‘Now’를 선보였습니다.<br>사진을 기다리는 설렘과 한 장의 추억을 남기는 감성은 오늘날에도 이어지고 있습니다.' }
];
const n = CH.length;
const header = root.closest('main')?.previousElementSibling;
const els = new Map();                   // 매 프레임 반복되는 querySelector를 줄이기 위해 찾은 요소를 저장
const $ = id => {
  if (id === 'gnb') return header;
  let el = els.get(id);
  if (!el) { el = root.querySelector(`#${id}`); if (el) els.set(id, el); }
  return el;
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const bellAt = (x, c, w) => Math.exp(-Math.pow((x - c) / w, 2));
const B = reduced ? 0 : 1;               // 블러 사용 여부
let U = 1, vh = innerHeight, vw = innerWidth;

/* ================= DOM 생성 ================= */
// Since + 연도는 한 자리에 고정하고, 숫자만 다이얼처럼 굴러가며 바뀐다.
$('titles').innerHTML = `<div class="ch on title-fixed"><p class="since">The Polaroid Story</p><i class="rule" aria-hidden="true"></i><p class="year" id="titleYear" aria-label="${CH[0].year}"></p></div>`;
// 왼쪽: 연도 아래에 그 연도의 제목·본문을 겹쳐 두고, 연도가 바뀌면 해당 글만 서서히 나타남
// 본문 줄바꿈(<br>)을 숨기는 화면에서도 문장이 붙지 않도록 <br> 앞에 띄어쓰기를 둔다.
root.querySelectorAll('#copy').forEach(el => el.remove());          // 개발 모드에서 두 번 마운트돼도 한 벌만 남도록
$('titles').insertAdjacentHTML('afterend', `<div class="copy stack" id="copy">${CH.map((c, i) => `<div class="cp${i ? '' : ' on'}"${i ? ' aria-hidden="true"' : ''}><h3 class="hl">${c.hl}</h3><p class="bd">${c.bd.replace(/<br>/g, ' <br>')}</p></div>`).join('')}</div>`);
const copies = [...$('copy').children];
// 오른쪽: 연도별 사진 카드를 가로로 이어 붙인 슬라이더 (참고: Osmo Draggable Infinite Slider). 버튼 없이 스크롤로만 넘어감
$('track').innerHTML = CH.map((c, i) => `<article class="blk${i ? '' : ' on'}" data-year="${c.year}"><div class="pic" data-year="${c.year}"><img src="${c.img}" alt="${c.year}년 아카이브 사진" decoding="async"></div></article>`).join('');
const blocks = [...$('track').children];
let cardStep = 0;                                                 // 카드 한 장 폭 + 간격 (layout에서 잼)
let cardPos = 0;                                                  // 카드 줄의 현재 위치(장 단위)
/* 연도 전환 (참고: ILKW about 히스토리 연도 흐름).
   앞 두 자리('19')는 제자리에 두고 뒤 두 자리만 스크롤에 맞춰 넘어간다. 1981 → 2008처럼 앞자리가 바뀔 때는 네 자리가 함께 넘어간다.
   진행도는 오른쪽 다음 블록이 올라오는 정도와 같은 값이라, 다음 블록이 자리를 잡는 순간 다음 연도도 함께 자리를 잡는다.
   ILKW처럼 화면 아래 먼 곳에서 올라오지 않고, 숫자 높이의 절반 정도 아래에서 흐린 채 올라와 선명해진다.
   이전 숫자는 먼저 위로 넘어가며 흐려지고 다음 숫자는 뒤이어 들어오므로 두 숫자가 또렷하게 겹쳐 보이지 않는다. 왼쪽 정렬. */
function yearFX(host) {
  const pres = [...new Set(CH.map(c => String(c.year).slice(0, 2)))], sufs = [...new Set(CH.map(c => String(c.year).slice(2)))];
  host.innerHTML = `<span class="yfx-pre" aria-hidden="true">${pres.map(p => `<span data-p="${p}">${p}</span>`).join('')}</span>`
    + `<span class="yfx-suf" aria-hidden="true">${sufs.map(x => `<span data-s="${x}">${x}</span>`).join('')}</span>`;
  const P = new Map([...host.querySelectorAll('[data-p]')].map(e => [e.dataset.p, e]));
  const S = new Map([...host.querySelectorAll('[data-s]')].map(e => [e.dataset.s, e]));
  const all = [...P.values(), ...S.values()];
  let pw = {}, last = '';
  const put = (e, o, y, b, left) => {
    if (!e) return;
    e.style.visibility = o > 0.004 ? 'visible' : 'hidden';
    e.style.opacity = o.toFixed(3);
    e.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`;
    e.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none';
    if (left !== undefined) e.style.left = left + 'px';
  };
  // q: 0 → 1 (이전 → 다음). 나가는 숫자는 0~0.6, 들어오는 숫자는 0.4~1 구간에서 움직임
  const outS = q => { const k = clamp(q / 0.6), e = k * k * (3 - 2 * k); return [1 - e, -58 * e, 6 * B * e]; };
  const inS = q => { const k = clamp((q - 0.4) / 0.6), e = k * k * (3 - 2 * k); return [e, 58 * (1 - e), 8 * B * (1 - e)]; };
  return {
    measure() { P.forEach((e, k) => { pw[k] = e.offsetWidth; }); last = ''; },
    render(pos) {
      const n = CH.length, a = Math.max(0, Math.min(n - 1, Math.floor(pos))), q = a >= n - 1 ? 0 : pos - a;
      const key = a + ':' + q.toFixed(4);
      if (key === last) return;
      last = key;
      const from = String(CH[a].year), to = String(CH[Math.min(n - 1, a + 1)].year);
      const fp = from.slice(0, 2), fs = from.slice(2), tp = to.slice(0, 2), ts = to.slice(2);
      all.forEach(e => { e.style.visibility = 'hidden'; });
      const o = outS(q), i = inS(q);
      if (q < 1e-4 || from === to) { put(P.get(fp), 1, 0, 0); put(S.get(fs), 1, 0, 0, pw[fp] || 0); return; }
      if (fp === tp) {
        put(P.get(fp), 1, 0, 0);
        put(S.get(fs), ...o, pw[fp] || 0);
        if (ts !== fs) put(S.get(ts), ...i, pw[tp] || 0);
      } else {                                              // 1981 → 2008: 네 자리가 함께
        put(P.get(fp), ...o); put(S.get(fs), ...o, pw[fp] || 0);
        put(P.get(tp), ...i); if (S.get(ts) !== S.get(fs)) put(S.get(ts), ...i, pw[tp] || 0);
      }
    }
  };
}
const titleFX = yearFX($('titleYear'));
const dialFX = yearFX($('yr'));
// 웹폰트(Outfit)가 늦게 도착하면 숫자 폭이 달라지므로 다시 잰다
if (document.fonts) listen(document.fonts, 'loadingdone', () => { if (!disposed) { titleFX.measure(); dialFX.measure(); dirty = true; } });
$('dial').setAttribute('aria-valuemin', 0); $('dial').setAttribute('aria-valuemax', n - 1);
$('dial').setAttribute('aria-valuenow', 0); $('dial').setAttribute('aria-valuetext', CH[0].year + '년');   // 첫 연도도 스크린리더에 값이 전달되도록

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
  return { el, x: +d.x, y: +d.y, w: +d.w, h: +d.h, rot: +d.rot, fx: +d.fx, fy: +d.fy, frot: +d.frot, start: +d.start, card: el.querySelector('.card'), img: el.querySelector('img') };
});

/* ================= 레이아웃 · 타임라인 =================
   하나의 고정 무대(#story) 안에서 스크롤 위치(px)로 장면을 전환한다. 단위 k = 화면 높이
   0 ─ Hero(연도) ─ 1.4k ─ Film ─ 4.4k ─ 질문 ─ F0 ─ 플래시 ─ Why 쓰기·머물기 ─ 퇴장 ─ chStart ─ 연도 7개 ─ Q0 ─ 인용 ─ C0 ─ 클로징 ─ END */
let F0, flashLen, whyLen, introLen, chStart, WS, WE, step, Q0, QLEN, C0, END, R;
function layout() {
  vh = innerHeight; vw = innerWidth;
  U = vw <= 820 ? vw / 820 : Math.min(vw / 1920, vh / 1080);
  const k = vh;
  // Since 1937 → 폴라로이드 사진 4장이 천천히 현상되듯 나타남 → 긴 페이지처럼 위로 올라가며 Film 등장
  RELEASE = 2.6;
  FILM_A = RELEASE + 0.9; FILM_B = RELEASE + 4.1; FILM_OUT = RELEASE + 3.6;
  F0 = (RELEASE + 5.2) * k; flashLen = 1.3 * k; whyLen = 1.5 * k; introLen = 2.2 * k; step = 0.9 * k;   // introLen: Why 문구가 먼지로 흩어지는 퇴장을 천천히 보도록 길게(원래 1.3)
  // Why 문구는 스크롤을 내리는 만큼 서서히 진해지고(WS→WE, 약 1.1화면), 조금 머문 뒤(whyLen 끝) 흐려지며 다음으로 넘어감
  WS = F0 + flashLen * 0.9; WE = F0 + flashLen + 1.0 * k;
  chStart = F0 + flashLen + whyLen + introLen;
  Q0 = chStart + (n - 1) * step + 0.5 * k; QLEN = 2.6 * k;
  C0 = Q0 + k + QLEN; END = C0 + 1.6 * k;
  $('story').style.height = (END + vh) + 'px';
  storyTopY = $('story').getBoundingClientRect().top + scrollY;
  R = $('dial').clientHeight / 2;
  const mobile = vw <= 820;
  photos.forEach(p => {
    const w = p.w * U, h = p.h * U;
    let left = p.x * U, top = p.y * U;
    if (mobile) {
      // 모바일: 네 장이 모인 줄 전체(가로 약 1096px)를 화면 폭에 맞춰 줄이고, 문구 아래에 둔다
      const s = Math.min(1, (vw - 24) / (1096 * U));
      const cx = p.x + p.w / 2 - 955, cy = p.y + p.h / 2 - 665;
      const ww = p.w * U * s, hh = p.h * U * s;
      left = vw / 2 + cx * U * s - ww / 2; top = vh * 0.58 + cy * U * s - hh / 2;
      Object.assign(p.el.style, { left: left + 'px', top: top + 'px', width: ww + 'px', height: hh + 'px' });
      return;
    }
    Object.assign(p.el.style, { left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px' });
  });
  const row = $('row');                 // 텍스트+이미지 행을 정수 px로 중앙 배치
  const colR = row.querySelector('.col-r');
  if (mobile) {
    row.style.transform = 'none'; row.style.left = '72px';
    const top = 90;
    row.style.top = top + 'px';
    // 모바일은 왼쪽(제목·연도) 아래에 오른쪽 블록이 오므로, 지나간 블록이 위로 올라가 제목·연도·헤더를 덮지 않도록 블록 영역만 보이게 자른다.
    const txtH = row.querySelector('.txt').offsetHeight;
    colR.style.height = Math.max(200, vh - top - txtH - 20 - 16) + 'px';
  } else { row.style.left = ''; row.style.top = ''; row.style.transform = ''; colR.style.height = ''; }   // Figma 1705:3122: 위치는 CSS에서 화면 가운데 기준으로 잡음
  marqW = $('marq').scrollWidth;
  cardStep = blocks[0].offsetWidth + (parseFloat(getComputedStyle($('track')).columnGap) || 0);
  titleFX.measure(); dialFX.measure();
  lastCur = 99; dirty = true;
}
const show = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden'; };

/* ================= 1. Hero: Since 1937 → 순간을 간직하는 방식 (Figma 1834:4717 → 4703 → 4789 → 4684) ================= */
// 진입: 아웃포커스 상태에서 서서히 초점이 맞으며 Since 1937이 나타나고, 그 뒤 SCROLL 표시가 생긴다.
const T_FOCUS = 1800;
const hero = { t0: performance.now(), focus: 0, done: false };
function heroIntro(now) {
  if (hero.done) return false;
  hero.focus = easeInOut(clamp((now - hero.t0 - 250) / T_FOCUS));
  if (hero.focus >= 1) {
    hero.done = true;
    $('cue').animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 350, easing: 'ease-out', fill: 'forwards' });
  }
  return true;
}
function skipIntro() {                              // 동작 줄이기 or 중간에서 새로고침한 경우
  Object.assign(hero, { focus: 1, done: true });
  $('cue').style.opacity = 1;
}
let hs = 0, RELEASE = 2.6;
const M0 = 0.35, DEV = 0.9;                         // 사진이 모이기 시작하는 지점과 한 장이 제자리에 오기까지의 길이(화면 높이 배수)
function heroUpdate() {
  const p = hs;
  // Since 1937: 처음엔 초점이 맞아 들어오고, 스크롤하면 다시 초점이 풀리며 물러남
  const out = easeInOut(clamp(p / 0.55));
  const o = $('origin');
  const blur = Math.max(1 - hero.focus, out);
  o.style.opacity = (clamp(hero.focus * 1.3) * (1 - out)).toFixed(3);
  o.style.filter = B && blur > 0.002 ? `blur(${(blur * 20).toFixed(2)}px)` : 'none';
  o.style.transform = `translate(-50%,-50%) scale(${(1 + 0.035 * blur * B).toFixed(4)})`;   // .frame 가운데 정렬 유지
  o.style.visibility = out >= 1 ? 'hidden' : 'visible';
  // 폴라로이드 4장 (Figma 2046:2383): 한 장씩 차례로 가운데 줄에 조용히 내려놓는 느낌.
  // 제자리에서 조금 아래·바깥쪽에서 살짝 더 기운 채 떠올라 천천히 자리를 잡고, 그 사이 바랜 인화지가 현상되듯 색이 돌아옴
  photos.forEach(ph => {
    const d = clamp((p - M0 - ph.start) / DEV), e = easeOut(d), r = 1 - e;
    ph.el.style.transform = `translate3d(${(r * ph.fx * U).toFixed(1)}px,${(r * ph.fy * U).toFixed(1)}px,0) rotate(${(ph.rot + r * ph.frot).toFixed(2)}deg) scale(${(1 + 0.03 * r).toFixed(4)})`;
    ph.card.style.opacity = easeOut(clamp(d * 1.6)).toFixed(3);
    ph.img.style.filter = d >= 1 ? 'none'
      : `sepia(${(0.55 * r).toFixed(3)}) saturate(${(0.35 + 0.65 * e).toFixed(3)}) brightness(${(1 + 0.6 * r).toFixed(3)}) contrast(${(0.6 + 0.4 * e).toFixed(3)}) blur(${(r * 3 * B).toFixed(2)}px)`;
  });
  // 가운데 문구: 사진이 현상되는 사이 초점이 맞으며 자연스럽게 이어짐
  const c = easeOut(clamp((p - 0.3) / 0.6)), mc = $('momentsCopy');   // 문구가 먼저 초점이 맞고, 이어서 사진이 한 장씩 모임
  mc.style.opacity = c.toFixed(3);
  mc.style.filter = B && c < 1 ? `blur(${((1 - c) * 10).toFixed(2)}px)` : 'none';
  mc.style.transform = `translate3d(0,${((1 - c) * 18 * U).toFixed(1)}px,0)`;
  $('cue').style.visibility = p > 0.08 ? 'hidden' : 'visible';
}

/* ================= 2. Film (k 단위 위치 sk) =================
   레퍼런스(ILKWANG about) 방식: 큰 문장이 줄 단위로 아래에서 마스크 리빌 →
   줄마다 다른 속도로 가로로 흘러 서로 엇갈림 → 가운데 영상 컷은 작게 열리며 커지고 어둠이 걷힘 → 빛 번짐이 지나감 */
let marqW = 0;
let FILM_A = 1.65, FILM_B = 4.85, FILM_OUT = 4.35;                    // 장면 구간 (화면 높이 배수)
const filmWords = [...root.querySelectorAll('#sFilm .w')];   // 띄어쓰기 기준 단어
const W0 = 0.05, W1 = 0.92;   // 단어 색 변화가 진행되는 구간(장면 진행률). 단어마다 앞 단어와 겹쳐 4단어 길이에 걸쳐 천천히 진해짐
const WORD_MUTED = 0.08, WORD_ON = 0.34, WORD_SPAN = 4;   // 글자 흰색 투명도: 아직 안 읽은 단어 → 읽은 단어 (디자인 .2보다 조금 진하게)
const filmS = root.querySelector('#sFilm .still'), filmDim = root.querySelector('#sFilm .dim');
const filmV = root.querySelector('#sFilm video');   // 가운데 영상: 장면이 보일 때만 재생(배터리·CPU 절약), 모션 줄이기 설정이면 포스터만 표시
let filmPlaying = false;
function filmPlay(on) {
  if (!filmV || reduced || on === filmPlaying) return;
  filmPlaying = on;
  if (on) filmV.play().catch(() => { filmPlaying = false; });
  else filmV.pause();
}
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
  filmPlay(sk > RELEASE - 0.3 && out < 1);
  // 단어가 스크롤에 맞춰 한 단어씩 차례로: 위치·블러 변화 없이 흐린 색에서 본래 색으로만 바뀜 (Text Reveal on Scroll 방식)
  const wp = reduced ? filmWords.length + WORD_SPAN : clamp((p - W0) / (W1 - W0)) * (filmWords.length + WORD_SPAN - 1);
  filmWords.forEach((w, i) => {
    const r = easeInOut(clamp((wp - i) / WORD_SPAN));
    w.style.color = `rgba(255,255,255,${(WORD_MUTED + (WORD_ON - WORD_MUTED) * r).toFixed(3)})`;
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
  // 작은 바램 문구가 흐려지며 물러나는 사이, 스크롤에 맞춰 카메라 섬광이 '촥' 터진 뒤 밝은 화면으로 번진다.
  const aOut = easeInOut(clamp(f / 0.2));
  const pa = $('preA');
  pa.style.opacity = (preIn * (1 - aOut)).toFixed(3);
  pa.style.filter = B && aOut > 0 ? `blur(${(aOut * 10).toFixed(2)}px)` : 'none';
  // 섬광: 화면 가운데 한 점에서 터져 빛이 바깥으로 흘러 퍼지고, 그대로 밝은 화면으로 이어짐 (스크롤 위치에 연결)
  const burst = clamp((f - 0.2) / 0.5);
  const pop = $('pop');
  pop.style.transform = `scale(${(B ? 0.02 + 2.4 * easeOut(burst) : 2.4).toFixed(4)})`;
  pop.style.opacity = (burst <= 0 ? 0 : Math.min(1, burst * 5) * (1 - easeInOut(clamp((f - 0.62) / 0.25)))).toFixed(3);
  const growIn = easeOut(clamp((f - 0.24) / 0.3));
  const fill = easeInOut(clamp((f - 0.4) / 0.4));
  const scale = 0.04 + 0.96 * growIn + 2.5 * fill;
  const fl = $('flash');
  fl.style.transform = `scale(${(U * (B ? scale : 1 + 2.5 * fill)).toFixed(4)})`;
  fl.style.opacity = clamp((f - 0.24) / 0.06).toFixed(3);
  $('ivory').style.opacity = easeInOut(clamp((f - 0.45) / 0.35)).toFixed(3);
  show($('pre'), preIn > 0 && f < 0.5);
  show(fl, f > 0.23 && f < 0.95);
  show(pop, f > 0.19 && f < 0.9);
}
/* ================= Why 문구: 가루로 써지고, 먼지로 흩어짐 ================= */
// 문구를 픽셀 입자로 바꿔 두고,
//  - 등장(r): 왼쪽부터 오른쪽으로, 고운 가루가 왼쪽 뒤편에서 흩날려 와 글자 모양으로 모여 앉음. 다 모인 부분부터 또렷한 글자(DOM)가 보임
//  - 퇴장(d): 왼쪽부터 오른쪽으로 글자가 먼지로 부서져 오른쪽 위로 날아가며 사라짐
// 위치는 스크롤 진행으로만 정해져서, 되돌리면 그대로 거꾸로 움직임.
let dust = null;
const PS = 11;                                                     // 입자 하나당 값 개수
const R_SPAN = 0.8, R_LIFE = 0.2;                                  // 등장: 왼쪽→오른쪽 진행 비율, 한 입자가 날아와 앉는 길이
const D_SPAN = 0.5, D_LIFE = 0.38;                                 // 퇴장: 같은 뜻 (입자 하나가 오래 떠 있도록 길게)
function buildDust(qt, cv) {
  const cr = cv.getBoundingClientRect();
  const dpr = Math.min(2, devicePixelRatio || 1);
  const W = Math.max(1, Math.round(cr.width * dpr)), H = Math.max(1, Math.round(cr.height * dpr));
  cv.width = W; cv.height = H;
  const ln = qt.querySelector('.ql');
  const lr = ln.getBoundingClientRect();
  const cs = getComputedStyle(qt), fs = parseFloat(cs.fontSize) * dpr;
  const multi = lr.height > parseFloat(cs.lineHeight) * 1.5;      // 좁은 화면에서 두 줄로 바뀌면 가루 효과 없이 마스크로만 드러냄
  const base = { key: cr.width + 'x' + cr.height + 'x' + cs.fontSize, W, H, dpr, ln, left: lr.left - cr.left, width: lr.width, color: cs.color, multi, ctx: cv.getContext('2d') };
  if (multi) return { ...base, P: [], step: 1, minX: 0, maxX: 1 };
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  const c = off.getContext('2d', { willReadFrequently: true });
  c.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
  try { c.letterSpacing = (parseFloat(cs.letterSpacing) || 0) * dpr + 'px'; } catch (e) { /* 지원 안 하는 브라우저는 자간 없이 그림 */ }
  c.fillStyle = cs.color; c.textBaseline = 'alphabetic';
  const m = c.measureText('H'), A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent, lh = parseFloat(cs.lineHeight) * dpr;
  const x0 = (lr.left - cr.left) * dpr, y0 = (lr.top - cr.top) * dpr;
  c.fillText(ln.textContent, x0, y0 + (lh - (A + D)) / 2 + A);    // DOM 글자와 같은 기준선에 그림
  const minX = x0, maxX = x0 + lr.width * dpr, span = Math.max(1, maxX - minX);
  const img = c.getImageData(0, 0, W, H).data;
  const step = Math.max(1, Math.round(fs / 30));                   // 고운 가루: 글자 크기에 맞춘 촘촘한 간격(기기 픽셀)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = [];
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) {
    const al = img[(y * W + x) * 4 + 3];
    if (al < 40) continue;
    const fx = (x - minX) / span;
    P.push(x, y, al / 255,
      D_SPAN * fx + 0.12 * rnd(),                                   // [3] 퇴장: 부서지기 시작하는 시점
      (0.5 + rnd() * 1.5) * fs * 0.9, -(0.15 + rnd() * 0.9) * fs * 0.6,   // [4][5] 퇴장: 날아가는 거리
      rnd() * 6.283, (0.2 + rnd() * 0.5) * fs * 0.12,               // [6][7] 흔들림 위상·폭
      R_SPAN * fx + 0.06 * rnd(),                                   // [8] 등장: 날아오기 시작하는 시점 (왼쪽부터)
      -(0.4 + rnd() * 1.6) * fs,                                    // [9] 등장: 출발 위치 (왼쪽 뒤편으로 떨어진 거리)
      (rnd() - 0.5) * fs * 1.4);                                    // [10] 등장: 출발 위치 (위아래로 흩어진 정도)
  }
  return { ...base, P, step, minX, maxX };
}
function setMask(ln, m) { ln.style.maskImage = m; ln.style.webkitMaskImage = m; }
function applyDust(r, d) {
  const qt = $('quote'), cv = $('dust');
  if (!cv) return;
  const ln = qt.querySelector('.ql');
  if (reduced || (r >= 1 && d <= 0) || r <= 0) {                   // 완성 상태(또는 아직 시작 전): 캔버스 비우고 글자 그대로
    if (dust) dust.ctx.clearRect(0, 0, dust.W, dust.H);
    setMask(ln, '');
    return;
  }
  const cr = cv.getBoundingClientRect();
  if (!dust || dust.key !== cr.width + 'x' + cr.height + 'x' + getComputedStyle(qt).fontSize) dust = buildDust(qt, cv);
  const { ctx, W, H, dpr, step, P, minX, maxX, left, color, multi } = dust, span = maxX - minX;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = color;
  const toLn = v => (v / dpr - left).toFixed(1) + 'px';            // 캔버스 기준 x(기기 픽셀) → 글자 요소 기준 x(CSS px)
  if (d <= 0) {
    // 등장: 가루가 다 모여 앉은 부분까지 또렷한 글자를 보여 줌 (경계는 부드럽게)
    const full = minX + (r - R_LIFE - 0.06) / R_SPAN * span, none = minX + (r - R_LIFE * 0.35) / R_SPAN * span;
    setMask(ln, multi ? `linear-gradient(90deg,#000 ${((r * 1.1 - 0.1) * 100).toFixed(1)}%,transparent ${(r * 1.1 * 100).toFixed(1)}%)`
                      : `linear-gradient(90deg,#000 ${toLn(full)},transparent ${toLn(none)})`);
    for (let i = 0; i < P.length; i += PS) {
      const q = (r - P[i + 8]) / R_LIFE;
      if (q <= 0 || q >= 1.15) continue;                            // 다 앉은 뒤 잠깐 더 그려 글자와 자연스럽게 겹침
      const qq = Math.min(1, q), e = 1 - Math.pow(1 - qq, 3);       // 빠르게 날아와 천천히 내려앉음
      ctx.globalAlpha = P[i + 2] * Math.min(1, qq * 1.6) * (q > 1 ? 1 - (q - 1) / 0.15 : 1);
      ctx.fillRect(P[i] + P[i + 9] * (1 - e), P[i + 1] + P[i + 10] * (1 - e) + Math.sin(P[i + 6] + qq * 4) * P[i + 7] * (1 - e), step, step);
    }
  } else {
    // 퇴장: 아직 부서지지 않은 부분만 글자로 보이도록, 부서지는 경계를 따라 왼쪽을 가림
    const hide = minX + (d - 0.12) / D_SPAN * span, show = minX + d / D_SPAN * span;
    setMask(ln, multi ? `linear-gradient(90deg,transparent ${(d * 100).toFixed(1)}%,#000 ${(d * 100 + 10).toFixed(1)}%)`
                      : `linear-gradient(90deg,transparent ${toLn(hide)},#000 ${toLn(show)})`);
    for (let i = 0; i < P.length; i += PS) {
      const q = (d - P[i + 3]) / D_LIFE;
      if (q <= 0 || q >= 1) continue;
      const e = 1 - (1 - q) * (1 - q);                              // 처음엔 빠르게 흩어지고 점점 느려짐
      ctx.globalAlpha = P[i + 2] * (1 - q) * (1 - q);
      const sz = step * (1 - 0.5 * q);
      ctx.fillRect(P[i] + P[i + 4] * e + Math.sin(P[i + 6] + q * 5) * P[i + 7] * q, P[i + 1] + P[i + 5] * e, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}

function applyIntro(t, w) {
  // Why 문구: 왼쪽부터 고운 가루가 모여 앉으며 써지고, 퇴장할 때는 왼쪽부터 먼지로 부서져 흩어지며 사라짐
  const d = clamp((t - 0.02) / 0.34);                             // 먼지 퇴장 진행 (다음 화면이 덮기 시작하기 전에 대부분 끝남)
  // Why 문구는 화면이 밝아진 뒤, 스크롤을 내리는 만큼 써짐 (되돌리면 다시 지워짐)
  focusIn = reduced ? (w > 0 ? 1 : 0) : w;
  const q = $('intro'), r = focusIn;
  const qt = $('quote');
  qt.style.transform = 'none';
  applyDust(r, d);
  q.style.filter = 'none';
  q.style.transform = 'none';
  q.style.opacity = (r > 0 ? 1 : 0) * (reduced ? 1 - d : 1);      // 동작 줄이기 설정이면 가루 없이 바로 보이고, 퇴장은 그냥 옅어짐
  q.style.visibility = (d >= 1 || r <= 0) ? 'hidden' : 'visible';
  const a = clamp((t - 0.4) / 0.3), h = $('hist');          // 다음 화면은 먼지 퇴장(t 0.36까지)이 끝난 뒤 나타남
  h.style.opacity = a;
  h.style.filter = a >= 1 ? 'none' : `blur(${(14 * (1 - a) * B).toFixed(2)}px)`;
  h.style.transform = a >= 1 ? 'none' : `scale(${(1 - 0.04 * (1 - a) * B).toFixed(4)})`;
  reveal = clamp((t - 0.62) / 0.35);
  $('yr').style.opacity = clamp((t - 0.8) / 0.2);
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
const setYear = y => { $('titleYear').setAttribute('aria-label', String(y)); };

/* ================= 챕터 전환: 랙 포커스 크로스페이드 ================= */
const anim = (el, kf, o) => el.animate(kf, Object.assign({ fill: 'backwards' }, o));
let active = 0;
function change(from, to) {
  active = to;
  $('hist').dataset.year = CH[to].year;
  setYear(CH[to].year);
  $('dial').setAttribute('aria-valuenow', to);
  $('dial').setAttribute('aria-valuetext', CH[to].year + '년');
}
// 연도 아래 제목·본문과 카드 배지는 카드가 넘어가는 진행도(가운데 지점)에 맞춰 바꿈 → 연도 숫자·카드와 같은 순간에 바뀜
let copyIdx = 0;
function setCopy(to) {
  copyIdx = to;
  blocks.forEach((b, i) => b.classList.toggle('on', i === to));
  copies.forEach((c, i) => { c.classList.toggle('on', i === to); if (i === to) c.removeAttribute('aria-hidden'); else c.setAttribute('aria-hidden', 'true'); });
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

/* ================= GNB 호버 (Figma 2128:1214 'GNB / Menu Item (Roll)': Default → Hover → Out) ================= */
// 롤용 글자 복사본은 data-text 로 CSS(::before/::after)가 읽는다. 공통 헤더 마크업은 건드리지 않는다.
// 들어오면 한 줄 위로(in), 나가면 한 줄 더 위로(out) 굴린 뒤, 끝나면 Default 로 순간 복귀(보이는 글자는 같아 티 나지 않음).
function setupGnbHover() {
  if (!header) return;
  const snap = a => {                              // 전환 없이 Default 로 되돌림
    a.dataset.gnbSnap = '';
    delete a.dataset.gnb;
    void a.offsetWidth;
    delete a.dataset.gnbSnap;
  };
  const enter = a => {
    if (reduced) return;
    if (a.dataset.gnb === 'out') snap(a);          // 나가는 중에 다시 들어오면 처음부터 다시 굴림
    a.dataset.gnb = 'in';
  };
  const leave = a => {
    if (a.dataset.gnb !== 'in') return;
    a.dataset.gnb = 'out';
  };
  header.querySelectorAll('nav a').forEach(a => {
    a.dataset.text = a.textContent.trim();
    // 링크가 위로 움직여도 판정이 흔들리지 않도록, 고정된 li 에서 들어오고 나감을 받는다.
    const hit = a.closest('li') || a;
    listen(hit, 'pointerenter', e => { if (e.pointerType !== 'touch') enter(a); });
    listen(hit, 'pointerleave', e => { if (e.pointerType !== 'touch') leave(a); });
    listen(a, 'focus', () => { if (a.matches(':focus-visible')) enter(a); });
    listen(a, 'blur', () => leave(a));
    listen(a, 'transitionend', e => { if (e.target === a && e.propertyName === 'transform' && a.dataset.gnb === 'out') snap(a); });
  });
}
setupGnbHover();

/* ================= 폴라로이드 만져보기 (마우스 호버) =================
   커서를 올리면 사진을 손으로 살짝 집어 든 것처럼: 커서 쪽으로 기울고 조금 들려 그림자가 깊어지며, 인화지 표면에 빛이 커서를 따라 비침.
   스크롤 모션(.ph의 transform)과 겹치지 않도록 안쪽 .card에만 적용. 마우스가 있는 기기에서만, 모션 줄이기 설정이면 끔 */
function setupCardTouch() {
  if (reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  photos.forEach(ph => {
    const c = ph.card;
    listen(ph.el, 'pointermove', e => {
      const r = ph.el.getBoundingClientRect();
      const x = clamp((e.clientX - r.left) / r.width), y = clamp((e.clientY - r.top) / r.height);
      c.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(2) + 'deg');
      c.style.setProperty('--ry', ((x - 0.5) * 16).toFixed(2) + 'deg');
      c.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      if (!ph.el.classList.contains('is-touch')) ph.el.classList.add('is-touch');
    });
    listen(ph.el, 'pointerleave', () => {
      ph.el.classList.remove('is-touch');
      c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg');
    });
  });
}
setupCardTouch();

/* ================= GNB 테마 ================= */
function gnbTheme(f, sy) {
  if (!header) return;
  header.dataset.historyTheme = lastF > 0.65 && sy < Q0 + 1.2 * vh ? 'light' : 'dark';
  // 아래로 스크롤하면 숨기고, 위로 스크롤하면 다시 내려온다. 맨 위에서는 항상 보인다.
  const hidden = scrollY > 40 && headerDir > 0;
  if ((header.dataset.historyHidden === 'true') !== hidden) header.dataset.historyHidden = String(hidden);
}

/* ================= 메인 루프 ================= */
let cur = 0, vel = 0, lastF = -1, lastT = -1, lastW = -1, lastH = -1, lastFi = -1, lastPre = -1;
const near = (a, b) => Math.abs(a - b) < 0.0004;
// 마우스 휠은 한 칸에 100px 이상 뚝뚝 끊겨 움직이므로, 장면은 실제 스크롤 값을 부드럽게 따라가는 값(ss)으로 그린다.
let ss = null, lastNow = performance.now(), yp = 0, lastRaw = null, lastMove = 0;
const follow = (dt, rate) => (reduced ? 1 : 1 - Math.pow(1 - rate, dt / 16.667));
function frame() {
  if (disposed) return;
  const now = performance.now(), dt = Math.min(64, now - lastNow); lastNow = now;
  const raw = scrollY - storyTop();
  if (ss === null || Math.abs(raw - ss) > 2.5 * vh) ss = raw;      // 첫 프레임·앵커 이동처럼 큰 점프는 그대로 반영
  else { ss += (raw - ss) * follow(dt, 0.16); if (Math.abs(raw - ss) < 0.3) ss = raw; }
  const sy = ss, sk = sy / vh;
  const hp = clamp(sk, 0, 3);
  const playing = heroIntro(now);
  const hsPrev = hs; hs += (hp - hs) * follow(dt, 0.085);
  if (playing || dirty || !near(hp, lastH) || Math.abs(hs - hsPrev) > 1e-4) { heroUpdate(); lastH = hp; show($('sHero'), sk < RELEASE + 1.05); }
  if (dirty || !near(sk, lastFi)) {
    filmUpdate(sk); quoteUpdate(sy); closeUpdate(sy); lastFi = sk;
    preIn = sk > FILM_OUT ? 1 : 0;                                // 문구는 처음부터 선명하게, 위치만 아래에서 올라옴
  }
  const f = clamp((sy - F0) / flashLen), t = clamp((sy - F0 - flashLen - whyLen) / introLen), w = clamp((sy - WS) / (WE - WS));
  const fc = dirty || !near(f, lastF) || preIn !== lastPre;
  if (fc) { applyFlash(f); lastF = f; lastPre = preIn; }
  if (fc || !near(t, lastT) || !near(w, lastW)) { applyIntro(t, w); lastT = t; lastW = w; }
  show($('hist'), t > 0.4 && sy < Q0 + vh);
  const tRaw = (sy - chStart) / step;                          // 창 크기가 잠깐 0이 되는 순간에도 NaN이 퍼지지 않도록
  const target = Number.isFinite(tRaw) ? clamp(tRaw, 0, n - 1) : 0;
  if (reduced) cur = target;
  else {
    // 프레임이 느려도 튀지 않도록 60fps 기준 고정 간격으로 나눠서 계산 (큰 간격 한 번에 계산하면 발산함)
    const steps = Math.max(1, Math.min(4, Math.round(dt / 16.667)));
    for (let i = 0; i < steps; i++) { vel += (target - cur) * 0.085; vel *= 0.74; cur += vel; }
    if (!Number.isFinite(cur)) { cur = target; vel = 0; }
  }
  if (dirty || Math.abs(cur - lastCur) > 1e-4 || reveal !== lastReveal) { drawTicks(cur); lastCur = cur; lastReveal = reveal; }
  { // 오른쪽 카드 슬라이더: 스크롤에 맞춰 카드 줄이 왼쪽으로 넘어감. 지금 연도 카드만 또렷하고 양옆 카드는 20%로 흐리게 (참고 사이트와 같은 비율)
    // 연도 숫자와 같은 진행도(스크롤 값 target 기준): 한 장마다 잠시 머물렀다가(구간 앞 35%) 다음 장으로 부드럽게 넘어감.
    // 다이얼용 스프링 값(cur)은 끝에서 살짝 지나쳤다 돌아오고 화면 주사율에 따라 속도가 흔들려서, 카드는 쓰지 않고
    // 주사율과 상관없는 지수 감쇠로 따라감(지나침 없음). 스크롤이 멈추면 연도 숫자처럼 가까운 장으로 마저 정리됨.
    const ti = Math.min(n - 1, Math.floor(target)), tf = target - ti, tk = clamp((tf - 0.35) / 0.6);
    let want = Math.min(n - 1, ti + tk * tk * (3 - 2 * tk));
    const cIdle = now - lastMove > 220 && Math.abs(raw - ss) < 1;
    if (cIdle) want = Math.round(want);
    if (reduced || dirty) cardPos = want;
    else { cardPos += (want - cardPos) * follow(dt, cIdle ? 0.1 : 0.2); if (Math.abs(want - cardPos) < 1e-4) cardPos = want; }
    const pos = cardPos;
    $('track').style.transform = `translate3d(${(-pos * cardStep).toFixed(2)}px,0,0)`;
    blocks.forEach((b, i) => { b.style.opacity = (1 - 0.8 * clamp(Math.abs(i - pos))).toFixed(3); });
    const ai = Math.round(pos);
    if (ai !== copyIdx && Math.abs(pos - ai) < 0.45) setCopy(ai);   // 경계 근처에서 앞뒤로 깜빡이지 않도록 조금 넘어야 바뀜
  }
  { // 연도 숫자: 오른쪽 블록이 올라오는 진행도와 같은 값으로 넘어감
    // 다음 블록이 35%쯤 올라왔을 때 넘어가기 시작해 블록이 자리를 잡을 때(95%) 다음 연도도 자리를 잡음
    const fi = Math.min(n - 1, Math.floor(target)), fr = target - fi;
    const k = clamp((fr - 0.35) / 0.6), goal = fi + k * k * (3 - 2 * k);
    if (lastRaw === null || Math.abs(raw - lastRaw) > 0.5) lastMove = now;
    lastRaw = raw;
    const idle = now - lastMove > 220 && Math.abs(raw - ss) < 1;
    // 스크롤을 멈추면 넘어가던 숫자는 가까운 연도로 마저 정리되어 두 숫자가 겹친 채 남지 않음
    const want = idle ? Math.round(goal) : goal;
    if (reduced || dirty) yp = Math.round(goal);
    else { yp += (want - yp) * follow(dt, idle ? 0.12 : 0.3); if (Math.abs(want - yp) < 1e-4) yp = want; }
    titleFX.render(yp); dialFX.render(yp);
  }
  const idx = Math.round(clamp(cur, 0, n - 1));
  // 경계(.5) 근처에서 스크롤을 멈추면 연도가 앞뒤로 깜빡이지 않도록, 경계를 조금 넘어야 바뀜
  if (idx !== active && CH[idx]) change(active, idx);
  gnbTheme(f, sy);
  dirty = false;
  requestAnimationFrame(frame);
}

/* ================= 연도 구간 스크롤 =================
   스크롤을 멈춘 뒤 가까운 연도로 끌어당기던 자동 맞춤은 흐름을 끊어 없앴다.
   오른쪽 블록과 연도 숫자는 스크롤 위치를 그대로 따라 이어서 움직인다. (방향키·다이얼 이동은 그대로) */
let dragging = false;
const stops = () => { const b = storyTop(); return [b + WE, ...CH.map((_, i) => b + chStart + i * step)]; };
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
addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
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
  if (e.key === 'Home') { e.preventDefault(); goTo(0); }          // 슬라이더 기본 키: 처음·마지막 연도
  if (e.key === 'End') { e.preventDefault(); goTo(n - 1); }
});

// 창 크기 조절 중 연속으로 들어오는 resize를 한 프레임에 한 번만 처리
let resizeId = null;
addEventListener('resize', () => {
  if (resizeId !== null) return;
  resizeId = window.requestAnimationFrame(() => { resizeId = null; if (!disposed) layout(); });
});
document.fonts?.ready.then(() => { if (!disposed) layout(); });
layout();
setYear(CH[0].year);
if (reduced || scrollY > innerHeight * 0.5) skipIntro();
requestAnimationFrame(frame);

/* ================= 다가오는 먼지 (#0e0d0d 배경용) =================
   별 같은 고운 입자들이 화면 가운데(먼 곳)에서 생겨나 바깥쪽(가까운 곳)으로 천천히 다가옴.
   가운데에선 작고 흐리게 나타나, 바깥으로 갈수록 빨라지고 커지며 조금씩 밝아지다가 화면 밖으로 빠져나가고, 빠져나간 입자는 다시 가운데에서 생김.
   다가오는 동안 입자마다 밝기가 은은하게 반짝임.
   화면 1920×1080 기준 약 70점, 작고 은은하게. */
let dustFxId = null;
(() => {
  const cv = $('filmdust');
  if (!cv || reduced) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, R = 1, last = 0, specks = [];
  const spawn = (fresh) => {
    const r = R * (fresh ? 0.03 + Math.random() * 0.97 : 0.02 + Math.random() * 0.12);   // 처음엔 곳곳에, 이후엔 가운데 근처에서 생김
    return { ang: Math.random() * 6.283, r, spin: (Math.random() - 0.5) * 0.04,             // 아주 살짝 소용돌이
      size: 1 + Math.random() * 1.4, a: 0.5 + Math.random() * 0.45,
      v: 0.06 + Math.random() * 0.08, born: fresh ? 1 : 0,       // v: 1초에 현재 거리의 6~14%씩 멀어짐(바깥으로 갈수록 빨라짐)
      tw: Math.random() * 6.283, tws: 2 + Math.random() * 4 };    // 반짝임 위상·속도
  };
  const fit = () => {
    const w = innerWidth, h = innerHeight;
    if (w === W && h === H) return;
    W = cv.width = w; H = cv.height = h; R = Math.hypot(w, h) / 2;
    const n = Math.round(70 * (w * h) / (1920 * 1080));
    specks = Array.from({ length: n }, () => spawn(true));
  };
  const tick = now => {
    dustFxId = window.requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (document.hidden) return;
    fit();
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    for (let k = 0; k < specks.length; k++) {
      const p = specks[k];
      p.r += p.r * p.v * dt + R * 0.003 * dt;                     // 바깥으로 다가옴 (가운데서도 멈춰 있지 않게 최소 속도 더함)
      p.ang += p.spin * dt;
      p.born = Math.min(1, p.born + dt / 1.5);                     // 생길 때 1.5초에 걸쳐 서서히 나타남
      const depth = p.r / R;                                       // 0이면 가운데(멂), 1이면 가장자리(가까움)
      if (depth > 1.05) { specks[k] = spawn(false); continue; }
      p.tw += p.tws * dt;
      const twinkle = 0.72 + 0.28 * Math.sin(p.tw) * Math.sin(p.tw * 0.37 + 1.3);   // 다가오는 동안 은은하게 반짝임
      ctx.globalAlpha = p.a * p.born * Math.min(1, 0.25 + depth) * twinkle;  // 가까워질수록 조금씩 밝아짐
      ctx.beginPath();
      ctx.arc(cx + Math.cos(p.ang) * p.r, cy + Math.sin(p.ang) * p.r, p.size * (0.35 + 0.65 * depth), 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  dustFxId = window.requestAnimationFrame(tick);
})();

 return () => {
  disposed = true;
  controller.abort();
  window.cancelAnimationFrame(frameId);
  if (resizeId !== null) window.cancelAnimationFrame(resizeId);
  if (dustFxId !== null) window.cancelAnimationFrame(dustFxId);
  timers.forEach(window.clearTimeout);
  root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  if (header) {
    delete header.dataset.historyTheme; delete header.dataset.historyHidden;
    header.querySelectorAll('nav a').forEach(a => { delete a.dataset.gnb; delete a.dataset.gnbSnap; delete a.dataset.text; });
  }
 };
}
