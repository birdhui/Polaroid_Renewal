import { useLayoutEffect, useRef } from 'react';
import styles from './HistoryPage.module.css';
import { initHistoryStory } from './historyStory.js';
import { asset7, asset8, asset9, asset29, asset30, asset31, asset32, asset33 } from './storyAssets.js';

export default function HistoryPage() {
 const root = useRef(null);
 useLayoutEffect(() => initHistoryStory(root.current), []);
 return <section ref={root} className={styles.page} aria-label="Polaroid History">
{/* 폰트 파일 서버에 미리 연결해 웹폰트 표시를 앞당긴다 (React 19 가 <head> 로 올린다) */}
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700;800&amp;family=DM+Sans:opsz,wght@9..40,500&amp;display=swap" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />

<section className="pin" id="story">
<div className="stage" id="stage">
{/* 1~5번 장면(인트로·제목·필름·문구·섬광) 공통 배경: 왼쪽 아래 따뜻한 빛이 스크롤할수록 진해진다 */}
<div className="glow" aria-hidden="true"><i className="warm" id="warm"></i></div>
<div className="scene" id="sHero">
<div className="frame" id="heroFrame">
{/* 폴라로이드 사진 4장: Figma 1834:4684 의 image 101(왼쪽 위) · 108(오른쪽 위) · 107(오른쪽) · 133(왼쪽 아래)
    원본 이미지의 투명 여백을 뺀 실제 사진 영역 좌표 (1920×1080 기준) */}
<div className="ph" data-x="195.2" data-y="232.1" data-w="269.6" data-h="329"><div className="card"><img src={asset29} alt="책장 앞에서 서로 손을 맞잡은 두 사람의 폴라로이드 사진" width="863" height="1053" fetchPriority="high" decoding="async" /></div></div>
<div className="ph" data-x="1106.7" data-y="151.6" data-w="158.6" data-h="190.5"><div className="card"><img src={asset30} alt="카페 창가에서 카메라를 들고 사진을 찍는 사람의 폴라로이드 사진" width="885" height="1063" fetchPriority="high" decoding="async" /></div></div>
<div className="ph" data-x="1395.4" data-y="397.7" data-w="351.3" data-h="429.5"><div className="card"><img src={asset31} alt="카페 테라스에 마주 앉아 웃는 두 사람의 폴라로이드 사진" width="867" height="1060" fetchPriority="high" decoding="async" /></div></div>
<div className="ph" data-x="417.7" data-y="661.9" data-w="217.5" data-h="271.8"><div className="card"><img src={asset32} alt="강가 다리 위에서 마주 보는 두 사람의 폴라로이드 사진" width="897" height="1121" fetchPriority="high" decoding="async" /></div></div>
</div>
<div className="hero-copy">
{/* 인트로: Figma 1705:3492 — 흐릿한 상태에서 초점이 맞춰지고, 스크롤하면 다시 흐려진다 */}
<p className="hero-mark" id="heroMark" lang="en"><span className="mark-since">{"Since"}</span><span className="mark-year">{"1937"}</span></p>
{/* 이어지는 화면: Figma 1834:4684 — 제목 + 소개 문구, 주변으로 폴라로이드 사진 4장 */}
<div className="yblock" id="yblock"><h1 className="hero-title" id="heroTitle">{"우리가 순간을 간직하는 방식"}</h1>
<p className="sub" id="heroSub">{"소중한 사람과 그 순간을 직접 찍고, 기다리고, 손에 쥐는 과정. "}<br />{"우리는 디지털 이미지와는 다른 방식으로 실제 경험과 기억을 남겨왔습니다."}</p></div>
</div>
<div className="scroll-cue" id="cue" aria-hidden="true">{"SCROLL"}</div>
</div>
<div className="scene film" id="sFilm">
<div className="frame">
<div className="still"><img src={asset7} alt="폴라로이드 카메라로 사진을 찍는 사람" decoding="async" /><i className="dim"></i></div>
</div>
<div className="film-titles" lang="en">
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
<div className="pre" id="pre"><p>{"지나간 순간을, 손에 남는 한 장으로"}</p></div>
<div className="flash" id="flash" aria-hidden="true"><img src={asset8} width="1604" height="1604" alt="" fetchPriority="low" decoding="async" /></div>
<div className="pop" id="pop"></div>
<div className="ivory" id="ivory"></div>
{/* Figma 1834:4671 — 따옴표가 있는 문구, 왼쪽부터 스르르 드러남 */}
<div className="intro" id="intro"><p className="quote" lang="en">{"“Why can’t I see the picture right now?”"}</p></div>
<div className="hist" id="hist" data-year="1937">
<div className="dial" id="dial" role="slider" tabIndex="0" aria-label="연도 다이얼"><div className="ticks" id="ticks"></div><div className="yr" id="yr"></div></div>
{/* Figma 1705:3122 — 왼쪽(고정): The Polaroid Story · 구분선 · 연도 / 오른쪽(연도별 한 묶음으로 흐름): 제목 · 본문 · 사진 */}
<div className="row" id="row">
<div className="txt">
<p className="eyebrow" lang="en">{"The Polaroid Story"}</p>
<div className="rule" id="rule"><img id="ruleAsset" src={asset33} alt="" width="576" decoding="async" /></div>
<div className="stack" id="titles"></div>
</div>
<div className="side stack" id="slides"></div>
</div>
</div>
<div className="scene quote-sec" id="sQuote">
<i className="q-grad" id="qGrad"></i>
<div className="frame">
{/* 흐르는 대형 문구는 아래 인용문(q-en)과 같은 내용이라 스크린 리더에서는 한 번만 읽히게 숨긴다 */}
<p className="marq" id="marq" lang="en" aria-hidden="true">{"“Don’t undertake a project unless it’s manifestly important, and nearly impossible.”"}</p>
<div className="land" id="land"><img src={asset9} alt="SX-70 카메라와 사진을 들어 보이는 에드윈 랜드" fetchPriority="low" decoding="async" /></div>
<p className="q-en" id="qEn" lang="en">{"“Don’t undertake a project unless it’s manifestly important, and nearly impossible.”"}</p>
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
