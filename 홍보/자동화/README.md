# 홍보 자동화 (계정 연결·자동 게시 담당 채팅)

| 문서 | 내용 |
|---|---|
| [계정_만들기.md](계정_만들기.md) | 강사가 직접: 유튜브·인스타·스레드·네이버 블로그·카카오 채널 만들기 (약 1시간 30분) |
| [API_연결.md](API_연결.md) | 강사가 한 번만: Claude가 대신 올릴 수 있게 하는 준비 (Meta 앱, Google Cloud, 열쇠 넣기) |
| [이미지_공개주소.md](이미지_공개주소.md) | 인스타그램이 가져갈 그림을 어디에 둘지 비교·추천 |
| [성과보고_설계.md](성과보고_설계.md) | 주간 성과 보고서 (계정이 생긴 뒤 켬) |
| [진행.md](진행.md) | 이 채팅의 작업 기록 |

## 게시 도구 `post.mjs`
기본은 **연습(미리 보기)** 이다. 실제로 올리려면 `--go`. 처음 2~4주는 강사가 "올려도 됨"이라고 한 것만 `--go`로 올린다.

```bash
node 홍보/자동화/post.mjs insta cn01 --prepare   # PNG → JPEG (공개/cn01/), 크기·비율 검사
node 홍보/자동화/post.mjs insta cn01             # 무엇을 올릴지 보기 (연습)
node 홍보/자동화/post.mjs insta cn01 --go        # 실제 게시 — 공개 폴더를 push 한 뒤
node 홍보/자동화/post.mjs threads <글.txt> [--image 주소] [--go]
node 홍보/자동화/post.mjs youtube <영상정보.json> [--go]   # 항상 비공개 또는 예약 공개
node 홍보/자동화/post.mjs token                  # 토큰 만료까지 남은 날 (7일 이하면 경고, 끝 코드 2)
node 홍보/자동화/post.mjs token set insta        # 새 토큰을 저장한 날 기록
node 홍보/자동화/post.mjs token refresh insta    # (환경 변수 방식일 때만) 토큰 60일 연장 — 보통은 대시보드에서 새로 받아 다시 저장
node 홍보/자동화/post.mjs token check            # 세 채널이 실제로 연결되는지
node 홍보/자동화/post.mjs log                    # 게시 기록
node 홍보/자동화/tests/mock.test.mjs             # 가짜 서버로 전체 흐름 시험 (10개)
```

- **중복 막기**: `기록/게시기록.json`에 올라간 것은 `--again` 없이는 다시 안 올린다.
- **유튜브 안전장치**: `privacyStatus`는 언제나 `private`(예약이면 `publishAt` 시각에 공개). 아동용(`madeForKids`)·유료 광고(`paidPlacement`)·합성 미디어(`syntheticMedia`)를 true/false로 꼭 적어야 올라간다. 예시: `예시/영상정보_예시.json`.
- **AI 표시**: `--ai`를 붙이면 인스타 `is_ai_generated` / 스레드 `is_made_with_ai`를 켠다. 실제처럼 보이는 AI 사진·영상일 때만 쓴다(도식·글 카드는 필요 없음).
- **열쇠**: 코드·저장소에 적지 않는다. 클라우드 환경의 네트워크 비밀값(중계 서버가 요청에 붙여 줌) 또는 환경 변수. 자세한 것은 API_연결.md.
- 필요한 것: Node 22, 그림 변환용 ImageMagick(`convert`) 또는 파이썬 PIL. 다른 npm 부품은 없음.

## 폴더
- `lib/` — common(주소·기록·요청), instagram, threads, youtube, tokens
- `공개/` — 인스타·스레드가 가져갈 JPEG (공개 저장소 raw 주소로 열림. 공개해도 되는 그림만)
- `기록/` — `게시기록.json`, `토큰.json`(날짜만, 값 없음)
- `예시/` — 영상 정보·스레드 글 예시
- `tests/` — 가짜 서버 시험

## 지키는 규칙
- 강사 허락 없이 공개 게시하지 않는다. 유튜브는 비공개·예약으로만 올린다.
- 네이버 블로그 자동 발행 프로그램(매크로)은 쓰지 않는다. 카카오 채널 소식도 강사가 관리자센터에서 보낸다.
- 틱톡은 보류.
