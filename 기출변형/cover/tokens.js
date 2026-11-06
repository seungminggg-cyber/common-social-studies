// 정조준 시리즈 — 디자인 값(색·글꼴·크기·간격). 모든 표지·책등·간지가 이 값만 쓴다.
// 길이 단위는 mm(재단선 기준). 도련은 BLEED만큼 바깥으로 더 칠한다.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OTF_DIR = join(HERE, '../../textbook/node_modules/font-kopubworld/fonts');
// 인쇄용: TrueType 윤곽으로 바꾼 글꼴(otf2ttf.py)을 먼저 쓴다. 없으면 원본 OTF(PDF에 Type 3으로 들어감).
const TTF_DIR = join(HERE, '../out/cover/fonts');
export const FONT_IS_TTF = existsSync(join(TTF_DIR, 'KoPubWorld-Batang-Bold.ttf'));

export const PAGE = { w: 210, h: 297 }; // A4
export const BLEED = 3; // 사방 도련
export const SAFE = 10; // 재단선에서 글자·중요 요소까지 최소 거리

// 대단원 색 (개념서 시안 H와 같은 값)
export const CH = { 'Ⅰ': '#1D6C74', 'Ⅱ': '#7D3566', 'Ⅲ': '#3C7A37', 'Ⅳ': '#B5651D', 'Ⅴ': '#234E8A' };
export const RINGS = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'].map((k) => CH[k]); // 과녁 바깥 → 안

// 무채색
export const C = {
  paper: '#F5F3EE', paperGray: '#DCD7CB', white: '#FFFFFF',
  ink: '#1E2124', inkBg: '#1C1F23', sub: '#5E6166',
  onDark: '#F2EFE8', onDarkSub: '#A7ABB1',
};

// 권별 바탕(수능에 가까울수록 진해짐)
export const GROUND = {
  // 2차 시안(강사: 회색 바탕 싫음) — 01~05권 흰 종이, 06·07권 먹
  white: { bg: C.white, fg: C.ink, sub: C.sub, rule: C.ink, boxBg: C.ink, boxFg: C.white, band: C.ink, bandFg: C.onDark, bandSub: C.onDarkSub, dark: false },
  paper: { bg: C.paper, fg: C.ink, sub: C.sub, rule: C.ink, boxBg: C.ink, boxFg: C.paper, dark: false },
  gray: { bg: C.paperGray, fg: C.ink, sub: C.sub, rule: C.ink, boxBg: C.ink, boxFg: C.paperGray, dark: false },
  ink: { bg: C.inkBg, fg: C.onDark, sub: C.onDarkSub, rule: C.onDarkSub, boxBg: C.onDark, boxFg: C.inkBg, band: C.onDark, bandFg: C.inkBg, bandSub: C.sub, dark: true },
};

// 어두운 바탕에서 과녁 선이 묻히지 않게: 단원 색을 밝은 글자색 쪽으로 섞은 값
export function lift(hex, t = 0.38, to = C.onDark) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex), b = p(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// 모서리 자른 네모: 오른쪽 위를 한 변의 18% 만큼 자른다(개념서 .cut과 같은 방향)
export const CUT = 0.18;

// 글꼴 (KoPub World, 출판물 사용 무료). 굵기 300 Light / 500 Medium / 700 Bold
export const FONT = { dotum: 'KoPub Dotum', batang: 'KoPub Batang' };
export function fontFaces() {
  const out = [];
  for (const [fam, file] of [[FONT.dotum, 'Dotum'], [FONT.batang, 'Batang']])
    for (const [w, name] of [[300, 'Light'], [500, 'Medium'], [700, 'Bold']])
      out.push(`@font-face{font-family:'${fam}';font-weight:${w};src:url('file://${FONT_IS_TTF ? `${TTF_DIR}/KoPubWorld-${file}-${name}.ttf` : `${OTF_DIR}/KoPubWorld-${file}-${name}.otf`}');}`);
  return out.join('\n');
}

// 제목('정조준'·앞 단어 상자) 글꼴 후보 — 모두 SIL Open Font License 1.1(인쇄 출판물 무료, PDF 임베드 허용).
// css: 글꼴 패키지의 @font-face 파일(textbook/node_modules), scale: 같은 자리·같은 폭으로 보이도록 크기 맞춤
const NM = join(HERE, '../../textbook/node_modules');
export const TITLE_FONTS = {
  kopub: { label: 'KoPub 바탕 Bold (지금)', family: FONT.batang, weight: 700, scale: 1, box: { family: FONT.dotum, weight: 700 } },
  // 함렛: 가변 글꼴은 PDF에 Type 3으로 들어가므로 otf2ttf.py가 만든 굵기 900 고정 글꼴(out/cover/fonts)을 쓴다
  hahmlet: { label: '함렛 Black', face: `${TTF_DIR}/Hahmlet-Black.ttf`, family: 'Hahmlet Black', weight: 900, scale: 0.94, spacing: -0.03, box: { family: FONT.dotum, weight: 700 } },
  noto: { label: '본명조(Noto Serif KR) Black', css: `${NM}/@fontsource/noto-serif-kr/900.css`, family: 'Noto Serif KR', weight: 900, scale: 0.94, spacing: -0.02, box: { family: FONT.dotum, weight: 700 } },
  bhs: { label: '검은고딕(Black Han Sans)', css: `${NM}/@fontsource/black-han-sans/400.css`, family: 'Black Han Sans', weight: 400, scale: 1.12, spacing: 0, box: { family: 'Black Han Sans', weight: 400, spacing: 0.08 } },
};
export const titleFontLinks = () =>
  Object.values(TITLE_FONTS).filter((f) => f.css).map((f) => `<link rel="stylesheet" href="file://${f.css}">`).join('') +
  `<style>${Object.values(TITLE_FONTS).filter((f) => f.face).map((f) => `@font-face{font-family:'${f.family}';font-weight:${f.weight};src:url('file://${f.face}');}`).join('')}</style>`;

// 글자 크기(pt)
export const TYPE = {
  title: 99, // '정조준' — 모든 권에서 같은 크기·같은 자리
  word: 19, // 앞 단어 상자
  sub: 13.5, // 부제
  subject: 11.5, // 과목
  meta: 8.6, // 위·아래 줄
};
