import { useLayoutEffect, useRef } from 'react';
import { preconnect } from 'react-dom';
import styles from './HistoryPage.module.css';
import { initHistoryStory } from './historyStory.js';
import { filmVideo, filmPoster, asset8, asset9, momentGrandma, momentKid, momentRaincoat, momentFamily } from './storyAssets.js';

export default function HistoryPage() {
 const root = useRef(null);
 // 웹폰트 서버와 미리 연결해 첫 글자 표시를 앞당김
 preconnect('https://fonts.googleapis.com');
 preconnect('https://fonts.gstatic.com', { crossOrigin: 'anonymous' });
 preconnect('https://cdn.jsdelivr.net', { crossOrigin: 'anonymous' });
 useLayoutEffect(() => initHistoryStory(root.current), []);
 return <section ref={root} className={styles.page} aria-label="Polaroid History">
{/* Outfit은 실제 쓰는 굵기(200·300·400·500·600·700)만, Pretendard는 화면에 나온 글자만 받는 dynamic subset으로 불러옴 */}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&amp;family=DM+Sans:opsz,wght@9..40,500&amp;display=swap" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css" />

<section className="pin" id="story">
<div className="stage" id="stage">
<div className="glow"></div>
<div className="scene" id="sHero">
<div className="frame origin" id="origin"><p className="origin-since">{"Since"}</p><h1 className="origin-year">{"1937"}</h1></div>
<div className="frame" id="heroFrame">
<div className="ph" data-x="464.95" data-y="490.71" data-w="244.57" data-h="293.48" data-rot="1.77" data-fx="-90" data-fy="60" data-frot="-4" data-start="0.2"><div className="card" style={{ '--m': `url(${momentKid})` }}><img src={momentKid} alt="카메라를 들고 있는 아이의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="709.36" data-y="519.42" data-w="244.57" data-h="293.48" data-rot="-3.36" data-fx="-40" data-fy="80" data-frot="3" data-start="0.38"><div className="card" style={{ '--m': `url(${momentFamily})` }}><img src={momentFamily} alt="거실에서 함께 웃는 가족의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="953.78" data-y="490.27" data-w="244.57" data-h="293.48" data-rot="0" data-fx="40" data-fy="80" data-frot="-3" data-start="0.56"><div className="card" style={{ '--m': `url(${momentRaincoat})` }}><img src={momentRaincoat} alt="노란 레인코트를 입고 폴라로이드 카메라를 든 사람의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="1201.22" data-y="514.85" data-w="244.57" data-h="293.48" data-rot="5.74" data-fx="90" data-fy="60" data-frot="4" data-start="0.74"><div className="card" style={{ '--m': `url(${momentGrandma})` }}><img src={momentGrandma} alt="할머니를 안고 있는 아이의 폴라로이드 사진" /></div></div>
</div>
<div className="moments-copy" id="momentsCopy"><h2>{"The way we hold onto moments."}</h2><p>{"소중한 사람과 그 순간을 직접 찍고, 기다리고, 손에 쥐는 과정"}{" "}<br />{"우리는 디지털 이미지와는 다른 방식으로 실제 경험과 기억을 남겨왔습니다."}</p></div>
<div className="scroll-cue" id="cue">{"SCROLL"}</div>
</div>
<div className="scene film" id="sFilm">
<div className="frame">
<div className="still"><video src={filmVideo} poster={filmPoster} muted loop playsInline preload="metadata" aria-label="폴라로이드로 순간을 담는 모습의 영상" tabIndex={-1}></video><i className="dim"></i></div>
</div>
<div className="film-titles">
<p className="big l"><span className="ln"><span className="w">{"A"}</span>{" "}
<span className="w">{"day"}</span>{" "}
<span className="w">{"we"}</span>{" "}
<span className="w">{"spent"}</span>{" "}
<span className="w">{"together."}</span></span><span className="ln"><span className="w">{"You"}</span>{" "}
<span className="w">{"laughed,"}</span>{" "}
<span className="w">{"and"}</span>{" "}
<span className="w">{"I"}</span>{" "}
<span className="w">{"pressed"}</span>{" "}
<span className="w">{"the"}</span>{" "}
<span className="w">{"shutter."}</span></span><span className="ln"><span className="w">{"We"}</span>{" "}
<span className="w">{"waited"}</span>{" "}
<span className="w">{"for"}</span>{" "}
<span className="w">{"the"}</span>{" "}
<span className="w">{"picture"}</span>{" "}
<span className="w">{"to"}</span>{" "}
<span className="w">{"appear."}</span></span></p>
<p className="big r"><span className="ln"><span className="w">{"Years"}</span>{" "}
<span className="w">{"later,"}</span>{" "}
<span className="w">{"I"}</span>{" "}
<span className="w">{"still"}</span>{" "}
<span className="w">{"have"}</span>{" "}
<span className="w">{"that"}</span>{" "}
<span className="w">{"photograph."}</span></span><span className="ln"><span className="w">{"When"}</span>{" "}
<span className="w">{"I"}</span>{" "}
<span className="w">{"hold"}</span>{" "}
<span className="w">{"it,"}</span>{" "}
<span className="w">{"I"}</span>{" "}
<span className="w">{"can"}</span>{" "}
<span className="w">{"almost"}</span>{" "}
<span className="w">{"hear"}</span>{" "}
<span className="w">{"you"}</span>{" "}
<span className="w">{"laughing"}</span>{" "}
<span className="w">{"again."}</span></span></p>
</div>
</div>
<div className="pre" id="pre"><div className="pre-a" id="preA"><h2>{"It Began with a Wish"}</h2><p>{"찍은 사진을 바로 보고 싶다는 작은 바람에서 오늘의 폴라로이드가 있기까지."}</p></div></div>
<div className="flash" id="flash"><img src={asset8} width="1604" height="1604" alt="" /></div>
<div className="pop" id="pop"></div>
<div className="ivory" id="ivory"></div>
<div className="intro" id="intro"><p className="quote" id="quote">{"“Why can’t I see the picture right now?”"}</p></div>
<div className="hist" id="hist" data-year="1937">
<div className="dial" id="dial" role="slider" tabIndex="0" aria-label="연도 다이얼"><div className="ticks" id="ticks"></div><div className="yr" id="yr"></div></div>
<div className="row" id="row">
<div className="txt"><div className="stack" id="titles"></div></div>
<div className="col-r"><div className="track" id="track"></div></div>
</div>
</div>
<div className="scene quote-sec" id="sQuote">
<i className="q-grad" id="qGrad"></i>
<div className="frame">
<p className="marq" id="marq" aria-hidden="true">{"“Don’t undertake a project unless it’s manifestly important, and nearly impossible.”"}</p>
<div className="land" id="land"><img src={asset9} alt="SX-70 카메라와 사진을 들어 보이는 에드윈 랜드" /></div>
<p className="q-en" id="qEn">{"“Don’t undertake a project unless it’s manifestly important, and nearly impossible.”"}</p>
<p className="q-kr" id="qKr">{"“정말 중요한 일이라면, 불가능해 보여도 도전하라.”"}<br />{"— Edwin Land · 폴라로이드 창립자"}</p>
</div>
</div>
<div className="scene closing" id="sClose">
<p><span>{"즉석사진의 탄생부터, 멈췄던 필름이 다시 만들어지기까지."}</span><span>{"폴라로이드가 이어온 여정은 오늘 당신이 남기는 한 장의 사진으로 계속됩니다."}</span></p>
</div>
</div>
</section>

</section>;
}
