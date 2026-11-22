import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import imageIcon from '@/assets/compare/icons/chat-image.svg';
import micIcon from '@/assets/compare/icons/chat-mic.svg';
import sendIcon from '@/assets/compare/icons/chat-send.svg';
import styles from './CompareChat.module.css';

/** 질문 말풍선(검정) 하나와 그 대답 선택지(주황). 선택지를 누르면 부모가 다음 질문을 띄운다. */
function ChatStep({ step, selectedId, onChoose }) {
  const questionId = useId();

  return (
    <div className={styles.step} data-flip={step.id} data-layout={step.layout}>
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
  );
}

/**
 * Compare 채팅 섹션 — 베이지 배경 위에 질문(검정 말풍선)과 대답(주황 말풍선)이 쌓이는 채팅 화면.
 * 처음에는 입력창만 있다가, 입력창이 화면에 들어오면 첫 질문이 아래에서 위로 떠오르고 곧이어 선택지가 위에서 아래로 내려온다.
 * 답을 고르면 다음 질문이 같은 방식으로 이어지고, 앞의 말풍선들은 위로 밀려 올라간다.
 * 지나온 질문의 선택지도 눌러서 답을 바꿀 수 있다. 입력창은 시안의 장식이라 입력은 받지 않는다.
 * 모션 수치(시간·거리·이징)는 CompareChat.module.css 맨 위 변수에 모여 있다.
 */
export default function CompareChat({ steps, answers, stepIndex, onChoose }) {
  const sectionRef = useRef(null);
  const barRef = useRef(null);
  const tops = useRef(new Map());
  const titleId = useId();
  // IntersectionObserver 가 없는 환경에서는 바로 시작한다.
  const [entered, setEntered] = useState(() => typeof IntersectionObserver === 'undefined');

  // 입력창이 화면에 들어오면 첫 질문을 띄운다. 히어로 아래에 있어서 페이지를 열자마자 끝나 버리지 않게 하려는 것이다.
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
      { threshold: 0.6, rootMargin: '0px 0px -6% 0px' },
    );
    observer.observe(bar);
    return () => observer.disconnect();
  }, [entered]);

  const shownCount = entered ? stepIndex + 1 : 0;
  const visibleSteps = steps.slice(0, shownCount);

  // 새 질문이 아래에 붙으면 앞의 말풍선들이 위로 밀려 올라가는데, 그 이동을 부드럽게 이어 준다. (FLIP)
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const nodes = section.querySelectorAll('[data-flip]');
    nodes.forEach((node) => node.getAnimations().forEach((animation) => animation.cancel()));

    const base = section.getBoundingClientRect().top;
    const next = new Map();
    nodes.forEach((node) => next.set(node.dataset.flip, node.getBoundingClientRect().top - base));

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
  }, [shownCount]);

  return (
    <section ref={sectionRef} className={styles.chat} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Find
      </h2>
      <div className={styles.column}>
        <div className={styles.stack} aria-live="polite">
          {visibleSteps.map((step) => (
            <ChatStep key={step.id} step={step} selectedId={answers[step.id] ?? null} onChoose={onChoose} />
          ))}
        </div>
        <div ref={barRef} className={styles.bar} aria-hidden="true">
          <span className={styles.barIcon}>
            <img src={micIcon} alt="" width="16" height="16" />
          </span>
          <span className={styles.barIcon}>
            <img src={imageIcon} alt="" width="16" height="16" />
          </span>
          <span className={styles.barText}>Type message</span>
          <span className={styles.barIcon}>
            <img src={sendIcon} alt="" width="16" height="16" />
          </span>
        </div>
      </div>
    </section>
  );
}
