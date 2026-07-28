// data.js — 只读 data/public/*.json，带内存缓存
// 二期迁 Vue3 时此文件可直接搬进 src/utils/

const BASE = "data/public";
const cache = new Map();

export async function fetchJSON(name) {
  if (cache.has(name)) return cache.get(name);
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const json = await res.json();
  cache.set(name, json);
  return json;
}

export const loadMeta = () => fetchJSON("meta.json");
export const loadLatest = () => fetchJSON("tags-latest.json");
export const loadSeries = () => fetchJSON("tags-series.json");
export const loadAcgDict = () => fetchJSON("acg-dict.json");

/** 由词典构建 tag -> kind 映射；优先级 moe > trope > ip > genre */
export function buildKindMap(dict) {
  const map = new Map();
  if (!dict) return map;
  for (const t of dict.genre || []) map.set(t, "genre");
  for (const t of dict.ip || []) map.set(t, "ip");
  for (const t of dict.trope || []) map.set(t, "trope");
  for (const t of dict.moe || []) map.set(t, "moe");
  return map;
}

export function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
