# 승민T 통합사회 클래스

학교별 내신 대비, 매일 O/X·빈칸 퀴즈, 플래너, 집중 타이머, 강사용 학생 관리를 한곳에 모은 웹앱입니다.

- 화면: HTML + Tailwind CSS (Vite로 빌드)
- 로그인·데이터: Firebase (Authentication + Firestore)
- 배포: GitHub Pages (main 브랜치에 올리면 자동 배포)

## 처음 한 번만 하는 설정

1. **보안 규칙 붙여넣기**: Firebase 콘솔 → Firestore → 규칙 탭 → `firestore.rules` 내용 전체를 붙여넣고 [게시]
2. **GitHub Pages 켜기**: 저장소 Settings → Pages → Source를 **GitHub Actions**로 선택
3. **로그인 허용 주소 추가**: Firebase 콘솔 → Authentication → 설정 → 승인된 도메인 → `seungminggg-cyber.github.io` 추가
4. **강사(관리자) 계정 등록**
   1. 배포된 앱에서 강사님 Google 계정으로 로그인 → "강사(관리자) 계정으로 쓰시려면"을 펼쳐 ID 복사
   2. Firebase 콘솔 → Firestore → 데이터 → 컬렉션 시작 → 컬렉션 ID `admins`, 문서 ID에 복사한 ID 붙여넣기, 필드 `name` (string) = `승민T` → 저장
   3. 앱 새로고침 → 강사 관리 → [샘플 데이터로 시작하기]

## 학생 가입 흐름

학생이 Google 또는 이메일로 가입 → 이름·학교 입력 → 강사 관리 화면에서 [승인] → 이용 시작

## 개발용 명령어

```bash
npm install
npm run dev          # 실제 Firebase에 연결해서 실행
npm run dev:emu      # 테스트용 Firebase(에뮬레이터)에 연결해서 실행
npm run build        # 배포용 파일 만들기
npx firebase-tools emulators:exec --only firestore "npm run test:rules"   # 보안 규칙 테스트
```

## 폴더 구조

- `firestore.rules` — 누가 어떤 데이터를 보고 쓸 수 있는지 정하는 보안 규칙
- `src/views/` — 화면별 코드 (로그인, 퀴즈, 우리 학교, 내 공부, 강사 관리)
- `src/store.js` — Firebase 실시간 데이터 연결
- `src/seed.js` — 샘플 데이터
- `tests/rules.test.js` — 보안 규칙 자동 테스트
