/** 한글 글자의 받침 여부. 한글이 아니면 받침이 없는 것으로 본다. */
function hasFinalConsonant(word) {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/**
 * 받침에 맞는 조사를 붙인다. withJosa('비용', '와', '과') → '비용과', withJosa('기능', '이', '가') → '기능이'
 * @param {string} word
 * @param {string} withoutFinal 받침이 없을 때 쓰는 조사
 * @param {string} withFinal 받침이 있을 때 쓰는 조사
 */
export function withJosa(word, withoutFinal, withFinal) {
  return `${word}${hasFinalConsonant(word) ? withFinal : withoutFinal}`;
}

/**
 * 비교용으로 문장을 단순하게 만든다. 소문자로 바꾸고 한글·영문·숫자만 남긴다.
 * 띄어쓰기를 모두 없애 "안 써봤어요" 와 "안써봤어요" 를 같게 보며, ㅋㅋ · ㅠㅠ 같은 자음·모음 단독 글자와 이모지·문장부호도 지운다.
 */
export function normalizeText(text) {
  return String(text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^가-힣a-z0-9]/g, '');
}
