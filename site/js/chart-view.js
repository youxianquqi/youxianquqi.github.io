// chart-view.js — Chart.js 折线封装，颜色实时读取 CSS 变量以跟随主题

let chart = null;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexA(hex, a) {
  const m = String(hex).match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export function chartAvailable() {
  return typeof window.Chart !== "undefined";
}

export function renderTrend(canvas, labels, values, seriesLabel) {
  const brand = cssVar("--brand") || "#6ec6ff";
  const brandInk = cssVar("--brand-ink") || brand;
  const muted = cssVar("--muted") || "#8a94a6";
  const border = cssVar("--border") || "rgba(128,128,128,.2)";
  const surface = cssVar("--surface-3") || "#1f2c47";
  const ink = cssVar("--ink") || "#e8f1fb";

  if (chart) {
    chart.destroy();
    chart = null;
  }

  const ctx = canvas.getContext("2d");
  const h = canvas.parentElement ? canvas.parentElement.clientHeight : 360;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, hexA(brand, 0.26));
  grad.addColorStop(1, hexA(brand, 0.02));

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: seriesLabel,
          data: values,
          borderColor: brand,
          backgroundColor: grad,
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 3,
          pointHoverRadius: 5.5,
          pointBackgroundColor: brand,
          pointBorderColor: surface,
          pointBorderWidth: 1.5,
          spanGaps: false, // 缺日保留断点，不向前填充
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: surface,
          titleColor: ink,
          bodyColor: brandInk,
          borderColor: border,
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: (item) => `热度分 ${item.parsed.y === null ? "—" : item.parsed.y.toFixed(1)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: border, drawTicks: false },
          ticks: { color: muted, maxTicksLimit: 10, font: { family: "Consolas, monospace", size: 11 } },
        },
        y: {
          min: 0,
          suggestedMax: 100,
          grid: { color: border },
          ticks: { color: muted, font: { family: "Consolas, monospace", size: 11 } },
        },
      },
    },
  });
  return chart;
}
