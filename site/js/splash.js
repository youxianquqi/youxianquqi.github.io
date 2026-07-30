// 次元热度 · 开屏「晨启 · 学园都市」
// 每天首次访问 index.html 播放一次（localStorage 记录当天日期）
// 纯 CSS/SVG 注入，主站 rank.js 数据加载并行进行、不受阻塞
// 无 JS 环境不注入开屏，主站直接可用（渐进增强）

const STORE_KEY = "cyhd-splash";
const TODAY = new Date().toLocaleDateString("sv"); // 本地时区 YYYY-MM-DD
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FORCE =
  typeof location !== "undefined" &&
  /(?:\?|&)splash=(?:1|reset|force)\b/.test(location.search);

// play  = 播放完整四幕（约 2.6s）
// static = 静态成品帧 500ms 后快进退场（storage 异常 / reduced-motion）
// skip  = 当天已播过，直进主站
function decideMode() {
  let stored;
  try {
    if (FORCE) localStorage.removeItem(STORE_KEY);
    stored = localStorage.getItem(STORE_KEY);
  } catch (e) {
    return "static";
  }
  if (!FORCE && stored === TODAY) return "skip";
  try {
    localStorage.setItem(STORE_KEY, TODAY);
  } catch (e) {
    return "static";
  }
  return REDUCED ? "static" : "play";
}

const SKYLINE = `
<svg class="splash__skyline" viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <g fill="currentColor">
    <rect x="0" y="213" width="1440" height="7"/>
    <rect x="48" y="118" width="116" height="102"/>
    <rect x="96" y="88" width="26" height="30"/>
    <path d="M210 220a72 72 0 0 1 144 0z"/>
    <rect x="396" y="76" width="56" height="144"/>
    <rect x="418" y="38" width="6" height="38"/>
    <circle cx="421" cy="32" r="5"/>
    <rect x="556" y="118" width="8" height="102"/>
    <rect x="648" y="146" width="92" height="74"/>
    <rect x="772" y="96" width="132" height="124"/>
    <rect x="800" y="70" width="76" height="26"/>
    <path d="M968 220 1000 58 1032 220z"/>
    <rect x="1076" y="126" width="104" height="94"/>
    <rect x="1236" y="84" width="12" height="136"/>
    <circle cx="1242" cy="74" r="6"/>
    <rect x="1300" y="154" width="96" height="66"/>
  </g>
  <g fill="none" stroke="currentColor" stroke-width="3">
    <circle cx="560" cy="112" r="38"/>
    <circle cx="1000" cy="86" r="26"/>
  </g>
</svg>`;

const HUD = `
<svg class="splash__hud" viewBox="0 0 300 300" aria-hidden="true">
  <g class="hud-spin-cw"><circle cx="150" cy="150" r="132" class="hud-ticks"/></g>
  <g class="hud-spin-ccw"><circle cx="150" cy="150" r="108" class="hud-arcs"/></g>
  <circle cx="150" cy="150" r="86" class="hud-thin"/>
  <circle cx="150" cy="150" r="120" class="hud-charge"/>
  <circle cx="150" cy="150" r="120" class="hud-pulse"/>
</svg>`;

// 四幕时间轴（毫秒）：日志打字 → 最终行/进度 → 退场
const LINES = [
  { text: "› 接入风感网络 … OK", start: 850 },
  { text: "› 同步多源标签热度 … OK", start: 1160 },
  { text: "› 风向仪校准完成", start: 1500 },
];
const FINAL_TEXT = "WIND STATION ONLINE";
const ONLINE_AT = 1740;
const PROGRESS_END = 2480;
const EXIT_AT = 2640;
const CHAR_MS = 22;

function buildSplash() {
  const el = document.createElement("div");
  el.id = "splash";
  el.className = "splash";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "开屏动画，点击任意处或按 Esc 跳过");
  el.innerHTML = `
    <div class="splash__sky"></div>
    ${SKYLINE}
    <div class="splash__hexgrid"></div>
    <div class="splash__winds"><i></i><i></i><i></i><i></i></div>
    ${HUD}
    <div class="splash__core">
      <span class="splash__logo-wrap"><img src="tagheat-quill.svg" alt="" width="56" height="56" /></span>
      <p class="splash__word">
        <span style="--i:0">次</span><span style="--i:1">元</span><span style="--i:2">热</span><span style="--i:3">度</span>
      </p>
      <span class="splash__en">TagHeat</span>
      <div class="splash__log">
        ${LINES.map(() => "<p></p>").join("")}
        <p class="is-final"></p>
      </div>
      <div class="splash__progress"><i></i></div>
    </div>
    <div class="splash__flash"></div>
    <button type="button" class="splash__skip">跳过 ›</button>`;
  document.body.appendChild(el);
  return el;
}

const mode = decideMode();
const root = document.documentElement;

if (mode === "skip") {
  root.classList.remove("js-splash-boot");
} else {
  const splash = buildSplash();
  const logEls = [...splash.querySelectorAll(".splash__log p")];
  const finalEl = logEls.pop();
  const bar = splash.querySelector(".splash__progress > i");
  root.style.overflow = "hidden";
  root.classList.add("js-splash-boot");

  let raf = 0;
  let finished = false;
  let online = false;
  const t0 = performance.now();
  const typed = LINES.map(() => 0);

  function completeAll() {
    LINES.forEach((line, i) => {
      logEls[i].textContent = line.text;
      logEls[i].classList.add("is-on");
      logEls[i].classList.remove("is-typing");
    });
    finalEl.textContent = FINAL_TEXT;
    finalEl.classList.add("is-on");
    bar.style.width = "100%";
    splash.classList.add("is-online");
  }

  function tick(now) {
    const e = now - t0;
    LINES.forEach((line, i) => {
      if (e < line.start) return;
      const n = Math.min(line.text.length, Math.floor((e - line.start) / CHAR_MS) + 1);
      if (n === typed[i]) return;
      typed[i] = n;
      logEls[i].textContent = line.text.slice(0, n);
      logEls[i].classList.add("is-on");
      logEls[i].classList.toggle("is-typing", n < line.text.length);
    });
    if (!online && e >= ONLINE_AT) {
      online = true;
      finalEl.textContent = FINAL_TEXT;
      finalEl.classList.add("is-on");
      splash.classList.add("is-online");
    }
    if (e >= ONLINE_AT) {
      const p = Math.min(1, (e - ONLINE_AT) / (PROGRESS_END - ONLINE_AT));
      bar.style.width = `${(1 - Math.pow(1 - p, 3)) * 100}%`;
    }
    if (e >= EXIT_AT) return finish(false);
    raf = requestAnimationFrame(tick);
  }

  function onKey(ev) {
    if (ev.key === "Escape") finish(true);
  }

  function finish(quick) {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    completeAll();
    document.removeEventListener("keydown", onKey);
    splash.classList.add("is-exiting");
    if (quick) splash.classList.add("is-quick");
    const leaveDelay = quick ? 60 : 300;
    setTimeout(() => {
      splash.classList.add("is-leaving");
      document.body.classList.add("js-splash-reveal");
      setTimeout(() => document.body.classList.remove("js-splash-reveal"), 750);
    }, leaveDelay);
    setTimeout(() => {
      splash.remove();
      root.style.overflow = "";
      root.classList.remove("js-splash-boot");
    }, leaveDelay + (quick ? 380 : 520));
  }

  splash.addEventListener("pointerdown", () => finish(true));
  document.addEventListener("keydown", onKey);

  if (mode === "static") {
    splash.classList.add("is-static");
    completeAll();
    setTimeout(() => finish(true), 450);
  } else {
    raf = requestAnimationFrame(tick);
  }
}
