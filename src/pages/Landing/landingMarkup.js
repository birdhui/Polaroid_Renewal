/**
 * Landing 마크업 (프로토타입과 동일한 구조).
 * 화면 엔진이 클래스·id 로 요소를 찾아 직접 움직이므로, 마운트할 때마다 이 문자열로 새로 그린다
 * (StrictMode 의 두 번 마운트·페이지 재진입에도 처음 상태에서 시작).
 */
export const LANDING_MARKUP = String.raw`
<canvas id="bg"></canvas>
<div class="wordmark" aria-hidden="true"><img src="/assets/landing/polaroid-wordmark-1824.webp" srcset="/assets/landing/polaroid-wordmark-912.webp 912w, /assets/landing/polaroid-wordmark-1824.webp 1824w, /assets/landing/polaroid-wordmark-2736.webp 2736w" sizes="(max-width: 768px) 86vw, 47.5vw" alt="" width="912" height="250" decoding="async" fetchpriority="high"></div>
<canvas id="three"></canvas>
<canvas id="gl"></canvas>
<div class="ui" lang="en">
  <h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Polaroid Now Gen 3 — There is only one</h1>
  <div class="rail">
    <p class="cue" data-r style="--d:7">SCROLL</p>
    <div class="col">
      <section class="info">
        <h2 data-r style="--d:1">THERE IS ONLY ONE</h2>
        <p class="body" data-r style="--d:2">No negative. No file. No undo.<br>You press the button, the picture slides out, and<br>that’s the only one there will ever be.</p>
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
<section class="story" aria-label="Capture the Moment, Keep the Memory.">
  <h3>Capture the Moment,<br>Keep the Memory.</h3>
  <p>우리는 순간을 기록하는 것에서 그치지 않습니다.<br>지나간 시간을 손에 남는 사진으로,<br class="mb"> 한 장의 기록을 오래도록 간직할 기억으로.<br>폴라로이드는 순간의 가치를 이어갑니다.</p>
</section>
<section class="hist" aria-label="Polaroid history">
  <p class="since">Since</p>
  <div class="year" aria-label="year"></div>
  <div class="draw"><svg aria-hidden="true"></svg></div>
  <p class="model"></p>
  <div class="tblk hlw"><p class="hl hl1">이어온 시간을 지나,</p><p class="hl hl2">당신의 NOW로</p></div>
  <div class="tblk cc"><p class="cname">pebble white</p><h2 class="ctitle">choose your color,<br>your now</h2></div>
</section>
<div class="zghost-wrap" aria-hidden="true"><img class="zghost" src="/assets/landing/polaroid-wordmark-1824.webp" alt=""><p class="zadj"><span class="zadj-a"></span><span class="zadj-t">DEVELOPED</span><span class="zadj-g">DEVELOPED</span></p></div>
<section class="zx zx-back" aria-hidden="true">
  <p class="zl zsub-l"><span class="zi zsub" style="transition-delay:.2s">ONE PRESS<i></i>ONE PRINT</span></p>
</section>
<section class="zx zx-front" aria-label="Fifteen minutes, one memory">
  <p class="zl zd-1"><span class="zi zd" style="transition-delay:0s"><span class="zfp"><span class="zg zg1 r" aria-hidden="true">FIFTEEN</span><span class="zg zg1 c" aria-hidden="true">FIFTEEN</span><span class="zcnt">ZERO</span><span class="zw2 zcnt2">ONE</span></span></span></p>
  <p class="zl zd-2"><span class="zi zd" style="transition-delay:.1s"><span class="zfp"><span class="zg r" aria-hidden="true">MINUTES</span><span class="zg c" aria-hidden="true">MINUTES</span><span class="zw">MINUTES</span><span class="zw2 zmem">MEMORY</span></span></span></p>
  <p class="zl zb-l"><span class="zi zb" style="transition-delay:.3s">EVERY PRINT SLIDES OUT BLANK AND DEVELOPS IN TEN TO FIFTEEN MINUTES,<br>SO THE MOMENT YOU TOOK BECOMES A MEMORY YOU CAN HOLD.</span></p>
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
  <div class="fstack" aria-hidden="true"><img src="/assets/landing/prints/print-01.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-02.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-03.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-04.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-05.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-06.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-07.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-08.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-09.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-10.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-11.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-12.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-13.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-14.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-15.webp" alt="" decoding="async"><img src="/assets/landing/prints/print-16.webp" alt="" decoding="async"></div>
  <p class="fw fw1">Make</p><p class="fw fw2">a Moment</p><p class="fw fw3">Last</p><p class="fw fwx" aria-hidden="true">a Memory</p>
</section>
<div id="track"></div>

<div class="hud" lang="en" aria-hidden="true">
  <p class="brand">POLAROID <span class="rainbow"></span></p>
  <p class="state" id="state">LOADING...</p>
  <div class="corners"><i></i><i></i><i></i><i></i></div>
  <div class="focus"></div>
  <div class="scale" id="scale"></div>
  <p class="read"><span>f 2.0</span><span class="pct" id="pct">0%</span><span>1/60</span></p>
</div>
<div class="boot"></div>


<video id="video" data-src="/assets/landing/hero.mp4" poster="/assets/landing/hero-poster.jpg" muted loop playsinline preload="none" style="display:none"></video>

<button class="sndfix off" type="button" aria-pressed="false" aria-label="Sound"><span class="snd-in">Sound <i aria-hidden="true"><b></b><b></b><b></b></i></span></button>
`;
