# 승민T 통합사회 개념서 만들기

수능 대비 개념서를 **내용**과 **디자인**으로 나눠서 만듭니다.
내용은 한 번만 쓰고, 디자인(시안 A·B·C)은 바꿔 끼울 수 있습니다.
같은 내용으로 학생용(빈칸)·교사용(채움) PDF와 한글 파일(.hwpx)을 만듭니다.

## 폴더 구성
| 위치 | 하는 일 |
|---|---|
| `content/t1-1.js` | 통합사회1 Ⅰ단원 내용 (개념, 개념 확인, 수능형 문제, 해설) |
| `themes/a.css` | 시안 A · 날개형 (본문 옆 날개 메모, 글자 칸 빈칸, 보라색) |
| `themes/b.css` | **시안 B · 카드형 (강사 선택)** — 넓은 한 단, 청록·남색, 밑줄 빈칸 |
| `themes/c.css` | 시안 C · 2단 노트형 (칠판 머리, 2단, 주황색, 손글씨 한마디) |
| `themes/d.css` | **시안 D · 교과서형 (강사 확정, 기본값)** — B를 바탕으로 대단원별 색, 엄지 색인 |
| `themes/e.css` | 시안 E · 시험지와 판서 (견본, 강사 확인 대기) — D 위에 덮어씀. 제목·원문·자료·수능형 문제는 명조(Hahmlet), 설명은 고딕. 상자 대신 괘선, 대단원 색 형광펜, 단원 첫 쪽만 크게. `node build.mjs t2-2 e student png` |
| `themes/f.css`·`g.css`·`h.css` | 견본(강사 확인 대기). F: 기출 데이터형(개념 카드·별점·이렇게 나온다·한 장 정리, 진한 색). G: F의 구조 + 차분한 겉모습 + 회독 체크·스티커. H: 편집 디자인형(KoPub World 글꼴, 본문+바깥 날개 단 격자, 모서리 잘린 네모 상징, 인쇄용 차분한 색, 알약 이름표·아이콘 없음). 견본 내용은 `content/z-sample-f.js` → `node build.mjs z-sample-f h student png` |
| `themes/base.css` | 모든 시안이 함께 쓰는 A4 쪽 뼈대 |
| `content/t1-2.js` | 통합사회1 Ⅱ단원 내용 |
| `content/t1-3.js` ~ `t1-5.js` | 통합사회1 Ⅲ~Ⅴ단원. 길어서 중단원마다 `_t1-3/u05.js`처럼 나눠 두고 여기서 모은다 (밑줄로 시작하는 폴더는 단원 목록에 안 잡힘) |
| `content/z-gallery.js` | 그림 기능 견본 (시험용, 기본 만들기에서 빠짐) |
| `lib/render.js` | 내용 → HTML 변환 |
| `lib/figures.js` | 그래프·지도·벤 다이어그램 그리기 (SVG) |
| `lib/paginate.js` | 브라우저에서 A4 쪽 나누기, 빈칸 번호·쪽 아래 정답 띠 |
| `build.mjs` | PDF·쪽 그림 만들기 |
| `hwpx_build.py` | 한글 파일(.hwpx) 만들기 — 시안 B 모양 |

## 만드는 법
```bash
cd textbook
npm install
node build.mjs                      # 모든 단원, 시안 H(기본), 학생용 PDF → out/
node build.mjs t1-2 b both png      # Ⅱ단원, 학생용+교사용, 쪽 그림(PNG)까지
node build.mjs z-gallery b          # 그림 기능 견본
```
Playwright(크롬)가 설치된 환경이 필요합니다.

## 중단원 구성
1. **단원 첫머리** — 번호, 제목, 핵심 질문, 수능 포인트
2. **개념 정리** (A, B, …) — 의미·특징·탐구 방법·예시 표, 날개 메모(개념 더하기), 헷갈리는 개념, 자료 읽기
3. **수능 자료 해석 연습** — 수능 자료를 푸는 순서를 STEP으로
4. **승민T 한마디** — 함정 포인트
5. **개념 확인** — OX, 빈칸
6. **수능형 문제** — 5지선다 (난이도 하·중·상)
7. **정답과 해설** — 책 끝에 모음

## 쪽 나눔 규칙 (`lib/paginate.js`)
- 사상가 카드는 한 쪽에 **통째로** 들어간다. 카드가 한 쪽보다 길 때만 조각(핵심 주장 / 원전 읽기 / 기출 선지) 경계에서 나뉘고, 다음 쪽에 "(이어서)" 이름표가 붙는다.
- 조금 넘치면 그 쪽만 간격을 줄여(.tight) 맞춘다.
- 쪽 아래가 조금 남으면 블록 사이를 고르게 벌리고, 많이 남으면(쪽의 10% 이상) **정리 노트** 칸으로 채운다. 문제 쪽은 두 단 높이를 맞추고 아래에 **오답 노트** 칸을 넣는다.
- 쪽마다 남는 공간을 재 보려면 PNG를 만들어 확인한다. 카드가 한 쪽에 안 들어가면 내용을 조금 줄이거나 순서를 바꾼다.

## 내용 쓰는 법 (`content/*.js`)
문장 안에서 이렇게 표시합니다.
- `[[낱말]]` 빈칸 (학생용은 비우고 쪽 아래 정답 띠에, 교사용은 채워서)
- `**낱말**` 굵게, `==낱말==` 형광펜, `__낱말__` 밑줄

모든 문장은 교재를 옮기지 않고 새로 씁니다. (저작권)

## 그림 자료 (그래프·지도·벤 다이어그램·표)
숫자 데이터로 직접 그립니다. 예시는 `content/z-gallery.js`에 다 있습니다.
| 블록 | 쓰임 |
|---|---|
| `{ t: 'chart', kind: 'bar' }` | 세로 막대 (여러 계열) |
| `kind: 'hbar'` | 가로 막대, 순위 비교 (`highlight`로 강조) |
| `kind: 'stack100'` | 100% 누적 막대 (응답 비율) |
| `kind: 'line'` | 꺾은선, `schematic: true`면 숫자 없는 개념도 (`smooth`, `dash`, `end` 이름표(겹치면 `endDy`로 위아래 이동), `vlines` 기준선, `notes` 그래프 안 글씨) |
| `kind: 'scatter'` | 산점도 (`trend: true` 추세선) |
| `kind: 'pie'` | 원그래프 (`donut: true`) |
| `kind: 'climate'` | 기후 그래프 (월평균 기온 + 월 강수량) |
| `{ t: 'venn' }` | 벤 다이어그램 (A 왼쪽만, B 공통, C 오른쪽만) |
| `{ t: 'map', view: 'world' }` | 세계 지도 / `view: [서경, 남위, 동경, 북위]` 지역 지도. 나라 색칠(`highlight`), 지점(`markers`), 화살표(`arrows`), 이름표(`labels`). 자세한 설정은 아래 '지도' |
| `{ t: 'figrow', items: [그림, 그림] }` | 그림 나란히 놓기 (기후 그래프 비교 등). 기후 그래프는 `compact: true`. 한글 파일에는 줄 전체가 그림 한 장으로 들어감 |
| `{ t: 'table' }` | 칸 합치기 `{ text, rs, cs }`, 여러 줄 머리, 열 정렬 `align`, 강조 칸 `cls: 'hl'`, 빗금 빈칸 `cls: 'hatch'` |

공통: `title`(제목), `source`(출처), `note`(설명), `width`(폭 %), `h`(높이), `w`(좁은 단에서 글자를 키우려면 420 정도), `keepNext: true`(다음 블록과 같은 쪽에 두기 — 지도와 그 표 등).
- `kind: 'line'`의 `between: { a, b, pos: { label, x, y }, neg: {…}, rate: { end } }`: 두 선 사이를 a > b면 초록, a < b면 빨강으로 칠하고, `rate`를 주면 a − b 값을 점선으로(인구 변천 모형). `y.min`이 음수면 0 기준선.
- `kind: 'hbar'`의 `labW`(이름 칸 폭을 맞춰 여러 그래프의 막대 시작점 맞추기), `digits`(값 소수 자리, 6 → 6.0).

개념서에만 적용되는 모양(그림 아래 설명 글씨·출처 크기, 개념어 한 줄 묶기, 개념 더하기 가운데 정렬)은 `themes/h.css` 끝의 `.tb` 규칙이다.
`<body class="… tb">`는 개념서 렌더러(`renderBook`, `renderFull`)만 붙이므로 같은 CSS를 쓰는 문제집(기출변형)에는 적용되지 않는다.
한글 파일도 같은 이유로 `hwpx_build.py`의 `TEXTBOOK`(직접 실행할 때만 참)으로 나눈다.
출처를 확인한 숫자만 실제 자료로 쓰고, 나머지는 "개념도"나 "가상 자료"라고 적습니다.

## 지도 (2026-11 새 방식, `lib/maps.js`)
| 설정 | 모양 |
|---|---|
| `style: 'terrain'` | 지형도: 실제 고도로 산지·평야 색과 음영, 바다 깊이. `palette: 'soft'`면 베이지 한 톤의 옅은 음영(기후·분포도 바탕) |
| `style: 'political'` | 나라마다 다른 색(이웃 나라는 다른 색) |
| `style: 'thematic'`(기본) | 옅은 땅 + 주제 색칠(문화권·종교 분포 같은 개념도) |
| `choro: { data: { ISO3: 값 }, breaks, colors, title, labels }` | 단계 구분도(실제 통계로 나라별 색칠) |
| `center: 150` | 세계 지도 가운데 경도(태평양 중심) |
| `seas`, `labels[].cls` | 바다 이름(파란 기울임), `cls: 'country'·'river'·'terr'(산맥)·'region'·'strong'`, `rot` 기울기 |
| `rivers`, `lakes`, `riverEmph: ['Mekong']` | 강·호수 표시 등급, 강조할 강 |
| `provinces: true`, `krRivers` | 우리나라 시·도 경계, 우리나라 하천(최소 유역 km²) |
| `plates: true` | 판의 경계(Bird 2003) |
| `borders: false`, `deg: false`, `north: false`, `scale: false` | 국경·경위도 숫자·방위표·축척 끄기 |
| `legend: [{ pin }, { line: 'border'·'river'·'prov'·'mdl'·'plate'·'warm'·'cold'·'wind' }, { fill }]`, `legendV`, `legendAt` | 범례 모양·세로 배치·위치 |

- 바탕 자료는 `data/geo/` (Natural Earth 강·호수, **우리나라 정부 시각의 국경**(Natural Earth 'KOR' 판: `countries-kor-10m/50m.json`, 군사 분계선 등 `ne-special-lines.json`), 통계청 시·도 경계(2023 군위군 대구 편입 반영), 판의 경계, 고도 자료로 계산한 우리나라 하천). 다시 만들 때는 `tools/geo-prep.mjs`.
- 나라 이름은 ISO3 코드(`KOR`, `JPN` …)로 쓴다. 예전 이름('South Korea' 등)은 `lib/maps.js`의 `ALIAS`로 바꿔 준다.
- 지형도 바탕 그림은 `assets/terrain/<번호>.jpg`. 지도 설정(범위·크기)을 바꾸면 빌드할 때 `lib/terrain.js`가 고도 타일(AWS Terrain Tiles)을 내려받아 새로 만든다(인터넷 필요, 타일은 `~/.cache/terrain-tiles`).
- 우리나라 하천은 `tools/terrain/mosaic.py` + `tools/terrain/rivers.mjs`로 고도 자료에서 물길을 계산한 것(작은 지류는 실제와 조금 다를 수 있음).

## 시안 H와 개념 계획 (2026-11 강사 확정)
기본 디자인은 **시안 H(편집 디자인형, `themes/h.css`)**입니다. 중단원은 '개념 01, 02 …' 한 가지로만 나눕니다.
- 내용 파일(`content/_t2-2/u04.js` 등)은 그대로 두고, 책마다 **개념 계획** `content/_cc/<책>.js`를 따로 적습니다. 책 파일이 `withCC(book, cc)`로 빌드할 때 붙입니다(`content/_cc/apply.js`).
  - `concepts`: 개념이 시작하는 블록(`at`), 제목, 출제 빈도(`stars` 1 기본 개념 · 2 빈출 · 3 최다 빈출, 근거 `hits`), 개념 끝 '이렇게 나온다' O/X(`pattern`)
  - `summary`: 중단원 끝 '한 장 정리'(한 줄 요약, 개념별 핵심, 헷갈리지 말자, 시험 전 체크) — 한 쪽에 들어가야 함
  - `exam`: 수능형 문제마다 [관련 개념 번호, 문제 유형]
  - A·B·C 큰 묶음 제목은 빠지고, '수능 자료 해석 연습' 묶음만 글자 없이 남습니다.
- 출제 빈도는 `참고/기출분류.json`(2028 수능 예시문항 + 2025~2026 고1·고2 학평 8회)에서 그 개념을 직접 물은 문항 수입니다.
- 계획을 짤 때: `node tools/cc-outline.mjs t2-2 04` (원래 블록 순서, 개념 나누기 결과, 문제, 그 대단원의 기출 분류)
- 글꼴: KoPub World 돋움·바탕(npm `font-kopubworld`, 한국출판인회의 약관: 출판물 사용 무료, 서체 판매 금지). 본문 + 바깥쪽 날개 단 격자, 모서리 잘린 네모가 상징 모양입니다.
- 예전 디자인으로 만들려면 `node build.mjs t2-2 d`, `node build-book.mjs d`.

## 인포그래픽 도식 (`lib/diagrams.js`, 2026-11)
`{ t: 'diagram', kind, title, width, note }` — 아이콘(Tabler Icons, MIT)과 대단원 색으로 그리는 개념 도식. 견본은 `content/z-diagrams.js`.
| `kind` | 모양 |
|---|---|
| `cycle` | 순환 고리 (`nodes: [{ title, text, icon }]`, `center`) |
| `concentric` | 동심원 + 옆 설명 (`rings: [{ short, title, text }]`, 안쪽부터) |
| `triangle` | 삼각형 꼭짓점 셋 (`corners`, `split: ['위', '아래']` 점선, `center`) |
| `stairs` | 왼쪽→오른쪽으로 높아지는 계단 (`steps`, `arrow`) |
| `timeline` | 연표 (`events: [{ year, title, text, icon }]`) |
| `cards` | 아이콘 카드 여러 장 (`items: [{ title, text, icon, tag }]`, `cols`) |
| `layers` | 피라미드(`shape: 'pyramid'`)·쌓기(`'stack'`) (`layers`는 아래에서부터) |
| `econflow` | 가계·기업(·정부) 경제 순환 (`gov: true`) |
| `cultchange` | 문화 변동 세 양상(동화·병존·융합) (`items`) |
| `venn3` | 세 원 겹치기 (`sets`, `texts`, `center`) |
- `hub`·`chain`·`flow` 블록에도 `icon: '이름'`을 줄 수 있다. 아이콘 이름은 https://tabler.io/icons (outline).

## 사진 (`lib/photos.js`, 위키미디어 공용)
- `{ t: 'photo', title, h, items: [{ src: 'ph-…', caption, flex, pos }] }`. 사상가 카드는 `photo: 'pt-…'`(정사각형 초상).
- 사진 파일은 `assets/photos/<id>.jpg`, 출처는 `assets/photos/credits.json`(제목·저작자·라이선스·원본 주소). 사진마다 아래에 저작자·라이선스를 적고, 단원 끝과 통합본 끝에 '사진 출처' 쪽이 자동으로 붙는다.
- 자유 라이선스(CC BY, CC BY-SA, CC0, 퍼블릭 도메인)만 쓴다. 사진 파일이 없으면 그 사진 블록은 건너뛴다(빌드는 그대로 됨).
- 내려받기: upload.wikimedia.org는 요청 제한(429)이 심해서 `commons.wikimedia.org/w/thumb.php?f=파일이름&w=960`으로 받는다(주소 끝 `?utm_…`는 떼야 함).

## 한글 파일
`hwpx_build.py`가 같은 내용으로 시안 B 모양의 한글 파일(.hwpx)을 만듭니다.
색 띠·표·상자는 모두 한글 "표"라서 한글에서 바로 고칠 수 있습니다.
PDF와 다른 점:
- 한글이 쪽을 스스로 나누므로, 빈칸 정답은 쪽 아래가 아니라 개념 부분 끝에 모읍니다.
- 둥근 모서리는 없고, 작은 이름표(A, 개념 더하기 등)는 형광펜으로 만듭니다.
- 글꼴은 맑은 고딕(Windows 기본). Pretendard를 설치했다면 파일 위쪽 `FONT`를 바꿉니다.
- 표 안에 표를 넣지 않습니다(한글에서 깨질 수 있어서).
- 그래프·지도는 PDF와 같은 그림을 PNG로 찍어 넣습니다(제목·출처는 글자로).
```bash
pip install python-hwpx==6.11.0
node build.mjs t1-2 b        # out/t1-2.json 과 그림(out/fig/t1-2/*.png)을 먼저 만든다
python3 hwpx_build.py out/t1-2.json out/t1-2-B-학생용.hwpx
python3 hwpx_build.py out/t1-2.json out/t1-2-B-교사용.hwpx teacher
```

## 통합본 (한 권으로 묶기)

```bash
node build-book.mjs          # 학생용 개념서 + 교사용 개념서 + 별책 정답과 해설 (PDF 3개)
node build-book.mjs png      # 쪽 그림(out/png/book-*.png)도 저장
node build-book.mjs t2       # 통합사회2 통합본 (content/_book/t2.js, 기본은 통합사회1)
```

- 묶을 대단원과 간지 문구는 `content/_book/t1.js`에 있다. 디자인은 `themes/book.css`.
- 순서: 표지 → 이 책의 주인 → 차례 → 이 책의 구성 → (간지 → 학습 계획표 → 중단원) × 대단원 → 뒤표지.
- 양면 인쇄용: 간지는 늘 오른쪽(홀수) 쪽, 뒤표지는 왼쪽(짝수) 쪽에 온다. 모자라면 앞에 '메모' 쪽이 들어간다.
- 개념서에는 해설을 싣지 않는다(빈칸 정답 띠는 그대로). 수능형 문제 번호는 대단원마다 01부터, 해설은 별책에 있다.
- 교사용은 빈칸·O/X·정답 선지가 채워져 있고, 쪽 번호가 학생용과 같다.
