import { useRef, useState } from 'react';
import calendar from '@/assets/film/film-recap-calendar.png';
import FilmRecapPhotoPreview from './FilmRecapPhotoPreview.jsx';
import styles from './FilmNovemberRecapSection.module.css';

const photoDays = [1, 4, 7, 10, 12, 16, 18, 21, 23, 27, 30];

export default function FilmNovemberRecapSection() {
  const calendarRef = useRef(null);
  const [selection, setSelection] = useState(null);

  function choosePhoto(event, day, column, row) {
    const trigger = event.currentTarget;
    const pointer = event.nativeEvent.pointerType === 'mouse'
      ? { x: event.clientX, y: event.clientY }
      : null;
    setSelection(current => current?.day === day ? null : { day, column, row, trigger, pointer });
  }

  return (
    <section className={styles.section} aria-labelledby="film-recap-title">
      <h2 className={styles.visuallyHidden} id="film-recap-title" lang="en">11 November Recap</h2>
      <div className={styles.stage}>
        <figure className={styles.calendar}>
          <div className={styles.headingCrop}>
            <img src={calendar} alt="" width={1920} height={1080} loading="lazy" decoding="async" />
          </div>
          <div className={styles.gridCrop} ref={calendarRef}>
            <img
              src={calendar}
              alt="11월 달력 격자와 날짜별로 담긴 필름 사진 모음"
              width={1920}
              height={1080}
              loading="lazy"
              decoding="async"
            />
            <div className={styles.interactionLayer}>
              <div className={styles.photoDays}>
                {photoDays.map(day => {
                  const dateIndex = day + 5;
                  const column = dateIndex % 7;
                  const row = Math.floor(dateIndex / 7);

                  return (
                    <button
                      key={day}
                      type="button"
                      className={styles.photoDay}
                      style={{ gridColumn: column + 1, gridRow: row + 1 }}
                      aria-label={`11월 ${day}일 사진`}
                      aria-pressed={selection?.day === day}
                      onClick={event => choosePhoto(event, day, column, row)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </figure>
      </div>
      {selection && (
        <FilmRecapPhotoPreview
          key={selection.day}
          selection={selection}
          calendarRef={calendarRef}
          onClose={setSelection}
        />
      )}
    </section>
  );
}
