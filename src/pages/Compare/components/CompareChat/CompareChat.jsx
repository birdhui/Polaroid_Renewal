import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import micIcon from '@/assets/compare/icons/chat-mic.svg';
import sendIcon from '@/assets/compare/icons/chat-send.svg';
import { buildRetryMessage } from '@/pages/Compare/data/compareChatReplies.js';
import { classifyNearest, MAX_ANSWER_LENGTH } from '@/pages/Compare/utils/classifyAnswer.js';
import styles from './CompareChat.module.css';

/**
 * 사용자가 답을 보낸 뒤 챗봇이 답하기까지의 시간(ms) — 시안에 정해진 값이 없어 임시로 둔 값이다.
 * 이 시간 동안 "입력 중" 표시(···)가 보인다.
 */
const BOT_REPLY_DELAY = 700;

/**
 * 안내 문구 순서 — 제목이 한 글자씩 타이핑되고(아래 TYPE_*), 다 쓰이면 설명 글이 아래에서 위로 올라오며, 그 뒤에 첫 질문이 뜬다.
 * INTRO_RISE: 설명 글이 올라오는 시간(CompareChat.module.css 의 --chat-intro-rise 와 같은 값). 거리·곡선도 그쪽 변수에 있다.
 */
const INTRO_RISE = 600;
const INTRO_HOLD = 700; // 설명 글이 다 나타난 뒤 문구를 읽을 수 있게 머무르는 시간(이 뒤에 문구가 사라지고 첫 질문이 나온다)

/**
 * 안내 제목 타이핑 모션 — Framer 'AnimatedTextRotator' 의 Typewriter 를 측정한 값(얇은 막대 커서)을 따르되, 글자당 간격은 레퍼런스(≈65ms)보다 빠르게 45ms 로 잡았다.
 * TYPE_START_DELAY: 섹션이 보인 뒤 첫 글자가 찍히기까지, CURSOR_HOLD: 다 쓴 뒤 커서가 깜빡이며 남아 있는 시간.
 */
const TYPE_INTERVAL = 45;
const TYPE_START_DELAY = 250;
const CURSOR_HOLD = 700;

/**
 * 한 글자씩 타이핑되는 제목. 전체 글자는 보이지 않게 미리 깔아 두어(visibility) 줄바꿈과 가운데 정렬이 타이핑 중에 흔들리지 않는다.
 * 스크린리더에는 완성된 문장을 한 번에 읽어 주고, 모션 감소 설정에서는 바로 완성된 상태로 둔다.
 * 다 쓰이면 onDone 을 한 번 부른다(아래 설명 글이 이어서 나타나는 신호).
 */
function TypewriterTitle({ text, active, onDone }) {
  const chars = Array.from(text);
  const [count, setCount] = useState(0);
  const [cursor, setCursor] = useState(false);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!active) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setCount(chars.length);
      doneRef.current?.();
      return undefined;
    }
    let timer;
    let index = 0;
    setCursor(true);
    const tick = () => {
      index += 1;
      setCount(index);
      if (index < chars.length) {
        timer = setTimeout(tick, chars[index - 1] === ' ' ? TYPE_INTERVAL * 0.6 : TYPE_INTERVAL);
        return;
      }
      doneRef.current?.();
      timer = setTimeout(() => setCursor(false), CURSOR_HOLD);
    };
    timer = setTimeout(tick, TYPE_START_DELAY);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, text]);

  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {chars.slice(0, count).join('')}
        {cursor ? <span className={styles.typeCursor} data-typing={count < chars.length} /> : null}
        <span className={styles.typeRest}>{chars.slice(count).join('')}</span>
      </span>
    </>
  );
}

/**
 * 질문 하나 — 왼쪽에 검정 질문 말풍선, 그 아래 오른쪽 끝에 문장형 답변이 세로로 한 개씩, 맨 아래에 점선 '직접 입력해서 답변하기'.
 * 답변을 고르면 나머지가 먼저 옅어지며 사라지고, 고른 문장만 진한 주황 말풍선으로 질문 아래에 남은 뒤(직접 입력 버튼도 사라진다), 조금 있다가 다음 질문이 아래에 붙는다.
 * 입력창에 직접 써서 답한 질문(viaText)은 선택지를 모두 치우고 보낸 말(오른쪽 주황)만 남긴다.
 */
function ChatStep({ step, first, selectedId, settled, viaText, onChoose, onDirect }) {
  const questionId = useId();
  const stepRef = useRef(null);
  const relBefore = useRef(null); // 누른 답변이 선택지들 사이에 있을 때, 이 단계 위쪽에서부터 떨어져 있던 거리
  const answered = selectedId !== null;
  // 답을 누르면 나머지 선택지는 자리는 그대로 둔 채 옅어져 사라지고, 다음 질문이 붙는 순간(settled)에 한꺼번에 접힌다.
  // 다음 질문이 없는 마지막 단계는 결과 화면으로 넘어갈 때까지 접지 않는다.
  const collapsed = answered && settled;
  const shown = collapsed ? step.options.filter((option) => option.id === selectedId) : step.options;

  const pick = (event, optionId) => {
    relBefore.current = event.currentTarget.getBoundingClientRect().top - stepRef.current.getBoundingClientRect().top;
    onChoose(step.id, optionId);
  };

  // 선택지가 접히면 고른 말풍선이 있던 자리에서 질문 아래로 부드럽게 올라붙는다. (단계 전체가 움직이는 건 FLIP 이 따로 이어 준다)
  useLayoutEffect(() => {
    if (!collapsed || relBefore.current === null) return;
    const before = relBefore.current;
    relBefore.current = null;
    const sent = stepRef.current?.querySelector('[data-sent]');
    if (!sent || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const delta = before - (sent.getBoundingClientRect().top - stepRef.current.getBoundingClientRect().top);
    if (Math.abs(delta) < 1) return;
    const style = getComputedStyle(sent);
    const duration = parseFloat(style.getPropertyValue('--chat-shift-duration')) || 550;
    const easing = style.getPropertyValue('--chat-ease-out').trim() || 'ease-out';
    sent.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration, easing });
  }, [collapsed]);

  const stateOf = (optionId) => (!answered ? undefined : optionId === selectedId ? 'picked' : 'fading');

  return (
    <div ref={stepRef} className={styles.step} data-flip={step.id} data-first={first ? 'true' : 'false'}>
      <p id={questionId} className={first ? `${styles.question} ${styles.firstQuestion}` : styles.question}>
        {step.question}
      </p>
      {viaText ? null : (
        <div className={styles.answers} role="group" aria-labelledby={questionId}>
          {shown.map((option, index) =>
            collapsed ? (
              <p key={option.id} className={`${styles.answer} ${styles.sent}`} data-sent="true">
                {option.answer ?? option.label}
              </p>
            ) : (
              <button
                key={option.id}
                type="button"
                className={styles.answer}
                data-state={stateOf(option.id)}
                style={{ '--i': index }}
                disabled={answered}
                onClick={(event) => pick(event, option.id)}
              >
                {option.answer ?? option.label}
              </button>
            ),
          )}
          {collapsed ? null : (
            <button
              type="button"
              className={styles.direct}
              data-state={answered ? 'fading' : undefined}
              style={{ '--i': step.options.length }}
              disabled={answered}
              onClick={onDirect}
            >
              직접 입력해서 답변하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** 사용자 메시지(주황, 오른쪽)와 챗봇 메시지(검정, 왼쪽). typing 이면 챗봇이 답을 쓰는 중이라는 점 세 개를 보여 준다. */
function ChatMessage({ message, typing = false }) {
  const role = typing ? 'bot' : message.role;
  return (
    <div className={styles.message} data-role={role} data-flip={typing ? 'typing' : message.id}>
      {typing ? (
        <p className={styles.messageText} aria-hidden="true">
          <span className={styles.typingDots}>
            <span />
            <span />
            <span />
          </span>
        </p>
      ) : (
        <p className={styles.messageText}>
          <span className={styles.srOnly}>{role === 'user' ? '나: ' : '챗봇: '}</span>
          {message.text}
        </p>
      )}
    </div>
  );
}

/** 섹션 안의 [data-flip] 요소들의 위쪽 위치(섹션 기준) */
function measureTops(section) {
  const base = section.getBoundingClientRect().top;
  const tops = new Map();
  section.querySelectorAll('[data-flip]').forEach((node) => tops.set(node.dataset.flip, node.getBoundingClientRect().top - base));
  return tops;
}

/**
 * Compare 채팅 섹션 — 베이지 배경 위 흰 카드 안에서 질문(왼쪽 검정 말풍선)과 문장형 답변(오른쪽 세로 정렬)이 쌓이는 채팅 화면.
 * 카드 위쪽에 안내 문구(Let's find your Polaroid.)가 고정돼 있고, 입력창이 화면에 들어오면
 * 카드 위쪽에서 첫 질문 말풍선이 떠오르며, 곧이어 답변 선택지가 오른쪽에 나타난다.
 * 안내 문구는 첫 질문 말풍선이 뜨는 순간 위로 올라가며 사라지고, 말풍선은 안내 문구가 있던 카드 위쪽에서부터 아래로 차례로 쌓인다.
 * 답변은 기본이 연한 주황, 호버·포커스하면 진한 주황이 된다. '직접 입력해서 답변하기'(점선)를 누르면 입력창으로 포커스가 간다.
 * 답을 고르면 고른 문장만 진한 주황 말풍선으로 남고 나머지는 사라지며, 다음 질문이 그 아래에 이어 붙는다.
 * 입력창에 직접 답을 써서 보낼 수도 있다. 보낸 말은 오른쪽(주황)에 나오고, 챗봇이 뜻을 이해하면 중간 반응 없이 바로 다음 질문이 이어진다.
 * 마지막 질문에 답하면 따로 안내 없이 곧바로 추천 결과(로딩)로 넘어간다.
 * 뜻을 정확히 알 수 없으면 임의로 고르지 않고 짧게 다시 묻는다. 선택지 버튼과 직접 입력은 섞어서 쓸 수 있다.
 * 문장 → 선택지 id 변환은 utils/classifyAnswer.js(규칙 기반)가 하며, 추천 규칙은 건드리지 않고 그 id 로 기존 선택 흐름을 그대로 탄다.
 * 대화가 길어지면 말풍선 영역 안에서 스크롤되고, 새 메시지가 나오면 맨 아래로 이동한다.
 * 모션 수치(시간·거리·이징)는 CompareChat.module.css 맨 위 변수에 모여 있다.
 */
export default function CompareChat({ steps, answers, stepIndex, onChoose }) {
  const sectionRef = useRef(null);
  const barRef = useRef(null);
  const stackRef = useRef(null);
  const inputRef = useRef(null);
  const tops = useRef(new Map());
  const titleId = useId();
  // IntersectionObserver 가 없는 환경에서는 바로 시작한다.
  const [entered, setEntered] = useState(() => typeof IntersectionObserver === 'undefined');
  // 안내 제목 타이핑 → 설명 글이 올라옴 → 첫 질문 순서. 한 번 끝나면 다시 하지 않는다.
  const [textOn, setTextOn] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  // 제목 타이핑이 끝나면 설명 글을 올리고, 다 올라온 뒤에 첫 질문을 띄운다.
  const handleTitleDone = () => {
    setTextOn(true);
    setTimeout(() => setIntroDone(true), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : INTRO_RISE + INTRO_HOLD);
  };

  // 입력창이 화면에 들어오기 시작하면 첫 질문을 띄운다. 히어로 아래에 있어서 페이지를 열자마자 끝나 버리지 않게 하려는 것이다.
  // 첫 질문 말풍선은 입력창 바로 위에 뜨므로, 입력창이 조금만 보여도 말풍선은 이미 화면 안에 있다.
  useEffect(() => {
    const bar = barRef.current;
    if (entered || !bar) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -3% 0px' },
    );
    observer.observe(bar);
    return () => observer.disconnect();
  }, [entered]);

  // 자유 입력 대화 — thread: 보낸 말과 챗봇 답변(어느 질문 때 나눈 말인지 stepId 로 붙인다)
  const [thread, setThread] = useState([]);
  const [typing, setTyping] = useState(false);
  const [busyStepIndex, setBusyStepIndex] = useState(null); // 답을 이해해 다음 질문이 뜨기를 기다리는 중
  const [draft, setDraft] = useState('');
  const [textSteps, setTextSteps] = useState({}); // 입력창에 직접 써서 답한 질문들
  const messageSeq = useRef(0);
  const replyTimer = useRef(null);
  const failures = useRef({}); // 질문마다 연달아 분류하지 못한 횟수
  const onChooseRef = useRef(onChoose);

  useEffect(() => {
    onChooseRef.current = onChoose;
  });
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const shownCount = entered && introDone ? stepIndex + 1 : 0;
  const visibleSteps = steps.slice(0, shownCount);
  const currentStep = steps[stepIndex];
  const allAnswered = steps.every((step) => answers[step.id]);
  const busy = typing || busyStepIndex === stepIndex;
  const canSend = entered && introDone && !allAnswered && !busy && draft.trim().length > 0;

  const addMessage = (message) => setThread((prev) => [...prev, { id: `m${messageSeq.current++}`, ...message }]);

  // 선택지 버튼을 누르면 기다리던 챗봇 답변은 취소하고 버튼 선택을 따른다. (버튼과 직접 입력을 섞어 써도 답이 겹치지 않게)
  const handleChoose = (stepId, optionId) => {
    if (replyTimer.current) {
      clearTimeout(replyTimer.current);
      replyTimer.current = null;
      setTyping(false);
    }
    onChoose(stepId, optionId);
  };

  const sendMessage = () => {
    const text = draft.trim().slice(0, MAX_ANSWER_LENGTH);
    if (!text || !canSend) return;

    const step = currentStep;
    const result = classifyNearest(step.id, text);
    addMessage({ stepId: step.id, role: 'user', text });
    setDraft('');
    inputRef.current?.focus();
    // 직접 입력해서 답하면 위의 선택지는 모두 치우고 보낸 말만 남긴다. (뜻을 못 알아들어 되물을 때도 마찬가지)
    setTextSteps((prev) => ({ ...prev, [step.id]: true }));

    // 가장 가까운 선택지로 분류되면(애매해도) 중간 반응 없이 바로 다음 질문(마지막이면 안내 문구)으로 넘어간다.
    if (result.status === 'matched') {
      failures.current[step.id] = 0;
      setBusyStepIndex(stepIndex);
      onChooseRef.current(step.id, result.optionId);
      return;
    }

    // 걸리는 표현이 하나도 없을 때만 임의로 고르지 않고 짧게 다시 묻는다.
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      replyTimer.current = null;
      setTyping(false);
      failures.current[step.id] = (failures.current[step.id] ?? 0) + 1;
      addMessage({ stepId: step.id, role: 'bot', text: buildRetryMessage(step, result, failures.current[step.id]) });
    }, BOT_REPLY_DELAY);
  };

  const handleKeyDown = (event) => {
    // 한글 조합 중에 누른 Enter 는 글자를 확정하는 키라서 전송하지 않는다. Shift+Enter 는 줄바꿈.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    sendMessage();
  };

  const itemCount = visibleSteps.length + thread.length + (typing ? 1 : 0);

  // 말풍선이 적을 땐 위에서부터 쌓여 움직임이 없지만, 대화가 길어져 영역을 넘치면 맨 아래로 스크롤되며 앞 말풍선들이 위로 밀려 올라가는데 그 이동을 부드럽게 이어 준다. (FLIP)
  // 대화가 길어 말풍선 영역이 넘치면 먼저 맨 아래로 옮겨 두고(즉시), 그 이동도 같은 방식으로 이어 준다.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (stackRef.current) stackRef.current.scrollTop = stackRef.current.scrollHeight;

    const nodes = section.querySelectorAll('[data-flip]');
    nodes.forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));

    const next = measureTops(section);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const style = getComputedStyle(section);
      const duration = parseFloat(style.getPropertyValue('--chat-shift-duration')) || 550;
      const easing = style.getPropertyValue('--chat-ease-out').trim() || 'ease-out';
      nodes.forEach((node) => {
        const before = tops.current.get(node.dataset.flip);
        if (before === undefined) return;
        const delta = before - next.get(node.dataset.flip);
        if (Math.abs(delta) < 1) return;
        node.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], { duration, easing });
      });
    }
    tops.current = next;
  }, [itemCount]);

  return (
    <section ref={sectionRef} className={styles.chat} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Find
      </h2>
      <div className={styles.card}>
        {/* 카드 위쪽 안내 문구. 첫 질문 말풍선이 뜨기 시작하면 위로 올라가며 사라진다. */}
        <div className={styles.intro} data-hidden={introDone}>
          <h3 className={styles.introTitle}>
            <TypewriterTitle text="Let's find your Polaroid." active={entered} onDone={handleTitleDone} />
          </h3>
          <p className={styles.introText} data-shown={textOn}>
            어떤 순간을 남기고 싶은지 알려주세요.
            <br />몇 가지 질문으로 어울리는 카메라를 찾아드릴게요.
          </p>
        </div>
        {/* 사용자가 스크롤로 위 대화를 볼 때 FLIP 기준 위치가 어긋나지 않도록 스크롤할 때마다 다시 잰다. */}
        <div
          ref={stackRef}
          className={styles.stack}
          aria-live="polite"
          onScroll={() => {
            if (sectionRef.current) tops.current = measureTops(sectionRef.current);
          }}
        >
          {visibleSteps.map((step, index) => (
            <Fragment key={step.id}>
              <ChatStep
                step={step}
                first={index === 0}
                selectedId={answers[step.id] ?? null}
                settled={index < visibleSteps.length - 1}
                viaText={Boolean(textSteps[step.id])}
                onChoose={handleChoose}
                onDirect={() => inputRef.current?.focus()}
              />
              {thread
                .filter((message) => message.stepId === step.id)
                .map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              {typing && currentStep.id === step.id ? <ChatMessage typing /> : null}
            </Fragment>
          ))}
        </div>
        <form
          ref={barRef}
          className={styles.bar}
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <div className={styles.barInner} data-empty={draft.length === 0}>
            <span className={styles.barCaret} aria-hidden="true" />
            <textarea
              ref={inputRef}
              className={styles.input}
              rows={1}
              value={draft}
              maxLength={MAX_ANSWER_LENGTH}
              placeholder={allAnswered ? '추천 카메라를 확인해보세요.' : '메세지를 입력해주세요.'}
              aria-label="답변 입력"
              enterKeyHint="send"
              autoComplete="off"
              spellCheck={false}
              disabled={allAnswered}
              readOnly={busy}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className={styles.barTools}>
              <img src={micIcon} alt="" width="20" height="20" />
              <span className={styles.barDivider} />
              <button type="submit" className={styles.send} disabled={!canSend} aria-label="보내기">
                <img src={sendIcon} alt="" width="16" height="16" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
