/**
 * AI 编程合格考 · 抽题
 * 从 AI 题库抽 20 题：8 判断 + 8 单选 + 4 多选；选项打乱
 */
(function (global) {
  const DRAW = { judge: 8, single: 8, multi: 4 };
  const DURATION_MS = 20 * 60 * 1000; // 20 分钟

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickN(arr, n) {
    if (arr.length < n) {
      throw new Error("题库不足：" + (arr[0] && arr[0].type) + " 需要 " + n + "，实际 " + arr.length);
    }
    return shuffle(arr).slice(0, n);
  }

  function shuffleOptions(q) {
    const indices = q.options.map((_, i) => i);
    const shuffledIdx = shuffle(indices);
    const newOptions = shuffledIdx.map((i) => q.options[i]);
    const map = {};
    shuffledIdx.forEach((old, neu) => {
      map[old] = neu;
    });
    return {
      ...q,
      options: newOptions,
      answer: q.answer.map((old) => map[old]).sort((a, b) => a - b),
    };
  }

  function collectBank() {
    const banks = global.EXAM_BANKS || {};
    return Object.values(banks).flat();
  }

  function groupByType(all) {
    const g = { judge: [], single: [], multi: [] };
    all.forEach((q) => {
      if (g[q.type]) g[q.type].push(q);
    });
    return g;
  }

  function drawExam() {
    const all = collectBank();
    const g = groupByType(all);
    const picked = [
      ...pickN(g.judge, DRAW.judge),
      ...pickN(g.single, DRAW.single),
      ...pickN(g.multi, DRAW.multi),
    ].map(shuffleOptions);

    const questions = shuffle(picked).map((q, i) => ({ ...q, examIndex: i }));

    return {
      questions,
      meta: {
        drawnAt: Date.now(),
        count: questions.length,
        durationMs: DURATION_MS,
        failWrong: 5,
        draw: DRAW,
      },
      answers: {},
      flags: {},
      currentIndex: 0,
      remainingMs: DURATION_MS,
    };
  }

  function drawPractice(pool, n) {
    return shuffle(pool)
      .slice(0, Math.min(n, pool.length))
      .map(shuffleOptions);
  }

  function validateBank() {
    const g = groupByType(collectBank());
    return {
      total: collectBank().length,
      judge: g.judge.length,
      single: g.single.length,
      multi: g.multi.length,
      ok: g.judge.length >= DRAW.judge && g.single.length >= DRAW.single && g.multi.length >= DRAW.multi,
    };
  }

  global.AiExamDraw = {
    DRAW,
    DURATION_MS,
    shuffle,
    shuffleOptions,
    collectBank,
    drawExam,
    drawPractice,
    validateBank,
  };
})(typeof window !== "undefined" ? window : globalThis);
