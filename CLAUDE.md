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
