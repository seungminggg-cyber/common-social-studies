# 2028 수능 통합사회 정규반 OT 촬영용 PPT

예비 고3·N수생·학부모 대상 1년 정규반(2027-01-02 개강) OT 영상용 발표 자료. 본편 21장 + 촬영 전 점검용 숨김 1장, 16:10.
지난 예비 고1 겨울특강 OT(`../겨울특강OT/`) 코드를 복사해 고쳤다. 내용은 저장소 맨 위 `작업의뢰서_수능반OT.md`에 적힌 사실만 쓴다.

## 판 세 가지
| 파일 | 쓰는 곳 | 만들기 |
|---|---|---|
| `…-칠판용.pptx` | 학원 초록 칠판에 빔으로 쏴서 촬영(검정 바탕) | `node build.mjs` |
| `…-반전용.pptx` | 학원 PC·빔이 화면 색을 반전시킬 때 | `python3 invert_art.py && OT_INVERT=1 node build.mjs` |
| `…-남색.pptx` | 화면 녹화·배포용(미니맵 남색 바탕) | `OT_NAVY=1 node build.mjs` |

## 만드는 순서
```bash
# 0) 교재 표지(처음 한 번): 기출변형 폴더에서
cd 기출변형 && node cover/build-cover.mjs mmapfinal && node cover/build-cover.mjs maxifinal && node cover/build-cover.mjs mmfinal && cd ..
cd 수능반OT && npm install
node art.mjs                                   # 네온 아이콘·로고·핑
node globe-anim.mjs && python3 globe_post.py   # 반짝이는 지구본 GIF + 화살표
OT_NAVY=1 node globe-anim.mjs && python3 globe_post.py navy   # 남색 판 지구본
python3 frames.py                              # 앱 화면 휴대폰 틀 + 교재 표지 JPEG
node build.mjs                                 # 칠판용 (위 표의 다른 판도)
python3 pdf.py out/<파일>.pptx out/<파일>.pdf  # 예비용 PDF (숫자 올라가기 중간 숫자는 PDF에서 지움)
python3 board_preview.py                       # 칠판에 쏜 모습 미리보기
```
- 글꼴 Pretendard(OFL). 촬영 PC에 없으면 맑은 고딕으로 바뀐다 → 굵은 글자는 'Pretendard'+굵게로 썼고, `~/.fonts/pretendard`를 치우고 렌더링해 넘침을 확인했다. 설치용 zip은 `out/Pretendard-글꼴-설치용.zip`.

## 슬라이드 구성
표지 → 오늘의 순서(8가지) → ① 2028 수능 변화(2) → ② 왜 지금인가(5: 고3 1학기·2년 공백·약 42점·문이과 모두·N수생) → ③ 수시 최저(대학별 한 줄, 계산 예시) → ④ 1년 로드맵(노선도 4구간, 약 45회 + 주요 일정) → ⑤ 수업 방식(3시간 막대, 숙제 원칙 + 40%→61%) → ⑥ 교재(표지 4종, 1,300여 문항) → ⑦ 강사 소개(2) → ⑧ 등록 안내 → 마무리.
- 파트 구분 화면 대신 제목 위 작은 파트 이름 + 오른쪽 위 점 8개(지금 파트 노랑).
- 겹치기 쉬운 내용은 한 곳에서만 자세히: 실모 횟수 = 로드맵 2쪽, 떠올리기 효과 = 수업 방식 2쪽, MINT = 교재 1쪽.
- 강사 요청으로 '목동 에듀메이트'는 뺐다. 수업 시간·수강료·교재비는 [ ] 빈칸 그대로.

## 애니메이션 (`anim.mjs`)
- 겨울특강 OT 방식 그대로(클릭 한 번에 묶음이 차례로 자동, 노트 맨 위 '▶ 클릭 N번' 안내, 모두 24번).
- 2026-11-24 강사 요청 "보는 맛·집중도" → 효과 추가:
  - `flash` + `countUp()`: 큰 숫자가 0부터 올라감(42점·20만 명·45회·61%·1,300). 같은 자리에 숫자 글상자를 겹쳐 두고 중간 숫자(이름에 TMP)는 잠깐씩만 보임.
  - `pulse`: 강조(한 번 커졌다 돌아옴).
  - `hl()`: 형광펜 띠가 닦아내기로 그어진 뒤 결론 문장이 나옴.
  - 모든 슬라이드에 '서서히' 화면 전환.
- LibreOffice로 열어 효과(나타내기·강조·닦아내기·전환)가 읽히는 것만 확인함. 실제 움직임은 PowerPoint 슬라이드 쇼(F5)로 확인.
