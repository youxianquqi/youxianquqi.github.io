/**
 * AI 编程合格考 · 作答页
 * 答完即显示对错与解析（单选/判断点选即出；多选需点「确认本题」）
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

  function ensureRevealed() {
    if (!paper.revealed || paper.revealed.length !== paper.questions.length) {
      paper.revealed = paper.questions.map(function (_, i) {
        const q = paper.questions[i];
        const ans = paper.answers[i] || [];
        // 续考：已作答的判断/单选视为已揭晓；多选仅在曾揭晓时保留
        if (q.type === "multi") return false;
        return ans.length > 0;
      });
    }
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
      AiExamStorage.clearPaper();
    }
    const report = AiExamDraw.validateBank();
    if (!report.ok) {
      alert("AI 题库不足，无法开考。当前：" + JSON.stringify(report));
      location.href = "index.html";
      return null;
    }
    paper = AiExamDraw.drawExam();
    paper.revealed = paper.questions.map(function () {
      return false;
    });
    AiExamStorage.savePaper(paper);
    return paper;
  }

  function save() {
    AiExamStorage.savePaper(paper);
  }

  function getAnswer(i) {
    return paper.answers[i] || [];
  }

  function isRevealed(i) {
    return !!(paper.revealed && paper.revealed[i]);
  }

  function setAnswer(i, arr) {
    paper.answers[i] = AiExamScoring.normalize(arr);
    save();
    renderSheet();
  }

  function reveal(i) {
    ensureRevealed();
    paper.revealed[i] = true;
    save();
  }

  function renderSheet() {
    ensureRevealed();
    document.getElementById("sheet-grid").innerHTML = paper.questions
      .map(function (q, i) {
        const answered = (paper.answers[i] || []).length > 0;
        const shown = isRevealed(i);
        const ok = shown && AiExamScoring.equal(q.answer, paper.answers[i] || []);
        const cls = [
          "sheet-btn",
          answered ? "is-answered" : "",
          shown && ok ? "is-right" : "",
          shown && !ok ? "is-wrong" : "",
          paper.flags[i] ? "is-flagged" : "",
          i === paper.currentIndex ? "is-current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return '<button type="button" class="' + cls + '" data-i="' + i + '">' + (i + 1) + "</button>";
      })
      .join("");
  }

  function applyFeedbackUI(i) {
    const q = paper.questions[i];
    const user = getAnswer(i);
    const ok = AiExamScoring.equal(q.answer, user);
    const card = document.getElementById("question-card");

    document.querySelectorAll("#options .option").forEach(function (el) {
      const oi = Number(el.getAttribute("data-oi"));
      el.classList.remove("is-selected", "is-correct", "is-wrong");
      if (q.answer.indexOf(oi) !== -1) el.classList.add("is-correct");
      if (user.indexOf(oi) !== -1 && q.answer.indexOf(oi) === -1) el.classList.add("is-wrong");
      const input = el.querySelector("input");
      if (input) input.disabled = true;
      el.classList.add("is-locked");
    });

    let fb = document.getElementById("exam-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.id = "exam-feedback";
      card.appendChild(fb);
    }
    fb.hidden = false;
    fb.className = "feedback " + (ok ? "feedback--ok" : "feedback--bad");
    fb.innerHTML =
      (ok ? "回答正确。" : "回答错误。") +
      " 正确答案：" +
      q.answer
        .map(function (ai) {
          return LETTERS[ai];
        })
        .join("、") +
      '<div class="explain">' +
      escapeHtml(q.explain || "") +
      "</div>";

    const confirmBtn = document.getElementById("btn-confirm-answer");
    if (confirmBtn) confirmBtn.hidden = true;
  }

  function syncFromInputs() {
    const i = paper.currentIndex;
    if (isRevealed(i)) return;
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

    if (q.type !== "multi" && selected.length > 0) {
      reveal(i);
      applyFeedbackUI(i);
      renderSheet();
    } else if (q.type === "multi") {
      const confirmBtn = document.getElementById("btn-confirm-answer");
      if (confirmBtn) confirmBtn.hidden = selected.length === 0;
    }
  }

  function renderQuestion() {
    ensureRevealed();
    const i = paper.currentIndex;
    const q = paper.questions[i];
    const user = getAnswer(i);
    const isMulti = q.type === "multi";
    const locked = isRevealed(i);

    document.getElementById("progress-label").textContent =
      "第 " + (i + 1) + " / 20 题 · 错满 5 题不合格";

    const tip = isMulti
      ? '<p class="meta">多选题：选出所有正确项后点「确认本题」（须全对）</p>'
      : q.type === "judge"
        ? '<p class="meta">判断题：点选后立即显示对错与解析</p>'
        : '<p class="meta">单选题：点选后立即显示对错与解析</p>';

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
            (locked ? " disabled" : "") +
            ' /><span class="option-label">' +
            LETTERS[oi] +
            '.</span><span class="option-text">' +
            escapeHtml(opt) +
            "</span></li>"
          );
        })
        .join("") +
      "</ul>" +
      (isMulti && !locked
        ? '<div class="btn-row" style="margin-top:1rem"><button type="button" class="btn btn--primary" id="btn-confirm-answer"' +
          (user.length ? "" : " hidden") +
          ">确认本题</button></div>"
        : "") +
      '<div id="exam-feedback" hidden></div>';

    document.getElementById("btn-prev").disabled = i === 0;
    document.getElementById("btn-next").textContent = i === 19 ? "最后一题" : "下一题";
    document.getElementById("btn-flag").textContent = paper.flags[i] ? "取消标记" : "标记";

    if (!locked) {
      document.querySelectorAll("#options .option").forEach(function (el) {
        el.addEventListener("click", function (e) {
          if (isRevealed(paper.currentIndex)) return;
          if (e.target.tagName === "INPUT") return;
          const input = el.querySelector("input");
          if (isMulti) input.checked = !input.checked;
          else input.checked = true;
          syncFromInputs();
        });
        el.querySelector("input").addEventListener("change", syncFromInputs);
      });
      const confirmBtn = document.getElementById("btn-confirm-answer");
      if (confirmBtn) {
        confirmBtn.addEventListener("click", function () {
          if (isRevealed(i)) return;
          const selected = getAnswer(i);
          if (!selected.length) {
            alert("请至少选择一项");
            return;
          }
          reveal(i);
          applyFeedbackUI(i);
          renderSheet();
        });
      }
    } else {
      applyFeedbackUI(i);
    }

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
      const unanswered = paper.questions.filter(function (_, idx) {
        return !(paper.answers[idx] && paper.answers[idx].length);
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
  ensureRevealed();
  bind();
  renderQuestion();
  startTimer();
})();
