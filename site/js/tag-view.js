// tag-view.js — 单标签趋势：日/周切换 × 综合/分源切换
import { initThemeToggle } from "./theme.js";
import { loadMeta, loadLatest, loadSeries, loadAcgDict, findIpMeta, escapeHTML } from "./data.js";
import { renderTrend, chartAvailable } from "./chart-view.js";

const $ = (sel) => document.querySelector(sel);

const state = { tag: null, series: null, gran: "daily" };
let meta = null;
let latest = null;
let dict = null;

const tagNameOf = (src) => (meta && meta.source_names[src]) || src;

// 优先取 ?name=，退化到 #name=：部分静态服务器（如 serve 的 cleanUrls）
// 重定向 .html 时会丢查询串，hash 不会被重定向影响
function parseTag() {
  const fromQuery = new URLSearchParams(location.search).get("name");
  const fromHash = new URLSearchParams(location.hash.replace(/^#/, "")).get("name");
  const name = (fromQuery || fromHash || "").trim();
  return name || null;
}

function showFatal(msg) {
  $("#chart-box").style.display = "none";
  $("#tag-summary").innerHTML = "";
  $("#hit-chips").innerHTML = "";
  $("#chart-status").innerHTML = `<div class="empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
    <p>${escapeHTML(msg)}</p>
    <span class="meta"><a href="index.html">返回热榜</a> 看看今天在榜的标签</span>
  </div>`;
}

function findLatestBoardItem() {
  for (const key of ["fandom", "merged", "channel"]) {
    const board = (latest.boards && latest.boards[key]) || [];
    const hit = board.find((item) => item.tag === state.tag);
    if (hit) return { board: key, item: hit };
  }
  for (const src of meta.sources) {
    if (src === "merged" || src === "fandom" || src === "channel") continue;
    const board = latest.boards[src] || [];
    const hit = board.find((item) => item.tag === state.tag);
    if (hit) return { board: src, item: hit };
  }
  return null;
}

function renderHead() {
  document.title = `${state.tag} · 标签趋势 · 次元热度`;
  $("#tag-title").textContent = state.tag;

  const hits = [];
  for (const src of meta.sources) {
    if (src === "merged" || src === "fandom" || src === "channel") continue;
    const board = latest.boards[src] || [];
    if (board.some((item) => item.tag === state.tag)) hits.push(src);
  }
  $("#hit-chips").innerHTML = hits.length
    ? `<span class="hit-chip">最新日在榜：${hits.map((s) => escapeHTML(tagNameOf(s))).join(" / ")}</span>`
    : `<span class="hit-chip">最新日未在任一源上榜</span>`;

  const metaEl = $("#tag-meta");
  const parts = [];
  const ip = findIpMeta(dict, state.tag);
  const found = findLatestBoardItem();
  const role = (found && found.item.tag_role) || (state.series && state.series.tag_role);
  if (ip) {
    parts.push(`<span class="meta-chip">宇宙：${escapeHTML(ip.canonical)}</span>`);
    if (ip.aliases && ip.aliases.length) {
      parts.push(`<span class="meta-chip">别名：${escapeHTML(ip.aliases.join(" / "))}</span>`);
    }
    if (ip.parent) parts.push(`<span class="meta-chip">上级：${escapeHTML(ip.parent)}</span>`);
  }
  if (role) parts.push(`<span class="meta-chip">角色：${escapeHTML(role)}</span>`);
  if (found && found.item.signal_summary_text) {
    parts.push(`<span class="meta-chip">证据：${escapeHTML(found.item.signal_summary_text)}</span>`);
  }
  if (found && found.item.discovery) {
    const d = found.item.discovery === "multi_source" ? "多源共识" : "单源发现";
    parts.push(`<span class="meta-chip">${d}</span>`);
  }
  if (parts.length) {
    metaEl.hidden = false;
    metaEl.innerHTML = parts.join("");
  } else {
    metaEl.hidden = true;
    metaEl.innerHTML = "";
  }
}

function renderStats() {
  const daily =
    state.series.daily.merged ||
    state.series.daily.fandom ||
    state.series.daily.channel ||
    [];
  const last = daily.length ? daily[daily.length - 1] : null;
  const prev = daily.length > 1 ? daily[daily.length - 2] : null;
  const recent7 = daily.slice(-7);
  const avg7 = recent7.length ? recent7.reduce((a, p) => a + p[1], 0) / recent7.length : null;
  const srcCount = Object.keys(state.series.daily).filter(
    (k) => k !== "merged" && k !== "fandom" && k !== "channel"
  ).length;

  const delta = last && prev ? last[1] - prev[1] : null;
  const deltaCls = delta === null ? "" : delta > 0 ? "ts--up" : delta < 0 ? "ts--down" : "";
  const deltaTxt = delta === null ? "—" : (delta > 0 ? "+" : "") + delta.toFixed(1);

  $("#tag-summary").innerHTML = `
    <span class="ts"><strong>${last ? last[1].toFixed(1) : "—"}</strong>最新热度分</span>
    <span class="ts ${deltaCls}"><strong>${deltaTxt}</strong>较昨日</span>
    <span class="ts"><strong>${avg7 === null ? "—" : avg7.toFixed(1)}</strong>近 7 日均值</span>
    <span class="ts"><strong>${srcCount}</strong>覆盖数据源</span>`;
}

function renderSeriesTabs() {
  const preferred = ["merged", "fandom", "channel"];
  const rest = Object.keys(state.series.daily).filter((k) => !preferred.includes(k));
  const keys = [...preferred.filter((k) => state.series.daily[k] && state.series.daily[k].length), ...rest];
  const tabs = $("#series-tabs");
  tabs.innerHTML = keys
    .map(
      (k) =>
        `<button type="button" role="tab" data-src="${k}" class="${k === state.seriesKey ? "is-active" : ""}">${escapeHTML(tagNameOf(k))}</button>`
    )
    .join("");
  tabs.querySelectorAll("button").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.seriesKey = btn.dataset.src;
      tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderChart();
    })
  );
}

// 日视图：把首末日期之间的缺日补为 null，折线留断点
function fillDailyGaps(points) {
  if (!points || !points.length) return { labels: [], values: [] };
  const map = new Map(points);
  const start = new Date(points[0][0] + "T00:00:00");
  const end = new Date(points[points.length - 1][0] + "T00:00:00");
  const labels = [];
  const values = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${dd}`;
    labels.push(`${m}-${dd}`);
    values.push(map.has(key) ? map.get(key) : null);
  }
  return { labels, values };
}

function renderChart() {
  const points = (state.series[state.gran] || {})[state.seriesKey] || [];
  let labels;
  let values;
  if (state.gran === "daily") {
    ({ labels, values } = fillDailyGaps(points));
  } else {
    labels = points.map(([week]) => week.replace(/^\d{4}-/, ""));
    values = points.map(([, score]) => score);
  }

  if (!chartAvailable()) {
    $("#chart-status").innerHTML = `<div class="load-error"><strong>图表库加载失败</strong>Chart.js CDN 不可用，请检查网络后刷新</div>`;
    return;
  }
  $("#chart-status").innerHTML = "";
  renderTrend($("#trend-chart"), labels, values, `${state.tag} · ${tagNameOf(state.seriesKey)}`);
}

async function init() {
  initThemeToggle();
  const tag = parseTag();
  if (!tag) {
    showFatal("缺少标签参数");
    return;
  }
  state.tag = tag;
  $("#tag-title").textContent = tag;

  try {
    [meta, latest] = await Promise.all([loadMeta(), loadLatest()]);
    dict = await loadAcgDict().catch(() => null);
    const all = await loadSeries();
    const entry = all[tag];
    if (!entry || !Object.keys(entry.daily).length) {
      showFatal(`「${tag}」暂无热度数据`);
      return;
    }
    state.series = entry;
    state.seriesKey = entry.daily.merged
      ? "merged"
      : entry.daily.fandom
        ? "fandom"
        : Object.keys(entry.daily)[0];

    renderHead();
    renderStats();
    renderSeriesTabs();
    renderChart();

    $("#gran-tabs").querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => {
        state.gran = btn.dataset.gran;
        $("#gran-tabs").querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === btn));
        renderChart();
      })
    );

    window.addEventListener("themechange", renderChart);
  } catch (err) {
    console.error(err);
    showFatal("数据加载失败，请通过 npx serve 次元热度 访问本站");
  }
}

init();
