import backdrop from '@/assets/film/faq-background.png';
import divider from '@/assets/film/faq-divider.svg';
import openDivider from '@/assets/film/faq-open-divider.svg';
import minusIcon from '@/assets/film/faq-minus.svg';
import plusIcon from '@/assets/film/faq-plus.svg';
import FocusTitle from './FocusTitle.jsx';
import styles from './FilmFaqSection.module.css';

const introLines = [
  '사진이 카메라에서 나온 뒤에도 필름 안에서는 현상이 계속돼요.',
  '이때 강한 빛에 노출되거나 사진을 흔들면',
  '아래쪽 가장자리에 얼룩이나 왜곡이 생길 수 있어요.',
];

const questions = [
  {
    question: '사진에 얼룩이 생기거나 이미지가 왜곡돼요.',
    answer: [
      `${introLines[0]} ${introLines[1]}`,
      `${introLines[2]} 사진이 나오면 밝은 빛을 가리고,`,
      '흔들지 않은 채 현상될 때까지 기다려 주세요.',
    ],
  },
  {
    question: '사진의 일부가 비어 있어요.',
    answer: ['현상액이 사진 전체에 고르게 퍼지지 않았을 수 있어요. 필름의 사용 기한과 보관 상태를 확인하고 카메라 롤러를 닦아 주세요.'],
  },
  {
    question: '사진에 세로 줄무늬가 보여요.',
    answer: ['필름을 오래 두거나 잘못 보관하면 현상액 상태가 달라져 세로 줄무늬가 생길 수 있어요. 사용 기한과 보관 상태를 확인해 주세요.'],
  },
  {
    question: '필름 사진이 전체적으로 푸르고 색이 흐려요.',
    answer: ['추운 곳에서는 현상이 느려져 사진에 푸른 기가 돌 수 있어요. 추운 날에는 카메라와 막 나온 사진을 겉옷 안쪽에 보관해 주세요.'],
  },
];

export default function FilmFaqSection() {
  return (
    <section className={styles.section} id="film-faq" aria-labelledby="film-faq-title">
      <img className={styles.backdrop} src={backdrop} alt="" loading="lazy" decoding="async" />
      <div className={styles.stage}>
        <div>
          <FocusTitle as="h2" className={styles.title} id="film-faq-title" lang="en">
            <span>Any questions?</span>{' '}
            <span>We got you.</span>
          </FocusTitle>
          <p className={styles.intro}>
            {introLines.map(line => <span key={line}>{line}</span>)}
          </p>
          <a
            className={styles.more}
            href="https://support.polaroid.com/hc/en-us/sections/115003366847-Troubleshooting"
            lang="en"
          >
            More FAQs →
          </a>
        </div>

        <div className={styles.questions}>
          {questions.map(({ question, answer }, index) => (
            <div className={styles.item} key={question}>
              <details name="film-faq" open={index === 0}>
                <summary className={styles.question}>
                  {question}
                  <span className={styles.icon} aria-hidden="true">
                    <img className={styles.plus} src={plusIcon} alt="" width={14} height={14} />
                    <img className={styles.minus} src={minusIcon} alt="" width={12} height={2} />
                  </span>
                </summary>
                <p className={styles.answer}>
                  {answer.map(line => <span key={line}>{line}</span>)}
                </p>
              </details>
              <div className={styles.divider} aria-hidden="true">
                <img className={styles.closedDivider} src={divider} alt="" width={637} height={1} />
                <img className={styles.openDivider} src={openDivider} alt="" width={637} height={1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
