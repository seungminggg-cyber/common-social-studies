# AI 목소리 만들기 (edge-tts, 견본 전용 — 비공식 통로라 실제 게시 영상에는 쓰지 않는다)
#   사용: python3 -I tts.py <작업 목록.json>
#   목록: [{"text": 읽을 문장, "voice": 목소리, "rate": "+5%", "mp3": 저장 경로, "json": 단어 시각 저장 경로}, ...]
#   단어 시각(json): [{"t": 시작 초, "d": 길이 초, "w": 단어}, ...] — 화면 움직임을 말에 맞추는 데 쓴다.
import sys, json, asyncio
import certifi
certifi.where = lambda: '/root/.ccr/ca-bundle.crt'  # 이 환경의 프록시 인증서
import edge_tts

async def one(job, sem):
    async with sem:
        for attempt in range(4):
            try:
                c = edge_tts.Communicate(job['text'], job['voice'], rate=job.get('rate', '+0%'), boundary='WordBoundary')
                words, audio = [], bytearray()
                async for ch in c.stream():
                    if ch['type'] == 'audio':
                        audio += ch['data']
                    elif ch['type'] == 'WordBoundary':
                        words.append({'t': ch['offset'] / 1e7, 'd': ch['duration'] / 1e7, 'w': ch['text']})
                open(job['mp3'], 'wb').write(audio)
                json.dump(words, open(job['json'], 'w', encoding='utf-8'), ensure_ascii=False)
                return
            except Exception as e:  # 네트워크가 끊기면 다시 시도
                if attempt == 3:
                    raise
                await asyncio.sleep(1.5 * (attempt + 1))

async def main():
    jobs = json.load(open(sys.argv[1], encoding='utf-8'))
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(one(j, sem) for j in jobs))

asyncio.run(main())
