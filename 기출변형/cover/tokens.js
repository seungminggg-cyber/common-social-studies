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
  paper: { bg: C.paper, fg: C.ink, sub: C.sub, rule: C.ink, boxBg: C.ink, boxFg: C.paper, dark: false },
  gray: { bg: C.paperGray, fg: C.ink, sub: C.sub, rule: C.ink, boxBg: C.ink, boxFg: C.paperGray, dark: false },
  ink: { bg: C.inkBg, fg: C.onDark, sub: C.onDarkSub, rule: C.onDarkSub, boxBg: C.onDark, boxFg: C.inkBg, dark: true },
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

// 글자 크기(pt)
export const TYPE = {
  title: 99, // '정조준' — 모든 권에서 같은 크기·같은 자리
  word: 19, // 앞 단어 상자
  sub: 13.5, // 부제
  subject: 11.5, // 과목
  meta: 8.6, // 위·아래 줄
};
