/**
 * AI 编程合格考 · 存储
 * 试卷与答案键分离存放，降低 F12 直接偷看试卷 JSON 的风险
 */
(function (global) {
  const KEYS = {
    paper: "ai_exam_paper",
    akey: "ai_exam_akey",
    result: "ai_exam_result",
    wrong: "ai_exam_wrong",
    history: "ai_exam_history",
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function encodeKey(map) {
    const json = JSON.stringify(map);
    // 轻度混淆（非加密）：避免在试卷条目里直接看到 answer
    if (typeof btoa === "function") {
      return btoa(unescape(encodeURIComponent(json)));
    }
    return Buffer.from(json, "utf8").toString("base64");
  }

  function decodeKey(hidden) {
    if (!hidden) return null;
    try {
      let json;
      if (typeof atob === "function") {
        json = decodeURIComponent(escape(atob(hidden)));
      } else {
        json = Buffer.from(hidden, "base64").toString("utf8");
      }
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function splitPaper(paper) {
    const key = {};
    const questions = (paper.questions || []).map(function (q) {
      key[q.id] = q.answer;
      var copy = {};
      Object.keys(q).forEach(function (k) {
        if (k !== "answer") copy[k] = q[k];
      });
      return copy;
    });
    return {
      paper: Object.assign({}, paper, { questions: questions }),
      key: key,
    };
  }

  function mergePaper(paper, key) {
    if (!paper) return null;
    if (!key) return paper;
    return Object.assign({}, paper, {
      questions: (paper.questions || []).map(function (q) {
        return Object.assign({}, q, { answer: key[q.id] });
      }),
    });
  }

  function savePaper(p) {
    var split = splitPaper(p);
    write(KEYS.paper, split.paper);
    localStorage.setItem(KEYS.akey, encodeKey(split.key));
  }

  function loadPaper() {
    var paper = read(KEYS.paper, null);
    if (!paper) return null;
    var key = decodeKey(localStorage.getItem(KEYS.akey));
    return mergePaper(paper, key);
  }

  function clearPaper() {
    localStorage.removeItem(KEYS.paper);
    localStorage.removeItem(KEYS.akey);
  }

  global.AiExamStorage = {
    savePaper: savePaper,
    loadPaper: loadPaper,
    clearPaper: clearPaper,
    saveResult: function (r) {
      write(KEYS.result, r);
    },
    loadResult: function () {
      return read(KEYS.result, null);
    },
    addHistory: function (e) {
      var list = read(KEYS.history, []);
      list.unshift(e);
      write(KEYS.history, list.slice(0, 30));
    },
    loadHistory: function () {
      return read(KEYS.history, []);
    },
    addWrong: function (items) {
      var book = read(KEYS.wrong, {});
      items.forEach(function (q) {
        book[q.id] = Object.assign({}, q, { savedAt: Date.now() });
      });
      write(KEYS.wrong, book);
    },
    removeWrong: function (id) {
      var book = read(KEYS.wrong, {});
      delete book[id];
      write(KEYS.wrong, book);
    },
    loadWrong: function () {
      return Object.values(read(KEYS.wrong, {})).sort(function (a, b) {
        return b.savedAt - a.savedAt;
      });
    },
    clearWrong: function () {
      write(KEYS.wrong, {});
    },
    // 测试用：读取原始试卷字符串
    _rawPaper: function () {
      return localStorage.getItem(KEYS.paper);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
