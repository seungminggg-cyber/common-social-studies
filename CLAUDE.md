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
- 실제 통계는 GitHub에 올라온 세계은행 원자료 CSV(raw.githubusercontent.com은 열림)로 받을 수 있다. 위키백과·기상청·세계은행 API는 막혀 있음.
