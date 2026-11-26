# OT 영상 말소리 → 글자(시간 표시 포함)
#   python3 transcribe.py <wav> <출력 txt> [모델]
import sys, time, torch, whisper

wav, out = sys.argv[1], sys.argv[2]
name = sys.argv[3] if len(sys.argv) > 3 else 'turbo'
torch.set_num_threads(4)
t0 = time.time()
model = whisper.load_model(name, device='cpu')
print('모델 준비', round(time.time() - t0), '초', flush=True)
prompt = ('통합사회 이승민입니다. 2028 수능, 예비 고3, N수생, 연간 커리큘럼, 메이트학원, 리브 아카데미, 족보닷컴, '
          'MINIMAP, MINIMAX, MAXIMIN, MINT, 수능특강, 수능완성, 6월 모의평가, 9월 모의평가, 3월 학력평가, 학평, 모평, 실모, '
          '내신, 수행평가, 생기부, 수시 최저, 등급컷, 예시문항, 기출, 변형 문항, 오답 노트, 웹앱.')
res = model.transcribe(wav, language='ko', fp16=False, initial_prompt=prompt, condition_on_previous_text=True, verbose=False)
with open(out, 'w', encoding='utf-8') as f:
    for s in res['segments']:
        m, sec = divmod(int(s['start']), 60)
        f.write(f'[{m:02d}:{sec:02d}] {s["text"].strip()}\n')
print('끝', round(time.time() - t0), '초', flush=True)
