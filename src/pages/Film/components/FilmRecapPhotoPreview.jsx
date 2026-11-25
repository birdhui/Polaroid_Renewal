import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FilmRecapImage from './FilmRecapImage.jsx';
import styles from './FilmNovemberRecapSection.module.css';

function anchorToButton(button) {
  const { left, top, width, height } = button.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
}

export default function FilmRecapPhotoPreview({ selection, calendarRef, onClose }) {
  const previewRef = useRef(null);
  const { photo, trigger, pointer } = selection;

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const section = trigger.closest('section');
    const gap = 16;
    let point = pointer;
    let frame = null;
    let width = preview.offsetWidth;
    let height = preview.offsetHeight;

    function positionPreview() {
      frame = null;
      const { x, y } = point ?? anchorToButton(trigger);
      const left = Math.min(Math.max(gap, x + gap), window.innerWidth - width - gap);
      const above = y - height - gap;
      const top = point || above >= gap
        ? above
        : Math.min(y + gap, window.innerHeight - height - gap);
      preview.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    }

    function updatePosition() {
      frame = null;
      const { top, bottom } = section.getBoundingClientRect();
      if (!point && (bottom <= 0 || top >= window.innerHeight)) {
        onClose(null);
        return;
      }

      positionPreview();
    }

    function schedulePosition() {
      if (frame === null) frame = window.requestAnimationFrame(updatePosition);
    }

    function followPointer(event) {
      if (event.pointerType === 'mouse') {
        point = { x: event.clientX, y: event.clientY };
        schedulePosition();
      }
    }

    function resize() {
      width = preview.offsetWidth;
      height = preview.offsetHeight;
      schedulePosition();
    }

    function dismissOutside(event) {
      const target = pointer ? event.target.closest('button') : event.target;
      if (!target || !calendarRef.current?.contains(target)) onClose(null);
    }

    function dismissOnEscape(event) {
      if (event.key === 'Escape') onClose(null);
    }

    positionPreview();

    if (pointer) window.addEventListener('pointermove', followPointer, { passive: true });
    window.addEventListener('scroll', schedulePosition, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissOnEscape);

    return () => {
      if (pointer) window.removeEventListener('pointermove', followPointer);
      window.removeEventListener('scroll', schedulePosition);
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissOnEscape);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [calendarRef, onClose, pointer, trigger]);

  return createPortal(
    <div className={styles.preview} ref={previewRef} aria-hidden="true">
      <div className={styles.print}>
        <div className={styles.printCrop}>
          <FilmRecapImage photo={photo} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
