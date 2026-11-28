// 홍보 게시 도구 — 인스타그램·스레드·유튜브에 공식 API로 올린다.
//
// 기본은 '연습(미리 보기)'이다. 실제로 올리려면 끝에 --go 를 붙인다.
// 처음 2~4주는 강사가 결과물을 확인하고 "올려도 됨"이라고 한 것만 --go 로 올린다.
//
//   node 홍보/자동화/post.mjs insta cn01 --prepare   PNG → JPEG (홍보/자동화/공개/cn01/), 검사
//   node 홍보/자동화/post.mjs insta cn01             무엇을 올릴지 보여 주기
//   node 홍보/자동화/post.mjs insta cn01 --go        실제 게시 (공개 폴더를 push 한 뒤)
//   node 홍보/자동화/post.mjs threads 홍보/인스타/th01.txt [--image 주소] [--go]
//   node 홍보/자동화/post.mjs youtube 홍보/영상/yt01.json [--go]   (항상 비공개 또는 예약 공개)
//   node 홍보/자동화/post.mjs token                  토큰 만료까지 남은 날 (7일 이하면 경고, 끝 코드 2)
//   node 홍보/자동화/post.mjs token set insta [날짜]   새 토큰을 저장한 날 기록
//   node 홍보/자동화/post.mjs token refresh insta     (환경 변수 방식일 때만) 토큰 60일 연장
//   node 홍보/자동화/post.mjs token check             실제로 연결되는지 확인
//   node 홍보/자동화/post.mjs log                     게시 기록 보기
//
// 다시 올리기 막기: 기록/게시기록.json 에 있는 것은 --again 없이는 다시 안 올린다.
// AI 표시: --ai 를 붙이면 인스타 is_ai_generated / 스레드 is_made_with_ai 를 켠다
//   (실제처럼 보이는 AI 사진·영상일 때만. 도식·글 카드에는 필요 없음).
import { parseArgs, readLog } from './lib/common.mjs';
import * as ig from './lib/instagram.mjs';
import * as th from './lib/threads.mjs';
import * as yt from './lib/youtube.mjs';
import * as tk from './lib/tokens.mjs';

const { pos, opt } = parseArgs(process.argv.slice(2));
const [cmd, a1, a2] = pos;
const show = (o) => console.log(typeof o === 'string' ? o : JSON.stringify(o, null, 2));

async function main() {
  switch (cmd) {
    case 'insta': case 'instagram': case 'ig': {
      if (!a1) throw new Error('조각 이름이 필요함 (예: cn01)');
      const piece = ig.resolvePiece(a1);
      if (opt.prepare) {
        const r = ig.prepare(piece);
        show(`JPEG ${r.files.length}장 준비됨 → 홍보/자동화/공개/${r.id}/`);
        for (const f of r.files) show(`  ${f.rel}  ${f.w}×${f.h}  ${Math.round(f.bytes / 1024)}KB  (${f.src})`);
        show('다음: 이 폴더를 commit·push → 강사 확인 → node 홍보/자동화/post.mjs insta ' + r.id + ' --go');
        return;
      }
      const r = await ig.post(piece, { go: !!opt.go, again: !!opt.again, aiLabel: !!opt.ai });
      if (r.dry) { show('[연습] 실제로 올리지 않음. 올리려면 --go'); show(r); } else show(r);
      return;
    }
    case 'threads': case 'th': {
      if (!a1) throw new Error('글 파일이 필요함 (예: 홍보/인스타/th01.txt)');
      const r = await th.post(a1, { go: !!opt.go, again: !!opt.again, image: opt.image, aiLabel: !!opt.ai });
      if (r.dry) show('[연습] 실제로 올리지 않음. 올리려면 --go');
      show(r);
      return;
    }
    case 'youtube': case 'yt': {
      if (!a1) throw new Error('영상 정보 파일(.json)이 필요함 — 예시: 홍보/자동화/예시/영상정보_예시.json');
      const r = await yt.upload(a1, { go: !!opt.go, again: !!opt.again });
      if (r.dry) show('[연습] 실제로 올리지 않음. 올리려면 --go (언제나 비공개/예약으로 올라감)');
      show(r);
      return;
    }
    case 'token': {
      if (a1 === 'set') { show(tk.setSaved(a2, pos[3], opt.note)); return; }
      if (a1 === 'refresh') { show(await tk.refresh(a2)); return; }
      if (a1 === 'check') { (await tk.check()).forEach((l) => show(l)); return; }
      const s = tk.status();
      s.rows.forEach((l) => show(l));
      if (s.warn) { show('→ 7일 안에 끊기는 토큰이 있음. API_연결.md의 \'토큰 갱신\' 참고'); process.exitCode = 2; }
      return;
    }
    case 'log': {
      const list = readLog();
      if (!list.length) { show('아직 게시 기록이 없음'); return; }
      for (const r of list) show(`${r.at}  ${r.channel.padEnd(9)} ${r.id.padEnd(12)} ${r.status}  ${r.url || r.mediaId || ''}`);
      return;
    }
    default:
      show('사용법은 이 파일(홍보/자동화/post.mjs) 맨 위 설명을 보세요.');
      process.exitCode = cmd ? 1 : 0;
  }
}

main().catch((e) => { console.error('✗ ' + e.message); process.exitCode = 1; });
