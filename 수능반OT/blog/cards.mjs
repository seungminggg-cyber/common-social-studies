// 학원 블로그 글에 넣을 카드 그림 6장 (2028 수능 대비 연간 커리큘럼 OT 글)
//   node 수능반OT/blog/cards.mjs  →  수능반OT/out/블로그/카드-1~6.jpg
// 디자인은 학원 블로그의 기존 통합사회 글 카드와 맞춤(2026-11-26): 진한 파랑(#0C357F) + 연회색 바탕 + 흰 카드,
// 위쪽 학원 마크 머리글, 노랑 강조, 세로 4:5(966×1208). 내용은 최종 OT PPT에 있는 사실만.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(ROOT, '../package.json'));
const { chromium } = (() => { try { return require('playwright'); } catch { return require('/opt/node22/lib/node_modules/playwright'); } })();
const OUT = join(ROOT, '../out/블로그');
mkdirSync(OUT, { recursive: true });
const ART = join(ROOT, '../out/art');
const url = (p) => pathToFileURL(p).href;
const MARK = url(join(ROOT, 'logo-mark-white.png'));
const SUB = '2028 수능 대비 연간 커리큘럼 · 이승민T';

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Pretendard',sans-serif;color:#0C2557;-webkit-font-smoothing:antialiased}
  .card{width:966px;height:1208px;position:relative;overflow:hidden;background:#F2F4F8;padding:64px 60px}
  .card.blue{background:#0C357F;color:#fff}
  .head{display:flex;align-items:center;gap:16px}
  .mk{width:58px;height:58px;border-radius:12px;background:#0C357F;display:flex;align-items:center;justify-content:center}
  .blue .mk{background:transparent}
  .mk img{width:44px}
  .blue .mk img{width:58px}
  .ht b{display:block;font-size:22px;font-weight:700}
  .ht span{display:block;font-size:17px;font-weight:500;color:#5B6B84;margin-top:3px}
  .blue .ht span{color:#C9D5EE}
  .kick{font-size:28px;font-weight:600;color:#40506A;margin-top:58px}
  .title{font-size:68px;font-weight:800;color:#0C357F;letter-spacing:-1.5px;margin-top:8px;line-height:1.15}
  .y{color:#FFC531}
  .box{background:#fff;border:2px solid #E1E6EF;border-radius:16px}
  .hi{background:#0C357F;border-color:#0C357F;color:#fff}
  .row{display:flex;align-items:center;justify-content:space-between;padding:0 34px;height:126px;margin-top:22px}
  .row .l{font-size:24px;font-weight:500;color:#5B6B84}
  .row.hi .l{color:#C9D5EE}
  .row .v{font-size:39px;font-weight:800;color:#0C357F;letter-spacing:-.5px}
  .row.hi .v{color:#FFC531}
  .foot{position:absolute;left:60px;right:60px;bottom:64px}
  .arrow{font-size:28px;font-weight:700;color:#0C357F;text-align:center}
  .chip{display:inline-block;background:rgba(255,255,255,.14);border-radius:30px;padding:10px 22px;font-size:22px;font-weight:600}
  .deco{position:absolute;border:46px solid rgba(255,255,255,.06);border-radius:50%}
`;
const head = (blue) => `<div class="head"><div class="mk"><img src="${MARK}"></div><div class="ht"><b>너를위한 메이트 · 김포관</b><span>${SUB}</span></div></div>`;
const page = (cls, inner) => `<div class="card ${cls}">${head(cls.includes('blue'))}${inner}</div>`;

const cards = [];

// 1. 표지
cards.push(page('blue', `
  <div class="deco" style="width:760px;height:760px;right:-330px;top:-260px"></div>
  <div class="deco" style="width:560px;height:560px;left:-300px;bottom:120px"></div>
  <div style="margin-top:150px"><span class="chip">예비 고3 · N수생</span></div>
  <div style="font-size:84px;font-weight:800;line-height:1.14;letter-spacing:-2px;margin-top:30px">2028 수능 대비<br>연간 커리큘럼</div>
  <div class="y" style="font-size:104px;font-weight:900;letter-spacing:-3px;margin-top:26px">통합사회 이승민</div>
  <div style="font-size:30px;font-weight:600;margin-top:26px;color:#DCE5F7">겨울 개념부터 11월 수능까지, 1년</div>
  <div class="foot" style="display:flex;gap:16px">
    ${[['개강', '2027. 1. 4.(월)'], ['수업', '매주 3시간 30분'], ['교재', '자체 제작 4종']].map(([k, v]) => `<div class="box" style="flex:1;padding:22px 24px;border:0"><div style="font-size:19px;color:#5B6B84;font-weight:600">${k}</div><div style="font-size:28px;font-weight:800;color:#0C357F;margin-top:6px">${v}</div></div>`).join('')}
  </div>`));

// 2. 왜 지금부터
cards.push(page('', `
  <div class="kick">수능 통합사회,</div>
  <div class="title">왜 지금부터?</div>
  <div style="margin-top:34px">
    ${[['고3 1학기', '내신 · 수행평가 · 생기부', true], ['고2 · 고3', '학교 수업 없음, 2년 공백'], ['2028 수능부터', '이과 최상위권도 응시'], ['N수생', '옛 교육과정 시험 없음']].map(([l, v, hi]) => `<div class="box row ${hi ? 'hi' : ''}"><span class="l">${l}</span><span class="v">${v}</span></div>`).join('')}
  </div>
  <div class="foot"><div class="box" style="padding:30px;text-align:center;border-color:#0C357F;border-width:3px"><div style="font-size:24px;color:#5B6B84;font-weight:600">그래서</div><div style="font-size:40px;font-weight:800;color:#0C357F;margin-top:6px">개념은 학교가 시작하기 전, 겨울에</div></div></div>`));

// 3. 수시 최저
const reason = (no, t, tags, out, hi) => `<div class="box" style="padding:44px 40px;margin-top:30px">
  <div style="display:flex;align-items:baseline;gap:18px"><span style="font-size:38px;font-weight:800;color:#0C357F">${no}</span><span style="font-size:42px;font-weight:800;color:#0C2557;letter-spacing:-.5px">${t}</span></div>
  <div style="display:flex;gap:12px;margin-top:22px;flex-wrap:wrap">${tags.map((g) => `<span style="background:#E8EEF8;color:#0C357F;border-radius:10px;padding:14px 20px;font-size:27px;font-weight:700">${g}</span>`).join('')}</div>
  ${out ? `<div style="margin-top:26px;font-size:33px;font-weight:800;color:#0C357F">→ ${out}</div>` : ''}
</div>`;
cards.push(page('', `
  <div class="kick">통합사회로 최저 맞추기,</div>
  <div class="title">과연 쉬울까요?</div>
  <div style="margin-top:22px">
    ${reason('01', '모두가 잘 보는 과목', ['진입장벽 낮음', '과목 난이도 낮음'], '무조건 만점에 가까운 등급컷')}
    ${reason('02', '2028 수능, 개정 첫해', ['불확실한 시중 문제집 퀄리티', '혼자서는 효율이 어려움'], '')}
  </div>
  <div class="foot"><div class="box hi" style="padding:34px;text-align:center"><span style="font-size:46px;font-weight:900;letter-spacing:-1px">그래서, <span class="y">승민T 통합사회</span></span></div></div>`));

// 4. 교재 4종
const book = (img, name, sub, line) => `<div class="box" style="padding:22px;display:flex;gap:20px;align-items:center">
  ${img}
  <div><div style="font-size:32px;font-weight:900;color:#0C357F;letter-spacing:.5px">${name}</div><div style="font-size:22px;font-weight:700;color:#0C2557;margin-top:8px">${sub}</div><div style="font-size:19px;font-weight:500;color:#5B6B84;margin-top:8px;line-height:1.35">${line}</div></div>
</div>`;
const cover = (f) => `<img src="${url(join(ART, f))}" style="width:156px;height:220px;border-radius:6px;object-fit:cover;flex:none;box-shadow:0 4px 10px rgba(12,37,87,.18)">`;
const mintCover = `<div style="width:156px;height:220px;border-radius:6px;background:#061A2C;flex:none;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(12,37,87,.18)"><img src="${url(join(ART, 'logo-mint.png'))}" style="width:138px"></div>`;
cards.push(page('', `
  <div class="kick">직접 분석하고, 직접 만든</div>
  <div class="title">교재 4종</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:40px">
    ${book(cover('cover-mmap1.jpg'), 'MINIMAP', '개념서 (통합사회1·2)', '개념마다 출제 빈도<br>기출 선지 O/X')}
    ${book(cover('cover-mmx.jpg'), 'MINIMAX', '기출분석서', '기본편 · 심화편<br>각 약 500문항')}
    ${book(cover('cover-maxi.jpg'), 'MAXIMIN', '실전 모의고사 10회', '회마다 25문항 · 50점<br>정답과 해설 별책')}
    ${book(mintCover, 'MINT', '주간지', '하루 30분, 네 단계<br>빈칸 · O/X · 사료 · 실전')}
  </div>
  <div class="foot"><div class="box hi" style="padding:30px 34px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:23px;color:#C9D5EE;font-weight:600;line-height:1.4">예시문항 + 2025~2026<br>학평 200문항 분석</span>
    <span style="font-size:52px;font-weight:900" class="y">1,300<span style="font-size:30px;color:#fff;font-weight:800">여 문항</span></span>
  </div></div>`));

// 5. 1년 로드맵
const stop = (n, name, when, desc, exam, hi) => `<div style="display:flex;gap:24px;align-items:stretch;margin-top:16px">
  <div style="width:64px;display:flex;flex-direction:column;align-items:center"><div style="width:58px;height:58px;border-radius:50%;background:${hi ? '#FFC531' : '#0C357F'};color:${hi ? '#0C357F' : '#fff'};font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center">${n}</div>${n < 4 ? '<div style="flex:1;width:4px;background:#C7D2E6;margin-top:6px"></div>' : ''}</div>
  <div class="box" style="flex:1;padding:22px 28px;display:flex;justify-content:space-between;align-items:center">
    <div><div style="font-size:19px;font-weight:700;color:#5B6B84">${when}</div><div style="font-size:32px;font-weight:800;color:#0C357F;margin-top:4px">${name}</div><div style="font-size:20px;font-weight:500;color:#40506A;margin-top:6px">${desc}</div></div>
    <span style="background:#0C357F;color:#FFC531;border-radius:10px;padding:10px 16px;font-size:21px;font-weight:800;white-space:nowrap">→ ${exam}</span>
  </div></div>`;
cards.push(page('', `
  <div class="kick">1년을 네 구간으로</div>
  <div class="title">1년 로드맵</div>
  <div style="margin-top:26px">
    ${stop(1, '개념', '1월 ~ 3월 20일', '통합사회1·2 전 범위 + 예시문항 7가지 유형', '3월 학평', true)}
    ${stop(2, '기출 N제', '3월 말 ~ 6월 초', '기출 분석·변형 문항 + 수능특강', '6월 모평')}
    ${stop(3, '고난도 + 주간 실전', '6월 중순 ~ 9월 초', '6모 분석으로 시작 · 수특·수완·6모 반영', '9월 모평')}
    ${stop(4, '파이널', '9월 ~ 수능', '9모 분석으로 시작 · 실전 모의고사 집중', '수능')}
  </div>
  <div class="foot"><div class="box hi" style="padding:24px 34px;display:flex;align-items:center;justify-content:space-between">
    <span style="font-size:24px;font-weight:700;line-height:1.45">매주 실전 모의고사 최소 약 45회<br><span style="color:#C9D5EE;font-weight:600">파이널까지 최종</span></span>
    <span style="font-size:52px;font-weight:900" class="y"><span style="font-size:26px;color:#fff">약 </span>70~80<span style="font-size:28px;color:#fff">회</span></span>
  </div></div>`));

// 6. 수강 안내(수업 구성·숙제 원칙 포함)
const info = (k, v, sub) => `<div style="display:flex;gap:24px;padding:18px 0;border-bottom:2px solid #EDF0F5"><span style="width:96px;flex:none;font-size:20px;font-weight:600;color:#5B6B84;padding-top:4px">${k}</span><div><div style="font-size:27px;font-weight:800;color:#0C2557">${v}</div>${sub ? `<div style="font-size:19px;font-weight:500;color:#5B6B84;margin-top:5px">${sub}</div>` : ''}</div></div>`;
cards.push(page('', `
  <div class="title" style="margin-top:46px">수강 안내</div>
  <div class="box" style="padding:10px 34px;margin-top:26px">
    ${info('강좌', '2028 수능 대비 통합사회 연간 커리큘럼')}
    ${info('대상', '예비 고3 · N수생')}
    ${info('개강', '2027. 1. 4.(월)')}
    ${info('시간', '1~2월 월요일 오전 10시 ~ 1시 반', '3월 이후 토요일 오후 2시 반 ~ 6시')}
    ${info('수업', '매주 3시간 30분', '복습 테스트 15분 · 수업 2시간 35분 · 실전 모의고사 + 오답 정리 40분')}
    <div style="display:flex;gap:24px;padding:18px 0"><span style="width:96px;flex:none;font-size:20px;font-weight:600;color:#5B6B84;padding-top:4px">숙제</span><div style="font-size:21px;font-weight:600;color:#0C2557;line-height:1.55">1~2월 · 7월~수능: 매주 교재 + 주간지<br><b style="color:#0C357F">3~6월 고3: 숙제 없음</b> (내신 집중)<br>3~6월 N수: 교재 + 주간지</div></div>
  </div>
  <div class="foot"><div class="box hi" style="padding:26px 34px">
    <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:38px;font-weight:800">031-8049-0716</span><span style="font-size:20px;color:#C9D5EE">평일 오후 4~10시</span></div>
    <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px"><span style="font-size:38px;font-weight:800" class="y">010-5528-9505</span><span style="font-size:20px;color:#C9D5EE">문자 전용</span></div>
  </div><div style="font-size:16px;color:#7A869A;margin-top:14px">너를위한메이트 김포 · 사우역 도보 5분</div></div>`));

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${cards.map((c, i) => `<div id="c${i + 1}" style="width:966px;height:1208px;margin-bottom:20px">${c}</div>`).join('')}</body></html>`;
const tmp = join(OUT, '_cards.html');
writeFileSync(tmp, html);
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 966, height: 1208 }, deviceScaleFactor: 2 });
await pg.goto(url(tmp));
await pg.evaluate(() => document.fonts.ready);
for (let i = 1; i <= cards.length; i++) await pg.locator(`#c${i}`).screenshot({ path: join(OUT, `카드-${i}.png`) });
await browser.close();
console.log(`카드 ${cards.length}장 → ${OUT}`);
