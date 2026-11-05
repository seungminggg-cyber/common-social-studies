// 브라우저 안에서 실행되는 "쪽 나누기" 스크립트
//
// #source 안의 블록(.row)을 하나씩 A4 쪽(.page)에 옮겨 담는다.
//   쪽(.page) 안에는 위에서 아래로 "영역(.region)"이 쌓이고, 영역마다 단(.slot) 수가 다를 수 있다.
//   (예: 개념 확인은 1단, 바로 아래 이어지는 수능형 문제는 2단)
//
// 묶음 규칙
//   data-keep="next"  제목·안내문: 다음 블록과 늘 같은 쪽에 놓는다.
//   data-keep="card"  사상가 카드 조각: 카드 전체를 한 쪽에 통째로 놓는다.
//                     카드가 한 쪽보다 클 때만 조각(핵심 주장 / 원전 읽기 / 기출 선지) 경계에서 나눈다.
// 넘칠 때 순서
//   1) 간격을 조금 줄여(.tight) 들어가면 그대로 둔다.
//   2) 아니면 묶음째 다음 단(또는 다음 쪽)으로 넘긴다.
// 다 나눈 뒤(마무리)
//   - 쪽 아래 남는 공간이 작으면 블록 사이 간격을 고르게 늘리고, 크면 '정리 노트' 칸으로 채운다.
//   - 2단 부분(수능형 문제·정답)의 마지막 쪽은 두 단 높이를 비슷하게 맞춘다.
// 끝나면 window.PAGINATED = true, 문제가 있으면 window.WARN 에 기록한다.
(function () {
  const L = window.LAYOUT || {};
  const book = document.getElementById('book');
  const src = document.getElementById('source');
  const WARN = (window.WARN = []);
  const MM = 96 / 25.4; // 1mm = 3.78px
  let pageNo = 0;

  function newPage(sec) {
    pageNo += 1;
    const el = document.createElement('div');
    el.className = `page page-${sec.dataset.kind} ${pageNo % 2 ? 'odd' : 'even'}`;
    if (sec.dataset.tab) el.dataset.ch = sec.dataset.tab; // 대단원 번호 → 대단원 색(시안 D)
    el.innerHTML = `
      <div class="edge-tab"><span>${sec.dataset.tab || ''}</span></div>
      <header class="page-head"><span class="ph-left">${sec.dataset.headLeft || ''}</span><span class="ph-right">${sec.dataset.headRight || ''}</span></header>
      <div class="page-body"></div>
      <footer class="page-foot"><div class="strip empty"><span class="strip-label">빈칸 정답</span><span class="strip-list"></span></div><div class="folio"><span>${pageNo}</span></div></footer>`;
    book.appendChild(el);
    return { el, body: el.querySelector('.page-body'), region: null, slots: [], i: 0, blankStart: 0 };
  }

  // 영역이 실제로 내용을 채운 아래 끝 위치 (머리 + 가장 긴 단)
  function usedBottom(region) {
    let bottom = region.querySelector('.region-top').getBoundingClientRect().bottom;
    for (const s of region.querySelectorAll('.slot')) {
      const last = s.lastElementChild;
      if (last) bottom = Math.max(bottom, last.getBoundingClientRect().bottom);
    }
    return bottom;
  }
  const roomLeft = (pg) => pg.body.getBoundingClientRect().bottom - usedBottom(pg.region);

  function addRegion(pg, sec, top, soft) {
    const kind = sec.dataset.kind;
    const n = L[kind] || 1;
    if (pg.region) {
      // 앞 영역은 내용 높이로 고정하고, 새 영역이 남은 자리를 쓴다.
      const h = usedBottom(pg.region) - pg.region.getBoundingClientRect().top;
      pg.region.style.flex = 'none';
      pg.region.style.height = `${h}px`;
    } else if (top) {
      pg.el.classList.add('first');
    }
    const r = document.createElement('div');
    r.className = `region region-${kind} cols-${n}`;
    if (soft) r.dataset.soft = '1';
    r.innerHTML = `<div class="region-top"></div><div class="region-slots">${'<div class="slot"></div>'.repeat(n)}</div>`;
    if (top) r.querySelector('.region-top').appendChild(top);
    pg.body.appendChild(r);
    pg.region = r;
    pg.slots = [...r.querySelectorAll('.slot')];
    pg.i = 0;
  }

  // 이어 붙였던 영역이 텅 비었으면 되돌린다 (제목만 덩그러니 남지 않게)
  function undoSoftRegion(pg) {
    const top = pg.region.querySelector('.region-top > .top');
    pg.region.remove();
    const prev = pg.body.lastElementChild;
    prev.style.flex = '';
    prev.style.height = '';
    pg.region = prev;
    return top;
  }

  // 이 쪽의 빈칸에 번호를 매기고 정답 띠를 다시 쓴다.
  function refreshStrip(pg) {
    const blanks = [...pg.el.querySelectorAll('.page-body .blank')];
    blanks.forEach((b, k) => (b.querySelector('.bn').textContent = pg.blankStart + k + 1));
    pg.el.querySelector('.strip-list').innerHTML = blanks
      .map((b, k) => `<span class="sa"><i>${pg.blankStart + k + 1}</i>${b.dataset.ans}</span>`)
      .join('');
    pg.el.querySelector('.strip').classList.toggle('empty', blanks.length === 0);
    return blanks.length;
  }

  const overflow = (pg) => pg.slots.some((s) => s.scrollHeight > s.clientHeight + 1);
  // 쪽 하나를 통째로 쓸 때의 단 높이 (머리 없는 새 쪽 기준)
  const fullHeight = (pg) => pg.body.clientHeight;
  const groupHeight = (g) => g[g.length - 1].getBoundingClientRect().bottom - g[0].getBoundingClientRect().top;

  // 묶음 나누기: keep="next"(제목)와 keep="card"(카드 조각)로 이어진 줄을 한 묶음으로
  function makeGroups(rows, keeps) {
    const groups = [];
    for (let k = 0; k < rows.length; k++) {
      const g = [rows[k]];
      while (keeps.includes(g[g.length - 1].dataset.keep) && k + 1 < rows.length) g.push(rows[++k]);
      groups.push(g);
    }
    return groups;
  }

  let pg = null;

  // 다음 단으로, 단이 없으면 새 쪽으로
  function advance(sec) {
    const kind = sec.dataset.kind;
    pg.i += 1;
    if (pg.i < pg.slots.length) return;
    let carryTop = null;
    if (pg.region.dataset.soft && pg.slots.every((s) => !s.children.length)) carryTop = undoSoftRegion(pg);
    const next = pg.blankStart + refreshStrip(pg);
    pg = newPage(sec);
    pg.blankStart = kind === 'concept' ? next : 0; // 빈칸 번호는 개념 부분 안에서 이어진다
    addRegion(pg, sec, carryTop, false);
  }

  // 간격을 조금 줄여서 들어가는지 본다. 안 들어가면 원래대로.
  function tryTight() {
    if (pg.el.classList.contains('tight')) return false;
    pg.el.classList.add('tight');
    if (!overflow(pg)) return true;
    pg.el.classList.remove('tight');
    return false;
  }

  function place(g, sec, canSplit) {
    for (;;) {
      const slot = pg.slots[pg.i];
      const wasEmpty = slot.children.length === 0;
      g.forEach((r) => slot.appendChild(r));
      refreshStrip(pg);
      if (!overflow(pg)) return;
      if (tryTight()) return;

      // 카드가 한 쪽보다 크면 조각 경계에서 나눈다 (지금 단에 들어가는 조각부터 채운다)
      if (canSplit && g.length > 1 && (wasEmpty || groupHeight(g) > fullHeight(pg))) {
        g.forEach((r) => r.remove());
        refreshStrip(pg);
        for (const sg of makeGroups(g, ['next'])) place(sg, sec, false);
        return;
      }
      if (wasEmpty && !pg.region.dataset.soft) {
        WARN.push(`${sec.dataset.kind} ${pageNo}쪽: 블록이 한 단보다 큽니다 (${g[0].className})`);
        return;
      }
      g.forEach((r) => r.remove());
      refreshStrip(pg);
      advance(sec);
    }
  }

  // 양면 인쇄: 간지처럼 오른쪽(홀수) 쪽에서 시작해야 하는 부분 앞에 메모 쪽을 끼운다.
  function fillerPage() {
    const p = newPage({ dataset: { kind: 'filler', tab: '', headLeft: '', headRight: '' } });
    p.body.innerHTML = `<div class="filler">${memoHtml('메모', '공부하면서 떠오른 생각, 질문, 다시 볼 내용을 자유롭게 적어 보자.')}</div>`;
  }

  function run() {
    for (const sec of [...src.children]) {
      const kind = sec.dataset.kind;
      if (sec.dataset.odd && pageNo % 2 === 1) fillerPage(); // 오른쪽 쪽에서 시작
      if (sec.dataset.even && pageNo % 2 === 0) fillerPage(); // 왼쪽 쪽에서 시작
      const n = L[kind] || 1;
      let top = sec.querySelector(':scope > .top');
      if (top) top.remove();

      // 새 쪽에서 시작할까, 앞 쪽에 이어 붙일까? (LAYOUT.soft 에 적힌 부분만 이어 붙인다)
      let placed = false;
      if (pg && (L.soft || []).includes(kind)) {
        const cur = pg.slots[pg.i];
        const curLast = cur.lastElementChild;
        const curRoom = cur.getBoundingClientRect().bottom - (curLast ? curLast.getBoundingClientRect().bottom : cur.getBoundingClientRect().top);
        const sameCols = pg.slots.length === n && !pg.region.style.height;
        if (sameCols && (pg.i < n - 1 || curRoom > cur.clientHeight * (L.softMin || 0.28))) {
          // 단 수가 같고 다음 단이 비어 있으면, 그 단에 제목부터 이어서 담는다.
          if (top) {
            const r = document.createElement('div');
            r.className = 'row row-top';
            r.dataset.keep = 'next';
            r.appendChild(top);
            sec.insertBefore(r, sec.firstChild);
          }
          if (curRoom < cur.clientHeight * (L.softMin || 0.28)) pg.i += 1; // 지금 단이 거의 찼으면 다음 단부터
          placed = true;
        } else if (roomLeft(pg) > pg.body.clientHeight * (L.softMin || 0.28)) {
          addRegion(pg, sec, top, true);
          placed = true;
        }
      }
      if (!placed) {
        pg = newPage(sec);
        addRegion(pg, sec, top, false);
      }

      const rows = [...sec.children].filter((x) => x.classList.contains('row'));
      for (const g of makeGroups(rows, ['next', 'card'])) place(g, sec, true);
      pg.region.dataset.end = '1'; // 이 부분이 끝난 영역 (마무리에서 단 높이 맞추기)
    }
    src.remove();
    finish();
    window.PAGES = pageNo;
    window.PAGINATED = true;
  }

  // ── 마무리 ─────────────────────────────────────
  const slotRoom = (s) => {
    const last = s.lastElementChild;
    return s.getBoundingClientRect().bottom - (last ? last.getBoundingClientRect().bottom : s.getBoundingClientRect().top);
  };

  // 2단 영역의 마지막 쪽: 줄 순서는 그대로 두고 두 단의 높이가 비슷해지도록 나눈다.
  function balance(region) {
    const slots = [...region.querySelectorAll('.slot')];
    if (slots.length !== 2) return;
    const rows = slots.flatMap((s) => [...s.children]);
    if (rows.length < 2 || !slots[1].children.length && rows.length < 2) return;
    const top = slots[0].getBoundingClientRect().top;
    const height = (s) => (s.lastElementChild ? s.lastElementChild.getBoundingClientRect().bottom - top : 0);
    const fits = () => slots.every((s) => s.scrollHeight <= s.clientHeight + 1);
    const putAt = (k) => rows.forEach((r, i) => slots[i < k ? 0 : 1].appendChild(r));
    const original = rows.findIndex((r) => r.parentElement === slots[1]);
    let best = null;
    for (let k = 1; k < rows.length; k++) {
      if (rows[k - 1].dataset.keep === 'next') continue; // 제목만 왼쪽 단 아래에 남지 않게
      putAt(k);
      if (!fits()) continue;
      const score = Math.max(height(slots[0]), height(slots[1]));
      if (!best || score < best.score - 1) best = { k, score };
    }
    putAt(best ? best.k : original < 0 ? rows.length : original);
  }

  const PROMPTS = {
    concept: ['이 쪽의 핵심 개념을 키워드로 다시 적어 보자.', '헷갈린 내용과 다시 볼 쪽수를 적어 두자.', '수능 자료로 나오면 무엇부터 볼지 적어 보자.'],
    check: ['틀린 문항 번호와 헷갈린 이유를 적어 두자.'],
    exam: ['틀린 문제 번호, 헷갈린 선지, 다시 볼 개념을 적어 두자.'],
    answers: ['틀린 문제 번호, 헷갈린 선지, 다시 볼 개념을 적어 두자.'],
  };
  const memoHtml = (label, prompt) =>
    `<div class="memo"><div class="memo-head"><span class="memo-tag">${label}</span><span class="memo-q">${prompt}</span></div><div class="memo-lines"></div></div>`;

  // 2단 영역이 쪽 아래를 많이 남기고 끝나면, 두 단 아래에 쪽 너비의 '오답 노트' 칸을 넣는다.
  function fillWide(page) {
    const regions = [...page.querySelectorAll('.page-body > .region')];
    const region = regions[regions.length - 1];
    if (!region || !region.dataset.end) return;
    const slots = [...region.querySelectorAll('.slot')];
    if (slots.length < 2) return;
    const kind = (region.className.match(/region-(\w+)/) || [])[1];
    if (!PROMPTS[kind]) return;
    const H = page.querySelector('.page-body').clientHeight;
    const room = Math.min(...slots.map(slotRoom));
    if (room < H * (L.memoMin || 0.1)) return;
    const box = region.querySelector('.region-slots');
    const used = box.clientHeight - room;
    box.style.flex = 'none';
    box.style.height = `${Math.ceil(used)}px`;
    const memo = document.createElement('div');
    memo.className = 'region-memo';
    memo.innerHTML = memoHtml('오답 노트', PROMPTS[kind][0]);
    region.appendChild(memo);
  }

  // 1단 영역의 남는 공간: 작으면 블록 사이를 고르게 벌리고, 크면 '정리 노트' 칸을 넣는다.
  function fillPage(page, k) {
    const regions = [...page.querySelectorAll('.page-body > .region')];
    const region = regions[regions.length - 1];
    if (!region || region.classList.contains('region-cover')) return;
    const slots = [...region.querySelectorAll('.slot')];
    if (slots.length !== 1) return;
    const slot = slots[0];
    const rows = [...slot.children];
    if (!rows.length) return;
    const H = page.querySelector('.page-body').clientHeight;
    const room = slotRoom(slot);
    const kind = (region.className.match(/region-(\w+)/) || [])[1];

    if (room >= H * (L.memoMin || 0.1) && PROMPTS[kind]) {
      const tk = [...slot.querySelectorAll('.row-tk[data-tk]')].pop();
      const prompt = tk && kind === 'concept'
        ? `${tk.dataset.tk} — 핵심 주장을 내 말로 한두 줄 정리해 보자.`
        : PROMPTS[kind][k % PROMPTS[kind].length];
      const memo = document.createElement('div');
      memo.className = 'row row-memo';
      memo.innerHTML = `<div class="main">${memoHtml('정리 노트', prompt)}</div>`;
      slot.appendChild(memo);
      const gap = memo.getBoundingClientRect().top - rows[rows.length - 1].getBoundingClientRect().bottom;
      memo.style.height = `${Math.floor(room - gap - 1)}px`;
      return;
    }
    // 묶음이 시작되는 줄 앞 간격만 늘린다 (제목과 본문, 카드 조각 사이는 그대로)
    const starts = rows.filter((r, i) => i > 0 && !rows[i - 1].dataset.keep);
    if (!starts.length || room < 2 * MM) return;
    const extra = Math.min(room / starts.length, (L.spreadMax || 6) * MM) - 0.5;
    for (const r of starts) r.style.marginTop = `${parseFloat(getComputedStyle(r).marginTop) + extra}px`;
  }

  function finish() {
    document.querySelectorAll('.region[data-end]').forEach((r) => {
      if (r === r.parentElement.lastElementChild) balance(r);
      else if (r.style.height && r.querySelectorAll('.slot').length === 2) {
        // 아래에 다음 부분이 이어 붙은 2단 영역: 두 단을 맞춘 뒤 높이를 다시 줄인다
        balance(r);
        r.style.height = `${Math.ceil(usedBottom(r) - r.getBoundingClientRect().top)}px`;
      }
    });
    [...document.querySelectorAll('.page')].forEach((p, k) => { fillPage(p, k); fillWide(p); });
    // 차례·간지·학습 계획표의 쪽 번호 채우기
    document.querySelectorAll('[data-pg]').forEach((el) => {
      const t = document.getElementById(el.dataset.pg);
      const p = t && t.closest('.page');
      if (!p) WARN.push(`쪽 번호를 찾지 못함: ${el.dataset.pg}`);
      el.textContent = p ? p.querySelector('.folio span').textContent : '';
    });
    // 쪽 범위: data-pgr="시작id|끝id" → 시작 쪽 ~ (끝 id가 있는 쪽 - 1)
    document.querySelectorAll('[data-pgr]').forEach((el) => {
      const [a, b] = el.dataset.pgr.split('|').map((id) => {
        const p = document.getElementById(id)?.closest('.page');
        return p ? +p.querySelector('.folio span').textContent : null;
      });
      if (!a || !b) WARN.push(`쪽 범위를 찾지 못함: ${el.dataset.pgr}`);
      let end = b - 1; // 끝에 끼워 넣은 메모 쪽은 범위에서 뺀다
      const all = document.querySelectorAll('.page');
      while (end > a && all[end - 1].classList.contains('page-filler')) end -= 1;
      el.textContent = a && b ? `${a}~${end}` : '';
    });
  }

  // 글꼴을 먼저 모두 불러와야 높이를 정확히 잴 수 있다.
  const text = src.textContent;
  const fonts = [
    '400 10pt "Pretendard Variable"', '700 10pt "Pretendard Variable"',
    '400 10pt "Noto Serif KR"', '600 10pt "Noto Serif KR"', '400 10pt "Nanum Pen Script"',
    '400 10pt "Hahmlet Variable"', '600 10pt "Hahmlet Variable"', // 시안 E (없으면 건너뜀)
  ];
  Promise.all(fonts.map((f) => document.fonts.load(f, text).catch(() => null)))
    .then(() => document.fonts.ready)
    .then(run);
})();
