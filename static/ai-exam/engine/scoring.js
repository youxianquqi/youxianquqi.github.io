/**
 * AI 编程合格考 · 判分
 * 共 20 题；错 ≥ 5 题不合格（即对 ≥ 16 题合格）
 */
(function (global) {
  const TOTAL = 20;
  const FAIL_WRONG = 5; // 错满 5 题不合格
  const PASS_CORRECT = TOTAL - FAIL_WRONG + 1; // 16

  function normalize(arr) {
    return [...(arr || [])].map(Number).sort((a, b) => a - b);
  }

  function equal(a, b) {
    const x = normalize(a);
    const y = normalize(b);
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }

  function gradePaper(questions, answersMap) {
    const details = questions.map((q, i) => {
      const user = answersMap[i] || [];
      const correct = equal(q.answer, user);
      return {
        index: i,
        id: q.id,
        module: q.module,
        type: q.type,
        stem: q.stem,
        options: q.options,
        answer: q.answer,
        userAnswer: normalize(user),
        explain: q.explain,
        correct,
      };
    });
    const wrongCount = details.filter((d) => !d.correct).length;
    const correctCount = details.length - wrongCount;
    const passed = wrongCount < FAIL_WRONG;

    return {
      total: details.length,
      correctCount,
      wrongCount,
      failWrong: FAIL_WRONG,
      passCorrect: PASS_CORRECT,
      passed,
      details,
      wrongList: details
        .filter((d) => !d.correct)
        .map((d) => ({
          id: d.id,
          module: d.module,
          type: d.type,
          stem: d.stem,
          options: d.options,
          answer: d.answer,
          explain: d.explain,
        })),
    };
  }

  global.AiExamScoring = {
    TOTAL,
    FAIL_WRONG,
    PASS_CORRECT,
    gradePaper,
    equal,
    normalize,
  };
})(typeof window !== "undefined" ? window : globalThis);
