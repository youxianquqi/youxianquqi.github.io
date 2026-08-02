// rank.js — 首页：细分 / 同人IP / 频道 / 分源
import { initThemeToggle } from "./theme.js";
import { loadMeta, loadLatest, loadSeries, loadAcgDict, buildKindMap, escapeHTML } from "./data.js";
import { byKeyword } from "./filters.js";

const state = { board: "merged", kind: "all", kw: "" };
let meta = null;
let latest = null;
let series = null;
let kindMap = new Map();
let sourceKeys = [];
let hasSpark = false;

const $ = (sel) => document.querySelector(sel);

const OVERVIEW = new Set(["merged", "fandom", "channel"]);

const ICON = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m7 7 10 10"/><path d="M17 8v9H8"/></svg>',
  flat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  arrow: '<svg class="rank-tag__arrow icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>',
  searchX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="m8.5 8.5 5 5m0-5-5 5"/></svg>',
};

function deltaHTML(dr) {
  if (dr === null || dr === undefined) return '<span class="delta delta--new">NEW</span>';
  if (dr > 0) return `<span class="delta delta--up">${ICON.up}${dr}</span>`;
  if (dr < 0) return `<span class="delta delta--down">${ICON.down}${Math.abs(dr)}</span>`;
  return `<span class="delta delta--flat">${ICON.flat}</span>`;
}

function rankNoHTML(rank) {
  if (rank <= 3) return `<span class="rank-no rank-no--medal rank-no--${rank}">${rank}</span>`;
  return `<span class="rank-no">${rank}</span>`;
}

function sparkSVG(tag) {
  const entry = series && series[tag];
  const key = state.board === "fandom" ? "fandom" : "merged";
  const daily = entry && entry.daily && entry.daily[key];
  if (!daily || daily.length < 1) return '<span class="rank-spark col-spark"></span>';
  const pts = daily.slice(-7).map((p) => p[1]);
  if (pts.length === 0) return '<span class="rank-spark col-spark"></span>';
  const w = 84;
  const h = 28;
  const pad = 3;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const stepX = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
  const xy = pts.map((v, i) => [pts.length > 1 ? pad + i * stepX : w / 2, h - pad - ((v - min) / span) * (h - pad * 2)]);
  const line = xy.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1][0].toFixed(1)},${h - pad} L${xy[0][0].toFixed(1)},${h - pad} Z`;
  const last = xy[xy.length - 1];
  return `<span class="rank-spark col-spark"><svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path class="spark-area" fill="currentColor" d="${area}"/><path class="spark-line" d="${line}"/><circle class="spark-dot" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="2.2"/></svg></span>`;
}

function dotsHTML(item) {
  const hit = new Set(item.sources_hit || []);
  const names = sourceKeys.map((s) => `${meta.source_names[s] || s}${hit.has(s) ? "" : "（未上榜）"}`);
  const dots = sourceKeys.map((s) => `<i class="${hit.has(s) ? "on" : ""}"></i>`).join("");
  return `<span class="rank-dots col-dots" title="${escapeHTML(names.join(" · "))}">${dots}</span>`;
}

function discoveryHTML(item, show) {
  if (!show) return "";
  const parts = [];
  if (item.discovery === "multi_source") {
    parts.push(`<span class="disc disc--multi" title="多源共识 · ${(item.sources_hit || []).join("、")}">多源共识·${item.source_count || 0}</span>`);
  } else if (item.discovery === "single_source") {
    parts.push(`<span class="disc disc--single" title="仅单一来源命中">单源发现</span>`);
  }
  if (item.signal_summary_text) {
    parts.push(
      `<span class="disc disc--signal" title="${escapeHTML(item.signal_summary_text)}">${escapeHTML(item.signal_summary_text)}</span>`
    );
  }
  return parts.join("");
}

function rowHTML(item, i, isOverview, scale) {
  const tag = escapeHTML(item.tag);
  const pct = scale(item.score);
  const showMeta = isOverview;
  const dots = showMeta ? dotsHTML(item) : '<span class="rank-dots col-dots"></span>';
  const spark =
    state.board === "merged" || state.board === "fandom"
      ? sparkSVG(item.tag)
      : '<span class="rank-spark col-spark"></span>';
  const top1 =
    (state.board === "merged" || state.board === "fandom") && item.rank === 1
      ? " rank-row--top1"
      : "";
  const disc = discoveryHTML(item, showMeta);
  const meta = disc ? `<span class="rank-tag__meta">${disc}</span>` : "";
  return `<li class="rank-row${top1}" style="--row-delay:${Math.min(i, 20) * 22}ms" data-tag="${tag}" role="link" tabindex="0" aria-label="查看 ${tag} 趋势">
    ${rankNoHTML(item.rank)}
    <span class="rank-tag">
      <span class="rank-tag__main"><span class="rank-tag__name">${tag}</span>${ICON.arrow}</span>
      ${meta}
    </span>
    <span class="rank-score"><span class="rank-score__num">${item.score.toFixed(1)}</span><span class="rank-score__bar"><i style="width:0%" data-w="${pct}"></i></span></span>
    <span class="rank-delta col-delta">${deltaHTML(item.delta_rank)}</span>
    ${dots}
    ${spark}
  </li>`;
}

function makeScale(list) {
  const scores = list.map((x) => x.score);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const span = max - min;
  if (span < 0.05) return () => 100;
  return (score) => 8 + 92 * ((score - min) / span);
}

function byKind(list, kind) {
  if (!kind || kind === "all") return list;
  return list.filter((item) => {
    if (item.tag_role === "ip_universe" && kind === "ip") return true;
    if (item.tag_role === "fandom_structure" && kind === "fandom_structure") return true;
    if (
      (item.tag_role === "relationship_type" || item.tag_role === "relationship") &&
      kind === "relationship"
    )
      return true;
    return kindMap.get(item.tag) === kind;
  });
}

const PIE_KINDS = [
  { key: "trope", name: "套路", css: "var(--brand)" },
  { key: "moe", name: "萌属性", css: "var(--up)" },
  { key: "ip", name: "作品宇宙", css: "var(--no1)" },
  { key: "relationship", name: "关系类型", css: "var(--down)" },
  { key: "genre", name: "题材", css: "var(--no2)" },
  { key: "other", name: "其他", css: "var(--flat)" },
];

function pieKindOf(item) {
  if (item.tag_role === "ip_universe") return "ip";
  if (item.tag_role === "relationship_type" || item.tag_role === "relationship")
    return "relationship";
  const k = kindMap.get(item.tag);
  return PIE_KINDS.some((p) => p.key === k) ? k : "other";
}

function renderKindPie() {
  const wrap = $("#kind-pie");
  if (!wrap) return;
  const list = (latest && latest.boards && latest.boards.merged) || [];
  if (state.board !== "merged" || !list.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;

  const counts = new Map(PIE_KINDS.map((p) => [p.key, 0]));
  list.forEach((it) => counts.set(pieKindOf(it), counts.get(pieKindOf(it)) + 1));
  const total = list.length;
  const segs = PIE_KINDS.filter((p) => counts.get(p.key) > 0).map((p) => ({
    ...p,
    n: counts.get(p.key),
    pct: (counts.get(p.key) / total) * 100,
  }));

  let acc = 0;
  const circles = segs
    .map((s) => {
      const len = Math.max(s.pct - 0.8, 0.4);
      const off = 25 - acc;
      acc += s.pct;
      const dim = state.kind !== "all" && state.kind !== s.key;
      return `<circle cx="21" cy="21" r="15.9155" fill="none" pathLength="100" stroke-width="6" class="pie-seg${dim ? " is-dim" : ""}" style="stroke:${s.css}" stroke-dasharray="${len.toFixed(2)} 100" stroke-dashoffset="${off.toFixed(2)}"><title>${s.name} ${s.n} 个</title></circle>`;
    })
    .join("");

  $("#kind-pie-chart").innerHTML = `<svg viewBox="0 0 42 42" role="img" aria-label="今日上榜标签类型构成">
    <circle cx="21" cy="21" r="15.9155" fill="none" pathLength="100" stroke-width="6" style="stroke:var(--surface-2)"></circle>
    ${circles}
  </svg>
  <div class="kind-pie__center"><strong>${total}</strong><span>今日上榜</span></div>`;

  const listEl = $("#kind-pie-list");
  listEl.innerHTML = segs
    .map((s) => {
      const active = state.kind === s.key;
      const stat = s.key === "other";
      return `<button type="button" class="kind-pie__row${stat ? " is-static" : ""}${active ? " is-active" : ""}" data-kind="${s.key}"${stat ? " disabled" : ""}>
        <i style="background:${s.css}"></i><span class="kp-name">${s.name}</span><span class="kp-n">${s.n}</span><span class="kp-pct">${s.pct.toFixed(0)}%</span>
      </button>`;
    })
    .join("");
  listEl.querySelectorAll("button[data-kind]").forEach((btn) => {
    if (btn.dataset.kind === "other") return;
    btn.addEventListener("click", () => {
      state.kind = state.kind === btn.dataset.kind ? "all" : btn.dataset.kind;
      renderKindTabs();
      renderBoard();
    });
  });
}

function renderKindTabs() {
  const tabs = $("#kind-tabs");
  if (!tabs) return;
  const board = state.board;

  // 分源榜不展示类型筛选；当前 kind 对不上可见按钮时回全部（禁止递归）
  const curBtn = tabs.querySelector(`button[data-kind="${state.kind}"]`);
  const curBoards = ((curBtn && curBtn.dataset.boards) || "merged").split(",");
  const kindOk =
    board === "merged" || board === "fandom" ? curBoards.includes(board) : true;
  if (!kindOk) state.kind = "all";

  tabs.querySelectorAll("button").forEach((btn) => {
    const boards = (btn.dataset.boards || "merged").split(",");
    if (board === "fandom") {
      btn.hidden = !boards.includes("fandom");
    } else if (board === "merged") {
      btn.hidden = !boards.includes("merged");
    } else {
      btn.hidden = true;
    }

    const active = btn.dataset.kind === state.kind;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
    btn.onclick = () => {
      state.kind = btn.dataset.kind;
      renderKindTabs();
      renderBoard();
    };
  });
}

function renderTabs() {
  const tabs = $("#board-tabs");
  tabs.innerHTML = meta.sources
    .map(
      (s) =>
        `<button type="button" role="tab" data-src="${s}" class="${s === state.board ? "is-active" : ""}" aria-selected="${s === state.board}">${escapeHTML(meta.source_names[s] || s)}</button>`
    )
    .join("");
  tabs.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.board = btn.dataset.src;
      state.kind = "all";
      tabs.querySelectorAll("button").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", b === btn ? "true" : "false");
      });
      renderKindTabs();
      renderBoard();
    })
  );
}

function renderBoard() {
  const isOverview = OVERVIEW.has(state.board);
  const board = $("#board");
  board.classList.toggle("board--src", !isOverview);
  $("#board-date").textContent = latest.date || "";
  const title = meta.source_names[state.board] || state.board;
  $("#board-title-text").textContent = isOverview ? `${title}榜` : `${title}分源榜`;

  let list = byKeyword(latest.boards[state.board] || [], state.kw);
  if (state.board !== "channel" && OVERVIEW.has(state.board)) list = byKind(list, state.kind);
  list = list.map((item, i) => Object.assign({}, item, { rank: i + 1 }));

  const ol = $("#rank-list");
  const status = $("#board-status");
  const kindRow = document.querySelector(".board__row--kind");
  if (kindRow) kindRow.hidden = state.board === "channel" || !OVERVIEW.has(state.board);
  renderKindPie();

  if (!list.length) {
    ol.innerHTML = "";
    const hint =
      state.kind !== "all" && state.board !== "channel"
        ? "当前类型下暂无上榜标签"
        : `没有匹配「${escapeHTML(state.kw)}」的标签`;
    status.innerHTML = `<div class="empty">
      ${ICON.searchX}
      <p>${hint}</p>
      <span class="meta">试试切换「同人/IP」或「全部 / 作品宇宙 / 同人结构 / 关系类型」</span>
    </div>`;
    return;
  }

  const hasDelta = list.some((x) => x.delta_rank !== null && x.delta_rank !== undefined);
  board.classList.toggle("board--nodelta", !hasDelta);
  board.classList.toggle(
    "board--nospark",
    !hasSpark || (state.board !== "merged" && state.board !== "fandom")
  );
  renderLegend(hasDelta);
  const scoreHead = document.querySelector(".rank-head .col-score");
  if (scoreHead) scoreHead.title = "分数条 = 当前榜单区间相对刻度";

  status.innerHTML = "";
  const scale = makeScale(list);
  ol.innerHTML = list.map((item, i) => rowHTML(item, i, isOverview, scale)).join("");

  requestAnimationFrame(() => {
    ol.querySelectorAll(".rank-score__bar > i").forEach((el) => {
      el.style.width = el.dataset.w + "%";
    });
  });

  ol.querySelectorAll(".rank-row").forEach((row) => {
    const go = () => {
      location.href = `tag.html#name=${encodeURIComponent(row.dataset.tag)}`;
    };
    row.addEventListener("click", go);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  });
}

function renderLegend(hasDelta) {
  const el = $("#board-legend");
  if (!el) return;
  el.innerHTML = hasDelta ? "" : '<span class="board__flag">首日快照 · 暂无升降</span>';
}

function renderHero() {
  const top = (latest.boards.merged || []).slice(0, 3);
  if (!top.length) return;
  const names = top.map((t) => `<strong>${escapeHTML(t.tag)}</strong>`).join("、");
  const rising = top.filter((t) => (t.delta_rank || 0) > 0).length;
  const tail = rising >= 2 ? "，整体走强" : top.some((t) => (t.delta_rank || 0) < 0) ? "，格局微调" : "";
  $("#wind-text").innerHTML = `${names} 领跑细分风向${tail}。`;
  $("#wind-date").textContent = `${latest.date} 快照`;
  $("#wind-line").hidden = false;
}

function showSkeleton() {
  $("#board-status").innerHTML = Array.from({ length: 8 })
    .map(() => '<div class="skeleton-row"><i></i><i></i><i></i><i></i><i></i></div>')
    .join("");
}

function showError(err) {
  console.error(err);
  $("#board-status").innerHTML = `<div class="load-error">
    <strong>数据加载失败</strong>
    请通过本地服务器访问本站：<code>npx serve 次元热度</code><br />
    直接双击打开 html 文件时浏览器会拦截 JSON 请求
  </div>`;
}

async function init() {
  initThemeToggle();
  showSkeleton();
  $("#search-input").addEventListener("input", (e) => {
    state.kw = e.target.value;
    renderBoard();
  });
  try {
    [meta, latest] = await Promise.all([loadMeta(), loadLatest()]);
    series = await loadSeries().catch(() => null);
    const dict = await loadAcgDict().catch(() => null);
    kindMap = buildKindMap(dict);
    sourceKeys = meta.sources.filter((s) => !OVERVIEW.has(s));
    hasSpark =
      !!series &&
      Object.values(series).some(
        (e) =>
          ((e.daily && e.daily.merged) || []).length >= 2 ||
          ((e.daily && e.daily.fandom) || []).length >= 2
      );
    renderHero();
    renderTabs();
    renderKindTabs();
    renderBoard();
  } catch (err) {
    showError(err);
  }
}

init();
