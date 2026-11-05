// 아이콘 (Tabler Icons, MIT 라이선스 — node_modules/@tabler/icons)
// icon('building-factory-2', { size: 22, cls: 'ic' }) → 인라인 SVG 문자열
// 이름은 https://tabler.io/icons 의 이름(outline)을 쓴다.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = new URL('../node_modules/@tabler/icons/icons/outline/', import.meta.url).pathname;
const cache = new Map();

// 아이콘 속 도형(path 등)만 꺼냄
export function iconInner(name) {
  if (!cache.has(name)) {
    const f = join(DIR, `${name}.svg`);
    if (!existsSync(f)) throw new Error(`없는 아이콘: ${name}`);
    const svg = readFileSync(f, 'utf8');
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
      .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '').replace(/\s+/g, ' ').trim();
    cache.set(name, inner);
  }
  return cache.get(name);
}

// HTML 안에 넣는 아이콘 (색은 currentColor)
export function icon(name, { size = 20, cls = 'ic', stroke = 1.8 } = {}) {
  if (!name) return '';
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconInner(name)}</svg>`;
}

// SVG 그림 안에 넣는 아이콘 (x, y = 왼쪽 위)
export function iconAt(name, x, y, size = 20, { stroke = 1.8, color = 'currentColor' } = {}) {
  if (!name) return '';
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${stroke / k * k}" stroke-linecap="round" stroke-linejoin="round">${iconInner(name)}</g>`;
}
