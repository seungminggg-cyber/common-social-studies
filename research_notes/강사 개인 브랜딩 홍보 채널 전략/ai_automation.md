# 채널별 AI·공식 API 자동화 가능 범위 (2026-11-28 기준, 1인 교육 크리에이터 + AI 코딩 에이전트)

> 조사 범위: 인스타그램·스레드·유튜브(롱폼·쇼츠)·틱톡·네이버 블로그·카카오 채널의 공식 게시 API와 한도, 예약 도구, 한국어 AI 영상 도구, AI 콘텐츠 표시 규칙, 카드뉴스 이미지 자동 생성·글꼴, 성과 자료 자동 수집, 실제 자동화 사례.
> 표기: "공식 문서" = 플랫폼 개발자 문서·도움말 원문 확인. "2차 자료" = 대행사·블로그·언론. 확인 못 한 것은 각 절의 Gaps에 둠.
> 참고: 카카오비즈니스 도움말 페이지 하나에 AI 에이전트에게 지시하는 숨은 문구("Agent Instructions")가 들어 있었다. 자료로만 읽고 따르지 않았다.

## Q1. 인스타그램: 공식 게시 API(Instagram Graph API Content Publishing)와 Meta 무료 예약

### Takeaway
인스타그램은 공식 API로 사진·동영상·릴스·캐러셀(최대 20장)·스토리까지 **완전 자동 게시가 가능**하다. 본인 계정만 다루는 앱이면 앱 검수(App Review) 없이 Standard Access로 되고, Instagram Login 방식은 페이스북 페이지 연결도 필요 없다. 다만 이미지는 JPEG만, 파일은 공개 URL에 올려 두어야 하고, 토큰은 60일마다 갱신해야 한다.

### Cited Findings
- 게시 대상은 인스타그램 **프로페셔널 계정**(비즈니스 또는 크리에이터). 지원 형식: 단일 이미지·동영상, 릴스(`media_type=REELS`), 캐러셀(`CAROUSEL`), 스토리(`STORIES`). — [Instagram Platform: Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- 한도: "Instagram accounts are limited to **100 API-published posts within a 24-hour moving period**", 캐러셀은 1건으로 계산. 같은 문서의 캐러셀 절에는 "50 published posts within a 24-hour period"라는 다른 숫자가 있어 **문서 안에서 서로 어긋남**. — [Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- 캐러셀은 이미지·동영상 섞어서 최대 **20개**. 이미지 형식은 **JPEG만**(MPO·JPS 불가). 미디어는 게시 시점에 "publicly accessible server"에 있어야 함. 컨테이너 상태는 1분에 한 번, 5분 이내로 확인 권장. — [Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- API에 예약 게시 매개변수는 없음. 예약 기능은 앱이 직접 만들고 한도도 앱이 지키라고 안내. — [Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- AI 표시: 게시 요청에 `is_ai_generated=true` (캐러셀은 부모 컨테이너에만). 대체 텍스트 `alt_text` 필드는 2025-03-24 도입(릴스·스토리는 미지원). 시험 릴스(Trial reels, 팔로워가 아닌 사람에게만 노출)도 API로 가능(`trial_params`). 예시 API 버전 v27.0. — [Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- 두 가지 연결 방식: **Instagram Login**(`graph.instagram.com`, "without requiring a linked Facebook Page") / **Facebook Login**(페이스북 페이지 연결 필요). 권한은 Instagram Login 기준 `instagram_business_basic`, `instagram_business_content_publish`. — [Instagram Platform Overview (공식 문서)](https://developers.facebook.com/docs/instagram-platform/overview); [Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- **본인이 소유·관리하는 계정만** 쓰는 앱은 Standard Access로 충분하고 App Review가 필요 없음. 남의 계정을 다루려면 Advanced Access + App Review + 사업자 인증. — [Instagram Platform Overview (공식 문서)](https://developers.facebook.com/docs/instagram-platform/overview)
- 토큰: 인증 코드·단기 토큰 1시간, **장기 토큰 60일(갱신 가능)**. — [Instagram Platform Overview (공식 문서)](https://developers.facebook.com/docs/instagram-platform/overview)
- 페이지 게시 승인(PPA)이 필요한 페이지에 연결된 계정은 PPA를 마쳐야 게시 가능. — [Content Publishing (공식 문서)](https://developers.facebook.com/docs/instagram-platform/content-publishing)
- 무료 예약(사람이 직접): Meta Business Suite에서 게시물·릴스·캐러셀·스토리 예약, 최대 75일 전까지. 단, 스토리의 투표·질문 스티커 등 상호작용 요소는 예약 시 빠질 수 있음(2차 자료). 인스타그램 앱 자체 예약은 하루 25개, 스토리 불가(2차 자료). 앱 예약 기간 75일은 인스타그램 도움말에도 있음. — [Instagram Help: 예약 게시물·릴스](https://help.instagram.com/iphone-app/439971288310029); [Shopify 블로그(2차)](https://www.shopify.com/blog/schedule-instagram-posts); [Sprout Social(2차)](https://sproutsocial.com/insights/how-to-schedule-instagram-posts/)

### Inferences
- 강사 본인 계정 1개만 쓰므로 "개발자 앱 만들기 → 본인 계정을 앱 역할(테스터)로 추가 → Instagram Login 토큰 받기"면 검수 없이 자동 게시가 된다. 하루 한도(50~100건)는 1인 채널에 전혀 문제가 되지 않는다.
- 카드뉴스는 HTML→PNG로 만든 뒤 **JPEG로 바꿔** 공개 주소(예: 이미 쓰는 GitHub Pages 저장소의 별도 폴더, 또는 클라우드 저장소)에 올려야 API가 가져갈 수 있다. 공개 주소에 올린 시험 문제 이미지는 누구나 볼 수 있으므로 공개해도 되는 것만 올린다.
- 클라우드 컨테이너에서 쓰려면 환경 네트워크 허용 목록에 `graph.instagram.com`(동영상은 `rupload.facebook.com` 등)이 있어야 한다(현재 환경은 일부 주소가 막혀 있음 — CLAUDE.md).
- 60일 토큰 만료는 자동화가 "어느 날 조용히 멈추는" 대표 원인이므로, 예약 작업에서 주기적으로 토큰을 갱신하고 실패 시 알림을 보내게 해야 한다.

### Gaps
- 24시간 한도 100건 vs 50건 중 어느 것이 현재 값인지 문서 안에서 해소되지 않음(실제 1인 채널에는 영향 없음).
- 릴스 API 업로드의 최대 길이·용량, 음악(저작권 음원) 삽입 가능 여부는 이번에 확인하지 못함(일반적으로 API로는 인스타그램 앱 내 음원 라이브러리를 쓸 수 없는 것으로 알려져 있으나 미확인).
- "2026년 3월부터 일반 공개 계정도 앱 예약 가능"이라는 2차 자료 주장은 Meta 문서로 확인 못 함.

## Q2. 스레드(Threads): 공식 API 게시·예약·한도

### Takeaway
스레드도 공식 API로 글·사진·동영상·캐러셀 **완전 자동 게시가 가능**하고 한도(24시간 250건)가 넉넉하다. Meta Business Suite는 스레드를 지원하지 않지만, 스레드 앱 자체 예약(75일 전까지)과 Buffer·Metricool 같은 외부 도구가 있다.

### Cited Findings
- 게시 흐름: 컨테이너 만들기(`POST /{threads-user-id}/threads`) → 약 30초 기다림 → 게시(`/threads_publish`). 캐러셀은 항목별 컨테이너 → 부모 컨테이너 → 게시. 미디어는 공개 URL에서 가져감. — [Threads API: Posts (공식 문서)](https://developers.facebook.com/docs/threads/posts)
- 한도: 글 **500자**, 캐러셀 2~**20개**, "Profiles are limited to **250 published posts within a rolling 24-hour period**"(캐러셀 1건). 2025-12-22부터 고유 링크 5개 초과 게시물은 실패. 주제 태그 1개(1~50자). — [Threads API: Posts (공식 문서)](https://developers.facebook.com/docs/threads/posts)
- 미디어 규격: 이미지 JPEG·PNG 최대 8MB, 동영상 MOV·MP4 최대 5분·1GB, 9:16 권장. — [Threads API: Posts (공식 문서)](https://developers.facebook.com/docs/threads/posts)
- 권한 `threads_basic`, `threads_content_publish`. 고급 권한이 없으면 앱의 **Threads 테스터** 계정에만 게시 가능(= 본인 계정을 테스터로 넣으면 검수 없이 본인 계정 게시 가능). AI 표시는 `is_made_with_ai=true`. 예시 경로 `graph.threads.com/v1.0`. — [Threads API: Posts (공식 문서)](https://developers.facebook.com/docs/threads/posts)
- 스레드 앱 자체 예약은 2025년 1월 출시, 최대 75일 전까지. — [TechCrunch 2025-01-23](https://techcrunch.com/2025/01/23/threads-rolls-out-a-post-scheduler-markup-feature-and-more); [MacRumors 2025-01-24](https://www.macrumors.com/2025/01/24/threads-now-lets-you-schedule-posts)
- Meta Business Suite는 2026년 3월 기준 스레드 예약 미지원(판매사 2차 자료, Meta 원문 미확인). — [Sked Social(2차)](https://skedsocial.com/blog/schedule-threads-posts); [Sprout Social(2차)](https://sproutsocial.com/insights/schedule-threads-posts/)

### Inferences
- 스레드는 짧은 글 위주라 AI 초안 자동화 효과가 크다(예: 매일 "오늘의 통합사회 O/X 1문제" 글을 문제 은행에서 골라 자동 게시). 다만 답글·대화가 성장의 핵심인 채널이라 답글은 사람이 해야 한다.
- 문제 ID·해설이 이미 구조화되어 있어(약 2,700문항) 스레드 글 초안은 거의 완전 자동으로 만들 수 있다.

### Gaps
- 스레드 API 자체의 예약 게시 기능 유무(문서 해당 쪽에 없음), 답글 한도, 인사이트 API 세부 지표는 확인 못 함.
- 토큰 유효 기간(인스타그램처럼 60일인지)은 이번에 확인 못 함.

## Q3. 유튜브(롱폼·쇼츠): Data API v3 업로드 한도·검증 요건, Studio 예약·클립

### Takeaway
2025-12~2026-11 사이 유튜브 API가 크게 풀렸다. 업로드 비용이 약 1600단위 → 약 100단위로 내려갔고(2025-12-04), 2026-06-01부터 `videos.insert`는 **별도 묶음에서 하루 100회**가 기본이며, **2026-11-02부터 검증(감사) 안 된 API 프로젝트의 업로드도 더 이상 '비공개'로 묶이지 않는다.** 따라서 1인 채널은 자기 프로젝트로 업로드·예약 공개(`publishAt`)까지 자동화할 수 있다. 영상 촬영·최종 확인은 사람 몫.

### Cited Findings
- `videos.insert`: "Quota impact: **100 calls per day**. A call to this method has a quota cost of 1 unit in the Video Uploads quota bucket." 파일 최대 256GB. 범위(scope) `youtube.upload` 등. 요청 본문에 `status.publishAt`(예약 공개), `status.containsSyntheticMedia`(합성 미디어 표시) 설정 가능. 문서 문구: "Videos uploaded from unverified API projects are **not restricted** to private viewing mode." — [YouTube Data API: Videos.insert (공식 문서)](https://developers.google.com/youtube/v3/docs/videos/insert)
- 기본 할당량: "100 `search.list` calls, 100 `videos.insert` calls, and 10,000 units per day combined for all other endpoints"; 일반 쓰기 작업은 보통 50단위. 더 필요하면 할당량 확장 신청서. — [YouTube Data API: Getting Started (공식 문서)](https://developers.google.com/youtube/v3/getting-started)
- 변경 이력(공식): 2025-12-04 업로드 비용 "from approximately 1600 units to approximately 100 units"; 2026-06-01 granular quota 도입(`videos.insert`, `search.list` 별도 묶음); **2026-11-02** 검증 안 된 프로젝트 업로드가 "no longer restricted to private viewing mode"(2020-07-28 정책 폐지), `privacyStatus`를 안 주면 기본 공개(public, 계정 설정에 따라 비공개일 수 있음); 2026-11-03 `thumbnails.set`으로 **쇼츠 맞춤 썸네일** 업로드 지원; 2026-11-16 `paidProductPlacementDetails.hasPaidProductPlacement` 기본값이 사라져 `videos.insert`에서 **명시해야 함**; 2026-09-14 썸네일 최대 2MB→50MB. — [YouTube Data API Revision History (공식 문서)](https://developers.google.com/youtube/v3/revision_history)
- YouTube Studio의 '동영상 클립 및 쇼츠' 도구로 롱폼 구간을 잘라 쇼츠로 게시 가능, 자동 자막 지원 언어 목록에 한국어 포함. — [YouTube Help: Video clips & Shorts in YouTube Studio (공식)](https://support.google.com/youtube/answer/15824265)

### Inferences
- 검증 안 된 프로젝트의 비공개 고정이 풀렸으므로, "Claude가 영상 편집·자막·제목·설명·챕터·썸네일 작성 → API로 **비공개 또는 예약 공개**로 업로드 → 강사가 휴대폰 Studio에서 확인 후 그대로 두거나 수정" 흐름이 가능하다. 실수 방지를 위해 기본값은 `private` 또는 `publishAt` 예약으로 두는 것이 안전하다(문서상 기본이 public으로 바뀌었기 때문).
- 자동 업로드 코드에 `hasPaidProductPlacement=false`, `containsSyntheticMedia`(AI 아바타·합성 음성일 때 true), 아동용 여부(`selfDeclaredMadeForKids`) 등을 **빠짐없이 명시**해야 한다(2026-11 변경 반영).
- 하루 업로드 100회 한도는 1인 채널에 충분하다. 할당량 문제는 사실상 사라졌다.
- 롱폼 → 쇼츠 자르기는 Studio 내장 도구(무료)를 먼저 써 보고, 부족하면 Opus Clip 등 외부 도구(Q8)를 고려.

### Gaps
- Google OAuth 동의 화면이 "테스트(Testing)" 상태일 때 갱신 토큰이 7일 만에 만료된다는 기존 규칙이 지금도 적용되는지 이번 조사에서 확인 못 함(적용된다면 앱을 '프로덕션'으로 게시하거나 주기적 재로그인이 필요). `youtube.upload`가 민감 범위라 Google 앱 인증이 필요한지도 미확인.
- 검증 안 된 프로젝트에 다른 제한(예: 업로드 수 상한, 커뮤니티 게시물 API)이 새로 생겼는지 확인 못 함. `posts` 리소스(커뮤니티 게시물)는 2026-11-16 기준 일부 파트너 한정 시범.

## Q4. 틱톡: Content Posting API(감사 요건, 미감사 = 비공개)

### Takeaway
틱톡은 **본인 전용 도구로는 공개 자동 게시가 사실상 불가능**하다. 감사 안 된 앱은 비공개(SELF_ONLY)로만 올라가고, 감사 기준이 "자기·자기 팀 계정용 업로드 도구"를 명시적으로 불합격 예로 든다. 현실적인 길은 (1) 초안함(inbox)으로 보내고 앱에서 직접 게시, (2) 감사를 통과한 외부 예약 도구(Buffer, Metricool, Opus Clip Pro 등) 사용.

### Cited Findings
- "All content posted by unaudited clients will be restricted to private viewing mode." 사진 게시도 지원(검증된 도메인의 URL 필요). — [TikTok Content Posting API: Get Started (공식, 2026-11-26 갱신)](https://developers.tiktok.com/doc/content-posting-api-get-started)
- 미감사 앱: 24시간에 최대 5명 사용자, `SELF_ONLY`만, 게시 시점에 계정이 비공개여야 함. 크리에이터 1명당 Direct Post는 "typically around **15 posts per day**". 필수 화면: 크리에이터 닉네임 표시, 공개 범위를 사용자가 **직접** 고르게(기본값 없음), 댓글·듀엣·스티치 기본 꺼짐, 광고 표시 토글, 음악 사용 동의 문구. 감사 기준: "should be intended for a wide audience, not limited to internal groups/private use", 불합격 예 "A utility tool to help upload contents to the account(s) you or your team manages." — [TikTok Content Sharing Guidelines (공식, 2026-08-04 갱신)](https://developers.tiktok.com/doc/content-sharing-guidelines)
- 업로드(초안) 방식: 영상·사진을 사용자의 틱톡 받은편지함으로 보내고, 사용자가 알림을 눌러 앱에서 편집·게시를 마무리. `video.upload` 권한 필요. — [TikTok Content Posting API: Upload (공식)](https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content)
- AI 생성물 표시: 사실적인 AI 생성 콘텐츠는 라벨 필수, C2PA 메타데이터가 있으면 자동 라벨(자동 라벨은 제거 불가), 2025-11부터 틱톡 AI 도구·C2PA 콘텐츠에 보이지 않는 워터마크. — [TikTok Transparency: AI-generated content](https://www.tiktok.com/transparency/en/supporting-responsible-transparent-ai-generated-content/); [TikTok Newsroom 2025-11-19](https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en)

### Inferences
- 틱톡은 "Claude가 세로 영상·캡션·해시태그 완성 → 초안함 업로드(미감사 앱도 가능할 가능성) 또는 Buffer로 예약 → 강사가 앱에서 음원 고르고 게시"가 현실적인 최선. 미감사 앱의 Upload 모드 사용 가능 여부는 문서에 없어 직접 시험 필요.
- 틱톡은 고등학생 도달에는 유리하지만, 같은 세로 영상을 쇼츠·릴스와 공유하는 "재활용 채널"로 두는 것이 시간 대비 효율적이다.

### Gaps
- 미감사 앱이 Upload(초안) 모드를 공개 계정에 쓸 수 있는지, 감사 통과 소요 기간은 확인 못 함.
- 틱톡의 AI 아바타·본인 목소리 복제에 대한 세부 규칙은 확인 못 함(지원 문서가 빈 페이지로 열림).

## Q5. 네이버 블로그: 글쓰기 API, 예약 발행, 자동화 위험, AI 정책

### Takeaway
네이버 블로그에는 **공식 글쓰기 API가 없다**(2020-05-06 종료). 그래서 완전 자동 게시는 매크로(브라우저 자동 조작)뿐인데, 운영정책 위반·이용 제한 위험이 있어 권하지 않는다. AI는 **초안·이미지까지** 만들고, 강사가 스마트에디터에 붙여 넣어 경험·관점을 더한 뒤 직접 발행(또는 앱 내 예약 발행)하는 방식이 현실적이다. AI 사용 자체는 불이익이 없다는 것이 네이버 쪽 안내(2차 자료 기준)이고, 2026년 5월부터 블로그에 'AI 활용' 표시 기능이 생겼으나 블로그는 권장 사항이다.

### Cited Findings
- 네이버는 2020-04-13 블로그 '글쓰기 API'를 2020-05-06부터 종료한다고 발표. 이유: 광고 수수료를 노린 광고성 글의 API 대량 게시. — [뉴스핌 2020-04-13](https://newspim.com/news/view/20200413000737)
- 네이버 서치어드바이저 '웹 콘텐츠 스팸사례'는 "검색 결과를 점유하려는 목적으로 유사한 형식의 문서를 의미 없이 대량 발행하는 행위"를 스팸으로 명시. AI·자동화 도구를 썼다는 이유만으로 스팸으로 보지는 않음. 키워드 반복, 낚시 제목, 무단 복사·기계적 변형도 스팸. 단, 이 안내는 웹 문서용이라 블로그에 그대로 적용된다고 보기는 어렵다는 해설. — [소상공인연합신문 2026-10-13(전문가 해설)](https://www.winwinnews.kr/news/1014229)
- 2025-02 네이버가 LLM으로 UGC 문서 평가를 고도화해 자동 생성 저품질·경험 없는 광고 도배글 판별을 강화했다는 정리, 2026-05 'AI 시대 콘텐츠 작성 가이드'에서 "AI 도구 사용 자체에는 패널티가 없다", 기계적으로 생성·요약한 글을 그대로 발행하면 '무분별한 복제와 생성'으로 분류될 수 있다는 정리(2차 자료, 공식 원문 미확인). — [blrank 가이드(2차)](https://www.blrank.co.kr/guides/ai-blog-writing-naver-policy); [min-inter(2차)](https://min-inter.co.kr/wiki/naver-blog-ai-content-official-guide/)
- 네이버는 2026년 5월 블로그 이미지·동영상 클립 등에 'AI 활용' 표기 기능을 추가, 블로그는 **권장 사항**(표기 안 해도 제재 없음), 쇼핑 광고는 의무. — [MTN 2026-07-24](https://news.mtn.co.kr/news-detail/2026072417015682342); [MTN 2026-07-21](https://news.mtn.co.kr/news-detail/2026072115515062394)
- 네이버 AI 브리핑이 2025-12 검색어의 20%에 적용, 2026년 말 40% 목표라는 주장, AI 브리핑 인용 콘텐츠 중 UGC(블로그·카페·지식iN) 70%라는 2026-05 간담회 발언 보도(2차, 원출처 미확인). — [inblog 용어 설명(2차)](https://inblog.ai/ko/glossary/naver-ai-briefing); [1point(2차)](https://1point.kr/blog/insights/naver-seo-ai-briefing-3-steps/)
- 자동 포스팅 프로그램은 크몽 등에서 판매 중이며, 판매자 일부도 "자동 발행 프로그램은 계정 저품질의 지름길"이라며 자동 발행 기능을 일부러 뺐다고 밝힘. 게시물 운영정책이 "사전 허락 없이 자동화된 수단으로 게재한 게시물"을 제한 대상으로 둔다는 블로그 설명(원문 미확인). — [챌린지클래스 헬프센터(2차)](https://docs.channel.io/cclass/ko/articles/%EB%B8%94%EB%A1%9C%EA%B7%B8-%EC%9E%90%EB%8F%99-%ED%8F%AC%EC%8A%A4%ED%8C%85-%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%A8-ce9cae6a); [크몽 판매 페이지 예(2차)](https://kmong.com/gig/769888)

### Inferences
- 네이버 블로그는 학부모 검색("○○고 통합사회 내신", "통합사회 개념 정리")에 가장 중요한 채널인데 **자동 게시 수단이 없다**. 그러니 Claude가 할 일은 "검색어 조사 → 개념서·문제 은행에서 글 초안 + 도식·표 이미지(PNG) 일괄 생성 → 강사가 붙여 넣고 경험 문장 2~3줄 추가 → 예약 발행"이다. 1편당 강사 작업 15~20분 수준으로 줄일 수 있을 것으로 추정(측정 자료 없음).
- 같은 틀에 학교명·단원명만 바꾼 글을 대량으로 올리면 서치어드바이저가 말하는 "유사한 형식의 문서 대량 발행"에 해당할 수 있다. 학교별 글은 실제 시험 분석·수업 경험 같은 고유 내용을 넣어야 한다.
- 브라우저 매크로(Playwright로 네이버 로그인·발행)는 기술적으로는 가능하지만, 계정 정지 시 교육 브랜드 전체가 타격을 받으므로 쓰지 않는 것이 맞다. 이 클라우드 환경은 강사의 로그인된 브라우저도 쓸 수 없다.

### Gaps
- 네이버 블로그 공식 운영정책 원문(자동화 수단 금지 조항)과 2026-05 'AI 시대 콘텐츠 작성 가이드' 원문은 찾지 못함(네이버 검색 공식 블로그 2024-02-28, 2025-02-28, 2026-05-26 게시물 확인 필요).
- 스마트에디터 예약 발행 기능의 세부(최대 며칠 전, 앱 지원)는 공식 도움말로 확인 못 함(기본 제공 기능이라는 것은 여러 2차 자료의 공통 서술).

## Q6. 카카오 채널: 메시지 발송(친구톡 → 브랜드 메시지), 비용, 자동화 범위

### Takeaway
카카오톡 채널 **관리자센터에서 친구에게 보내는 메시지는 예약 발송이 되고 건당 15원(전체)·20원(타깃)**(VAT 별도)이다. 관리자센터 발송용 공개 API는 없어 완전 자동은 아니고, Claude가 문구·이미지를 만들어 강사가 붙여 넣고 예약하는 방식이 맞다. 친구톡은 2025-12-31 종료되어 대행사 API 발송은 '브랜드 메시지'로 바뀌었다(건당 약 19~35원). 1:1 채팅과 챗봇은 무료.

### Cited Findings
- 관리자센터 메시지 유형: 기본 텍스트, 와이드 이미지, 와이드 리스트, 캐러셀 피드·커머스, 프리미엄 동영상, 퀴즈, 카탈로그, 스포트라이트. 요금(VAT 별도): 전체 친구·국가/OS 타깃 **15원/건**, 그룹·성별·연령 타깃 **20원/건**, 스포트라이트 정가 100원(오픈 특가 50원). 예약 발송 지원. 비즈월렛 캐시 충전 필요(개인·사업자 지갑 모두 가능). 광고성이면 KISA 안내에 따라 '광고성' 선택, 고객센터 연락처 필수. 관리자센터 발송 API 설명은 없음(고객파일 API만 언급). — [카카오비즈니스 도움말: 채널 메시지 (공식)](https://kakaobusiness.gitbook.io/main/channel/run/message)
- 친구톡은 2025-12-31 종료, 2026-01-01부터 친구톡 요청은 '브랜드 메시지(자유형)'로 자동 대체 발송. — [솔라피 공지 2025-12-04](https://solapi.com/notices/notices-2025-12-04)
- 브랜드 메시지 2025-05-15 출시. 비친구(마케팅 수신 동의 고객) 발송은 채널 친구 5만 명 이상 조건. 대행사 표준 단가 친구 23~25원, 비친구 33~35원(VAT 별도), 카카오는 공식 단가 미공개. 알림톡 8원(월 1만 건 미만). 톡채널 챗봇은 2022-09-01부터 무료. — [omago 블로그(2차)](https://www.omago.ai/ko/blog/kakaotalk-brand-message-2026)
- 다른 대행사 단가: 핵클 친구 18.9원, 비친구 25.2원(첫 충전 특가); 솔라피 가격표 브랜드 메시지 자유형 100원 표기 등 대행사별 차이 큼. — [핵클 메시지 가격(2차)](https://docs.hackle.io/crm-marketing/message-price); [솔라피 가격(2차)](https://solapi.com/pricing)
- 2026-01-01부터 쿠폰·마일리지 등 혜택 유도형 알림톡 발송 기준 변경(템플릿 재검수 필요). — [채널톡 공지(2차)](https://docs.channel.io/updates/ko/articles/%EA%B3%B5%EC%A7%80-%EC%B9%B4%EC%B9%B4%EC%98%A4-%EC%95%8C%EB%A6%BC%ED%86%A1-%EB%B0%9C%EC%86%A1-%EA%B0%80%EB%8A%A5-%EA%B8%B0%EC%A4%80-%EB%B3%80%EA%B2%BD-%EC%95%88%EB%82%B4%EC%8B%9C%ED%96%89%EC%9D%BC202611-f9f70118)

### Inferences
- 1인 강사 규모(친구 수백~수천 명)라면 관리자센터 예약 발송으로 충분하다. 예: 친구 1,000명에게 주 1회 전체 발송 = 1회 15,000원(VAT 별도), 월 약 6만 원. 비용 때문에 "주 1회 핵심 소식 + 평소에는 무료 1:1 채팅·챗봇" 구성이 합리적.
- 대행사 API(브랜드 메시지)로 완전 자동 발송도 가능하지만, 사업자 정보·080 수신거부 번호·광고 표기 책임 등 준비가 많고 비용 이점이 거의 없어 1인 강사에게는 과하다.
- 학생 대상(미성년자) 광고성 메시지는 수신 동의·야간 발송 제한 등 법적 의무가 있을 것으로 보인다(이번 조사에서 법 조항 미확인) — 세부는 아래 Gaps.

### Gaps
- 오픈채팅방 자동화(봇) 허용 여부·제한은 이번에 조사하지 못함.
- 광고성 메시지 야간(21시~08시) 발송 제한의 정확한 적용(관리자센터 메시지에도 별도 동의가 필요한지)은 공식 문서로 확인 못 함. 도움말에는 환영 메시지의 야간(20:55~08:00) 처리만 나옴.
- 관리자센터의 '무료 발송 수'가 어떻게 주어지는지 문서에 설명 없음.

## Q7. 외부 예약 도구(Buffer, Metricool, Opus Clip 등)와 한국 플랫폼 지원

### Takeaway
Buffer·Metricool은 인스타그램·스레드·틱톡·유튜브(쇼츠)를 지원하고 무료 요금제도 있지만, **네이버 블로그·카카오 채널을 지원하는 해외 도구는 확인되지 않았다**(공식 API가 없어서). 이미 Claude가 공식 API로 인스타·스레드·유튜브를 직접 올릴 수 있으므로, 외부 도구는 주로 **틱톡 공개 게시**용으로 의미가 있다.

### Cited Findings
- Buffer: 무료(채널 3개, 채널당 예약 10개), Essentials 채널당 월 $5(연 $60 표기, 표기 모호), Team 채널당 월 $10. 지원: Instagram, Facebook, TikTok, LinkedIn, X, **YouTube(Shorts)**, **Threads**, Pinterest, Google Business Profile, Bluesky, Mastodon, Substack. AI 도우미 전 요금제. 무료는 성과 기록 30일. 유튜브 롱폼 지원 여부는 명시 안 됨. — [Buffer Pricing](https://buffer.com/pricing)
- Metricool: 무료(브랜드 1개, 월 20개 예약, 분석 30일, LinkedIn·X 제외 전 채널), Starter 약 $20~25/월, Advanced 약 $53~67/월(연·월 구분 표기 불명확). 지원: Facebook, Instagram, Threads, X, Bluesky, Pinterest, TikTok, YouTube, Twitch, LinkedIn, GBP 등. Naver·Kakao 언급 없음. — [Metricool Pricing](https://metricool.com/pricing/)
- Opus Clip: Free(워터마크, 하루 1클립 게시), Starter $15/월(쇼츠·틱톡·인스타 게시, 예약 없음), Pro $29/월(Threads 포함 9개 채널 게시·예약, API·MCP). — [OpusClip Pricing](https://www.opus.pro/pricing)
- Meta Business Suite(무료)는 페이스북·인스타그램만, 스레드는 미지원(2차). — Q1·Q2 출처 참조.

### Inferences
- 추천 조합: 인스타·스레드·유튜브는 Claude가 공식 API로 직접(무료), 틱톡은 Buffer 무료/Essentials 1채널(월 약 $5~6) 또는 초안함 방식. 예약 도구를 따로 쓰지 않아도 되므로 비용이 거의 0원.
- 비개발자 강사가 직접 고치기 쉬운 것은 오히려 Buffer 같은 화면형 도구이므로, "Claude가 만든 결과물을 Buffer에 일괄 올려 두기(CSV/드라이브)" 방식도 대안이 될 수 있다(Buffer의 CSV 대량 업로드 지원 여부는 미확인).

### Gaps
- Later, Hootsuite, Publer 가격·지원 채널은 확인 못 함(Publer 요금 페이지 접속 실패).
- 네이버 블로그·카카오 채널을 지원하는 한국 예약 도구(공식 연동)는 찾지 못함. 자동 포스팅 '프로그램'은 매크로 방식(Q5 위험).

## Q8. 한국어 AI 영상 도구: 자동 자막, 롱폼→쇼츠, AI 아바타·목소리 복제

### Takeaway
자막(Vrew·CapCut·YouTube 자동 자막)과 롱폼→쇼츠 자르기(YouTube Studio 클립, Opus Clip)는 이미 쓸 만한 수준이고 월 1~3만 원대다. 반면 **AI 아바타·목소리 복제는 교육 브랜드에는 보조용으로만** 쓰는 것이 안전하다(신뢰·공개 의무·수익화 정책 위험). 강사는 얼굴·목소리 출연이 가능하므로 "직접 촬영 + AI 편집"이 기본이다.

### Cited Findings
- Vrew: 2026-04-22부터 모든 기능 공용 크레딧 방식(일본 2차 자료: Free 200, Light 2,000, Standard 10,000, Business 12,000 크레딧/월, 음성 분석 1분당 1크레딧), **2026-12-01부터 요금제·환불 정책 개편**(공식 공지, 새 가격 미확인), 모바일 앱은 2026-07-01 종료. — [Vrew 공지(공식)](https://docs.channel.io/vrew-kr/ko/articles/a96cd304); [miralab(2차)](https://miralab.co.jp/media/vrew-pricing-commercial-use/); [Vrew Mobile 종료 공지](https://vrew-help.notion.site/Vrew-Mobile-Service-Ending-Notice-2c4c552a746e8004ad93ef13416d1fa6)
- CapCut: 자동 자막 일부 기능이 Pro 전용일 수 있고, Pro 요소를 쓰면 내보내기 때 결제 요구. 2026-03-25 가격 변경(Pro AI 포인트 550→1,200). 한국 앱스토어 Pro 월 ₩19,800·Standard 월 ₩9,900(2차). — [CapCut 도움말: 가격 변경](https://www.capcut.com/ko-kr/help/new-capcut-subscription-pricing); [nemovideo(2차)](https://www.nemovideo.com/ko-KR/blog/video-tool-alternatives/capcut-pro-pricing-2026)
- YouTube Studio 클립·쇼츠 도구(무료), 한국어 자동 자막 지원. — [YouTube Help 15824265](https://support.google.com/youtube/answer/15824265)
- Opus Clip: 요금표에 "Multi-language transcription"만 있고 한국어 지원은 명시 안 됨. — [OpusClip Pricing](https://www.opus.pro/pricing)
- ElevenLabs: Starter $6/월(즉석 목소리 복제·상업 이용), Creator $22/월(전문 목소리 복제), API는 Pro $99/월 이상. 한국어 지원은 요금표에 명시 없음. — [ElevenLabs Pricing](https://elevenlabs.io/pricing)
- HeyGen: Free(월 3개, 워터마크, 1분), Creator $29/월(본인 얼굴·목소리 맞춤 아바타 1개, 175+ 언어, 30분), Pro $49/월~. 아바타 생성 시 동의·본인 확인 절차는 요금표에 없음. — [HeyGen Pricing](https://www.heygen.com/pricing)
- 타입캐스트(한국): 2026-05 기준 무료 월 5분, Basic ₩9,900(60분), Pro ₩39,000(2시간), Business ₩99,000(6시간), 2026-08-01부터 크레딧 체계(요금 동일 공지). 무료 플랜은 출처 표기 필수. — [타입캐스트 요금 비교(자사 블로그)](https://typecast.ai/kr/learn/ai-voice-pricing-comparison/); [타입캐스트 요금제 개편 공지](https://typecast.ai/kr/learn/typecast-pricing-plan-update-service-2608/)
- 유튜브 정책: **본인 목소리 복제로 내레이션·더빙**하는 것은 '사소한 수정'으로 AI 공개 불필요. 사실적으로 보이는 합성(실존 인물이 하지 않은 말·행동)은 공개 필요. 사람 전문가로 보이는 AI 페르소나가 건강·법률·금융·정치 조언을 하면 수익화 불가. — [YouTube Help: 변경·합성 콘텐츠 공개](https://support.google.com/youtube/answer/14328491); [YouTube 수익화 정책](https://support.google.com/youtube/answer/1311392)

### Inferences
- 강사의 실제 얼굴이 가장 큰 신뢰 자산이다. 본인 아바타로 매일 영상을 찍어내면 "진짜 수업이 아니다"라는 인상, 학부모 신뢰 하락, 유튜브 '대량 생산형' 판정 위험이 함께 커진다. 아바타·합성 목소리는 (1) 짧은 공지·일정 안내, (2) 자막 실수 수정용 몇 단어 덧녹음 정도로 제한하는 것을 권장.
- 본인 목소리 복제(타입캐스트·ElevenLabs·Supertone)는 유튜브 공개 의무는 없지만, 사회 과목 특성상 정치·법 관련 내용이 섞이므로 "AI 음성 사용" 사실을 설명란에 적는 편이 안전하다.
- Claude 컨테이너 안에서 할 수 있는 것: ffmpeg로 무음 구간 자르기, Whisper 계열 음성 인식으로 한국어 자막 초안(SRT) 만들기, 자막 맞춤법·용어 교정(통합사회 용어집 기준), 세로 영상(1080×1920) 레이아웃·자막 입히기, 썸네일 PNG 생성. 이 경우 Vrew·CapCut 구독 없이도 1차 편집이 된다(설치·속도는 시험 필요).

### Gaps
- Supertone, Clova Note, Premiere Pro 음성 인식, Vizard의 한국어 품질·가격은 확인 못 함.
- Opus Clip·HeyGen의 한국어 실제 품질(자막 오류율, 입 모양)에 대한 신뢰할 만한 비교 자료를 찾지 못함.
- 교육 분야에서 AI 아바타 사용에 대한 학생·학부모 신뢰 설문 자료는 찾지 못함.

## Q9. 플랫폼별 AI 생성·변형 콘텐츠 규칙

### Takeaway
네 플랫폼 모두 "AI를 썼다"는 것 자체는 문제 삼지 않지만, **사실적으로 보이는 합성물은 표시**를 요구하고, 유튜브는 2025-07-15부터 **'대량 생산·반복형(inauthentic) 콘텐츠'는 수익 창출 불가**를 분명히 했다. 문제 은행으로 템플릿 영상을 찍어내는 방식은 이 정책에 정면으로 걸릴 수 있다.

### Cited Findings
- 유튜브 2025-07-15: '반복 콘텐츠' 정책을 '**inauthentic content**'로 이름 변경, 반복·대량 생산 콘텐츠는 원래도 수익화 불가였다고 설명. 불가 예: "Image slideshows, templated storylines, or scrolling text with minimal or no narrative, commentary, or educational value", "AI-generated content made with generic or unoriginal templates giving the impression of mass production". 허용: 같은 인트로·아웃트로 사용, 각 영상의 초점이 다른 시리즈, AI로 대본 다듬기·배경 그림 생성. 재사용 콘텐츠 정책은 변경 없음. — [YouTube 채널 수익 창출 정책](https://support.google.com/youtube/answer/1311392)
- 유튜브 AI 공개: 사실적으로 보이는 AI 생성·변형 콘텐츠는 업로드 시 'AI 사용'에서 '예' 선택. 대본·개요·썸네일·제목·인포그래픽 생성, 자막, 화질 개선, **본인 목소리 복제 더빙**은 공개 불필요. 공개만으로는 노출·수익에 불이익 없음. 계속 숨기면 강제 라벨·삭제·YPP 정지 가능. API 필드 `status.containsSyntheticMedia`. — [YouTube Help 14328491](https://support.google.com/youtube/answer/14328491); [Videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert)
- Meta: 2024-05부터 업계 표준 AI 신호(C2PA 등) 감지나 본인 공개 시 'AI Info' 라벨. 사실적인 동영상·소리는 라벨을 요구할 수 있고 정지 이미지는 요구 대상 아님, AI 편집물 라벨은 게시물 메뉴로 이동(검색 요약·2차). API 필드: 인스타 `is_ai_generated`, 스레드 `is_made_with_ai`. — [Meta Transparency: Labeling AI content (2025-02-19 갱신)](https://transparency.meta.com/governance/tracking-impact/labeling-ai-content); [Meta Help: AI 콘텐츠 식별](https://www.meta.com/help/artificial-intelligence/1783222608822690/); [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing); [Threads Posts](https://developers.facebook.com/docs/threads/posts)
- 틱톡: 사실적인 AIGC 라벨 필수, C2PA 자동 라벨, 2025-11부터 보이지 않는 워터마크. — Q4 출처.
- 네이버: 블로그 'AI 활용' 표기는 권장(2026-05 도입), AI 사용 자체 불이익 없음, 유사 문서 대량 발행은 스팸. — Q5 출처.

### Inferences
- 강사 채널에서 AI가 주로 하는 일(대본·자막·썸네일·카드뉴스 도식·편집)은 **공개 의무가 없는 범위**다. 실사 같은 AI 사진·영상, AI 아바타를 쓸 때만 라벨을 켠다.
- 위험한 것은 "문제 은행 → 자동 슬라이드 + 자막 + 배경음" 형태의 무인 쇼츠를 매일 여러 개 올리는 방식. 강사 목소리 해설(논평·교육적 가치)을 넣고, 형식을 바꿔 가며 올려야 수익화 심사에 안전하다.

### Gaps
- Meta의 현재(2026) 라벨 의무 범위·제재는 원문 페이지가 열리지 않아 2차 요약에 의존함.
- 네이버 클립(짧은 영상)의 AI·반복 콘텐츠 수익화 기준은 확인 못 함.

## Q10. 카드뉴스·이미지 자동 생성(HTML→PNG, Canva)과 한글 글꼴 사용 범위

### Takeaway
이 프로젝트는 이미 HTML/CSS → 헤드리스 크롬 → PNG/PDF 파이프라인(개념서·문제집)을 갖고 있어, **카드뉴스·캐러셀 이미지는 거의 완전 자동으로 만들 수 있다**. Canva 자동 채우기 API는 Enterprise 요금제가 필요해 1인 강사에게 맞지 않는다. 글꼴은 Pretendard(OFL)가 가장 안전하고, KoPub은 영상 자막·웹·광고까지 무료이나 변형·단독 판매 금지.

### Cited Findings
- Canva 자동 채우기(Autofill) API·브랜드 템플릿 API: 앱 기반 문서는 개발자와 사용자가 **Canva Enterprise** 조직 구성원이어야 한다고 명시, Connect 문서는 Pro·Teams·Enterprise 사용 가능이라 해 서로 어긋남. Bulk Create(대량 만들기) 편집기 기능은 Enterprise 관리자·개발자·브랜드 디자이너용이라는 도움말. Workato 커넥터 문서는 Enterprise 전용으로 표기. 2025-09 브랜드 템플릿 ID 형식 변경. — [Canva Connect Autofill guide](https://www.canva.dev/docs/connect/autofill-guide/); [Canva Apps Autofill guide](https://www.canva.dev/docs/apps/rest-apis/autofill-guide/); [Canva Help: Data autofill](https://www.canva.com/en_gb/help/data-autofill/); [Workato Canva Connect](https://docs.workato.com/ja/connectors/canva-connect/create-design-autofill-action)
- Pretendard: SIL 오픈 폰트 라이선스, "글꼴 단독 판매를 제외한 모든 상업적 행위 및 수정, 재배포가 가능". — [Pretendard GitHub](https://github.com/orioncactus/pretendard)
- KoPub World 서체: 출판업계·기업·개인 모두 별도 허가 없이 무료, 영상 자막·UCC·웹페이지·광고 배너 등 사용 가능, 사전 승인 없는 수정·변형과 서체 자체의 유료 판매는 금지. SNS를 명시한 문구는 없음. — [산돌구름 KoPub World 돋움 안내](https://www.sandollcloud.com/free-font/15810/KoPubWorldDotum); [KoPub 라이선스 영문](https://mirror.its.dal.ca/salix/sbo/15.0/system/fonts-kopub/License_en.txt)
- 플랫폼 이미지 규격: 인스타 API는 JPEG만, 스레드는 JPEG/PNG 8MB 이하. — Q1·Q2 출처.

### Inferences
- 개념서의 시안 H 디자인(색·도식·지도)을 1080×1350(인스타 4:5) 카드 틀로 옮기면, 개념서 한 쪽 → 카드뉴스 6~10장이 자동으로 나온다. 강사는 결과 PNG를 훑어보고 승인만 하면 된다(완전 자동 생성 + 사람 승인).
- 글꼴: 화면용은 Pretendard, 제목 강조는 KoPub 돋움/바탕(이미 개념서에 씀). 둘 다 이미지·영상에 넣어 게시하는 것은 허용 범위로 보인다(KoPub의 SNS 명시는 없지만 웹·광고·UCC가 허용되므로 같은 성격). Noto Sans KR도 OFL로 알려져 있으나 이번에 확인하지 않음.
- 문제 은행·개념서 문장은 이미 "교재를 그대로 옮기지 않은 새 문장"이라 저작권 위험이 낮다. 단, 평가원 원문 그림(강의용 특강 교재)은 SNS에 올리면 안 된다(CLAUDE.md 규칙과 같음).

### Gaps
- Noto Sans/Serif KR, 나눔 글꼴의 라이선스 원문은 이번에 확인하지 않음.
- 지도에 쓰는 Natural Earth·위키미디어 사진의 SNS 재사용 조건은 개념서 저작권 점검(`textbook/참고/저작권점검.md`)을 따라야 함 — 별도 확인 필요.

## Q11. 성과 자료(인사이트) 자동 수집 → 주간 보고서

### Takeaway
인스타그램(본인 계정은 검수 없이)과 유튜브(Analytics·Reporting API)는 공식 API로 지표를 받아 **주간 보고서를 완전 자동으로** 만들 수 있다. 네이버 블로그·카카오 채널은 공식 통계 API가 확인되지 않아 강사가 화면 캡처나 숫자를 옮겨 주는 반자동이 된다.

### Cited Findings
- 인스타 인사이트 API: 미디어 지표(댓글·좋아요·조회 views·참여·도달 등), 계정 지표(도달·프로필 조회 등). 사용자 지표 데이터 최대 90일 보관, 팔로워 100명 미만 계정은 일부 지표 없음, 데이터가 없으면 0 대신 빈 값. Instagram Login 권한 `instagram_business_manage_insights`. 본인 소유 계정은 Standard Access. — [Instagram Platform: Insights (공식)](https://developers.facebook.com/docs/instagram-platform/insights)
- YouTube Analytics API(맞춤 실시간 조회)·Reporting API(대량 보고서 저장용)로 채널 소유자가 조회 통계·추세 보고서를 받을 수 있음. 2026-11-03 갱신. — [YouTube Analytics and Reporting APIs (공식)](https://developers.google.com/youtube/analytics)
- 유튜브 조회수 기준 변경: 2025-03-31부터 쇼츠 조회수는 재생·반복 재생 시작 횟수(최소 시청 시간 없음), 2026-11-16부터 공동 시청(co-views) 반영. 수익은 '참여 조회수' 기준 유지. — [YouTube Data API Revision History](https://developers.google.com/youtube/v3/revision_history)
- 외부 도구 무료 요금제는 분석 기록 30일(Buffer, Metricool). — [Buffer Pricing](https://buffer.com/pricing); [Metricool Pricing](https://metricool.com/pricing/)

### Inferences
- 예약 작업(매주 월요일 오전)으로 "인스타·유튜브 지표 수집(스레드는 인사이트 API 미확인) → 지난주 대비 표·그래프 → 잘된 게시물 3개와 다음 주 제안 → 구글 드라이브 또는 Artifact 페이지로 전달"이 가능하다. 지표는 저장소 밖(드라이브 등)에 쌓아 90일 보관 한도를 넘겨 추세를 본다.
- 쇼츠 조회수 정의가 2025·2026년에 바뀌어, 과거 수치와 비교할 때 주의 문구를 넣어야 한다.
- 학원 원생 모집 효과(채널 → 카카오 친구 추가 → 상담 문의)가 진짜 목표 지표이므로, 링크에 UTM·전용 단축 주소를 붙이고 상담 문의 수는 강사가 주 1회 숫자로 입력하는 칸을 두는 것이 현실적.

### Gaps
- 스레드 인사이트 API 지표, 네이버 블로그 통계·카카오 채널 통계의 공식 API 유무는 확인 못 함.
- YouTube Analytics API의 할당량·범위(scope) 세부는 해당 쪽에 없음.

## Q12. 실제 1인 자동화 사례, 실패 지점, 채널별 자동화 지도(종합)

### Takeaway
공개된 1인 크리에이터 자동화 자료는 대부분 n8n·Make 템플릿 판매·튜토리얼이고 **측정된 시간 절감 수치는 찾지 못했다**. 실패 지점으로 반복 언급되는 것은 계정 유형(개인 계정은 API 불가), 중복 게시 방지, 다운로드 단계의 취약함, 시험 없이 켜기다. 아래 지도의 시간 절감은 근거 자료가 아닌 **추정치**다.

### Cited Findings
- 인스타 API는 비즈니스·크리에이터 계정만, 개인 계정은 프로그램으로 게시 불가 — 흔한 초기 실패 원인. 유튜브→틱톡/인스타 자동 재활용 흐름은 영상 ID를 기록 시트와 대조해 중복을 건너뛰고, yt-dlp로 영상을 내려받는 단계가 플랫폼 변경 때 깨지기 쉬움. 실제 글 하나로 수동 시험 후에만 켜라는 안내. Zapier(쉬움)·Make(중간)·n8n(직접 설치) 비교, n8n 재활용 설정에 VPS와 몇 시간 필요. — [Alex Harte: n8n Content Repurposing](https://www.alexanderharte.com/n8n-content-repurposing-pipeline/); [The AI Maker](https://aimaker.substack.com/p/ai-content-repurposing-n8n-workflow-7-platforms); [DEV Community](https://dev.to/gentleaffair274/5-ai-automation-workflows-every-solopreneur-needs-in-2026-36aa); [Biolinky Blog](https://biolinky.co/blog/content-automation-creators)
- 얼굴 없는(faceless) 영상 자동 생산을 내세우는 공개 저장소·템플릿이 많음 — 유튜브 inauthentic 정책과 충돌 가능. — [GitHub: automate-faceless-content](https://github.com/cporter202/automate-faceless-content); [YouTube 수익화 정책](https://support.google.com/youtube/answer/1311392)

### Inferences
**채널별 자동화 지도 (a 완전 자동 / b AI 초안 + 사람 확인·업로드 / c 사람만)**

| 채널 | (a) 완전 자동 가능 | (b) AI 초안 + 사람 확인 | (c) 사람이 해야 함 | 준비·비용 | 주요 위험 |
|---|---|---|---|---|---|
| 인스타그램 | 카드뉴스·캐러셀 이미지 생성, 캡션·해시태그, API 예약 게시(본인 계정, 검수 불필요), 주간 지표 수집 | 릴스 편집본·자막, 스토리, 게시 전 승인 | 릴스 촬영, DM·댓글 답변, 음원 선택(앱) | 프로페셔널 계정 + Meta 개발자 앱 + 이미지 공개 호스팅 + 네트워크 허용. 0원 | 60일 토큰 만료, JPEG만, 공개 URL 노출 |
| 스레드 | 매일 O/X·개념 한 줄 글, 이미지 첨부, API 게시 | 시사 연결 글(사실 확인 필요) | 답글·대화 | Threads 테스터 등록. 0원 | 링크 5개 제한, 답글 없는 '봇 같은' 계정 인상 |
| 유튜브 롱폼 | 자막 SRT, 제목·설명·챕터·태그, 썸네일, 비공개/예약 업로드(2026-11-02 이후 미검증 프로젝트도 공개 가능) | 무음·실수 컷 편집, 썸네일 고르기, 최종 공개 | 촬영(강의), 댓글 관리 | Google Cloud 프로젝트 + OAuth. 0원 | 필수 필드 누락(유료 광고 표시·아동용), OAuth 토큰 만료 |
| 유튜브 쇼츠 | 롱폼에서 후보 구간 추천·자르기·세로 자막, 업로드, 쇼츠 썸네일(2026-11-03 지원) | 구간 최종 선택, 첫 3초 문구 | 쇼츠 전용 촬영(선택) | Studio 클립 도구 무료 또는 Opus Clip $15~29/월 | 템플릿 반복 → inauthentic 판정 |
| 틱톡 | (자체 앱은 비공개만) 영상·캡션 준비 | 초안함 업로드 또는 Buffer 예약 | 앱에서 공개 게시·음원 | Buffer 무료~월 $5~6 | 자체 도구는 감사 불가 |
| 네이버 블로그 | 검색어 조사, 글 초안, 도식·표 PNG 일괄 생성 | 강사 경험 문장 추가, 스마트에디터 붙여넣기, 예약 발행 | 발행 버튼, 이웃·댓글 | 0원 | 공식 API 없음, 매크로 금지 위험, 유사 문서 대량 발행=스팸 |
| 카카오 채널 | 메시지 문구·이미지 생성, 챗봇 답변 초안 | 관리자센터에 붙여 넣고 예약 발송 | 1:1 상담 답변, 발송 승인 | 비즈월렛 충전, 15원/건(전체)·20원/건(타깃) | 광고 표기·수신 동의 의무, 친구 수 대비 비용 |

- **주 6~10시간 안에서의 추정 시간 배분(추정치)**: 촬영 3~4시간(롱폼 1편 + 쇼츠용 컷), 확인·승인 1~1.5시간(카드뉴스·블로그 초안·업로드 예약 확인), 네이버 블로그 붙여넣기·경험 문장 1~1.5시간(주 2~3편), 댓글·DM·카카오 상담 1~2시간. AI 없이 같은 분량을 하려면 편집·디자인·글쓰기에 주 10~15시간이 더 들 것으로 추정되어, 편집·디자인·문안 작업의 약 60~80%를 줄일 수 있다고 본다(근거: 위 (a)(b) 분류, 측정 자료 없음).
- **한 번만 하면 되는 준비(강사가 직접)**: 인스타 프로페셔널 계정 전환, Meta 개발자 앱 생성·본인 계정 테스터 추가, Google Cloud 프로젝트·유튜브 OAuth 동의, (틱톡 쓸 경우) Buffer 가입, 카카오 비즈월렛 충전. 키·토큰은 채팅에 붙이지 말고 환경의 비밀값(credential) 기능으로 넣는다.
- **이 클라우드 환경에서의 실무 제약**: 네트워크 허용 목록에 `graph.instagram.com`, `graph.threads.com`(또는 threads 문서의 호스트), `www.googleapis.com`/`youtube.googleapis.com`, `oauth2.googleapis.com`, (틱톡) `open.tiktokapis.com` 등을 추가해야 한다. 예약 작업(scheduled task)은 보통 1시간 간격 이상이므로 "정해진 시각에 정확히 게시"는 API의 `publishAt`(유튜브)이나 플랫폼 예약 기능을 쓰는 편이 정확하다. 인스타·스레드는 API 예약 매개변수가 없어 예약 작업이 그 시각에 직접 게시해야 한다(최대 1시간 오차 가능).
- **실패를 막는 장치**: 게시 기록 파일(문제 ID·게시일)로 중복 방지, 모든 자동 게시는 처음 2~4주는 "초안만 만들고 강사 승인 후 게시"로 운영, 토큰 만료 7일 전 알림, 업로드 기본값 비공개·예약.

### Gaps
- 한국 교육 크리에이터의 자동화 도입 전후 시간 절감을 측정한 사례·통계는 찾지 못함.
- n8n·Make의 한국 플랫폼(네이버·카카오) 공식 연동 노드는 확인 못 함.
- 이 클라우드 환경에서 위 API 호스트가 실제로 열리는지는 시험하지 않음(환경 설정 변경 필요할 수 있음).
