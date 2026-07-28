// 主题切换：dark「极夜冰蓝」/ light「晴空文库」，localStorage 持久化
// 首次访问由 <head> 内联脚本按 prefers-color-scheme 预设，避免闪烁

const THEME_KEY = "cyhd-theme";

export function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    /* 隐私模式下静默 */
  }
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

export function initThemeToggle() {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  btn.addEventListener("click", toggleTheme);
}
