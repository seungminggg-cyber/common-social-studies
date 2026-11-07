# 기출변형 문제집 — 작업 규칙 (Claude용)

통합사회(2022 개정) 수능 대비 「기출변형 문제집」. 개념서(`../textbook/`, 시안 H)와 짝을 이루는 문제집이다.
강사(승민T)가 요청: 1차(겨울방학 특강용) → 2차(심화) → 별도 세션 검수.

## 분량
- **1차**: 단원별 약 500문항(`content/1/`) + 실전 모의고사 4회(100문항, `content/1/mock/`)
  - 난이도 비율 기본값: 하 10 · 중 35 · 중상 35 · 상 20%
- **2차**: 중상·상 위주 단원별 500문항(`content/2/`) + 모의고사 10회(250문항: 통합사회1 3 · 통합사회2 3 · 전 범위 4)
  - 난이도 비율: 하 0~5 · 중 15 · 중상 45 · 상 35~40%
  - 1차와 같은 자료·같은 선지·같은 사례를 되풀이하지 않는다(`tools/dup-check.mjs`로 확인).
- 단원별 문항 수는 출제율로 나눈다 → `참고/출제율.md`.

## 문항 형식 (개념서 exam 블록과 같은 모양 + 추가 항목)
```js
{
  id: 't2-04-1-003',        // 책-중단원-차수-번호 (바꾸지 않음)
  level: '중상',             // 상 · 중상 · 중 · 하
  concept: [2],             // 개념서 '개념 NN' 번호(content/_cc/<책>.js)
  type: '사상가 비교',        // 개념 이해, 사례 적용, 자료 해석, 그래프 해석, 지도 해석, 사상가 입장, 사상가 비교, 입장 비교, 글 해석, 질문 분류표, 계산
  src: '2026.9 고2 11번 유형', // 근거 기출(내부 메모, 책에는 안 보임)
  stem: '…', data: [블록…], bogi: ['…'], choices: ['…' ×5], answer: 1~5,
  explain: '정답 근거. ① … ② … (오답 선지마다 틀린 이유)',
  note: '…',                // (선택) 보충 설명 — 개념서 범위를 넘는 내용이 나오면 반드시 자세히. 정답과 해설에 '보충 설명' 상자로 나옴
}
```
- 5지 선다. 자료 블록은 개념서 render가 아는 것만(p, dialog, table, chart, map, venn, diagram, figrow 등).
- 정답 번호는 한 단원·한 회 안에서 ①~⑤가 고르게.
- 모의고사 1회 = 25문항, 배점 1.5점 5 · 2점 15 · 2.5점 5문항(합 50점), `points` 항목, 문항마다 `unit`(예: 't2-04').

## 개념서 밖 내용 (강사 결정 2026-11-06)
- 개념서 범위를 조금 넘는 사실·개념을 써도 되지만, 그때는 `note`(보충 설명)에 학생이 해설만 읽고 이해할 수 있을 만큼 자세히 설명한다.
- 강사가 정한 것: 가상 자료 표시 방식, 절대 우위=단위당 노동자 수, 처벌 감수=소로·롤스 공통점은 그대로 둔다. 2·3·4·5번 판단 항목(`참고/강사확인목록.md`)도 그대로 둔다.

## 저작권 (꼭 지킴)
- '기출변형' = 기출의 유형·평가 요소만 살리고 문장·자료·사례·숫자는 새로 쓴다. 시험·문제집·교과서 문장을 옮기지 않는다.
- 저장소는 공개: 드라이브 자료(PDF)·추출한 원문 텍스트·결과 PDF를 **커밋하지 않는다**(`out/`은 .gitignore).
- 실제 숫자는 출처 확인된 것만. 나머지는 "가상 자료". 지도는 우리나라 정부 시각 국경.

## 디자인
- 개념서 시안 H와 같은 느낌: A4, KoPub World, 대단원 색·엄지 색인, 모서리 잘린 네모 번호, 문제 머리(번호·난이도·관련 개념·유형), 괘선 위주.
- `build.mjs`가 `../textbook/lib`(render·paginate·figures·maps·diagrams)과 `../textbook/themes/h.css`를 다시 쓴다.

## 파일
- `content/<차수>/<책>-<중단원>.js` 단원별 문항, `content/<차수>/mock/<회>.js` 모의고사
- `build.mjs` PDF(학생용·정답과 해설)·PNG, `hwpx` 한글 파일
- `tools/` 검사(정답 분포, 중복, 형식)
- `참고/진행.md` 진행 기록(사용량 한도 뒤 이어 가기), `참고/출제율.md`, `참고/검토할점.md`

## 문항 싣는 순서 (강사 요청 2026-11-06)
- 단원별 문항은 파일 순서가 아니라 `content/<차수>/order.json` 순서로 싣는다(번호·정답과 해설·한글 파일 모두). 지문이 긴 문항만 이어져 단이 비지 않도록, 실제 높이를 재서 단마다 꼭 맞게 채우고 난이도를 섞은 순서다.
- 문항을 고치거나 더하면 `node build.mjs <차수> order`로 순서를 다시 만든 뒤 빌드한다(order.json에 없는 문항은 단원 끝에 붙음).
- 단원이 끝난 쪽에 자리가 남으면 다음 단원을 이어 싣는다(LAYOUT.soft). 대단원 첫 단원은 새 쪽(`data-nosoft`). 모의고사는 시험 순서 그대로.
- 문제 자료 표는 칸마다 가운데 정렬, 테두리 전부(wb.css 끝, hwpx_wb.py data_box).


## 2차 검수에서 정한 것 (2026-11-06, `참고/검수결과2.md`)
- 교사용: 해설은 문항 아래 별도 줄(`row-qx`, data-keep=card) — 한 단에 안 들어가면 해설만 다음 단으로, 'NN번 정답 ④'로 시작.
- 문제집에서만 그림 글씨 키움(`build.mjs` bigMapText): 지도 범례·화살표 이름표 약 6pt, 기후 그래프 줄은 두 개씩(cols 2)·폭 240.
- 발문 속 '<보기>'는 줄 끝에서 갈라지지 않게 묶음(wb-render keepBogi). 모의고사 해설 머리 줄은 배점·단원만(유형 뺌).
- 보충 설명에는 내부 이름(u09, tb 등)을 쓰지 않고 '개념서 09 단원', '개념서 개념 05'처럼 쓴다.

## MINIMAX 완성본 (2026-11-07, 시리즈 이름 '정조준' → 'MINIMAX')
- 표지·간지 디자인은 `cover/`(진행 기록 `참고/디자인진행.md`). 강사가 고른 표지 = `cover/mmx.js`의 X5 '네온 길'.
- 만들기(02 기본편): `node build.mjs 1 units mm` → `node cover/build-cover.mjs mmfinal` → `python3 cover/assemble.py 02` → `out/MINIMAX-02-완성본/`.
  03 심화편: `node build.mjs 2 units mm` → `node cover/build-cover.mjs mmfinal 2` → `python3 cover/assemble.py 03` → `out/MINIMAX-03-완성본/`.
  `mm` 모드는 속표지·과목 간지·대단원 간지를 쪽 나누기에 넣고 인쇄용 TrueType 글꼴로 바꾼다(그 전에 `python3 cover/otf2ttf.py` 한 번). 기본 빌드(옛 표지)는 그대로.
- **MINIMAP 개념서**(2026-11-07, 강사가 고른 표지 = `cover/mmap.js`의 M1 '네온 지구', 간지 `cover/mmap-div.js`):
  `textbook`에서 `node build-book.mjs mm` (통합사회2는 `mm t2`) → 기출변형에서 `node cover/build-cover.mjs mmapfinal` → `python3 cover/assemble.py t1`(t2) → `out/MINIMAP-통합사회1-완성본/`.
- **MAXIMIN 실전 모의고사 10회**(2026-11-07, 2차 모의고사, 강사가 고른 표지 = `cover/maxi.js`의 G2 계기판):
  `node build.mjs 2 mock mx`(본문 + 정답과 해설 별책) → `node cover/build-cover.mjs maxifinal` → `python3 cover/assemble.py maximin` → `out/MAXIMIN-완성본/`.
- 뒷표지 대표 문장의 네온 글자는 `cover/mm-letters.js`의 HANGUL에 직접 그린 글자만 쓸 수 있다(새 글자는 그려 넣어야 함).

## MINIMAX 합본 — 과목별 두 권 (강사 결정 2026-11-07)
- 강사: "기본편과 심화편을 나누는 게 의미가 있나, 섞어서 한 권으로" → **MINIMAX 기출분석 통합사회1 · 통합사회2** 두 권(개념서 MINIMAP 1·2와 짝). 기본편(02)·심화편(03)은 더 만들지 않는다(옛 빌드 명령은 남겨 둠).
- 권 안: 중단원마다 **STEP 1 기본(1차 문항) → STEP 2 심화(2차 문항)**, 문항 번호는 중단원 안에서 이어진다. 차례 다음 쪽 '이 책의 구성'. 권 끝에 1차 실전 모의고사(통합사회1 권 1회 = 1차 m1, 통합사회2 권 1~3회 = 1차 m2·m3·m4, 엄지 색인 '모의'). 정답과 해설은 별책(STEP 표시). MAXIMIN(2차 모의고사 10회)은 따로.
- 문항 파일(`content/1`, `content/2`)과 문항 id는 그대로. 합본 순서는 `content/order-vol.json`(단계마다 실제 높이로 단을 채움) — 문항을 고치거나 더하면 `node build.mjs vol order` 다시.
- 표지·간지: '네온 길' 그대로, 글자만 '통합사회 기출분석 / 통합사회1(2)'. 통합사회1 = 남색·하늘 네온, 통합사회2 = 보라·분홍 네온(`cover/mmx.js` X5_PAL, MINIMAP과 같은 짝).
- 만들기: `node build.mjs vol order`(문항이 바뀐 때만) → `node build.mjs vol t1 [teacher]`(t2) → `out/vol/MINIMAX-통합사회1-본문.pdf`(178쪽)·`-정답과해설.pdf`(49쪽)·`-교사용.pdf`
  → `node cover/build-cover.mjs mmvol` → `python3 cover/assemble.py x1`(x2) → `out/MINIMAX-통합사회1-완성본/`
  → 한글 `python3 -I hwpx_wb.py out/vol/MINIMAX-통합사회1-본문.json out/vol/MINIMAX-통합사회1.hwpx [teacher]` → `python3 -I tools/hwpx-check.py vol`
  · 쪽 검사 `node tools/page-check.mjs --dir out/vol`. 통합사회2: 본문 215쪽 · 정답과 해설 65쪽.

## 다음 검수 방식 (강사 결정 2026-11-06)
- **바뀐 문항만 검수한다.** 1,350문항 전체 검수는 2차 검수(main `893eeb8`)로 끝났다. 다음부터는 그 뒤에 바뀌거나 새로 생긴 문항만 본다(`git diff 893eeb8 -- 기출변형/content`에서 문항 id를 뽑음). 검수가 끝나면 이 기준 커밋을 새로 적는다.
- **그림 확인은 프로그램 검사부터.** 쪽 그림에서 글자가 그림·단 밖으로 나감, 글자 겹침, 단 아래 넘침, 큰 빈 단, 너무 작은 글씨를 먼저 자동으로 찾는다. 눈으로는 검사에 걸린 쪽과 바뀐 문항이 있는 쪽만 본다.
- 그림 확인을 더 가벼운(값싼) 모델에 맡기지 않는다 — 강사가 원하지 않음.

## 검사 도구 (`tools/`, 2026-11-06 정리)
| 도구 | 하는 일 |
|---|---|
| `node tools/check.mjs <차수> [단원키\|mock]` | 형식 오류, 정답 분포, 난이도 비율 |
| `node tools/dup-check.mjs <차수> [--vs 1] [--src <글자본 폴더>]` | 1·2차 겹침, 기출·문제집 원문과 같은 문장 |
| `node tools/changed.mjs [기준커밋] [--ids]` | **바뀐 문항 뽑기**(기준은 `참고/검수기준.txt`). 검수가 끝나면 기준을 새 커밋으로 바꾼다 |
| `node tools/explain-check.mjs [차수] [--ids a,b]` | 해설에 오답 선지(①~⑤)·<보기>(ㄱ~ㄹ)마다 이유가 있는지 |
| `node tools/note-check.mjs` | 교과 범위 문항(`참고/교과범위.json`)의 보충 설명, 내부 이름(u09 등) 섞임, 너무 짧은 보충 설명 |
| `node tools/page-check.mjs <차수> [책이름] [--only id,…] [--all]` | **쪽 그림 자동 검사**(빌드 뒤): 넘침·그림 글자 잘림·겹침·같은 이름 두 번·연도 쉼표·5pt 미만 글씨·문제 머리 두 줄·빈 단 |
| `python3 -I tools/hwpx-check.py <차수>` | 한글 파일이 PDF와 같은지(문항 순서·보충 설명·그림 수) |

바뀐 문항 검수 순서: `changed.mjs --ids` → 그 문항을 읽고 고침 → `check`·`explain-check --ids`·`note-check`·`dup-check` → `build.mjs <차수> order` → 빌드 → `page-check --only <id들>`(전체도 한 번) → 걸린 쪽만 PNG로 눈 확인 → 한글 파일 → `hwpx-check`.

## Paffy 견본 주문 파일 (2026-11-07, MINIMAP 개념서 1·2권)
- Paffy(대성전산 교재 제작 플랫폼) 규격(사이트 프로그램·공개 옵션에서 확인): A4, 표지 한 면 213mm(210 + 바깥 도련 3) × 303mm(297 + 도련 3×2),
  펼침 표지 = 뒷표지 + 책등 + 앞표지 한 장. 책등 = 내지 두께 × 쪽수 ÷ 2를 0.5mm 단위로 올림(미색 모조플러스 100g = 0.11mm, 80g = 0.09mm),
  무선 제본은 짝수 쪽(홀수면 끝 백지), 49쪽 이상. 자동 검수: 쪽 크기 같음·글자 윤곽선·Acrobat PDF 여부·주석 없음(권장 CMYK).
- 만들기: textbook에서 `node build-book.mjs mm`, `mm t2` → 기출변형에서 `node cover/build-cover.mjs mmappaffy`(본문 쪽수로 책등 계산, 책등 디자인 `cover/mmap.js`의 m1Spine)
  → `python3 cover/paffy.py`(표지 크기 정확히, 내지 A4·짝수 쪽, Ghostscript로 글자 윤곽선) → `out/paffy/`(커밋하지 않음).
- 첫 견본(2026-11-07): 통합사회1 내지 274쪽(273 + 빈 쪽) 책등 15.5mm, 통합사회2 270쪽 책등 15mm. 색은 RGB 그대로(인쇄소가 변환), 내지는 도련 없는 A4.
- 2차(2026-11-07 밤, 강사): 속표지·특강 진도표·학습 계획표 빼기, 이 책의 구성 → 차례 순, 간지 문구 정리, 쪽수 줄이기(간지 오른쪽 고정 해제, 날개 없는 글 쪽 폭 전체,
  간격 줄임, 개념 확인 2단 + 수능형 문제 띠는 쪽 폭 전체로 이어 붙임 `softRegion`) → 통합사회1 259쪽(+빈 쪽 = 260, 책등 14.5mm), 통합사회2 258쪽(14.5mm).
  이 모양은 MINIMAP 빌드(`build-book.mjs mm`, body.mmbook)에만 적용된다.
