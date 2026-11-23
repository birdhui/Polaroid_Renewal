import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import micIcon from '@/assets/compare/icons/chat-mic.svg';
import sendIcon from '@/assets/compare/icons/chat-send.svg';
import { buildAcknowledgement, buildRetryMessage } from '@/pages/Compare/data/compareChatReplies.js';
import classifyAnswer, { MAX_ANSWER_LENGTH } from '@/pages/Compare/utils/classifyAnswer.js';
import styles from './CompareChat.module.css';

/**
 * 사용자가 답을 보낸 뒤 챗봇이 답하기까지의 시간(ms) — 시안에 정해진 값이 없어 임시로 둔 값이다.
 * 이 시간 동안 "입력 중" 표시(···)가 보인다.
 */
const BOT_REPLY_DELAY = 700;

/** 질문 말풍선(검정) 하나. 말풍선 안에 질문과 대답 칩이 들어 있고, 칩을 누르면 부모가 다음 질문을 띄운다. */
function ChatStep({ step, selectedId, onChoose }) {
  const questionId = useId();

  return (
    <div className={styles.step} data-flip={step.id}>
      <div className={styles.bubble}>
        <p id={questionId} className={styles.question}>
          {step.question}
        </p>
        <div className={styles.options} role="group" aria-labelledby={questionId}>
          {step.options.map((option, index) => {
            const selected = option.id === selectedId;
            return (
              <button
                key={option.id}
                type="button"
                className={selected ? `${styles.option} ${styles.selected}` : styles.option}
                style={{ '--i': index }}
                aria-pressed={selected}
                onClick={() => onChoose(step.id, option.id)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
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
 * Compare 채팅 섹션 — 베이지 배경 위 흰 카드 안에서 질문(대답 칩이 안에 든 검정 말풍선)이 쌓이는 채팅 화면.
 * 카드 위쪽에 안내 문구(Let's find your Polaroid.)가 고정돼 있고, 입력창이 화면에 들어오면
 * 그 아래에서 첫 질문 말풍선이 아래에서 위로 떠오르며, 곧이어 말풍선 안의 선택지가 나타난다.
 * 안내 문구는 말풍선 안의 선택지를 누르는 순간 위로 올라가며 사라진다.
 * 선택지는 기본이 회색이고 호버·포커스·선택하면 주황색이 된다.
 * 답을 고르면 다음 질문이 같은 방식으로 이어지고, 앞의 말풍선들은 위로 밀려 올라간다.
 * 지나온 질문의 선택지도 눌러서 답을 바꿀 수 있다.
 * 입력창에 직접 답을 써서 보낼 수도 있다. 보낸 말은 오른쪽(주황)에 나오고, 챗봇이 뜻을 이해하면 짧게 답한 뒤 다음 질문이 이어진다.
 * 뜻을 정확히 알 수 없으면 임의로 고르지 않고 다시 묻는다. 선택지 버튼과 직접 입력은 섞어서 쓸 수 있다.
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
  const messageSeq = useRef(0);
  const replyTimer = useRef(null);
  const failures = useRef({}); // 질문마다 연달아 분류하지 못한 횟수
  const onChooseRef = useRef(onChoose);

  useEffect(() => {
    onChooseRef.current = onChoose;
  });
  useEffect(() => () => clearTimeout(replyTimer.current), []);

  const shownCount = entered ? stepIndex + 1 : 0;
  // 하나라도 답을 하거나 말을 보냈으면 안내 문구를 치운다. (다시 선택하기로 답이 지워지면 다시 나타난다)
  const answered = Object.keys(answers).length > 0 || thread.length > 0;
  const visibleSteps = steps.slice(0, shownCount);
  const currentStep = steps[stepIndex];
  const allAnswered = steps.every((step) => answers[step.id]);
  const busy = typing || busyStepIndex === stepIndex;
  const canSend = entered && !allAnswered && !busy && draft.trim().length > 0;

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
    const result = classifyAnswer(step.id, text);
    addMessage({ stepId: step.id, role: 'user', text });
    setDraft('');
    setTyping(true);
    inputRef.current?.focus();

    replyTimer.current = setTimeout(() => {
      replyTimer.current = null;
      setTyping(false);
      if (result.status === 'matched') {
        failures.current[step.id] = 0;
        addMessage({ stepId: step.id, role: 'bot', text: buildAcknowledgement(step.id, result.optionId) });
        setBusyStepIndex(stepIndex);
        onChooseRef.current(step.id, result.optionId);
      } else {
        failures.current[step.id] = (failures.current[step.id] ?? 0) + 1;
        addMessage({ stepId: step.id, role: 'bot', text: buildRetryMessage(step, result, failures.current[step.id]) });
      }
    }, BOT_REPLY_DELAY);
  };

  const handleKeyDown = (event) => {
    // 한글 조합 중에 누른 Enter 는 글자를 확정하는 키라서 전송하지 않는다. Shift+Enter 는 줄바꿈.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    sendMessage();
  };

  const itemCount = visibleSteps.length + thread.length + (typing ? 1 : 0);

  // 새 질문이나 메시지가 아래에 붙으면 앞의 말풍선들이 위로 밀려 올라가는데, 그 이동을 부드럽게 이어 준다. (FLIP)
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
        {/* 카드 위쪽에 고정된 안내 문구. 첫 질문이 떠도 그대로 있다가, 말풍선 안의 선택지를 누르면 위로 사라진다. */}
        <div className={styles.intro} data-hidden={answered}>
          <h3 className={styles.introTitle}>Let&apos;s find your Polaroid.</h3>
          <p className={styles.introText}>
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
          {visibleSteps.map((step) => (
            <Fragment key={step.id}>
              <ChatStep step={step} selectedId={answers[step.id] ?? null} onChoose={handleChoose} />
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
