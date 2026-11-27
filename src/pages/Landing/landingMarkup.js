/**
 * Landing 마크업 (프로토타입과 동일한 구조).
 * 화면 엔진이 클래스·id 로 요소를 찾아 직접 움직이므로, 마운트할 때마다 이 문자열로 새로 그린다
 * (StrictMode 의 두 번 마운트·페이지 재진입에도 처음 상태에서 시작).
 */
export const LANDING_MARKUP = String.raw`
<canvas id="bg"></canvas>
<div class="desk" aria-hidden="true"><i class="dk-img"></i><i class="dk-blur"></i><i class="dk-dim"></i><i class="dk-win"></i><canvas class="dk-cam"></canvas><i class="dk-vig"></i></div>
<div class="dkfx dkfx-a" aria-hidden="true"><i></i></div>
<div class="wordmark" aria-hidden="true"><img src="/assets/landing/polaroid-wordmark-1824.webp" srcset="/assets/landing/polaroid-wordmark-912.webp 912w, /assets/landing/polaroid-wordmark-1824.webp 1824w, /assets/landing/polaroid-wordmark-2736.webp 2736w" sizes="(max-width: 768px) 86vw, 47.5vw" alt="" width="912" height="250" decoding="async" fetchpriority="high"></div>
<canvas id="three"></canvas>
<canvas id="gl"></canvas>
<div class="ui" lang="en">
  <h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Polaroid Now Gen 3 — There is only one</h1>
  <p class="eyebrow" data-r style="--d:0">I-TYPE &amp; 600<i>/</i>AUTOFOCUS<i>/</i>USB-C</p>
  <div class="rail">
    <p class="cue" data-r style="--d:7">SCROLL</p>
    <div class="col">
      <section class="info">
        <h2 data-r style="--d:1">THERE IS ONLY ONE</h2>
        <p class="body" data-r style="--d:2">No negative. No file. No undo.<br> You press the button, the picture slides out, and<br> that’s the only one there will ever be.</p>
        <hr data-r style="--d:3">
        <p class="cta" data-r style="--d:4"><span class="take">Take</span> one ↓</p>
      </section>
      <div class="meta">
        <div data-r style="--d:5"><b>Polaroid Now Gen 3</b><span>i-Type &amp; 600 film · two-lens autofocus · USB-C</span></div>
        <p class="sound off" data-r style="--d:6" role="button" tabindex="0" aria-pressed="false" aria-label="Sound"><span class="snd-in">Sound <i aria-hidden="true"><b></b><b></b><b></b></i></span></p>
      </div>
    </div>
  </div>
  <nav class="wheel" id="wheel" aria-label="sections"><div class="trk" id="wheelTrk"></div></nav>
</div>
<div class="flash-veil" aria-hidden="true"><i></i></div>
<section class="story" aria-label="From Moment to Memory">
  <h3>From Moment to Memory</h3>
  <p>지나가는 순간을, 손에 남는 한 장으로.<br>폴라로이드는 그 한 장을 오래 간직할 기억으로 이어갑니다.</p>
</section>
<section class="hist" aria-label="Polaroid history">
  <p class="since">Since</p>
  <div class="year" aria-label="year"></div>
  <div class="draw"><svg aria-hidden="true"></svg></div>
  <p class="model"></p>
  <div class="tblk hlw"><p class="hl hl1">이어온 시간을 지나,</p><p class="hl hl2">당신의 NOW로</p></div>
  <div class="tblk cc"><p class="cname">pebble white</p><h2 class="ctitle">choose your color,<br>your now</h2></div>
</section>
<div class="zghost-wrap" aria-hidden="true"><img class="zghost" src="/assets/landing/polaroid-wordmark-1824.webp" alt=""><p class="zadj"><span class="zadj-a"></span><span class="zadj-t">NOW</span><span class="zadj-g">NOW</span></p><p class="dvcap l">Polaroid Now<br>Gen 3</p><p class="dvcap r">Two-Lens<br>Autofocus</p></div>
<section class="zx zx-back" aria-hidden="true">
  <p class="zl zsub-l"><span class="zi zsub" style="transition-delay:.2s">ONE PRESS<i></i>ONE PRINT</span></p>
</section>
<section class="zx zx-front" aria-label="Fifteen minutes, one memory">
  <p class="zl zd-1"><span class="zi zd" style="transition-delay:0s"><span class="zfp"><span class="zg zg1 r" aria-hidden="true">FIFTEEN</span><span class="zg zg1 c" aria-hidden="true">FIFTEEN</span><span class="zcnt">ZERO</span><span class="zw2 zcnt2">ONE</span></span></span></p>
  <p class="zl zd-2"><span class="zi zd" style="transition-delay:.1s"><span class="zfp"><span class="zg r" aria-hidden="true">MINUTES</span><span class="zg c" aria-hidden="true">MINUTES</span><span class="zw">MINUTES</span><span class="zw2 zmem">MEMORY</span></span></span></p>
  <p class="zl zb-l"><span class="zi zb" style="transition-delay:.3s">EVERY PRINT SLIDES OUT BLANK<br class="zmb"> AND DEVELOPS IN TEN TO FIFTEEN MINUTES,<br>SO THE MOMENT YOU TOOK<br class="zmb"> BECOMES A MEMORY YOU CAN HOLD.</span></p>
</section>
<div class="parts-img" aria-hidden="true"><div class="pimg"></div></div>
<section class="parts" aria-label="Polaroid Now Gen 3 parts">
  <div class="pleft"><h2 class="pname pfade">Now Gen 3</h2><p class="plabel pfade"></p><p class="pdesc pfade"></p><p class="pcount pfade"></p></div>
  <span class="px pfade" aria-hidden="true">×</span>
  <div class="plist"><i class="pline t pfade"></i><i class="pline b pfade"></i><div class="ptrk"></div></div>
  <div class="pscrim pfade"></div><div class="pmob"><div class="pmrow pfade"><span class="pmword"></span><span class="pmcount"></span></div></div>
</section>
<section class="msg" aria-label="Make a Moment Last">
  <p class="mlines"><span class="ml mo">Every print starts as a second that slips away.</span><span class="ml"><span class="mo mpre">Press once and </span><span class="mk">Make</span><span class="mo"> </span><span class="mk">a Moment</span><span class="mo"> </span><span class="mk">Last</span><span class="mo">,</span><span class="mo mrest"> a print to hold,</span></span><span class="ml mo">keep close, and pass on to someone you love.</span></p>
</section>
<section class="film" aria-label="Make a Moment Last">
  <div class="fstack" aria-hidden="true"><img data-src="/assets/landing/film/film-01.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-02.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-03.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-04.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-05.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-06.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-07.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-08.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-09.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-10.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-11.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-12.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-13.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-14.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-15.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-16.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-17.webp" alt="" decoding="async"><img data-src="/assets/landing/film/film-18.webp" alt="" decoding="async"></div>
  <p class="fw fw1">Make</p><p class="fw fw2">a Moment</p><p class="fw fw3">Last</p><p class="fw fwx" aria-hidden="true">a Memory</p>
</section>
<div id="track"></div>

<div class="hud" lang="en" aria-hidden="true">
  <p class="brand">POLAROID</p>
  <p class="state" id="state" hidden>LOADING...</p>
  <div class="corners"><i></i><i></i><i></i><i></i></div>
  <div class="focus"></div>
  <div class="scale" id="scale"></div>
  <p class="read"><span>f 11</span><span class="pct" id="pct">0%</span><span>AUTO</span></p>
</div>
<div class="boot"></div>

<video id="video" muted loop playsinline preload="none" style="display:none"></video>   

<div class="dv-burst" aria-hidden="true"></div>
<canvas class="dv-fx" aria-hidden="true"></canvas>
<div class="shot-white" aria-hidden="true"></div>
<section class="shot" aria-label="Shot — frame it yourself">
  <div class="sh-bg" aria-hidden="true"></div>
  <div class="sh-glow" aria-hidden="true"></div>
  <div class="sh-vf">
    <div class="sh-in" role="img" aria-label="Viewfinder">
      <canvas class="sh-cv"></canvas>
      <div class="sh-flash"></div>
      <div class="sh-brk" aria-hidden="true"><i></i><i></i><i></i><i></i><b>][</b></div>
      <p class="sh-ss" aria-live="polite">1/125</p>
      <div class="sh-ghost" aria-hidden="true"></div>
      <div class="sh-zoom sh-modes" role="group" aria-label="촬영 모드">
        <button type="button" data-m="flash" class="on" aria-pressed="true" aria-label="플래시"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2.5 5.5 13.5h5l-1.2 8 8.2-11.2h-5.2z" fill="currentColor"/></svg></button>
        <button type="button" data-m="timer" aria-pressed="false" aria-label="셀프타이머"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.8M9.5 3h5"/></svg></button>
        <button type="button" data-m="dbl" aria-pressed="false" aria-label="다중 노출"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="12" height="12" rx="1.5"/><rect x="8.5" y="8.5" width="12" height="12" rx="1.5"/></svg></button>
      </div>
    </div>
  </div>
  <div class="sh-thumbs">
    <button type="button" class="on" aria-label="Shot 01"><img data-src="/assets/landing/shot/shot-01.webp" alt=""></button>
    <button type="button" aria-label="Shot 02"><img data-src="/assets/landing/shot/shot-02.webp" alt=""></button>
    <button type="button" aria-label="Shot 03"><img data-src="/assets/landing/shot/shot-03.webp" alt=""></button>
    <button type="button" aria-label="Shot 04"><img data-src="/assets/landing/shot/shot-04.webp" alt=""></button>
  </div>
  <div class="sh-info">
    <p class="sh-st">SHOT <b class="sh-fade">01</b></p>
    <dl class="sh-dl sh-fade">
      <dt>LOCATION</dt><dd data-k="loc"></dd><dt>DATE</dt><dd data-k="date"></dd><dt>TIME</dt><dd data-k="time"></dd>
      <dt>CAMERA</dt><dd data-k="cam"></dd><dt>FILM</dt><dd data-k="film"></dd>
    </dl>
    <div class="sh-hr"></div>
    <p class="sh-tag">EVERYONE SEES<br>THIS SCENE.<br>YOU FRAME IT.</p>
  </div>
  <div class="sh-bar">
    <button type="button" class="sh-help"><i>?</i><span lang="ko">사용 방법</span></button>
    <div class="sh-dial" aria-hidden="true"><div class="tri"></div><div class="tk"></div><div class="nums"></div></div>
    <div class="sh-left"><span class="lt"><b>8</b> LEFT</span><span class="dots"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
    <button type="button" class="sh-new"><i>↻</i>NEW PACK</button>
  </div>
  <div class="sh-tut" role="dialog" aria-label="사용 방법" lang="ko">
    <div class="tp"><span class="n">01 / 04</span><span class="pg"><i></i><i></i><i></i><i></i></span></div>
    <h3></h3>
    <div class="ic"></div>
    <p class="tx"></p>
    <p class="hint">직접 해보거나 <b>다음</b>을 누르세요</p>
    <div class="bt"><button type="button" class="skip">건너뛰기</button><button type="button" class="next">다음 →</button></div>
  </div>
</section>
<section class="ysf" aria-label="Your Style, Your Film">
  <div class="ys-prints" aria-hidden="true"></div>
  <div class="ys-copy"><h2>Your Style, Your Film</h2><p class="ys-sub">같은 순간도 저마다 다른 모습으로 남습니다.<br>폴라로이드는 그 기억을 당신의 취향으로 담습니다.</p></div>
</section>
<section class="gal"><h2 class="tl-head"><span class="ey" lang="en">1990 — 2026</span><span class="tt"><span>다시 오지 않는 날을,</span><span>다시 꺼내 볼 수 있도록.</span></span></h2><div class="tl-row" aria-hidden="true"></div><div class="tl-dial" aria-hidden="true"><canvas></canvas></div></section>
<div class="finbg" aria-hidden="true"></div>
<section class="fin" aria-label="지나가는 순간을, 손에 남는 한 장으로.">
  <h2 class="fin-t">지나가는 순간을, 손에 남는 한 장으로.</h2>
  <p class="fin-l">Some moments are too precious to fade. <br>Polaroid turns fleeting memories into timeless <br>stories we hold close forever.</p>
  <ul class="fin-r"><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.6"/></svg>Capture the Moment</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.6"/></svg>Feel the Emotion</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.6"/></svg>Make Memories Last</li></ul>
</section>
<button class="sndfix off" type="button" aria-pressed="false" aria-label="Sound"><span class="snd-in">Sound <i aria-hidden="true"><b></b><b></b><b></b></i></span></button>
`;
