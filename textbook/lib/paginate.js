// 브라우저 안에서 실행되는 "쪽 나누기" 스크립트
//
// #source 안의 블록(.row)을 하나씩 A4 쪽(.page)에 옮겨 담는다.
//   쪽(.page) 안에는 위에서 아래로 "영역(.region)"이 쌓이고, 영역마다 단(.slot) 수가 다를 수 있다.
//   (예: 개념 확인은 1단, 바로 아래 이어지는 수능형 문제는 2단)
// 단이 넘치면 다음 단 → 다음 쪽으로 넘긴다. 빈칸 번호와 쪽 아래 정답 띠도 여기서 채운다.
// 끝나면 window.PAGINATED = true, 문제가 있으면 window.WARN 에 기록한다.
(function () {
  const L = window.LAYOUT || {};
  const book = document.getElementById('book');
  const src = document.getElementById('source');
  const WARN = (window.WARN = []);
  let pageNo = 0;

  function newPage(sec) {
    pageNo += 1;
    const el = document.createElement('div');
    el.className = `page page-${sec.dataset.kind} ${pageNo % 2 ? 'odd' : 'even'}`;
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

  let pg = null;

  function run() {
    for (const sec of [...src.children]) {
      const kind = sec.dataset.kind;
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

      // data-keep="next" 인 블록(제목)은 다음 블록과 한 묶음
      const rows = [...sec.children].filter((x) => x.classList.contains('row'));
      const groups = [];
      for (let k = 0; k < rows.length; k++) {
        const g = [rows[k]];
        while (g[g.length - 1].dataset.keep === 'next' && k + 1 < rows.length) g.push(rows[++k]);
        groups.push(g);
      }

      for (const g of groups) {
        g.forEach((r) => pg.slots[pg.i].appendChild(r));
        refreshStrip(pg);
        // 넘치면 꺼내서 다음 단(또는 다음 쪽)으로. 자리가 날 때까지 반복한다.
        while (overflow(pg)) {
          const slot = pg.slots[pg.i];
          const wasEmpty = slot.children.length === g.length;
          if (wasEmpty && !pg.region.dataset.soft) {
            WARN.push(`${kind} ${pageNo}쪽: 블록이 한 단보다 큽니다 (${g[0].className})`);
            break;
          }
          g.forEach((r) => r.remove());
          refreshStrip(pg);
          pg.i += 1;
          if (pg.i >= pg.slots.length) {
            let carryTop = null;
            if (pg.region.dataset.soft && pg.slots.every((s) => !s.children.length)) carryTop = undoSoftRegion(pg);
            const next = pg.blankStart + refreshStrip(pg);
            pg = newPage(sec);
            pg.blankStart = kind === 'concept' ? next : 0; // 빈칸 번호는 개념 부분 안에서 이어진다
            addRegion(pg, sec, carryTop, false);
          }
          g.forEach((r) => pg.slots[pg.i].appendChild(r));
          refreshStrip(pg);
        }
      }
    }
    src.remove();
    window.PAGES = pageNo;
    window.PAGINATED = true;
  }

  // 글꼴을 먼저 모두 불러와야 높이를 정확히 잴 수 있다.
  const text = src.textContent;
  const fonts = [
    '400 10pt "Pretendard Variable"', '700 10pt "Pretendard Variable"',
    '400 10pt "Noto Serif KR"', '600 10pt "Noto Serif KR"', '400 10pt "Nanum Pen Script"',
  ];
  Promise.all(fonts.map((f) => document.fonts.load(f, text).catch(() => null)))
    .then(() => document.fonts.ready)
    .then(run);
})();
