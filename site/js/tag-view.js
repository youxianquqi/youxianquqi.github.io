// tag-view.js — 单标签趋势：日/周切换 × 综合/分源切换
import { initThemeToggle } from "./theme.js";
import { loadMeta, loadLatest, loadSeries, escapeHTML } from "./data.js";
import { renderTrend, chartAvailable } from "./chart-view.js";

const $ = (sel) => document.querySelector(sel);

const state = { tag: null, series: null, gran: "daily" };
let meta = null;
let latest = null;

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

function renderHead() {
  document.title = `${state.tag} · 标签趋势 · 次元热度`;
  $("#tag-title").textContent = state.tag;

  // 最新日仍在榜的源（用最新快照判定，比“历史出现过”更有意义）
  const hits = [];
  for (const src of meta.sources) {
    if (src === "merged") continue;
    const board = latest.boards[src] || [];
    if (board.some((item) => item.tag === state.tag)) hits.push(src);
  }
  $("#hit-chips").innerHTML = hits.length
    ? `<span class="hit-chip">最新日在榜：${hits.map((s) => escapeHTML(tagNameOf(s))).join(" / ")}</span>`
    : `<span class="hit-chip">最新日未在任一源上榜</span>`;
}

function renderStats() {
  const daily = state.series.daily.merged || [];
  const last = daily.length ? daily[daily.length - 1] : null;
  const prev = daily.length > 1 ? daily[daily.length - 2] : null;
  const recent7 = daily.slice(-7);
  const avg7 = recent7.length ? recent7.reduce((a, p) => a + p[1], 0) / recent7.length : null;
  const srcCount = Object.keys(state.series.daily).filter((k) => k !== "merged").length;

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
  const keys = ["merged", ...Object.keys(state.series.daily).filter((k) => k !== "merged")];
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
    const all = await loadSeries();
    const entry = all[tag];
    if (!entry || !Object.keys(entry.daily).length) {
      showFatal(`「${tag}」暂无热度数据`);
      return;
    }
    state.series = entry;
    state.seriesKey = entry.daily.merged ? "merged" : Object.keys(entry.daily)[0];

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
