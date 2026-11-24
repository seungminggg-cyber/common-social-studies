// PowerPoint 애니메이션 넣기 (pptxgenjs는 애니메이션을 못 넣어서, 만든 .pptx의 슬라이드 XML에 <p:timing>을 직접 써 넣는다)
// 쓰는 법(build.mjs): 슬라이드마다 단계 목록을 만든다.
//   { auto: [항목...], clicks: [[항목...], [항목...]] }
//   항목 = { names: [도형 이름...], fx, dir, dur, at }   at = 그 단계 시작부터 몇 ms 뒤에 시작
//   fx: fade(서서히) · float(살짝 떠오르며) · zoom(작게→원래 크기) · wipe(닦아내기, dir l·r·t·b = 그쪽에서 시작) · flicker(네온 깜빡이며 켜짐) · breathe(은은하게 계속 깜빡임)
//       flash(잠깐 보였다 사라짐 — 숫자 올라가기의 중간 숫자) · pulse(강조: 한 번 쿵 커졌다 돌아옴, 이미 보이는 도형에)
// 모든 슬라이드에 '서서히' 화면 전환을 넣는다(transition).
// 도형은 이름(cNvPr name)으로 찾는다. 같은 그림 파일이 여러 번 들어가면 하나로 합친다(파일 크기 줄이기).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }));

// 닦아내기 방향: PowerPoint의 '…에서' 하위 유형 번호와 filter 이름(filter는 움직이는 방향)
const WIPE = { l: [8, 'wipe(right)'], r: [2, 'wipe(left)'], t: [1, 'wipe(down)'], b: [4, 'wipe(up)'] };

function builder() {
  const emph = new Set(); // 강조 효과를 받은 도형
  let id = 2; // 1 = 뿌리, 2 = 주 순서
  const nid = () => ++id;
  const tgt = (sp) => `<p:tgtEl><p:spTgt spid="${sp}"/></p:tgtEl>`;
  const setVis = (sp, val = 'visible', delay = 0) =>
    `<p:set><p:cBhvr><p:cTn id="${nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst></p:cTn>${tgt(sp)}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="${val}"/></p:to></p:set>`;
  const fadeIn = (sp, dur) => `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}"/>${tgt(sp)}</p:cBhvr></p:animEffect>`;
  const animProp = (sp, dur, attr, from, to) =>
    `<p:anim calcmode="lin" valueType="num"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}" fill="hold"/>${tgt(sp)}<p:attrNameLst><p:attrName>${attr}</p:attrName></p:attrNameLst></p:cBhvr><p:tavLst><p:tav tm="0"><p:val><p:strVal val="${from}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${to}"/></p:val></p:tav></p:tavLst></p:anim>`;

  // 효과 하나(도형 하나) → <p:par>
  function effect(it, sp, nodeType) {
    const dur = it.dur || { fade: 450, float: 550, zoom: 450, wipe: 500, flicker: 700, breathe: 1400, flash: 70, pulse: 220 }[it.fx];
    const head = (preset, sub, cls = 'entr', extra = '') => `<p:par><p:cTn id="${nid()}" presetID="${preset}" presetClass="${cls}" presetSubtype="${sub}"${extra} fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>`;
    const tail = '</p:childTnLst></p:cTn></p:par>';
    switch (it.fx) {
      case 'fade':
        return head(10, 0) + setVis(sp) + fadeIn(sp, dur) + tail;
      case 'float': // 떠오르기: 조금 아래에서 제자리로 + 서서히
        return head(42, 0) + setVis(sp) + fadeIn(sp, dur) + animProp(sp, dur, 'ppt_x', '#ppt_x', '#ppt_x') + animProp(sp, dur, 'ppt_y', '#ppt_y+.06', '#ppt_y') + tail;
      case 'zoom': { // 확대: 원래 크기의 s배에서 원래 크기로 + 서서히
        const s = it.from ?? 0.8;
        return head(53, 16) + setVis(sp) + animProp(sp, dur, 'ppt_w', `#ppt_w*${s}`, '#ppt_w') + animProp(sp, dur, 'ppt_h', `#ppt_h*${s}`, '#ppt_h') + fadeIn(sp, dur) + tail;
      }
      case 'wipe': {
        const [sub, filter] = WIPE[it.dir || 'l'];
        return head(22, sub) + setVis(sp) + `<p:animEffect transition="in" filter="${filter}"><p:cBhvr><p:cTn id="${nid()}" dur="${dur}"/>${tgt(sp)}</p:cBhvr></p:animEffect>` + tail;
      }
      case 'flicker': { // 네온사인 켜지듯: 켜짐·꺼짐을 몇 번 하고 켜진 채로
        const steps = [[0, 'visible'], [70, 'hidden'], [150, 'visible'], [210, 'hidden'], [330, 'visible'], [380, 'hidden'], [480, 'visible']];
        return head(1, 0) + steps.map(([t, v]) => setVis(sp, v, t)).join('') + tail;
      }
      case 'flash': // 잠깐 보였다가 사라짐(dur ms 동안)
        return head(1, 0) + setVis(sp, 'visible', 0) + setVis(sp, 'hidden', dur) + tail;
      case 'pulse': { // 강조(커졌다 돌아오기). 나타나기 효과와 다른 묶음 번호(grpId 1)
        const k = Math.round((it.by ?? 1.12) * 100000);
        emph.add(sp);
        return `<p:par><p:cTn id="${nid()}" presetID="6" presetClass="emph" presetSubtype="0" fill="hold" grpId="1" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:animScale><p:cBhvr><p:cTn id="${nid()}" dur="${dur}" autoRev="1" fill="hold"/>${tgt(sp)}</p:cBhvr><p:by x="${k}" y="${k}"/></p:animScale>` + tail;
      }
      case 'breathe': // 은은하게 계속: 서서히 나타났다 사라지기를 슬라이드가 끝날 때까지 반복
        return `<p:par><p:cTn id="${nid()}" presetID="10" presetClass="entr" presetSubtype="0" repeatCount="indefinite" autoRev="1" fill="hold" grpId="0" nodeType="${nodeType}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>` + setVis(sp) + fadeIn(sp, dur) + tail;
      default:
        throw new Error('모르는 효과: ' + it.fx);
    }
  }

  // 한 단계(자동 또는 클릭 한 번) → 시간 칸들
  function stage(items, spOf, { first, auto }) {
    const slots = new Map(); // 시작 시각 → 효과들
    for (const it of items) {
      const sps = it.names.map(spOf).filter(Boolean);
      if (!sps.length) continue;
      const t = Math.round(it.at || 0);
      if (!slots.has(t)) slots.set(t, []);
      slots.get(t).push(...sps.map((sp) => [it, sp]));
    }
    if (!slots.size) return '';
    const times = [...slots.keys()].sort((a, b) => a - b);
    const cond = auto ? `<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>` : '<p:cond delay="indefinite"/>';
    let x = `<p:par><p:cTn id="${nid()}" fill="hold"><p:stCondLst>${cond}</p:stCondLst><p:childTnLst>`;
    times.forEach((t, k) => {
      x += `<p:par><p:cTn id="${nid()}" fill="hold"><p:stCondLst><p:cond delay="${t}"/></p:stCondLst><p:childTnLst>`;
      slots.get(t).forEach(([it, sp], j) => {
        const lead = j === 0 ? (k === 0 && !auto ? 'clickEffect' : 'afterEffect') : 'withEffect';
        x += effect(it, sp, lead);
      });
      x += '</p:childTnLst></p:cTn></p:par>';
    });
    return x + '</p:childTnLst></p:cTn></p:par>';
  }
  return { stage, emph };
}

function timingXml(spec, spOf, spIds) {
  const b = builder();
  let body = '';
  if (spec.auto?.length) body += b.stage(spec.auto, spOf, { auto: true });
  for (const c of spec.clicks || []) body += b.stage(c, spOf, { auto: false });
  if (!body) return '';
  const bld = [...spIds].map((sp) => `<p:bldP spid="${sp}" grpId="0" animBg="1"/>` + (b.emph.has(sp) ? `<p:bldP spid="${sp}" grpId="1" animBg="1"/>` : '')).join('');
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${body}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${bld ? `<p:bldLst>${bld}</p:bldLst>` : ''}</p:timing>`;
}

// specs: 슬라이드 순서대로(0부터) { auto, clicks } 또는 null
export async function applyAnimations(file, specs) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  let count = 0;
  const TRANS = '<p:transition spd="med"><p:fade/></p:transition>';
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const part = `ppt/slides/slide${i + 1}.xml`;
    let xml = await zip.file(part).async('string');
    if (!xml.includes('<p:transition')) { xml = xml.replace('</p:clrMapOvr>', '</p:clrMapOvr>' + TRANS); zip.file(part, xml); }
    if (!spec) continue;
    // 이름 → 도형 번호, 그리고 글상자·도형(p:sp)인지 그림(p:pic)인지
    const ids = new Map(), isSp = new Map();
    for (const m of xml.matchAll(/<p:(sp|pic)>\s*<p:nv(?:Sp|Pic)Pr>\s*<p:cNvPr id="(\d+)" name="([^"]*)"/g)) {
      ids.set(m[3], m[2]);
      isSp.set(m[2], m[1] === 'sp');
    }
    const used = new Set(), missing = [];
    const spOf = (name) => {
      const sp = ids.get(name);
      if (!sp) { missing.push(name); return null; }
      if (isSp.get(sp)) used.add(sp);
      return sp;
    };
    const t = timingXml(spec, spOf, used);
    if (missing.length) throw new Error(`슬라이드 ${i + 1}: 이름을 못 찾음 ${missing.slice(0, 5).join(', ')}`);
    if (!t) continue;
    xml = xml.replace(/<p:timing>[\s\S]*?<\/p:timing>/, '').replace('</p:sld>', `${t}</p:sld>`);
    zip.file(part, xml);
    count++;
  }
  // 같은 그림 하나로 합치기
  const media = Object.keys(zip.files).filter((k) => k.startsWith('ppt/media/') && !zip.files[k].dir);
  const hashOf = new Map(), canon = new Map();
  for (const k of media) {
    const h = createHash('sha1').update(await zip.file(k).async('nodebuffer')).digest('hex');
    if (hashOf.has(h)) canon.set(k, hashOf.get(h)); else hashOf.set(h, k);
  }
  if (canon.size) {
    for (const k of Object.keys(zip.files).filter((f) => f.endsWith('.rels'))) {
      let r = await zip.file(k).async('string');
      let changed = false;
      for (const [dup, keep] of canon) {
        const a = '../media/' + dup.split('/').pop(), b2 = '../media/' + keep.split('/').pop();
        if (r.includes(`"${a}"`)) { r = r.split(`"${a}"`).join(`"${b2}"`); changed = true; }
      }
      if (changed) zip.file(k, r);
    }
    for (const dup of canon.keys()) zip.remove(dup);
  }
  for (const k of Object.keys(zip.files)) if (zip.files[k].dir) delete zip.files[k];
  writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
  return { slides: count, dedup: canon.size };
}
