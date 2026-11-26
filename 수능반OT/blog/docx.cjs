// 학원 블로그 글 초안 → 워드 파일(그림 6장 포함)
//   node 수능반OT/blog/cards.mjs   (먼저 카드 그림 만들기)
//   node 수능반OT/blog/docx.cjs    →  수능반OT/out/블로그/블로그-초안-연간커리큘럼OT.docx
// 글 내용은 수능반OT/블로그초안.md와 같다(슬라이드 사진 19장 대신 블로그용 카드 6장).
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle, ShadingType, LevelFormat,
} = require('/opt/node-tools/node_modules/docx');

const OUT = path.join(__dirname, '../out/블로그');
const FONT = '맑은 고딕';
const BLUE = '0C357F', GRAY = '6B7686';

// ── 문단 도구 ──
const run = (t, o = {}) => new TextRun({ text: t, font: FONT, size: o.size || 22, bold: o.bold, color: o.color, italics: o.italic });
// 한 줄 = 한 문단. 글자 조각: '보통 글' 또는 ['글', {bold, color, size}]
const P = (parts, o = {}) => new Paragraph({
  children: (Array.isArray(parts) ? parts : [parts]).map((x) => (typeof x === 'string' ? run(x, o) : run(x[0], { ...o, ...x[1] }))),
  spacing: { after: o.after ?? 40, line: 300 },
  alignment: o.align,
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  border: o.border,
  indent: o.indent,
});
const gap = () => new Paragraph({ children: [run('')], spacing: { after: 60 } });
// 줄 여러 개를 문단으로(블로그처럼 짧은 줄 + 빈 줄)
const lines = (txt, o = {}) => txt.split('\n').map((l) => P(l, o));
const H = (t) => new Paragraph({ children: [run(t, { bold: true, size: 30, color: BLUE })], spacing: { before: 200, after: 160 }, keepNext: true });
const SUBH = (t) => new Paragraph({ children: [run(t, { bold: true, size: 25 })], spacing: { before: 120, after: 60 }, keepNext: true });
const quote = (t) => P(t, { size: 24, italic: false, color: '333333', fill: 'F2F4F8', indent: { left: 240, right: 240 }, after: 120,
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: BLUE, space: 8 } } });
const hr = () => new Paragraph({ children: [run('')], spacing: { before: 120, after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C9D1DE', space: 1 } } });
// 블로그에서 직접 넣을 것(영상·지도) 표시
const slot = (t) => P(`▶ ${t}`, { color: GRAY, size: 21, fill: 'FFF6D6', align: AlignmentType.CENTER, after: 160 });
const img = (n) => new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 },
  children: [new ImageRun({ type: 'jpg', data: fs.readFileSync(path.join(OUT, `카드-${n}.jpg`)), transformation: { width: 386, height: 483 }, altText: { title: `카드 ${n}`, description: `블로그 카드 그림 ${n}`, name: `card${n}` } })],
});
const check = (title, body) => [P([['✔ ', { color: BLUE, bold: true }], [title, { bold: true }]], { after: 20 }), ...(body ? lines(body) : []), gap()];

const body = [
  // 제목 후보(블로그에는 고른 것 하나만)
  P([['제목 후보', { bold: true, color: GRAY, size: 20 }]], { fill: 'EEF1F6', after: 0 }),
  P('① 김포 수능 통합사회 | 2028 수능 대비 연간 커리큘럼 OT (1/4 개강)', { size: 20, color: '333333', fill: 'EEF1F6', after: 0 }),
  P('② 김포 통합사회 학원 | 수능 통합사회, 왜 지금부터 해야 할까요?', { size: 20, color: '333333', fill: 'EEF1F6', after: 0 }),
  P('③ 김포 사우동 통합사회 | 예비 고3·N수생 통합사회 1년 정규반 개강 안내', { size: 20, color: '333333', fill: 'EEF1F6', after: 240 }),

  P([['2028 수능 대비 통합사회 연간 커리큘럼', { bold: true, size: 26 }]]),
  P([['2027. 1. 4.(월) 개강 | 매주 1회 3시간 30분', { bold: true }]]),
  P('1~2월 월요일 오전 10시 ~ 1시 반 / 3월 이후 토요일 오후 2시 반 ~ 6시'),
  img(1),
  ...lines('안녕하세요,\n김포 너를위한메이트학원입니다.'), gap(),
  ...lines('2028 수능을 준비하는 예비 고3·N수생 학생과 학부모님께\n통합사회 이승민T의 1년 연간 커리큘럼을 소개해 드립니다.'), gap(),
  ...lines('OT 영상에서 말씀드린 내용을\n글로도 하나씩 정리해 보았습니다.'), gap(),
  slot('여기에 OT 영상'),
  quote('"통합사회는 고1 때 배운 과목이니까, 수능 최저 맞추기는 쉽지 않을까?"'),
  quote('"고3 1학기 끝나고, 여름부터 시작해도 되지 않을까?"'),
  gap(),
  ...lines('결론부터 말씀드리면,\n2028 수능 통합사회는 개정 첫해라 아직 불확실한 것이 많습니다.\n그래서 더더욱 겨울부터, 제대로 시작해야 합니다.'),
  hr(),

  H('■ 강사 소개'),
  P([['통합사회 이승민T', { bold: true, size: 24, color: BLUE }]]),
  ...lines('메이트학원 사회과 대표강사\n대치 다원교육 · 리브 아카데미\n족보닷컴 22개정 사회탐구 출제위원\n전) 대치 에듀퍼스트'), gap(),
  ...lines('수업에 쓰는 교재는 모두 이승민T가 직접 만들었습니다.\n2028 평가원 예시문항과 2025~2026 학력평가 200문항을 하나하나 분석해서\n만든 문항만 1,300여 개입니다.'),
  hr(),

  H('■ 수능 통합사회, 왜 지금부터 해야 할까요?'),
  img(2),
  SUBH('① 고3 1학기에는 시간이 없습니다.'),
  ...lines('수시에 반영되는 마지막 내신 학기라\n내신 시험에 수행평가, 생기부까지 한꺼번에 몰립니다.\n합격한 선배들의 경험담에서도\n"1학기엔 내신 때문에 수능 공부를 못 해서, 여름에 몰아서 했어요"라는 말이 반복됩니다.\n여름은 개념이 끝난 상태로 실전에 들어가야 하는 때입니다.\n개념은 학교가 시작하기 전, 겨울에 끝내야 합니다.'), gap(),
  SUBH('② 통합사회 수업은 고1에서 끝납니다.'),
  ...lines('통합사회는 고1 때 배우고, 고2·고3에는 학교 수업이 없습니다.\n예비 고3 학생들은 고1 내용을 대부분 잊은 상태라\n처음부터 다시 1회독이 필요합니다.'), gap(),
  SUBH('③ 이과 최상위권도 함께 보는 시험입니다.'),
  ...lines('사탐·과탐 중 하나를 고르던 방식이 없어지고,\n이과 최상위권 학생도 같은 시험지, 같은 상대평가로 통합사회를 봅니다.\n피할 수도, 다른 과목으로 갈아탈 수도 없는 과목입니다.'), gap(),
  SUBH('④ N수생에게도 처음 배우는 과목입니다.'),
  ...lines('2027 수능은 현행 체제의 마지막 해였고,\nN수생은 약 20만 명으로 23년 만에 최대였습니다.\n2028 수능에는 옛 교육과정 시험이 없기 때문에\n재수를 하면 2022 개정 통합사회를 새로 배워야 합니다.\n겨울 1회독은 선택이 아니라 필수입니다.'),
  hr(),

  H('■ 통합사회로 최저 맞추기, 과연 쉬울까요?'),
  img(3),
  ...check('모두가 잘 보는 과목입니다.', '상대적으로 진입장벽이 낮고, 과목 자체 난이도도 높지 않습니다.\n그래서 등급컷은 무조건 만점에 가깝게 나옵니다.\n한두 문제 실수가 바로 등급을 가릅니다.'),
  ...check('2028 수능은 개정 첫해입니다.', '시중 문제집의 퀄리티가 아직 불확실하고,\n혼자 공부하면 제대로 된 효율이 나오지 않을 수 있습니다.'),
  P([['그래서, 승민T 통합사회입니다.', { bold: true, size: 25, color: BLUE }]]),
  hr(),

  H('■ 승민T가 직접 만든 교재 4종'),
  img(4),
  SUBH('📘 개념은 MINIMAP으로'),
  ...lines('통합사회1 · 통합사회2 개념서\n✔ 출제 빈도 표시 : 개념마다 기본 개념 · 빈출 · 최다 빈출\n✔ 이렇게 나온다 : 실제 기출 선지 표현을 O/X로 확인\n✔ 사상가 카드 : 핵심 주장 · 원전 읽기 · 헷갈리지 말자\n✔ 한 장 정리 + 수능형 문제 : 중단원 끝에서 정리와 실전 연습'), gap(),
  SUBH('📗 기출 분석과 변형은 MINIMAX로'),
  ...lines('기출분석서 (기본편 · 심화편)\n✔ 2028 예시문항 + 2025~2026 학평 200문항 분석\n✔ 분석한 출제 방식 그대로, 단원별 변형 문항\n✔ 기본편 약 500문항 · 심화편 약 500문항 (심화편은 중상 · 상 난이도 위주)'), gap(),
  SUBH('📕 실전은 MAXIMIN으로'),
  ...lines('실전 모의고사 10회\n✔ 통합사회1 3회 · 통합사회2 3회 · 전 범위 4회\n✔ 수능과 같은 형식, 회마다 25문항 · 50점\n✔ 정답과 해설 별책\n✔ + MAXIMIN FINAL (파이널 시기 실전용, 예정)'), gap(),
  SUBH('📒 매일의 복습은 MINT로'),
  ...lines('승민T 자체 제작 주간지\n하루 30분, 네 단계 순서대로\n01 빈칸 채우기 → 02 O/X 변형 → 03 사료 분석 → 04 실전문제 풀이\n눈으로만 읽는 대신, 매일 손으로 풀어 보는 습관을 만듭니다.'),
  hr(),

  H('■ 1년 로드맵'),
  img(5),
  P([['1구간 개념', { bold: true }], ' (1월 ~ 3월 20일)']), P('통합사회1·2 전 범위 + 예시문항 7가지 유형 → 3월 학평'), gap(),
  P([['2구간 기출 N제', { bold: true }], ' (3월 말 ~ 6월 초)']), P('기출 분석 · 변형 문항 + 수능특강 → 6월 모평'), gap(),
  P([['3구간 고난도 + 주간 실전', { bold: true }], ' (6월 중순 ~ 9월 초)']), P('6모 분석으로 시작, 수특 · 수완 · 6모 반영 → 9월 모평'), gap(),
  P([['4구간 파이널', { bold: true }], ' (9월 ~ 수능)']), P('9모 분석으로 시작, 실전 모의고사 집중 → 수능'), gap(),
  P('3월 20일, 통합사회1·2 개념을 완주하고 3월 학평에 들어갑니다.'), gap(),
  ...lines('그리고 1년 내내 빠지지 않는 것이 있습니다.\n매주 수업 시간의 실전 모의고사입니다.\n1월 개강부터 11월 수능까지, 약 45회를 봅니다.'), gap(),
  P([['주요 일정 (날짜는 예상)', { bold: true }]]),
  ...lines('1월 말 수능특강 출간\n3월 24일 3월 학력평가\n5월 5월 학력평가 · 5월 말 수능완성 출간\n6월 6월 모의평가\n7월 7월 학력평가\n9월 9월 모의평가\n10월 10월 학력평가\n11월 18일 수능'),
  hr(),

  H('■ 수업 방식과 관리 원칙'),
  P([['매주 3시간 30분, 이렇게 씁니다.', { bold: true }]]),
  P('복습 테스트 15분 → 수업 2시간 35분 → 실전 모의고사 + 오답 정리 40분'), gap(),
  P([['고3은 학기 중 숙제 없이, 내신에 집중합니다.', { bold: true }]]),
  ...lines('✔ 1~2월 : 매주 교재 + 주간지 숙제 (겨울방학, 개념 1회독)\n✔ 3~6월 고3 : 숙제 없음 (내신 집중, 수업 시간 복습 테스트 + 실전 모의고사로)\n✔ 3~6월 N수 : 교재 + 주간지 숙제 (같은 패턴 그대로)\n✔ 7월~수능 : 매주 교재 + 주간지 숙제 (고3 · N수 모두)'), gap(),
  ...lines('숙제가 없는 기간에도 괜찮은 이유가 있습니다.\n한 연구(Roediger & Karpicke, 2006)에서\n네 번 다시 읽은 학생들은 1주일 뒤 40%를,\n한 번 읽고 세 번 시험을 본 학생들은 61%를 기억했습니다.\n다시 읽기보다 직접 떠올리는 시험이 기억에 남습니다.\n매주 복습 테스트와 실전 모의고사가 바로 이 방법입니다.'), gap(),
  P([['수업 없는 날에도, 학생용 웹앱', { bold: true }]]),
  ...lines('✔ 오늘의 10문제 : 매일 새 문제, 틀리면 바로 해설\n✔ 오답 노트 자동 저장 : 틀린 문제가 저절로 모임\n✔ 플래너 · 집중 타이머 : 혼자 공부하는 시간까지 기록\n✔ 선생님이 매일 확인 : 누가 공부했는지, 무엇을 틀렸는지'), gap(),
  ...lines('학습 앱은 아래 글에서 더 자세히 보실 수 있습니다.\nhttps://blog.naver.com/yourmate_gimpo/224466311319'),
  hr(),

  H('■ 수강 안내'),
  img(6),
  ...lines('대상 : 2028 수능을 준비하는 예비 고3 · N수생\n개강 : 2027. 1. 4.(월)\n수업 : 매주 1회 3시간 30분\n1~2월 월요일 오전 10시 ~ 1시 반\n3월 이후 토요일 오후 2시 반 ~ 6시\n강사 : 통합사회 이승민T\n교재 : MINIMAP · MINIMAX · MAXIMIN · MINT (자체 제작)'), gap(),
  P([['불확실한 통합사회,', { bold: true, size: 26, color: BLUE }]], { after: 0 }),
  P([['효율적으로 완벽하게.', { bold: true, size: 26, color: BLUE }]]), gap(),
  ...lines('고3 1학기가 시작되기 전,\n통합사회 개념은 이번 겨울에 끝내 두고\n11월 수능까지 1년 동안 함께 가겠습니다.'), gap(),
  ...lines('2028 수능 통합사회를 제대로 준비하고 싶다면,\n너를위한메이트 학원\n승민T 연간 커리큘럼을 신청하시길 바랍니다!!'), gap(),
  P([['📍 너를위한 메이트학원', { bold: true }]]),
  ...lines('경기도 김포시 사우중로92 3층, 사우동 / 사우역 도보 5분\n(롯데리아 건물)'), gap(),
  P([['📞 문의', { bold: true }]]),
  ...lines('031-8049-0716 (평일 오후 4시–10시, 공휴일 제외)\n010-5528-9505\n* 문자 내용: 목동관/김포관 + 학교 학년 + 상담희망과목 + 통화가능시간을 남겨주세요\n* 문자로 사전 시간 조율 후 전화주시면 감사하겠습니다!!'), gap(),
  P('🟡 카카오톡 채널 상담: http://pf.kakao.com/_xfAZaX/chat'), gap(),
  slot('여기에 지도(장소: 너를위한메이트학원)'),
  hr(),
  P([['태그 후보', { bold: true, color: GRAY, size: 20 }]], { after: 0 }),
  P('#김포통합사회 #사우동통합사회 #김포수능통합사회 #2028수능 #통합사회 #예비고3 #N수생 #통합사회학원 #너를위한메이트학원 #이승민T', { size: 20, color: GRAY }),
];

const doc = new Document({
  creator: '이승민',
  title: '블로그 글 초안 — 2028 수능 대비 연간 커리큘럼 OT',
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: [{ reference: 'none', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1300, right: 1300 } } },
    children: body,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  const f = path.join(OUT, '블로그-초안-연간커리큘럼OT.docx');
  fs.writeFileSync(f, buf);
  console.log('완성:', f);
});
