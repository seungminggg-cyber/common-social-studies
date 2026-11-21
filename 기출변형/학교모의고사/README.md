# 학교별 실전 모의고사 (인천 계양 고1 통합사회2 기말 대비, 2026-11-21 시작)

학교마다 3세트. 강사 결정(2026-11-21): **객관식 25문항, 상 12 · 특상 13**, 학교 학습지 개념 최우선.
역할: 학습·문제 구성·검토 = Opus, **출제 = Fable(effort high)**, 다시 풀기에서 갈린 문항만 Fable이 다시 판정.
완성 PDF는 **강사 허락을 받은 뒤에만** 구글 드라이브 '통사2 자료/모의고사/<학교>' 폴더에 올린다(강사 2026-11-21: 완성본도 수정이 필요할 수 있음). 먼저 SendUserFile로 보내고, 강사가 '올려'라고 하면 조정 채팅이 올린다.
| 학교 | 드라이브 폴더 id | 채팅 |
|---|---|---|
| 인천국제고 | 1M-YOkKKsk7rtHglIkrYM_eBTgJsPzPQW | 모의고사 · 인천국제고 (session_01QqEa9Aa1H8xRhMz2kX6aX9, 브랜치 claude/mock-inguk) — 시범 1세트, 11/22 수업용 |
| 작전고 | 1yGySTQr8b9auWR0SU_qNGSC1WDKuu1nz | 모의고사 · 작전고 (session_01QqEa9C37TwRVqaHC6sWeTt, claude/mock-jakjeon) |
| 계양고 | 16xdV0xwn1loaU2CLuI0HHcvbEsIeU9Ms | 모의고사 · 계양고 (session_01QqEa9CkeoGw1X2beaBzx3k, claude/mock-gyeyang) |
| 계산여고 | 1BTfUiREv0O9VVZ5AWUm1YCPHM_GwEah9 | 모의고사 · 계산여고 (session_01QqEa9B3gBHXZc34Gsx81X9, claude/mock-gyesan) |
| 서운고 | 1f-L2m2I36a-Y4k2WybX1107lyuRXUa83 | 모의고사 · 서운고 (session_01QqEa9BvKgnPYWiQ13VaMay, claude/mock-seoun) |
- 형식 모음(`형식모음.md`)·빌드(`build.mjs`)는 인천국제고 채팅이 먼저 만들고, 다른 학교가 같이 쓴다.
- 드라이브 업로드: Google Drive 연결 `create_file`(parentId = 위 폴더 id, application/pdf, disableConversionToGoogleType, base64Content = `sha256:<해시>:<절대 경로>` 파일 참조).
  **2026-11-21 확인: 학교 채팅에서는 파일 참조가 거부됐고, 조정 채팅에서는 됐다** → 학교 채팅은 PDF를 SendUserFile로 보내고 조정 채팅에 '빌드 명령'을 알리면, 조정 채팅이 그 브랜치에서 같은 PDF를 다시 만들어 올린다(인천국제고 1회 문제·해설 업로드 완료).

- 참고 자료(드라이브 '통사2 자료'): '지난 기출'(`13pR7bU_D931F9oyM94LZDbmKTqHUsDv2`) 안에 학교별 지난 시험 사진 — 작전/2학기 중간, 계양/1학기 기말·2학기 중간, 계산여고/2학기 중간, 서운고/1학기 기말·2학기 중간. 학교 채팅은 자기 학교 기출의 형식을 반영한다(문장은 옮기지 않음).
