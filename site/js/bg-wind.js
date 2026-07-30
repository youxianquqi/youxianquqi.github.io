// bg-wind.js — 背景数据粒子：按当日 merged top10 涨跌比例染色
// 失败静默退回默认配色；与 rank.js 共享 data.js 缓存，不产生额外请求

import { loadLatest } from "./data.js";

async function tintMotes() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const motes = document.querySelectorAll(".site-motes i");
  if (!motes.length) return;
  try {
    const latest = await loadLatest();
    const merged = latest && latest.boards && latest.boards.merged;
    if (!Array.isArray(merged)) return;
    const top = merged.slice(0, 10);
    const ups = top.filter((x) => typeof x.delta_rank === "number" && x.delta_rank > 0).length;
    const downs = top.filter((x) => typeof x.delta_rank === "number" && x.delta_rank < 0).length;
    const total = ups + downs;
    if (!total) return;
    const n = motes.length;
    const upCount = Math.round((ups / total) * n);
    motes.forEach((el, i) => {
      el.classList.remove("is-up", "is-down");
      if (i < upCount) el.classList.add("is-up");
      else el.classList.add("is-down");
    });
  } catch {
    /* 数据不可用时保持默认冰蓝 */
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", tintMotes, { once: true });
} else {
  tintMotes();
}
