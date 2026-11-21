import { useLayoutEffect, useRef } from 'react';
import styles from './HistoryPage.module.css';
import { initHistoryStory } from './historyStory.js';
import { asset3, asset4, asset5, asset6, asset7, asset8, asset9 } from './storyAssets.js';

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
<div className="frame" id="heroFrame">
<div className="ph" data-kind="car" data-x="132" data-y="181" data-w="352" data-h="352" data-f="1"><div className="card"><img src={asset3} alt="차창 너머의 꽃을 든 사람" /></div></div>
<div className="ph" data-kind="camera" data-x="1173" data-y="140" data-w="191" data-h="185" data-f="1"><div className="card"><img src={asset4} alt="손에 든 폴라로이드 카메라" /></div></div>
<div className="ph" data-kind="dinner" data-x="1404" data-y="392" data-w="384" data-h="512" data-f="1"><div className="card"><img src={asset5} alt="함께한 저녁 식사" /></div></div>
<div className="ph" data-kind="sunset" data-x="322" data-y="698" data-w="319" data-h="243" data-f="1"><div className="card"><img src={asset6} alt="창밖으로 바라본 노을" /></div></div>
<div className="origin" id="origin"><p className="origin-since">{"Since"}</p><h1 className="origin-year">{"1937"}</h1></div>
<div className="memory-copy" id="memoryCopy"><h2 className="memory-title">{"The Act of Creating Memories"}</h2><p className="memory-body">{"찍은 사진을 바로 보고 싶었던 작은 바람에서 오늘에 이르기까지,"}<br />{"폴라로이드는 함께 찍고, 기다리고, 마주 보는 시간을 통해 사진 너머의 추억을 만들어왔습니다."}</p></div>
</div>
<div className="scroll-cue" id="cue">{"SCROLL"}</div>
</div>
<div className="scene film" id="sFilm">
<div className="glow"></div>
<div className="frame">
<div className="still"><img src={asset7} alt="폴라로이드 카메라로 사진을 찍는 사람" /><i className="dim"></i></div>
</div>
<div className="film-titles">
<p className="big l"><span className="ln"><span className="w">{"A"}</span>
<span className="w">{"day"}</span>
<span className="w">{"we"}</span>
<span className="w">{"spent"}</span></span><span className="ln"><span className="w">{"together."}</span></span></p>
<p className="big r"><span className="ln"><span className="w">{"Years"}</span>
<span className="w">{"later,"}</span></span><span className="ln"><span className="w">{"one"}</span>
<span className="w">{"photograph"}</span>
<span className="w">{"takes"}</span>
<span className="w">{"us"}</span>
<span className="w">{"back."}</span></span></p>
</div>
</div>
<div className="pre" id="pre"><p>{"지나간 순간을, 손에 남는 한 장으로"}</p></div>
<div className="flash" id="flash"><img src={asset8} width="1604" height="1604" alt="" /></div>
<div className="pop" id="pop"></div>
<div className="ivory" id="ivory"></div>
<div className="intro" id="intro"><p className="quote">{"Why can’t I see the picture"}<br />{"right now?"}</p></div>
<div className="hist" id="hist" data-year="1937">
<div className="dial" id="dial" role="slider" tabIndex="0" aria-label="연도 다이얼"><div className="ticks" id="ticks"></div><div className="yr" id="yr"></div></div>
<div className="row" id="row">
<div className="txt">
<div className="stack" id="titles"></div>
<div className="rule" id="rule"><img id="ruleAsset" alt="" width="520" height="1" /></div>
<div className="stack" id="bodies"></div>
</div>
<div className="pics stack" id="pics"></div>
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
<p><span>{"즉석사진의 탄생부터, 멈췄던 필름이 다시 만들어지기까지."}</span><span>{"폴라로이드가 이어온 여정은"}</span><span>{"오늘 당신이 남기는 한 장의 사진으로 계속됩니다."}</span></p>
</div>
</div>
</section>

</section>;
}
