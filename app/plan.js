/* ============================================================
   곰돌이 학습장 — 190일 학사 계획 엔진
   ------------------------------------------------------------
   · 학년도 시작일부터 주말·공휴일·방학을 뺀 190 수업일을 만든다
   · 학습 내용은 날짜가 아니라 **진도 일차(1~190)** 로 정한다
     → 며칠 빠져도 배울 것을 건너뛰지 않는다
   · 같은 일차는 언제 열어도 같은 문제가 나온다
   ============================================================ */
(function (global) {
  "use strict";

  var TOTAL = 190;                    // 초·중등교육법 시행령이 정한 최소 수업일수

  /* 공휴일 (월-일). 학년도에 맞춰 설정에서 고칠 수 있다 */
  var HOLIDAY = [
    "03-01", "05-01", "05-05", "06-06", "08-15",
    "10-03", "10-09", "12-25", "01-01"
  ];
  /* 방학 (월-일 구간). 실제 학사일정에 맞춰 고친다 */
  var BREAK = [
    ["07-21", "08-17"],                 // 여름방학
    ["12-24", "12-31"], ["01-01", "02-28"]   // 겨울·봄방학
  ];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function key(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function md(d) { return pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function inBreak(m, breaks) {
    for (var i = 0; i < breaks.length; i++) {
      var a = breaks[i][0], b = breaks[i][1];
      if (a <= b) { if (m >= a && m <= b) return true; }
      else { if (m >= a || m <= b) return true; }   // 해를 넘기는 구간
    }
    return false;
  }

  /* 학년도 시작일부터 190 수업일을 뽑는다 */
  function calendar(startStr, opt) {
    opt = opt || {};
    var holi = opt.holidays || HOLIDAY;
    var brk = opt.breaks || BREAK;
    var d = parse(startStr || "2026-03-02");
    var out = [], guard = 0;
    while (out.length < TOTAL && guard++ < 900) {
      var w = d.getDay(), m = md(d);
      if (w !== 0 && w !== 6 && holi.indexOf(m) < 0 && !inBreak(m, brk)) out.push(key(d));
      d = new Date(d.getTime() + 86400000);
    }
    return out;
  }

  /* 오늘이 학사일정상 몇 일째인가 (수업일이 아니면 가장 가까운 지난 일차) */
  function expectedDay(cal, todayStr) {
    var i = cal.indexOf(todayStr);
    if (i >= 0) return i + 1;
    var n = 0;
    for (var k = 0; k < cal.length; k++) if (cal[k] <= todayStr) n = k + 1;
    return n;                            // 0 이면 아직 학년도 시작 전
  }

  /* ---------------------------------------------------------
     회차별 읽기 초점 — 같은 글을 다시 읽을 때 무엇을 볼지
     --------------------------------------------------------- */
  var ROUNDS = [
    { name: "처음 읽기", types: null, task: null },
    { name: "낱말·추론 집중", types: ["낱말 뜻", "추론"],
      task: { q: "이 글을 세 문장으로 요약해 보세요.",
              sample: "가장 중요한 사실 한 문장, 그 까닭 한 문장, 글쓴이의 생각 한 문장으로 묶어 씁니다.",
              rubric: ["세 문장으로 썼는가", "글의 중요한 내용을 골랐는가", "자기 말로 바꾸어 썼는가"] } },
    { name: "중심 생각 집중", types: ["사실 확인", "중심 생각"],
      task: { q: "이 글에 새 제목을 붙이고, 그렇게 붙인 까닭을 쓰세요.",
              sample: "제목은 글 전체를 한 마디로 묶는 말이어야 하고, 까닭에는 글의 어느 부분 때문인지 밝힙니다.",
              rubric: ["새 제목을 지었는가", "까닭을 글의 내용에서 찾았는가", "두 문장 이상으로 썼는가"] } },
    { name: "질문 만들기", types: null,
      task: { q: "글쓴이에게 묻고 싶은 질문을 두 개 만들어 보세요.",
              sample: "글에 나오지 않아 더 알고 싶은 점, 또는 글의 주장에서 확인하고 싶은 점을 묻습니다.",
              rubric: ["질문을 두 개 만들었는가", "글의 내용과 이어지는가", "물음표로 끝나는 문장인가"] } },
    { name: "내 경험과 잇기", types: ["추론", "중심 생각"],
      task: { q: "이 글의 내용과 이어지는 내 경험을 하나 떠올려 써 보세요.",
              sample: "글의 어느 부분과 어떻게 이어지는지 밝히면서 자기 경험을 씁니다.",
              rubric: ["자기 경험을 구체적으로 썼는가", "글의 어느 부분과 이어지는지 밝혔는가", "두 문장 이상으로 썼는가"] } },
    { name: "다르게 보기", types: null,
      task: { q: "이 글의 생각에 반대하는 사람이 있다면 어떤 근거를 들지 써 보세요.",
              sample: "글쓴이의 생각을 한 문장으로 정리한 뒤, 그에 맞서는 근거를 한두 가지 듭니다.",
              rubric: ["글의 생각을 짚었는가", "반대 근거를 들었는가", "두 문장 이상으로 썼는가"] } }
  ];

  /* ---------------------------------------------------------
     일차별 배정
     --------------------------------------------------------- */
  function koPlan(grade, day) {
    var list = (global.KOBANK.passages[String(grade)] || []);
    var n = list.length || 1;
    var per = global.KOBANK.perDay[grade] || 1;
    var i0 = (day - 1) % n;
    var r0 = Math.floor((day - 1) / n) % ROUNDS.length;
    var out = [{ p: list[i0], round: r0, isNew: r0 === 0, slot: "오늘의 글" }];
    if (per >= 2 && n > 1) {
      var gap = Math.max(1, Math.floor(n / 2));
      var i1 = (i0 + gap) % n;
      var r1 = (Math.floor((day - 1) / n) + 1) % ROUNDS.length;
      if (r1 === 0) r1 = 1;                       // 두 번째 글은 늘 '다시 읽기'
      out.push({ p: list[i1], round: r1, isNew: false, slot: "다시 읽기" });
    }
    return out;
  }

  function questionsFor(entry) {
    var R = ROUNDS[entry.round] || ROUNDS[0];
    var qs = entry.p.questions.slice();
    if (R.types) {
      var picked = qs.filter(function (q) { return R.types.indexOf(q.type) >= 0; });
      if (picked.length >= 2) qs = picked;
    }
    if (R.task) {
      qs = qs.filter(function (q) { return q.type !== "서술형"; });
      qs = qs.concat([{ type: "서술형", q: R.task.q, sample: R.task.sample, rubric: R.task.rubric }]);
    }
    return { round: R.name, questions: qs };
  }

  function enPlan(grade, day) {
    var B = global.ENBANK;
    var per = Number(B.perDay[String(grade)] || 8);
    var i;
    if (grade <= 2) {
      var al = B.alphabet, ph = B.phonics;
      var letters = [al[((day - 1) * 2) % al.length], al[((day - 1) * 2 + 1) % al.length]];
      var fresh = [ph[(day - 1) % ph.length]];
      var rev = [], seen0 = {}; seen0[fresh[0].word] = 1;
      [1, 3, 7, 14, 30].forEach(function (back) {
        var d = day - back;
        if (d < 1 || rev.length >= per - 1) return;
        var w = ph[(d - 1) % ph.length];
        if (!seen0[w.word]) { seen0[w.word] = 1; rev.push(w); }
      });
      i = 0;
      while (rev.length < per - 1 && i < ph.length) {
        var w0 = ph[(day * 5 + i) % ph.length]; i++;
        if (!seen0[w0.word]) { seen0[w0.word] = 1; rev.push(w0); }
      }
      return { letters: letters, fresh: fresh, review: rev, pool: ph };
    }

    var list = B.words[String(grade)] || [];
    var L = list.length;
    var N = Math.max(1, Math.ceil(L / TOTAL));    // 190일 안에 한 바퀴를 돌 만큼
    var fresh2 = [], seen = {};
    for (i = 0; i < N; i++) {
      var f = list[((day - 1) * N + i) % L];
      if (!seen[f.word]) { seen[f.word] = 1; fresh2.push(f); }
    }
    var review = [], want = Math.max(0, per - fresh2.length);
    [1, 2, 4, 7, 14, 30, 60, 90].forEach(function (back) {
      var d = day - back;
      if (d < 1 || review.length >= want) return;
      for (var k = 0; k < N && review.length < want; k++) {
        var w = list[((d - 1) * N + k) % L];
        if (!seen[w.word]) { seen[w.word] = 1; review.push(w); }
      }
    });
    i = 0;
    while (review.length < want && i < L) {        // 학년 초반처럼 배운 것이 적을 때 채운다
      var w2 = list[(day * 7 + i) % L]; i++;
      if (!seen[w2.word]) { seen[w2.word] = 1; review.push(w2); }
    }
    return { letters: [], fresh: fresh2, review: review, pool: list };
  }

  function maSeed(grade, day) { return "day" + day + "|g" + grade; }

  global.PLAN = {
    TOTAL: TOTAL,
    HOLIDAY: HOLIDAY,
    BREAK: BREAK,
    calendar: calendar,
    expectedDay: expectedDay,
    rounds: ROUNDS,
    ko: koPlan,
    questionsFor: questionsFor,
    en: enPlan,
    maSeed: maSeed
  };
})(window);
