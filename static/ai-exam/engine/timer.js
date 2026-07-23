/**
 * AI 编程合格考 · 倒计时（默认 20 分钟）
 */
(function (global) {
  function createTimer(options) {
    let remaining = options.remainingMs ?? options.durationMs ?? 20 * 60 * 1000;
    const onTick = options.onTick || (() => {});
    const onEnd = options.onEnd || (() => {});
    let timerId = null;
    let lastTs = null;
    let running = false;

    function format(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
    }

    function tick(now) {
      if (!running) return;
      if (lastTs == null) lastTs = now;
      remaining -= now - lastTs;
      lastTs = now;
      onTick(Math.max(0, remaining), format(remaining));
      if (remaining <= 0) {
        stop();
        onEnd();
        return;
      }
      timerId = requestAnimationFrame(tick);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = null;
      timerId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (timerId != null) cancelAnimationFrame(timerId);
      timerId = null;
    }

    return {
      start,
      stop,
      format,
      getRemaining: () => Math.max(0, remaining),
    };
  }

  global.AiExamTimer = { createTimer, DURATION_MS: 20 * 60 * 1000 };
})(typeof window !== "undefined" ? window : globalThis);
