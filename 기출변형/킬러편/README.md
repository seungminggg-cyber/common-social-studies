# MINIMAX 킬러편 (2026-11-15 시작)

2028 수능 통합사회 대비 최고 난도 문항 200개(통합사회1 89 · 통합사회2 111). 다 쓰면 같은 문항으로 **스킬특강 교재**를 만든다.
출제 기준은 `기준.md`, 출제 절차는 저장소 스킬 `.claude/skills/minimax-killer/SKILL.md`.

## 파일
| 파일 | 내용 |
|---|---|
| `기준.md` | 난도·이중추론·형식 목표·강사 규칙·문항 형식·스킬 태그 |
| `배분.json` | 중단원별 문항 수(합 200) |
| `설계/<중단원키>.json` | 중단원별 재료와 문항 제안(설계 카드, Opus가 만든 제안) |
| `설계/쓴씨앗.json` | MAXIMIN·1차 모의고사·MINIMAX 심화에서 이미 쓴 근거 기출(피한다) |
| `설계/설계지시.md` | 설계 카드를 만든 지시서 |
| `검토지시.md` | 정답 가리고 다시 풀기 + 난도 판정 지시서 |
| `교훈.md` | 강사 의견·검토 교훈(세션마다 먼저 읽고, 배운 것을 적음) |
| `진행.md` | 진행 기록 |
| `도구/solve-prep.mjs`, `도구/정답대조.py` | 다시 풀기 준비·대조 |
| `스킬특강/기획.md` | 스킬특강 교재 기획 |
| 문항 | `기출변형/content/k/<중단원키>.js` (id `t2-08-k-001`) |

## 만들기 (기출변형 폴더에서)
```bash
node tools/check.mjs k                 # 형식·정답 분포·단원 문항 수
node build.mjs k order                 # 싣는 순서(문항을 고치거나 더한 뒤)
node build.mjs k units teacher         # out/k/단원별-학생용.pdf · -교사용.pdf
node build.mjs k answers               # out/k/정답과해설.pdf
node tools/page-check.mjs k            # 쪽 그림 자동 검사
```
- 새 컨테이너: 저장소 루트에서 `bash scripts/setup-env.sh`(부품·글꼴). 원문 대조용 자료는 `python3 -I scripts/fetch-sources.py <드라이브 폴더 주소> /home/user/자료/통합사회`(주소는 강사에게, 저장소에 적지 않음).
- 표지·간지는 아직 없다(강사 확인 뒤 `cover/`에 MINIMAX 표지 계열로).
