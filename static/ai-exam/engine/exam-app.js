/**
 * AI 编程合格考 · 作答页
 */
(function () {
  const TYPE_LABEL = { judge: "判断", single: "单选", multi: "多选" };
  const TYPE_CLASS = { judge: "badge--judge", single: "badge--single", multi: "badge--multi" };
  const LETTERS = "ABCDEFGH";

  let paper = null;
  let timer = null;
  let submitting = false;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensurePaper() {
    const existing = AiExamStorage.loadPaper();
    if (
      existing &&
      existing.questions &&
      existing.questions.length === 20 &&
      existing.remainingMs > 0 &&
      existing.questions.every(function (q) {
        return Array.isArray(q.answer) && q.answer.length > 0;
      })
    ) {
      return existing;
    }
    if (existing) {
      // 残缺续考数据（无答案键等）直接作废重抽
      AiExamStorage.clearPaper();
    }
    const report = AiExamDraw.validateBank();
    if (!report.ok) {
      alert("AI 题库不足，无法开考。当前：" + JSON.stringify(report));
      location.href = "index.html";
      return null;
    }
    paper = AiExamDraw.drawExam();
    AiExamStorage.savePaper(paper);
    return paper;
  }

  function save() {
    AiExamStorage.savePaper(paper);
  }

  function getAnswer(i) {
    return paper.answers[i] || [];
  }

  function setAnswer(i, arr) {
    paper.answers[i] = AiExamScoring.normalize(arr);
    save();
    renderSheet();
  }

  function renderSheet() {
    document.getElementById("sheet-grid").innerHTML = paper.questions
      .map(function (q, i) {
        const answered = (paper.answers[i] || []).length > 0;
        const cls = [
          "sheet-btn",
          answered ? "is-answered" : "",
          paper.flags[i] ? "is-flagged" : "",
          i === paper.currentIndex ? "is-current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return '<button type="button" class="' + cls + '" data-i="' + i + '">' + (i + 1) + "</button>";
      })
      .join("");
  }

  function syncFromInputs() {
    const i = paper.currentIndex;
    const q = paper.questions[i];
    const selected = [];
    document.querySelectorAll("#options input").forEach(function (inp) {
      if (inp.checked) selected.push(Number(inp.value));
    });
    if (q.type !== "multi" && selected.length > 1) {
      selected.splice(0, selected.length - 1);
    }
    setAnswer(i, selected);
    document.querySelectorAll("#options .option").forEach(function (el) {
      const oi = Number(el.getAttribute("data-oi"));
      el.classList.toggle("is-selected", selected.indexOf(oi) !== -1);
    });
  }

  function renderQuestion() {
    const i = paper.currentIndex;
    const q = paper.questions[i];
    const user = getAnswer(i);
    const isMulti = q.type === "multi";

    document.getElementById("progress-label").textContent =
      "第 " + (i + 1) + " / 20 题 · 错满 5 题不合格";

    const tip =
      q.type === "multi"
        ? '<p class="meta">多选题：选出所有正确项（须全对）</p>'
        : q.type === "judge"
          ? '<p class="meta">判断题</p>'
          : '<p class="meta">单选题</p>';

    document.getElementById("question-card").innerHTML =
      '<div class="q-meta"><span class="badge ' +
      TYPE_CLASS[q.type] +
      '">' +
      TYPE_LABEL[q.type] +
      "</span></div>" +
      tip +
      '<p class="q-stem">' +
      escapeHtml(q.stem) +
      '</p><ul class="options" id="options">' +
      q.options
        .map(function (opt, oi) {
          const checked = user.indexOf(oi) !== -1;
          return (
            '<li class="option' +
            (checked ? " is-selected" : "") +
            '" data-oi="' +
            oi +
            '"><input type="' +
            (isMulti ? "checkbox" : "radio") +
            '" name="q' +
            i +
            '" value="' +
            oi +
            '"' +
            (checked ? " checked" : "") +
            ' /><span class="option-label">' +
            LETTERS[oi] +
            '.</span><span class="option-text">' +
            escapeHtml(opt) +
            "</span></li>"
          );
        })
        .join("") +
      "</ul>";

    document.getElementById("btn-prev").disabled = i === 0;
    document.getElementById("btn-next").textContent = i === 19 ? "最后一题" : "下一题";
    document.getElementById("btn-flag").textContent = paper.flags[i] ? "取消标记" : "标记";

    document.querySelectorAll("#options .option").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.tagName === "INPUT") return;
        const input = el.querySelector("input");
        if (isMulti) input.checked = !input.checked;
        else input.checked = true;
        syncFromInputs();
      });
      el.querySelector("input").addEventListener("change", syncFromInputs);
    });

    renderSheet();
  }

  function go(i) {
    paper.currentIndex = Math.max(0, Math.min(19, i));
    save();
    renderQuestion();
  }

  function doSubmit(auto) {
    if (submitting) return;
    if (!auto) {
      const unanswered = paper.questions.filter(function (_, i) {
        return !(paper.answers[i] && paper.answers[i].length);
      }).length;
      if (!confirm((unanswered ? "还有 " + unanswered + " 题未作答。\n" : "") + "确定交卷？")) return;
    }
    submitting = true;
    if (timer) timer.stop();
    paper.remainingMs = timer ? timer.getRemaining() : 0;
    const result = AiExamScoring.gradePaper(paper.questions, paper.answers);
    result.at = Date.now();
    result.autoSubmit = !!auto;
    AiExamStorage.saveResult(result);
    AiExamStorage.addHistory({
      at: result.at,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      passed: result.passed,
    });
    if (result.wrongList.length) AiExamStorage.addWrong(result.wrongList);
    AiExamStorage.clearPaper();
    location.href = "result.html";
  }

  function setSheetOpen(open) {
    const sheet = document.getElementById("answer-sheet");
    const backdrop = document.getElementById("sheet-backdrop");
    const fab = document.getElementById("sheet-fab");
    if (!sheet) return;
    sheet.classList.toggle("is-open", open);
    if (backdrop) backdrop.classList.toggle("is-open", open);
    if (fab) fab.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function initSheetDrawer() {
    const fab = document.getElementById("sheet-fab");
    const sheet = document.getElementById("answer-sheet");
    const backdrop = document.getElementById("sheet-backdrop");
    if (!fab || !sheet) return;

    fab.addEventListener("click", function () {
      setSheetOpen(!sheet.classList.contains("is-open"));
    });
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setSheetOpen(false);
      });
    }
  }

  function bind() {
    document.getElementById("btn-prev").addEventListener("click", function () {
      go(paper.currentIndex - 1);
    });
    document.getElementById("btn-next").addEventListener("click", function () {
      if (paper.currentIndex < 19) go(paper.currentIndex + 1);
    });
    document.getElementById("btn-flag").addEventListener("click", function () {
      paper.flags[paper.currentIndex] = !paper.flags[paper.currentIndex];
      save();
      renderQuestion();
    });
    document.getElementById("btn-submit").addEventListener("click", function () {
      doSubmit(false);
    });
    document.getElementById("sheet-grid").addEventListener("click", function (e) {
      const btn = e.target.closest("[data-i]");
      if (btn) {
        go(Number(btn.getAttribute("data-i")));
        if (window.innerWidth <= 920) setSheetOpen(false);
      }
    });
    initSheetDrawer();
    window.addEventListener("beforeunload", function () {
      if (paper && timer && !submitting) {
        paper.remainingMs = timer.getRemaining();
        save();
      }
    });
  }

  function startTimer() {
    const el = document.getElementById("timer");
    timer = AiExamTimer.createTimer({
      remainingMs: paper.remainingMs,
      onTick: function (ms, text) {
        el.textContent = text;
        el.classList.toggle("is-warn", ms < 5 * 60 * 1000 && ms >= 60 * 1000);
        el.classList.toggle("is-danger", ms < 60 * 1000);
        paper.remainingMs = ms;
      },
      onEnd: function () {
        alert("时间到，自动交卷。");
        doSubmit(true);
      },
    });
    setInterval(function () {
      if (paper && timer && !submitting) {
        paper.remainingMs = timer.getRemaining();
        save();
      }
    }, 15000);
    timer.start();
  }

  paper = ensurePaper();
  if (!paper) return;
  bind();
  renderQuestion();
  startTimer();
})();
