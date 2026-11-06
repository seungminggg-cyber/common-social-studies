# 승민T 통합사회 클래스 — 프로젝트 안내 (Claude용)

학원 강사(승민T)가 고등학생에게 통합사회(2022 개정, 통합사회1·2)를 가르치며 쓰는 웹앱이다.
학생: 매일 퀴즈, 학교별 수업 영상·자료, 플래너·집중 타이머, 오답 노트.
강사: 학생 승인·성적 관리, 현황판, 문제 검토·수정, 학교·시험 일정 관리.

## 사용자와 소통할 때
- 사용자는 비개발자인 강사다. **한국어로, 쉬운 말로**, 결과부터 짧게 설명한다.
- 화면 문구와 코드 주석도 한국어로 쓴다 (강사가 GitHub에서 읽을 수 있게).
- 큰 변경 전에는 간단히 확인받고, 배포 후에는 무엇이 바뀌었는지 정리해 준다.

## 기술 구성
- Vite + 순수 JS(프레임워크 없음) + Tailwind CSS 3. 아이콘 Font Awesome, 글꼴 Pretendard (npm으로 번들).
- Firebase: Authentication(Google, 이메일/비밀번호) + Firestore. **무료(Spark) 요금제**.
- 배포: GitHub Pages. `main`에 push하면 `.github/workflows/deploy.yml`이 빌드·배포한다.
  - 주소: https://seungminggg-cyber.github.io/common-social-studies/ (vite `base` = `/common-social-studies/`)
- PWA: `public/manifest.webmanifest`, `public/sw.js`(network-first, 같은 출처 GET만 캐시), `src/install.js`(설치 배너).

## 명령어
```bash
npm install
npm run build                 # 배포용 빌드 (dist/)
npm run dev:emu               # 에뮬레이터에 연결해서 실행 (VITE_USE_EMULATOR=1)
node tests/check-packs.mjs    # 문제 팩 형식 검사
npx -y firebase-tools@13.29.1 emulators:exec --project demo-rules-test --only firestore "npm run test:rules"   # 보안 규칙 테스트 (12개)
```
- 화면 테스트: 에뮬레이터(`emulators:start --project common-social-studies --only auth,firestore`) + `dev:emu`를 켜고 Playwright로 강사·학생 흐름을 돌린다.
  - 강사 계정은 Auth 에뮬레이터 REST로 만들고 `admins/{uid}` 문서를 `Authorization: Bearer owner`로 넣는다.
  - 에뮬레이터 project id는 앱 설정과 같은 `common-social-studies`여야 한다.
- 이 클라우드 환경에서는 github.io, kvdb 등 일부 외부 주소가 막혀 있어 배포된 사이트를 직접 열어 볼 수 없다.

## 코드 구조
- `src/main.js` — 화면 그리기(morphdom으로 바뀐 부분만 갱신), 이벤트 위임, 탭 구성.
  - 클릭은 `data-action`, 폼 제출은 `data-submit`, 변경은 `data-change`, 입력은 `data-input`으로 연결한다. 각 view 파일이 `xxxActions` 객체를 내보내고 main에서 합친다.
  - 폼 안의 입력값은 `lib/drafts.js`에 임시 저장되어, 실시간 데이터로 화면이 다시 그려져도 지워지지 않는다.
- `src/lib/html.js` — `html` 태그 템플릿이 모든 값을 **자동 이스케이프**한다(XSS 방지). 검증된 HTML만 `raw()`로 넣는다. 속성 문자열을 조건부로 넣을 때도 `raw('data-action="..."')`처럼 써야 한다.
- `src/store.js` — 전역 상태 `S`, Firestore 실시간 리스너, 역할(teacher/student/pending/new) 판별, 문제·카드 합치기(`mergeContent`).
- `src/views/` — home, quiz, school, study, teacher(강사 관리), dashboard(현황판), review(문제 검토·수정), auth.
- `src/content/` — **기본 문제 팩**(통합사회1 Ⅰ~Ⅴ, 통합사회2 Ⅰ~Ⅴ). `index.js`의 `PACKS`에 등록. `build.js`의 `makePack`으로 만든다.
- `src/audio.js` — 집중 사운드(Web Audio로 합성). `src/pomodoro.js` — 끝나는 시각 기준 타이머.
- `src/packs.js` — 강사 로그인 시 한 번 실행되는 데이터 정리(이전 방식으로 Firestore에 복사된 팩 문서 삭제, 강사가 만든 문제에 `custom` 표시). `config/app.contentV2`로 완료 여부 기록.
- `src/seed.js` — 첫 실행 샘플 데이터(학교 5개, 공지). 예전 샘플 문제 문장은 정리용으로만 남아 있다.

## Firestore 데이터 구조
- `admins/{uid}` — 강사 계정 표시. 앱에서 만들 수 없고 Firebase 콘솔에서만 추가.
- `config/app` — 앱 이름, 공지, `teacherName`, `dailySubject`(오늘의 문제 과목), `deletedPackItems`(강사가 지운 팩 문제 ID), `contentV2`.
- `schools/{id}` (+ `videos/{vid}/summaries/{uid}`, `materials`, `intels`) — 학교 정보, 시험(`examName`, `examDate`), 영상, 자료, 제보.
- `users/{uid}` — 학생(`name`, `schoolId`, `status: pending|approved`, `retryCards`). 하위 `days/{yyyy-mm-dd}`(퀴즈 답, 플래너, 뽀모도로 수), `weak/{quizId}`(오답 노트).
- `reports/{uid}` — 강사만 쓰는 성적(`scores[{week, score, avg}]`), 숙제율, 코멘트.
- `quizzes`, `cards` — **강사가 직접 만든 것(`custom: true`)과 고친 것(`edited: true`)만** 저장. 기본 문제는 앱 번들에서 읽는다.
- 보안 규칙: `firestore.rules`. 바꾸면 테스트(`tests/rules.test.js`)도 함께 고치고, 강사에게 Firebase 콘솔 규칙 탭에 붙여넣어 달라고 안내해야 한다(자동 배포되지 않음).

## 꼭 지켜야 할 점
- **무료 사용량**: 읽기 5만/일, 쓰기 2만/일. 학생이 앱을 열 때 읽는 문서 수를 늘리는 변경(전체 컬렉션 리스너 등)은 피한다. 문제 팩을 Firestore로 옮기지 않는다. 현황판처럼 많이 읽는 기능은 열 때·새로고침 때만 불러온다.
- 문제 팩 문장은 교재를 그대로 옮기지 않고 **새 문장으로** 쓴다(저작권). 팩을 고치면 `node tests/check-packs.mjs`로 검사한다. 문제 ID(`팩id-ox001` 등)는 학생 답·오답 노트와 연결되므로 기존 순서를 함부로 바꾸지 않는다(새 문제는 목록 끝에 추가).
- 강사가 앱에서 고친 문제는 Firestore 문서가 팩 내용을 덮어쓰므로, 팩을 수정해도 강사 수정이 우선한다.
- 작업 브랜치 `claude/firebase-app`에 커밋·push한 뒤, `main`으로 fast-forward push해서 배포해 왔다(강사 동의 하에).

## 남은 일 / 참고
- 통합사회2 Ⅲ~Ⅴ는 개념 교재 없이 해설지와 교육과정 지식으로 만들어 대단원·중단원 이름이 교과서와 다를 수 있다.
- 집중 사운드(빗소리·모닥불·도서관)는 강사 피드백을 기다리는 중.
- 다음 후보 기능: 학교별 시험 범위 단원에 맞춘 오늘의 문제, 오답 반복 복습(1·3·7일), 단원 모의고사, 연속 학습·랭킹, 폰 알림.

## 구글 로그인 (2026-11)
- 배포 사이트는 `src/googleSignIn.js`(Google Identity Services 버튼 → `signInWithCredential`)를 쓴다. 예전 `signInWithPopup`은 firebaseapp.com 로그인 도우미를 거쳐서 아이폰 사파리에서 "missing initial state" 오류가 났음.
- OAuth 웹 클라이언트(`947075209071-8f8o…`)의 '승인된 자바스크립트 원본'에 `https://seungminggg-cyber.github.io`가 있어야 한다. 에뮬레이터·스크립트를 못 불러올 때는 예전 팝업 방식. 버튼 칸은 `data-keep`(morphdom이 안을 건드리지 않음).

## 개념서 만들기 (`textbook/`, 2026-11 시작)
- 수능 대비 통합사회 개념서(A4, 컬러). 앱과 별개 폴더이며 앱 빌드·배포에 영향 없음. 자세한 내용은 `textbook/README.md`.
- 내용(`textbook/content/*.js`)과 디자인(`textbook/themes/a|b|c.css`)을 나눠, `node build.mjs`로 HTML → 자동 쪽 나눔 → PDF(학생용/교사용).
- 한글 파일은 `hwpx_build.py`(python-hwpx 6.11.0)로 시안 B 모양의 .hwpx를 만든다. 강사 PC 한글에서 열리는 것 확인함(첫 시험판). 표 안에 표는 넣지 않는다.
- 강사가 참고로 준 교재: 완자 기출PICK(날개 메모, 글자 칸 빈칸, 쪽 아래 정답 띠). 디자인은 참고만 하고 문장·이름은 새로 만든다.
- 시안 A(날개형)·B(카드형)·C(2단 노트형) 중 **강사가 B(카드형)를 골랐다** (2026-11). 앞으로 B를 기준으로 다듬고 단원을 채운다.
- 참고 문제집 PDF는 claude.ai 업로드 한도(30MB)를 넘는 경우가 많다. 이 환경에서는 drive.google.com이 막혀 있음(환경 네트워크 설정에서 허용 가능). 제미나이로 단원별 요약을 받아 글로 붙여넣는 방식을 안내함.
- 기출 분석: `textbook/참고/기출분석.md`, `기출분류.json` (2028 수능 예시문항 + 2025~2026 고1·고2 학평 8회, 200문항). 시험 PDF와 문제집 PDF는 저작권 때문에 저장소에 올리지 않는다.
- 교과서 9종 모두 같은 대단원·중단원 이름(앱 단원 이름과 같음) → 개념서 목차도 그대로 쓴다.
- 그림 기능(`textbook/lib/figures.js`): 막대·가로 막대·100% 막대·꺾은선(개념도)·산점도·원·기후 그래프, 벤 다이어그램, 세계·지역 지도(world-atlas + d3-geo), 칸 합치기 표. 견본은 `content/z-gallery.js`. 한글 파일에는 PNG로 들어간다.
- 단원 진행: Ⅰ단원(t1-1, 강사가 그대로 두자고 함), Ⅱ단원(t1-2) 완료, Ⅲ~Ⅴ단원 완료(아래). Ⅲ단원 전에 그림 기능을 준비해 달라는 요청을 반영함. 숫자 자료는 출처 확인된 것만 실제 값, 나머지는 "개념도/가상 자료" 표시.
- 2026-11 강사 요청: "이 개념서만으로 수능 개념 학습이 끝나도록" 깊게. 분량이 늘어도 괜찮다고 함. 사상가는 `t: 'thinker'` 카드(핵심 주장·원전 읽기·기출 선지 O/X·헷갈리지 말자)로 쓴다. Ⅱ단원(t1-2)을 이 방식으로 다시 씀(31쪽).
- 자료: EBS 개념완성·개념풀 통합사회1 해설(글자 PDF, Ⅰ~Ⅴ 전체)을 받음 → 선지·해설 내용을 본문으로 끌어온다. "원전 읽기"는 고전 원문을 새로 옮긴 문장(문제집 번역문 금지).
- 2026-11 강사 요청(배치): 사상가 카드나 한 덩어리 내용이 쪽을 넘겨 끊기지 않게, 쪽 아래 큰 빈 공간 없게. → `paginate.js`가 카드를 통째로 옮기고(쪽보다 길 때만 조각 경계에서 나눔), 조금 넘치면 `.tight`로 간격을 줄이고, 남는 공간은 간격 벌리기 또는 '정리 노트'·'오답 노트' 칸으로 채운다. 카드는 한 쪽에 1~2장이 되도록 분량을 맞춘다(PNG로 확인).
- Ⅲ(t1-3: 05~07)·Ⅳ(t1-4: 08~11)·Ⅴ(t1-5: 12~14) 완료(2026-11-04). 종교도 사상가 카드 모양으로 정리. 현대 사상가(싱어·슈바이처·테일러)는 원문 대신 주장 요약. 기후 그래프는 가상 자료(실제 특징을 단순화), 이산화 탄소 농도는 NOAA 실측.
- 2026-11 "문제집·모의고사 전부 반영해 보완" 요청으로 Ⅱ(40쪽)·Ⅲ(62쪽)·Ⅳ(53쪽)·Ⅴ(43쪽, 2026-11-05) 보완 완료. 강사 확인이 필요한 곳은 `textbook/참고/검토할점.md`에 모아 둠. 다음: 강사가 한꺼번에 검토 → 통합사회2.
- 2026-11-05 통합본 완성: `node build-book.mjs` → 통합사회1 개념서 학생용·교사용(216쪽, 간지·차례·학습 계획표·뒤표지, 양면 인쇄용) + 별책 정답과 해설(10쪽). 강사 선택: 빈칸 정답 띠는 개념서에 남김, 해설은 별책.
- 표지 뒷면에 '겨울방학 10주 특강 진도표'(`content/_book/t1.js`의 schedule, 쪽 범위 자동). 강사 계획: 통합사회1 4주(1주에 Ⅰ+Ⅱ) + 통합사회2 6주(Ⅲ을 2주), 주 1회 3시간.
- 통합사회2 단원(완자 기출PICK 차례 기준): Ⅰ 인권 보장과 헌법(01~03), Ⅱ 사회 정의와 불평등(04~06), Ⅲ 시장경제와 지속가능발전(07 자본주의의 전개 과정과 경제 체제, 08 합리적 선택과 경제 주체의 역할, 09 자산 관리와 금융 생활, 10 국제 무역과 지속가능발전), Ⅳ 세계화와 평화(11 세계화의 양상과 문제의 해결, 12 국제 사회와 세계 평화), Ⅴ 미래와 지속가능한 삶(13 세계의 인구와 인구 문제, 14 세계의 자원과 지속가능한 발전~미래 사회와 세계시민). 앱 문제 팩(t2-u345)의 Ⅲ~Ⅴ 단원 이름은 이와 달라 나중에 맞춰야 함.
- 통합사회2 개념서 시작(2026-11-05): 16개 중단원(개념풀·지학사 기준, 01~16)으로 구성. `content/t2-1.js`(Ⅰ, `_t2-1/u01~u03.js`) 완료. 자료는 강사 구글 드라이브(환경 Allowed domains에 drive.google.com, drive.usercontent.google.com 추가됨)에서 받아 scratchpad/gdrive/files 에 둠(저장소에 올리지 않음).
- **강사가 시안 D(교과서형: 대단원별 색, 엄지 색인, `themes/d.css`)로 확정**(2026-11-05). 앞으로 모든 단원·통합본은 시안 D로 만든다(`build.mjs`, `build-book.mjs` 기본값 d). 통합사회1 통합본(216쪽)도 시안 D로 다시 만듦.
- 통합사회2 Ⅱ(t2-2: 04~06)·Ⅲ(t2-3: 07~10)·Ⅳ(t2-4: 11~13)·Ⅴ(t2-5: 14~16) 완료(2026-11-05). 통합본 `node build-book.mjs t2` → 통합사회2 개념서 학생용·교사용 178쪽 + 정답과 해설 11쪽. 강사 확인 사항은 `참고/검토할점.md`의 통합사회2 부분.
- 2026-11-05 강사 요청 "통합사회2 내용이 적다, 오류 점검·세세하게 보완" → 다섯 단원 모두 개념·자료·사상가 주장·문제 보강(중단원마다 수능형 10~13문항). 통합본은 178쪽 → **204쪽**, 정답과 해설 13쪽. 새 사실 확인 목록은 `참고/검토할점.md`의 '통합사회2 2차 보완'.
- 2026-11-05 강사 요청 "실제 문제집처럼 현실적인 지도(색, 국경, 바다·육지·호수·강)" → 지도 41개를 새 방식(`lib/maps.js`)으로 다시 그림. 지형도(고도 음영)·정치 지도·주제도·단계 구분도, 판의 경계, 우리나라 시·도 경계와 하천(고도로 계산). 강사가 견본을 보고 승인, 하천 표현은 상류 가늘고 하류 굵게로 고침. 자세한 설정은 `textbook/README.md`의 '지도'.
- 이 환경에서 열리는 지도 자료: raw.githubusercontent.com(Natural Earth, 판의 경계 fraxen/tectonicplates, southkorea-maps), s3.amazonaws.com(고도 타일). 위키미디어 공용(upload/commons.wikimedia.org)은 강사가 허용 도메인에 추가함.
- 2026-11-05 강사 요청 "위키미디어 사진 + 그래프·개념 도식을 인포그래픽으로, 지도 재검토" → 인포그래픽 도식(`lib/diagrams.js`, 아이콘 Tabler Icons `lib/icons.js`), 사진 블록·사상가 초상(`lib/photos.js`, `assets/photos/` + `credits.json`, 단원·통합본 끝 '사진 출처' 쪽). 지도는 우리나라 정부 시각 국경(Natural Earth KOR 판), 2023 군위 대구 편입, 해류 색 바로잡음. 사진은 자유 라이선스만(84장), 사진 아래 저작자·라이선스 표시, 한글 파일 끝에도 '사진 출처'. 통합본은 통합사회1 **224쪽**, 통합사회2 **212쪽**으로 늘어남.
- 2026-11-05 저작권 점검: 사진 82장 라이선스·근거 재확인(`textbook/참고/저작권점검.md`, 도구 `textbook/tools/photos/`). 근거 약한 레오폴드 초상·싱가포르 수퍼트리 사진은 뺌, 슘페터·혼일강리역대국도지도는 원본으로 교체. 책 끝 '사진·자료 출처'에 저작자 지정 표기, 고도 타일 원문 출처, 판의 경계(ODC-By), Tabler MIT 전문 포함(`assets/credits-data.json`).
- 2026-11-05 강사 요청 "frontend-design 스킬로 시안 D를 업그레이드한 시안 E 견본 5쪽" → 플러그인이 계정에 없어 공개 원본 지침(anthropics/claude-plugins-official의 frontend-design SKILL.md)을 따름. `themes/e.css`(d.css 위에 덮어씀): 명조 Hahmlet(@fontsource-variable/hahmlet, OFL)=제목·원문·자료·수능형 문제, 고딕 Pretendard=설명, 괘선 위주·옅은 대단원 색·형광펜 밑줄·단원 첫 쪽 큰 숫자. 견본은 통합사회2 Ⅱ단원(t2-2) 2·4·5·32·13쪽. **강사 확인 대기** — 고르면 통합본·한글 파일 적용.
- 2026-11-05 강사: 시안 E는 "차이를 못 느끼겠다, 그 전이 나은 것 같다" → 의견 듣고 **①기출 데이터형 개념 카드 + ③진한 색 + 중단원 끝 한 장 정리**를 골라 시안 F 견본(`themes/f.css`, `content/z-sample-f.js` = u04에 개념 번호·별점·기출 표시·이렇게 나온다·한 장 정리). 렌더러 새 블록: `concept`(no, title, stars 1~3, hits), `pattern`(items [문장, O/X, 이유]), 단원 `summary`(core, branches, traps, checks). 별점은 `참고/기출분류.json` 9회에서 직접 출제 횟수(★★★ 3번 이상, ★★ 1~2번, ★ 바탕 개념). **강사 확인 대기**.
- 2026-11-05 강사: "F는 눈에 띄고 D는 베이직, 더 세련되고 학생 모두 좋아할 안?" → 시안 G 견본(`themes/g.css` = f.css 위에 덮어씀): F의 구조(개념 번호·별점·기출 표시·이렇게 나온다·한 장 정리·시험지형 문제) + D처럼 차분한 겉모습(진한 색은 개념 번호 칸만) + 회독 체크 칸 + 스티커(`concept.tags`: 헷갈림 주의·자료 해석·계산, ★★★면 '자주 나옴' 자동). 학생 투표용 비교 한 장(가=G, 나=D, 다=F)도 전달. **강사 확인 대기**.
- 2026-11-05 강사: "AI가 만든 느낌을 지우고 전문 디자이너 느낌" → 시안 H 견본(`themes/h.css` = g.css 위): KoPub World 돋움·바탕(npm `font-kopubworld@1.0.3`, 한국출판인회의 약관: 출판물 사용 무료, 서체 판매만 금지), 본문+바깥 날개 단 격자(날개에 개념 더하기·날개 사진 `side.photo`), 모서리 잘린 네모 상징, 인쇄용 색(Ⅱ는 보라 대신 자주), 알약·아이콘·그라데이션 없음, 정리 노트는 쪽의 40% 이상 빌 때만(`memoMin`). 2차 투표지(1=D, 2=H, 3=G). **강사 확인 대기**.
- 2026-11-05 강사 H 의견: 회독 칸·개념 옆 기출 연도 빼기, 나누기는 한 가지로(A·B·C 빼고 개념 01~07만), 문제 쪽에 포인트 → `content/z-sample-h.js`(A·B·C 제목 빼고 한 장 정리도 개념만 나열 `summary.concepts`, 문제에 `concept`·`type`), 문제 머리에 단원 색 번호·난이도 막대·관련 개념·유형, 수능형 문제 띠에 문항 수·난이도 나눔. **강사 확인 대기**.
- 2026-11-05 강사: 판형은 **국배판(A4) 유지**(4×6배판 188×257보다 큼, 학원 인쇄 편의). 출제 빈도 이름표 = 1칸 기본 개념 / 2칸 빈출 / 3칸 최다 빈출(FREQ), 문제 쪽은 빈출 대신 '난이도 상·중·하' 글자(칸 없음). 강사가 이 H 3차 수정본으로 확정.
- 위키미디어 사진 받기: upload.wikimedia.org는 429(요청 제한)가 심하고 thumb.wikimedia.org는 막힘 → `https://commons.wikimedia.org/w/thumb.php?f=파일이름&w=960`으로 받으면 잘 됨(URL 끝 `?utm_…` 떼기, User-Agent에 프로젝트 주소).
- 그림 기능 추가: 방사형(radar, 순위형은 reverse), 인구 피라미드(pyramid). 그림 설명(note)에서 **굵게** 지원.
- 실제 통계: Our World in Data의 GitHub 공개 자료(owid/energy-data, owid/co2-data)를 raw.githubusercontent.com으로 받을 수 있음. datahub.io, fred, ourworldindata.org 직접 접속은 막힘.
- 예금자 보호 한도는 2025-09-01부터 1억 원(교재의 5천만 원은 옛 기준).
- 실제 통계는 GitHub에 올라온 세계은행 원자료 CSV(raw.githubusercontent.com은 열림)로 받을 수 있다. 위키백과·기상청·세계은행 API는 막혀 있음.
- **2026-11-05 시안 H 전체 적용 완료**(기본 시안 = h): 30개 중단원마다 `content/_cc/<책>.js` 개념 계획(개념 01~, 출제 빈도, '이렇게 나온다' O/X, 한 장 정리, 수능형 문제의 관련 개념·유형)을 `withCC`로 붙임. 개념서 내용은 개념풀·수능풀·학평 해설과 다시 대조해 고침. 통합본 통합사회1 **276쪽**, 통합사회2 **268쪽**, 정답과 해설 10·14쪽, 한글 파일 20개. 강사 판단이 필요한 곳은 `참고/검토할점.md`의 '시안 H 전체 적용' 부분. 규칙 요약은 `textbook/개념서_작업정리.md`(문제집·검수 작업의 기준).
- 한글 파일 그림(`out/fig/<책>/`)은 `build.mjs`가 시안 b·d·h로 빌드할 때 새로 저장한다(예전에는 h에서 빠져 있었음 — 블록 순서가 바뀌면 그림이 어긋나므로 한글 파일 전에 꼭 단원 빌드).
- 검사 도구(세션 scratchpad, 저장소 밖): overflow·figbounds·textoverlap·fontfallback·qhead(문제 머리 줄바꿈)·qlv(난이도 꺾임).
- 다음 일: 기출변형 문제집(별도 세션, `기출변형/`) — 1차 단원별 약 500 + 모의고사 4회, 2차 중상·상 위주 500 + 모의고사 10회(통합사회1 3·통합사회2 3·전 범위 4), 그 뒤 별도 검수 세션.
- **기출변형 문제집(`기출변형/`, 2026-11-05~)**: 규칙은 `기출변형/CLAUDE.md`, 진행은 `기출변형/참고/진행.md`. 개념서의 render·paginate·시안 H를 다시 써서 `node build.mjs <차수>`로 PDF, `hwpx_wb.py`로 한글 파일. 1차(단원별 500 + 모의고사 4회)·2차(심화, 단원별 500 + 모의고사 10회) 완료·전달(2026-11-06), 검수는 별도 세션(브랜치 `claude/workbook-review`), 검사 도구 `tools/check.mjs`·`dup-check.mjs`(--src로 원문 유사 검사). 앱 빌드와 무관.
