// 강의 화면 동작 — 판서 단계 넘기기, 메모 칸, 차례, 녹음(화면마다 목소리 + 판서 넘긴 시각 기록)
(() => {
  'use strict';
  const D = JSON.parse(document.getElementById('deck-data').textContent);
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const frame = $('frame'), sizer = $('sizer'), stage = $('stage');
  const slides = [...frame.querySelectorAll('.slide')].map((el, i) => ({ ...D.slides[i], el }));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const params = new URLSearchParams(location.search);
  const EXPORT = params.has('export');
  let cur = 0, step = 0;

  // ───────── 화면 맞추기 ─────────
  function fit() {
    if (EXPORT) { sizer.style.width = '1920px'; sizer.style.height = '1080px'; frame.style.transform = 'none'; return; }
    const r = stage.getBoundingClientRect();
    const sc = Math.max(0.05, Math.min(r.width / 1920, r.height / 1080));
    sizer.style.width = 1920 * sc + 'px';
    sizer.style.height = 1080 * sc + 'px';
    frame.style.transform = `scale(${sc})`;
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(stage);
  window.addEventListener('resize', fit);

  // ───────── 보여 주기 ─────────
  function show(i, s, anim = true) {
    i = clamp(i, 0, slides.length - 1);
    const sl = slides[i];
    s = clamp(s, 0, sl.steps);
    if (!sl.el.classList.contains('cur')) {
      slides.forEach((x) => x.el.classList.remove('cur'));
      sl.el.classList.add('cur');
    }
    cur = i; step = s;
    sl.el.querySelectorAll('[data-s]').forEach((el) => {
      const n = +el.dataset.s;
      el.classList.toggle('on', n <= s);
      el.classList.toggle('now', anim && n === s && n > 0);
    });
    if (!EXPORT) updateUI();
  }
  function next() {
    const sl = slides[cur];
    if (step < sl.steps) show(cur, step + 1);
    else if (cur < slides.length - 1) show(cur + 1, 0);
  }
  function prev() {
    if (step > 0) show(cur, step - 1, false);
    else if (cur > 0) show(cur - 1, slides[cur - 1].steps, false);
  }

  window.DECK = {
    count: slides.length,
    slides: slides.map(({ key, li, si, steps, title }) => ({ key, li, si, steps, title })),
    render: (i, s, anim = false) => show(i, s, anim),
  };
  if (EXPORT) {
    body.classList.add('export');
    fit();
    show(0, 0, false);
    return;
  }

  // ───────── 도구 막대·메모·차례 ─────────
  const pos = $('pos'), mh = $('mh'), mlist = $('mlist'), mf = $('mf');
  const fmt = (m) => esc(m).replace(/\[([^\]]+)\]/g, '<i>[$1]</i>');
  function updateUI() {
    const sl = slides[cur], L = D.lectures[sl.li];
    pos.innerHTML = `<b>${L.no}강</b> ${sl.si + 1}/${L.count} · 판서 ${step}/${sl.steps}`;
    $('bprev').disabled = cur === 0 && step === 0;
    $('bnext').disabled = cur === slides.length - 1 && step === sl.steps;
    mh.innerHTML = `<small>${L.no}강 · ${sl.si + 1}/${L.count}${sl.tag ? ' · ' + esc(sl.tag) : ''}</small><h3>${esc(sl.title)}</h3>`;
    mlist.innerHTML = sl.memo
      .map((m, k) => `<li data-k="${k}" class="${k < step ? 'past' : k === step ? 'cur' : k === step + 1 ? 'next' : ''}"><span class="sn">${k === 0 ? '처음' : k}</span><span>${fmt(m)}</span></li>`)
      .join('');
    const c = mlist.querySelector('li.cur');
    if (c && body.classList.contains('memo-on')) c.scrollIntoView({ block: 'nearest' });
    const nx = slides[cur + 1];
    mf.textContent = nx ? `다음 화면 · ${D.lectures[nx.li].no}강 ${nx.si + 1}. ${nx.title}` : '마지막 화면이에요.';
    const h = `#k${L.no}-${sl.si + 1}`;
    if (location.hash !== h) try { history.replaceState(null, '', h); } catch (e) { /* 무시 */ }
    document.querySelectorAll('#toc .it').forEach((b) => b.classList.toggle('cur', +b.dataset.i === cur));
    updateRecUI();
  }
  mlist.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li || R.playing) return;
    show(cur, +li.dataset.k, +li.dataset.k > step);
    recLog();
  });

  function renderToc() {
    const sec = D.lectures.map((L) => {
      const items = slides.filter((s) => s.li === L.index);
      const chars = items.reduce((a, s) => a + s.memo.join('').length, 0);
      const done = items.filter((s) => R.clips[s.key]).length;
      return `<h3>${L.no}강 ${esc(L.title)}<small>약 ${Math.max(1, Math.round(chars / 5.2 / 60))}분${done ? ` · 녹음 ${done}/${items.length}` : ''}</small></h3>${items
        .map((s) => `<button class="it" data-i="${slides.indexOf(s)}"><span class="no">${L.no}-${s.si + 1}</span><span>${esc(s.title)}</span><span class="ok">${R.clips[s.key] ? '●' : ''}</span></button>`)
        .join('')}`;
    });
    $('tocbody').innerHTML = sec.join('');
    document.querySelectorAll('#toc .it').forEach((b) => b.classList.toggle('cur', +b.dataset.i === cur));
  }
  $('toc').addEventListener('click', (e) => {
    const b = e.target.closest('.it');
    if (!b) return;
    if (R.live) { msg('녹음 중에는 다른 화면으로 갈 수 없어요. 먼저 녹음을 멈추세요.'); return; }
    stopPlay();
    show(+b.dataset.i, 0);
    body.classList.remove('toc-on');
  });

  function toggleMemo(on = !body.classList.contains('memo-on')) {
    body.classList.toggle('memo-on', on);
    $('bmemo').setAttribute('aria-pressed', on);
    if (!on && body.classList.contains('rec-mode')) toggleRecMode(false);
    requestAnimationFrame(() => { fit(); updateUI(); });
  }
  function toggleToc(on = !body.classList.contains('toc-on')) {
    body.classList.toggle('toc-on', on);
    if (on) renderToc();
  }
  function fullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* 지원 안 함 */ }
  }

  // 움직임이 없으면 도구 막대 숨기기 (발표할 때)
  let idleT = 0;
  const wake = () => { body.classList.remove('idle'); clearTimeout(idleT); idleT = setTimeout(() => body.classList.add('idle'), 2600); };
  ['mousemove', 'pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));

  function act(kind) {
    if (R.playing) stopPlay();
    if (kind === 'next') {
      if (R.live) return recNext();
      next();
    } else {
      if (R.live) {
        if (step > 0) { show(cur, step - 1, false); recLog(); } else msg('녹음 중에는 앞 화면으로 갈 수 없어요.');
        return;
      }
      prev();
    }
  }
  $('bnext').onclick = () => act('next');
  $('bprev').onclick = () => act('prev');
  $('bmemo').onclick = () => toggleMemo();
  $('btoc').onclick = () => toggleToc();
  $('bfull').onclick = fullscreen;
  $('brec').onclick = () => toggleRecMode();
  $('tocclose').onclick = () => toggleToc(false);
  stage.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    const r = stage.getBoundingClientRect();
    act(e.clientX - r.left < r.width * 0.3 ? 'prev' : 'next');
  });
  let tx = null;
  stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (tx == null) return;
    const dx = e.changedTouches[0].clientX - tx;
    tx = null;
    if (Math.abs(dx) > 50) { e.preventDefault(); act(dx < 0 ? 'next' : 'prev'); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const onBtn = e.target.closest && e.target.closest('button, label');
    const k = e.key, c = e.code;
    if (k === 'ArrowRight' || k === 'PageDown' || ((k === ' ' || k === 'Enter') && !onBtn)) { e.preventDefault(); act('next'); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); act('prev'); }
    else if (c === 'KeyN') toggleMemo();
    else if (c === 'KeyT') toggleToc();
    else if (c === 'KeyF') fullscreen();
    else if (c === 'KeyR') { if (!body.classList.contains('rec-mode')) toggleRecMode(true); else recToggle(); }
    else if (k === 'Escape') { if (R.live) recStop(); else if (R.playing) stopPlay(); toggleToc(false); }
    else if (k === 'Home' && !R.live) show(slides.findIndex((s) => s.li === slides[cur].li), 0);
  });

  // ───────── 녹음 ─────────
  // 화면 한 장 = 녹음 한 개. → 키로 판서를 넘긴 시각을 같이 적어 두었다가 영상을 만들 때 쓴다.
  const R = {
    ok: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder),
    stream: null, mr: null, chunks: [], t0: 0, events: [], live: false, key: null, li: 0,
    clips: {}, timer: 0, audio: null, playing: false, raf: 0, lock: null,
  };
  const msg = (t, ok = false) => { const m = $('rmsg'); m.textContent = t || ''; m.classList.toggle('ok', ok); };
  const mmss = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  function toggleRecMode(on = !body.classList.contains('rec-mode')) {
    if (!on && R.live) recStop();
    body.classList.toggle('rec-mode', on);
    $('brec').setAttribute('aria-pressed', on);
    if (on && !body.classList.contains('memo-on')) toggleMemo(true);
    if (on && !R.ok) msg('이 화면에서는 마이크를 쓸 수 없어요. 내려받은 강의화면.html 파일을 크롬이나 엣지로 열면 녹음할 수 있어요.');
    updateRecUI();
  }
  function updateRecUI() {
    const sl = slides[cur];
    const has = !!R.clips[sl.key];
    const rb = $('rbtn');
    rb.classList.toggle('on', R.live);
    rb.innerHTML = R.live ? '■ 녹음 멈추기 <kbd>R</kbd>' : has ? '● 이 화면 다시 녹음 <kbd>R</kbd>' : '● 이 화면부터 녹음 <kbd>R</kbd>';
    rb.disabled = !R.ok;
    $('rplay').disabled = !has || R.live;
    $('rplay').textContent = R.playing ? '■ 그만 듣기' : '▶ 이 화면 들어보기';
    $('rdel').disabled = !has || R.live;
    const st = $('rstate');
    st.classList.toggle('live', R.live);
    if (!R.live) st.textContent = has ? `녹음됨 ${mmss(R.clips[sl.key].dur)}` : '아직 녹음 안 함';
    $('rprog').textContent = D.lectures
      .map((L) => {
        const items = slides.filter((s) => s.li === L.index);
        return `${L.no}강 ${items.filter((s) => R.clips[s.key]).length}/${items.length}`;
      })
      .join(' · ');
  }
  function countDown() {
    const el = $('count');
    return new Promise((res) => {
      let n = 3;
      el.textContent = n;
      el.classList.add('on');
      const t = setInterval(() => {
        n -= 1;
        if (n <= 0) { clearInterval(t); el.classList.remove('on'); res(); } else el.textContent = n;
      }, 650);
    });
  }
  async function recStart(countdown = true) {
    if (R.live || R.starting) return;
    stopPlay();
    if (!R.ok) { msg('이 화면에서는 마이크를 쓸 수 없어요. 강의화면.html 파일을 크롬이나 엣지로 직접 열어 녹음하세요.'); return; }
    R.starting = true;
    try {
      if (!R.stream) R.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
    } catch (err) {
      R.starting = false;
      msg('마이크를 켤 수 없어요. 주소창 옆 마이크 권한을 ‘허용’으로 바꾼 뒤 다시 눌러 주세요.');
      return;
    }
    msg('');
    if (countdown) await countDown();
    show(cur, 0, true);
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const mr = new MediaRecorder(R.stream, mime ? { mimeType: mime, audioBitsPerSecond: 128000 } : undefined);
    R.mr = mr; R.chunks = []; R.events = [{ t: 0, step: 0 }]; R.key = slides[cur].key; R.li = slides[cur].li;
    mr.ondataavailable = (e) => { if (e.data && e.data.size) R.chunks.push(e.data); };
    mr.start(1000);
    R.t0 = performance.now(); R.live = true; R.starting = false;
    try { if (navigator.wakeLock && !R.lock) R.lock = await navigator.wakeLock.request('screen'); } catch (e) { R.lock = null; }
    clearInterval(R.timer);
    R.timer = setInterval(() => { $('rstate').textContent = `녹음 중 ${mmss(performance.now() - R.t0)}`; }, 250);
    updateRecUI();
  }
  function recLog() {
    if (R.live && slides[cur].key === R.key) R.events.push({ t: Math.round(performance.now() - R.t0), step });
  }
  function recStop() {
    return new Promise((res) => {
      if (!R.live) return res();
      const mr = R.mr, key = R.key, events = R.events.slice(), dur = Math.round(performance.now() - R.t0);
      R.live = false;
      clearInterval(R.timer);
      mr.onstop = async () => {
        const blob = new Blob(R.chunks, { type: mr.mimeType || 'audio/webm' });
        R.clips[key] = { blob, mime: blob.type, events, dur, at: Date.now() };
        await idbPut(key, R.clips[key]);
        updateRecUI();
        if (body.classList.contains('toc-on')) renderToc();
        res();
      };
      try { mr.stop(); } catch (e) { res(); }
      if (R.lock) { R.lock.release().catch(() => {}); R.lock = null; }
      updateRecUI();
    });
  }
  async function recNext() {
    const sl = slides[cur];
    if (step < sl.steps) { show(cur, step + 1); recLog(); return; }
    await recStop();
    if (cur >= slides.length - 1) { msg('마지막 화면까지 녹음했어요. ‘녹음 파일 저장’을 눌러 주세요.', true); return; }
    const nxt = slides[cur + 1];
    show(cur + 1, 0);
    if (nxt.li !== sl.li) { msg(`${D.lectures[sl.li].no}강 녹음이 끝났어요. 잠깐 쉬었다가 R을 눌러 ${D.lectures[nxt.li].no}강을 시작하세요.`, true); return; }
    if ($('rauto').checked) setTimeout(() => recStart(false), 350);
  }
  function recToggle() { if (R.live) recStop(); else recStart(true); }

  function play() {
    const c = R.clips[slides[cur].key];
    if (!c) return;
    if (R.playing) { stopPlay(); return; }
    R.audio = new Audio(URL.createObjectURL(c.blob));
    R.playing = true;
    show(cur, 0, true);
    const loop = () => {
      if (!R.playing) return;
      const t = R.audio.currentTime * 1000;
      let s = 0;
      for (const e of c.events) if (e.t <= t) s = e.step;
      if (s !== step) show(cur, s, s > step);
      R.raf = requestAnimationFrame(loop);
    };
    R.audio.onended = () => stopPlay();
    R.audio.play().then(loop).catch(() => { msg('소리를 재생할 수 없어요.'); stopPlay(); });
    updateRecUI();
  }
  function stopPlay() {
    if (!R.playing) return;
    R.playing = false;
    cancelAnimationFrame(R.raf);
    try { R.audio.pause(); URL.revokeObjectURL(R.audio.src); } catch (e) { /* 무시 */ }
    updateRecUI();
  }
  let delArm = 0;
  async function delClip() {
    const key = slides[cur].key;
    if (!R.clips[key]) return;
    if (Date.now() - delArm > 3000) { delArm = Date.now(); $('rdel').textContent = '한 번 더 누르면 지워요'; setTimeout(() => { $('rdel').textContent = '이 화면 녹음 지우기'; }, 3000); return; }
    delArm = 0;
    delete R.clips[key];
    await idbDel(key);
    $('rdel').textContent = '이 화면 녹음 지우기';
    updateRecUI();
  }
  const toB64 = (blob) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.readAsDataURL(blob); });
  async function exportAll() {
    const keys = slides.map((s) => s.key).filter((k) => R.clips[k]);
    if (!keys.length) { msg('저장할 녹음이 아직 없어요.'); return; }
    const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
    const stamp = `${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}`;
    // 크롬·엣지: 저장할 곳과 이름을 고르는 창 (클릭 직후에 열어야 해서 먼저 연다)
    let handle = null;
    if (window.showSaveFilePicker) {
      try {
        handle = await window.showSaveFilePicker({ suggestedName: `녹음_${D.id}_${stamp}.json`, types: [{ description: '강의 녹음 파일', accept: { 'application/json': ['.json'] } }] });
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        handle = null;
      }
    }
    msg('녹음 파일을 만드는 중이에요…', true);
    const out = { deck: D.id, title: D.title, version: D.version, saved: d.toISOString(), slides: slides.map(({ key, steps, title }) => ({ key, steps, title })), clips: {} };
    for (const k of keys) { const c = R.clips[k]; out.clips[k] = { mime: c.mime, events: c.events, dur: c.dur, data: await toB64(c.blob) }; }
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    let name = '';
    if (handle) {
      try { const w = await handle.createWritable(); await w.write(blob); await w.close(); name = handle.name; } catch (e) { handle = null; }
    }
    if (!handle) {
      // 고르는 창이 없는 브라우저: 내려받기 폴더에 저장 (한글 이름이 깨지는 브라우저가 있어 영문 이름)
      name = `rec_${D.id}_${stamp}.json`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }
    msg(`${keys.length}개 화면의 녹음을 ‘${name}’ 파일로 저장했어요. 이 파일을 Claude에게 보내면 영상으로 만들어 드려요.`, true);
  }
  async function importFile(file) {
    try {
      const j = JSON.parse(await file.text());
      if (j.deck !== D.id) { msg('다른 강의의 녹음 파일이에요.'); return; }
      let n = 0;
      for (const [k, c] of Object.entries(j.clips || {})) {
        const bin = atob(c.data), arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        R.clips[k] = { blob: new Blob([arr], { type: c.mime }), mime: c.mime, events: c.events, dur: c.dur, at: Date.now() };
        await idbPut(k, R.clips[k]);
        n++;
      }
      msg(`녹음 ${n}개를 불러왔어요.`, true);
      updateRecUI();
    } catch (e) { msg('파일을 읽지 못했어요. 이 화면에서 저장한 녹음 파일인지 확인해 주세요.'); }
  }
  $('rbtn').onclick = recToggle;
  $('rplay').onclick = play;
  $('rdel').onclick = delClip;
  $('rsave').onclick = exportAll;
  $('rload').onchange = (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; };
  window.addEventListener('beforeunload', (e) => { if (R.live) { e.preventDefault(); e.returnValue = ''; } });

  // 브라우저 안에 녹음 보관 (창을 닫았다 열어도 이어서). 저장이 막힌 곳에서는 조용히 넘어간다.
  const dbp = new Promise((res) => {
    try {
      const rq = indexedDB.open('lecture-recordings', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('clips');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    } catch (e) { res(null); }
  });
  async function idbPut(key, val) {
    try {
      const db = await dbp;
      if (!db) return;
      await new Promise((res) => { const tx = db.transaction('clips', 'readwrite'); tx.objectStore('clips').put(val, `${D.id}/${key}`); tx.oncomplete = res; tx.onerror = res; tx.onabort = res; });
    } catch (e) { /* 무시 */ }
  }
  async function idbDel(key) {
    try {
      const db = await dbp;
      if (!db) return;
      await new Promise((res) => { const tx = db.transaction('clips', 'readwrite'); tx.objectStore('clips').delete(`${D.id}/${key}`); tx.oncomplete = res; tx.onerror = res; });
    } catch (e) { /* 무시 */ }
  }
  async function idbLoad() {
    try {
      const db = await dbp;
      if (!db) return;
      await new Promise((res) => {
        const tx = db.transaction('clips', 'readonly');
        const rq = tx.objectStore('clips').openCursor();
        rq.onsuccess = () => {
          const c = rq.result;
          if (!c) return res();
          const k = String(c.key);
          if (k.startsWith(D.id + '/') && c.value && c.value.blob) R.clips[k.slice(D.id.length + 1)] = c.value;
          c.continue();
        };
        rq.onerror = () => res();
      });
      updateRecUI();
    } catch (e) { /* 무시 */ }
  }

  // ───────── 시작 ─────────
  const m = /^#k(\d+)-(\d+)$/.exec(location.hash);
  let start = 0;
  if (m) {
    const L = D.lectures.find((x) => x.no === +m[1]);
    const idx = L ? slides.findIndex((s) => s.li === L.index && s.si === +m[2] - 1) : -1;
    if (idx >= 0) start = idx;
  }
  fit();
  show(start, 0, false);
  renderToc();
  idbLoad();
  wake();
})();
