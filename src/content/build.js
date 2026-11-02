// 문제 팩을 만드는 공통 틀
// 단원 표 + O/X·빈칸·개념·암기 목록을 넣으면 앱이 쓰는 형식으로 바꿔 줍니다.
const pad = (n) => String(n + 1).padStart(3, '0');

export function makePack({ id, version, title, subject, units, ox = [], blank = [], concept = [], flash = [] }) {
  const u = (key) => {
    if (!units[key]) throw new Error(`${id}: 단원 ${key} 없음`);
    return units[key];
  };
  return {
    id,
    version,
    title,
    quizzes: [
      ...ox.map(([k, question, answer, explanation], i) => ({
        key: `ox${pad(i)}`, type: 'ox', subject, ...u(k), question, answer, explanation,
      })),
      ...blank.map(([k, question, answer, hint], i) => ({
        key: `bl${pad(i)}`, type: 'blank', subject, ...u(k), question, answer, hint,
      })),
    ],
    cards: [
      ...concept.map(([k, cardTitle, tag, body], i) => ({
        key: `cc${pad(i)}`, type: 'concept', subject, ...u(k), title: cardTitle, tag, body,
      })),
      ...flash.map(([k, front, back], i) => ({
        key: `fc${pad(i)}`, type: 'flash', subject, ...u(k), front, back,
      })),
    ],
  };
}
