# 학교별 상중하 문제 (인천 계양 고1 통합사회2 기말 대비, 2026-11-21 시작)

**계산 문제를 뺀 시험 범위 전체**를 학교별로, 난이도 **하 · 중 · 상** 묶음으로 낸 객관식 문제지. 11/22(일) 수업용.
계산 문제 세트(`기출변형/계산문제/`, 브랜치 `claude/calc-problems`)와 짝이다. 조정 채팅(주간지 · 조정 채팅) 브랜치 `claude/practical-lamport-a7zkp4`에서 시작.

## 강사가 정한 것 (2026-11-21)
- 중단원마다 **하 1 · 중 2 · 상 3**(어렵게). 학교당 = 범위 중단원 수 × 6.
- 순서는 **난이도별 묶음**: 난이도 하(범위 전체, 단원 순) → 중 → 상, 난이도마다 새 쪽. 표지 없음, 제목은 '난이도 하·중·상'만, 첫 쪽 위에 학교·이름 한 줄. 정답과 해설은 별책 PDF.
- **모두 새 문항**: 같은 학교 주간지(1·2주차) 문항과 사례·숫자·선지가 겹치지 않게. MINIMAX·MAXIMIN·학습지 문제는 참고만(문장 옮기지 않음).
- **계산 문제는 넣지 않는다**(08·10도 개념·자료 해석 문항만 — 기회비용·비교 우위 계산은 계산 문제 세트에 있음).
- 학교 학습지 개념 최우선, 학습지가 없는 단원은 개념서(`textbook/content/_t2-*`, `_cc/t2-*.js`)로.

## 학교별 범위(개념서 중단원) · 문항 수
| 학교 키 | 학교 | 중단원 | 문항 |
|---|---|---|---|
| jakjeon | 작전고 | 07~16 | 60 |
| gyeyang | 계양고 | 07~13, 15, 16 | 54 |
| gyesan | 계산여고 | 03, 06, 09, 10, 12, 13, 15, 16 | 48 |
| seoun | 서운고 | 09, 10, 12, 13, 14, 15, 16 | 42 |
| inguk | 인천국제고 | 07~10, 12, 13, 15, 16 | 48 |

## 만들기
```bash
cd 기출변형
node 상중하/build.mjs <학교 키> [png]   # → 상중하/out/<학교>-상중하-문제.pdf · -정답과해설.pdf
```
- 문항은 `content/<학교 키>.js` 하나: `export default { questions: [ { id, unit: 't2-NN', level: '하|중|상', concept: [n], type, src, stem, data, bogi?, choices, answer, explain, note? } ] }`.
  형식은 `기출변형/CLAUDE.md` '문항 형식'과 같다. id는 `<학교 약자>-L-<단원>-<난이도 h|m|s><번호>`(예: jj-L-11-s2).
- 빌드가 단원·난이도별 문항 수를 계획(하 1·중 2·상 3)과 비교해 경고하고, 정답 분포를 출력한다.
- 결과 PDF·PNG(`out/`)는 저장소에 올리지 않는다. 학교 학습지 사진·원문도 올리지 않는다.
- 공통 파일(build.mjs, 주간지 styles)은 학교 채팅에서 고치지 않는다 — 필요하면 조정 채팅에 알린다.

## 학교별 채팅 (2026-11-21 열림, 조정 채팅 = 주간지 · 조정 채팅 session_01QqEa98Z8tj8bZXnLwjd2Cn)
| 학교 | 브랜치 | 세션 id |
|---|---|---|
| 작전고 | claude/level-jakjeon | session_01QqEa9A5E9wZ89cckcxvWfp |
| 계양고 | claude/level-gyeyang | session_01QqEa9AapteqCFojPhaFj1L |
| 계산여고 | claude/level-gyesan | session_01QqEa99oCzwCsTtKZRxsVyv |
| 서운고 | claude/level-seoun | session_01QqEa99CyiTLjTsnxvPM4vo |
| 인천국제고 | claude/level-inguk | session_01QqEa98QQ2EaiZcpVNhGncp |
