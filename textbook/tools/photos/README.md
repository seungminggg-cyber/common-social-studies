# 사진 모으기·점검 도구 (위키미디어 공용)

교재 사진(`assets/photos/`)을 찾고, 내려받고, 저작권 상태를 점검하는 스크립트입니다. 내려받은 자료를 다루므로 파이썬은 `-I`로 실행합니다.

| 파일 | 하는 일 |
|---|---|
| `subjects.json` | 사진 주제와 검색어 (`id`, `q`, `kind: photo|portrait`) |
| `search.py` | 주제별 후보 검색 → `candidates.json` (자유 라이선스만, NC·ND 제외) |
| `picks.json` | 고른 후보 번호(`i`)와 설명(`caption`), 초상 자르기(`zoom`, `cx`, `top`), 밝기(`bright`) |
| `download.py` | 고른 사진을 `commons.wikimedia.org/w/thumb.php`로 천천히 받아 줄이고 `assets/photos/credits.json`에 출처 기록 |
| `audit.py` | `credits.json`의 모든 사진을 다시 조회해 라이선스·근거·삭제 요청 여부를 `audit.json`에 저장 |
| `cands_lic.py`, `addcand.py`, `wikitext.py`, `titles.py`, `one.py` | 후보의 라이선스 근거 보기, 파일 하나 후보에 넣기, 설명 페이지 원문 보기 |

```bash
cd textbook/tools/photos
python3 -I search.py subjects.json candidates.json            # 후보 찾기
python3 -I download.py picks.json candidates.json ../../assets/photos ph-cave   # 특정 사진만 다시 받기
python3 -I audit.py ../../assets/photos/credits.json audit.json                  # 저작권 점검
```

- 저작자가 표기 문구를 정해 둔 사진(파일 정보의 Attribution)은 `credits.json`에 `attribution`으로 그대로 적는다.
- "직접 찍었다(own work)"고 올린 옛 사진, 색을 입히거나 손으로 옮겨 그린 사본은 원본 근거를 따로 확인한다.
- 점검 기록: `참고/저작권점검.md`
