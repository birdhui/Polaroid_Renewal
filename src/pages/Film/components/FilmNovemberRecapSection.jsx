import { useRef, useState } from 'react';
import calendar from '@/assets/film/film-recap-calendar.png';
import closeUp from '@/assets/film/recap-close-up.png';
import yellowMug from '@/assets/film/recap-yellow-mug.png';
import puppy from '@/assets/film/recap-puppy.png';
import family from '@/assets/film/recap-family.png';
import camera from '@/assets/film/recap-camera.png';
import siblings from '@/assets/film/recap-siblings.png';
import redBall from '@/assets/film/recap-red-ball.png';
import hug from '@/assets/film/recap-hug.png';
import faceMasks from '@/assets/film/recap-face-masks.png';
import pizza from '@/assets/film/recap-pizza.png';
import birthdayCake from '@/assets/film/recap-birthday-cake.png';
import fourFriends from '@/assets/film/recap-four-friends.png';
import groupPortrait from '@/assets/film/recap-group-portrait.png';
import twoFriends from '@/assets/film/recap-two-friends.png';
import FilmRecapImage from './FilmRecapImage.jsx';
import FilmRecapPhotoPreview from './FilmRecapPhotoPreview.jsx';
import styles from './FilmNovemberRecapSection.module.css';

// Each view box stays inside the exposed image on the original print.
const photosByDay = {
  1: { src: closeUp, width: 1978, height: 2400, crop: '103 147 1761 1781', alt: '얼굴을 가까이 댄 두 사람' },
  4: { src: yellowMug, width: 1920, height: 2336, crop: '119 151 1698 1717', alt: '노란 머그잔을 든 아이와 보드게임' },
  5: { src: fourFriends, width: 1600, height: 2400, crop: '108 590 1390 1390', monochrome: true, alt: '함께 웃으며 셀카를 찍은 네 친구' },
  7: { src: puppy, width: 1472, height: 2396, crop: '265 589 1006 1006', alt: '강아지를 안고 있는 사람' },
  10: { src: family, width: 2400, height: 3000, crop: '128 175 2160 2220', alt: '아기의 양 볼에 입맞추는 두 사람' },
  12: { src: faceMasks, width: 1472, height: 1962, crop: '250 530 842 842', alt: '마스크팩을 붙이고 얼굴을 맞댄 두 사람' },
  15: { src: groupPortrait, width: 1220, height: 1510, crop: '26 150 1166 1166', alt: '카메라 가까이 모여 장난스러운 표정을 짓는 사람들' },
  16: { src: camera, width: 1970, height: 2400, crop: '128 137 1714 1754', alt: '폴라로이드 카메라를 든 사람' },
  18: { src: pizza, width: 1470, height: 1400, crop: '405 443 690 670', alt: '피자 조각을 들고 웃는 두 사람' },
  21: { src: siblings, width: 2398, height: 2916, crop: '153 142 2092 2143', alt: '소파에 나란히 앉은 두 아이' },
  24: { src: twoFriends, width: 1470, height: 2322, crop: '104 390 1250 1250', monochrome: true, alt: '눈을 감고 웃는 두 친구' },
  26: { src: birthdayCake, width: 800, height: 1200, crop: '96 278 590 590', alt: '생일 케이크에 얼굴을 가까이 댄 친구들' },
  27: { src: redBall, width: 2154, height: 2226, crop: '79 107 1972 1995', alt: '입에 빨간 공을 문 사람' },
  30: { src: hug, width: 1472, height: 2016, crop: '106 327 1258 1318', alt: '서로 껴안고 웃는 두 아이' },
};

const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const calendarDays = Array.from({ length: 42 }, (_, index) => index - 5);

export default function FilmNovemberRecapSection() {
  const calendarRef = useRef(null);
  const [selection, setSelection] = useState(null);

  function showPhoto(event, day, followMouse) {
    const trigger = event.currentTarget;
    const pointer = followMouse ? { x: event.clientX, y: event.clientY } : null;
    setSelection(current => {
      if (current?.day !== day) return { day, trigger, pointer, photo: photosByDay[day] };
      if (followMouse && current.pointer) return current;
      return followMouse ? { ...current, pointer } : null;
    });
  }

  return (
    <section className={styles.section} id="film-recap" aria-labelledby="film-recap-title">
      <h2 className={styles.visuallyHidden} id="film-recap-title" lang="en">11 November Recap</h2>
      <div className={styles.stage}>
        <figure className={styles.calendar}>
          <div className={styles.headingCrop}>
            <img src={calendar} alt="" width={1920} height={1080} loading="lazy" decoding="async" />
          </div>
          <div className={styles.calendarBody} ref={calendarRef}>
            <div className={styles.weekdays} lang="en">
              {weekdays.map(weekday => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className={styles.days}>
              {calendarDays.map(day => {
                const photo = photosByDay[day];
                return (
                  <div className={styles.day} key={day}>
                    {photo && (
                      <button
                        type="button"
                        className={styles.photoDay}
                        aria-label={`11월 ${day}일 사진, ${photo.alt}`}
                        aria-pressed={selection?.day === day}
                        onPointerEnter={event => {
                          if (event.pointerType === 'mouse') showPhoto(event, day, true);
                        }}
                        onClick={event => showPhoto(event, day, event.nativeEvent.pointerType === 'mouse')}
                      >
                        <FilmRecapImage photo={photo} />
                      </button>
                    )}
                    {day >= 1 && day <= 30 && <span className={styles.dayNumber} aria-hidden={!!photo}>{day}</span>}
                  </div>
                );
              })}
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
