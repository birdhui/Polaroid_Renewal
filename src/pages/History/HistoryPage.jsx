import { useLayoutEffect, useRef } from 'react';
import styles from './HistoryPage.module.css';
import { initHistoryStory } from './historyStory.js';
import { asset7, asset8, asset9, asset32, asset33, asset34, asset35 } from './storyAssets.js';

export default function HistoryPage() {
 const root = useRef(null);
 useLayoutEffect(() => initHistoryStory(root.current), []);
 return <section ref={root} className={styles.page} aria-label="Polaroid History">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&amp;family=DM+Sans:opsz,wght@9..40,500&amp;display=swap" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

<section className="pin" id="story">
<div className="stage" id="stage">
<div className="glow"></div>
<div className="scene" id="sHero">
<div className="frame origin" id="origin"><p className="origin-since">{"Since"}</p><h1 className="origin-year">{"1937"}</h1></div>
<div className="frame" id="heroFrame">
<div className="ph" data-x="174" data-y="232" data-w="272" data-h="335" data-depth="0.6" data-rot="-3" data-start="0.05"><div className="card"><img src={asset32} alt="서점에서 손을 맞잡은 두 사람의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="1102" data-y="154" data-w="161" data-h="194" data-depth="0.25" data-rot="2.5" data-start="0.2"><div className="card"><img src={asset34} alt="카페 거울에 비친 사람의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="1389" data-y="401" data-w="357" data-h="432" data-depth="0.9" data-rot="2" data-start="0.32"><div className="card"><img src={asset35} alt="거리 카페에 마주 앉은 두 사람의 폴라로이드 사진" /></div></div>
<div className="ph" data-x="480" data-y="698" data-w="183" data-h="228" data-depth="0.45" data-rot="-2.5" data-start="0.44"><div className="card"><img src={asset33} alt="다리 위에서 마주 보는 두 사람의 폴라로이드 사진" /></div></div>
</div>
<div className="moments-copy" id="momentsCopy"><h2>{"폴라로이드가 순간을 간직하는 방식"}</h2><p>{"소중한 사람과 그 순간을 직접 찍고, 기다리고, 손에 쥐는 과정."}<br />{"우리는 디지털 이미지와는 다른 방식으로 실제 경험과 기억을 남겨왔습니다."}</p></div>
<div className="scroll-cue" id="cue">{"SCROLL"}</div>
</div>
<div className="scene film" id="sFilm">
<div className="glow"></div>
<div className="frame">
<div className="still"><img src={asset7} alt="폴라로이드 카메라로 사진을 찍는 사람" /><i className="dim"></i></div>
</div>
<div className="film-titles">
<p className="big l"><span className="ln"><span className="w">{"A"}</span>{" "}
<span className="w">{"day"}</span>{" "}
<span className="w">{"we"}</span>{" "}
<span className="w">{"spent"}</span></span><span className="ln"><span className="w">{"together."}</span></span></p>
<p className="big r"><span className="ln"><span className="w">{"Years"}</span>{" "}
<span className="w">{"later,"}</span></span><span className="ln"><span className="w">{"one"}</span>{" "}
<span className="w">{"photograph"}</span>{" "}
<span className="w">{"takes"}</span>{" "}
<span className="w">{"us"}</span>{" "}
<span className="w">{"back."}</span></span></p>
</div>
</div>
<div className="pre" id="pre"><div className="pre-a" id="preA"><h2>{"작은 바램에서 시작해, 우리의 일상으로"}</h2><p>{"찍은 사진을 바로 보고 싶다는 작은 바램에서 폴라로이드의 이야기가 시작됐습니다."}<br />{"오늘도 폴라로이드는 우리의 일상 속 한순간을 한 장의 사진으로 남깁니다."}</p></div></div>
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
<p className="marq" id="marq">{"“Don’t undertake a project unless it’s manifestly important, and nearly impossible.”"}</p>
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
