/* ============================================================
   곰돌이 학습장 — 앱 본체
   흐름 : 학년 고르기 → 오늘 일차 확인 → 국어 → 수학 → 영어 → 결과 → 메일
   진도 : 날짜가 아니라 '일차(1~190)'로 센다. 며칠 빠져도 배울 것을 건너뛰지 않는다.
   저장 : localStorage 만 사용. 밖으로 나가는 것은 결과 메일뿐.
   ============================================================ */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     0. 도구
     --------------------------------------------------------- */
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function mmss(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
  }
  function 분초(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m ? m + "분 " + s + "초" : s + "초";
  }
  var toastT = null;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  /* ---------------------------------------------------------
     1. 곰돌이
     --------------------------------------------------------- */
  var BEAR_FACE = {
    hi:    { eye: "open",  mouth: "M40,60 q10,9 20,0",  brow: false },
    think: { eye: "look",  mouth: "M43,62 q7,-4 14,0",  brow: true  },
    cheer: { eye: "happy", mouth: "M38,58 q12,14 24,0", brow: false },
    soft:  { eye: "open",  mouth: "M44,61 q6,5 12,0",   brow: false }
  };
  function bearSVG(size, mood, tone) {
    var f = BEAR_FACE[mood] || BEAR_FACE.hi;
    var body = tone || "#C88A4B", dark = "#8B5A2B", muzz = "#F5E3CC";
    var eyes;
    if (f.eye === "happy") {
      eyes = '<path d="M34,45 q5,-6 10,0" stroke="#3D2B1F" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
             '<path d="M56,45 q5,-6 10,0" stroke="#3D2B1F" stroke-width="3.4" fill="none" stroke-linecap="round"/>';
    } else if (f.eye === "look") {
      eyes = '<circle cx="40" cy="46" r="3.6" fill="#3D2B1F"/><circle cx="62" cy="46" r="3.6" fill="#3D2B1F"/>' +
             '<circle cx="41.4" cy="44.8" r="1.2" fill="#fff"/><circle cx="63.4" cy="44.8" r="1.2" fill="#fff"/>';
    } else {
      eyes = '<circle cx="39" cy="45" r="4" fill="#3D2B1F"/><circle cx="61" cy="45" r="4" fill="#3D2B1F"/>' +
             '<circle cx="40.5" cy="43.6" r="1.4" fill="#fff"/><circle cx="62.5" cy="43.6" r="1.4" fill="#fff"/>';
    }
    return '<svg class="bear" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="24" cy="24" r="14" fill="' + body + '"/><circle cx="24" cy="24" r="7" fill="' + muzz + '"/>' +
      '<circle cx="76" cy="24" r="14" fill="' + body + '"/><circle cx="76" cy="24" r="7" fill="' + muzz + '"/>' +
      '<ellipse cx="50" cy="52" rx="34" ry="31" fill="' + body + '"/>' +
      '<ellipse cx="50" cy="63" rx="17" ry="13" fill="' + muzz + '"/>' +
      '<ellipse cx="27" cy="58" rx="7" ry="5" fill="#F0A9A0" opacity=".55"/>' +
      '<ellipse cx="73" cy="58" rx="7" ry="5" fill="#F0A9A0" opacity=".55"/>' + eyes +
      (f.brow ? '<path d="M32,35 q7,-4 13,0" stroke="' + dark + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>' +
                '<path d="M55,35 q7,-4 13,0" stroke="' + dark + '" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".75"/>' : "") +
      '<ellipse cx="50" cy="56" rx="6" ry="4.4" fill="#3D2B1F"/>' +
      '<path d="M50,60 v4" stroke="#3D2B1F" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="' + f.mouth + '" stroke="#3D2B1F" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
      "</svg>";
  }
  var SUBJ_TONE = { ko: "#FF8A4C", ma: "#3FAF6E", en: "#4C93F0" };
  var SUBJ = { ko: { name: "국어" }, ma: { name: "수학" }, en: { name: "영어" } };
  var ORDER = ["ko", "ma", "en"];

  /* ---------------------------------------------------------
     2. 저장소
     --------------------------------------------------------- */
  var LSK = "bearApp.v2";
  var S = load();
  function load() {
    var d = {
      name: "", mail: "", auto: true, svc: "", tpl: "", key: "",
      gas: "", gasKey: "",            // 기록 모으기 (Google Apps Script)
      log: [],                        // 과목을 끝낼 때마다 한 줄 (최근 600)
      queue: [],                      // 아직 못 보낸 기록
      start: "2026-03-02", grade: 0,
      day: {},      // 학년별 지금 하고 있는 일차 (1~190)
      cur: {},      // 학년별 이 일차의 결과
      hist: []      // 끝낸 일차 기록 (최근 80)
    };
    try {
      var raw = JSON.parse(localStorage.getItem(LSK));
      if (raw) for (var k in d) if (raw[k] !== undefined) d[k] = raw[k];
    } catch (e) {}
    return d;
  }
  function save() { try { localStorage.setItem(LSK, JSON.stringify(S)); } catch (e) {} }

  function G() { return S.grade || 4; }
  function day() { return Math.min(window.PLAN.TOTAL, Math.max(1, S.day[G()] || 1)); }
  function rec() {
    var g = G();
    if (!S.cur[g]) S.cur[g] = { date: todayKey() };
    return S.cur[g];
  }
  function calendar() {
    if (!calendar._c || calendar._s !== S.start) { calendar._s = S.start; calendar._c = window.PLAN.calendar(S.start); }
    return calendar._c;
  }
  function pace() {
    var e = window.PLAN.expectedDay(calendar(), todayKey());
    return { expected: e, mine: day(), diff: day() - e };
  }

  /* ---------------------------------------------------------
     3. 오늘의 학습 꾸러미
     --------------------------------------------------------- */
  function shuffleSeeded(arr, seed) {
    var a = arr.slice(), s = (seed >>> 0) || 1;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  var _allEn = null;
  function allEnglishWords() {
    if (_allEn) return _allEn;
    _allEn = [];
    var W = window.ENBANK.words;
    for (var g in W) _allEn = _allEn.concat(W[g]);
    _allEn = _allEn.concat(window.ENBANK.phonics);
    return _allEn;
  }

  function buildSession(sub, grade, d) {
    var items = [], P = window.PLAN;

    if (sub === "ko") {
      P.ko(grade, d).forEach(function (e, ei) {
        var set = P.questionsFor(e);
        items.push({ t: "read", p: e.p, slot: e.slot, round: set.round, isNew: e.isNew });
        set.questions.forEach(function (q, qi) {
          items.push({
            t: q.type === "서술형" ? "long" : "mcq",
            p: e.p, q: q, round: set.round,
            key: e.p.id + "-r" + e.round + "-q" + qi + "-" + ei
          });
        });
      });
      return items;
    }

    if (sub === "ma") {
      window.MathBank.make(grade, P.maSeed(grade, d)).problems.forEach(function (pr) {
        items.push({ t: "num", pr: pr, key: "m-d" + d + "-g" + grade + "-" + pr.no });
      });
      return items;
    }

    var E = P.en(grade, d);
    E.letters.forEach(function (a) { items.push({ t: "alpha", a: a }); });
    E.fresh.forEach(function (w) { items.push({ t: "wcard", w: w, fresh: true }); });
    E.review.forEach(function (w) { items.push({ t: "wcard", w: w, fresh: false }); });

    var all = E.fresh.concat(E.review);
    all.forEach(function (w, i) {
      /* 보기가 서로 헷갈리지 않도록 — 정답 뜻을 품고 있거나 정답 뜻에 품히는 것은 뺀다
         (예: 정답이 '물'인데 보기에 '물고기'가 있으면 둘 다 맞아 보인다) */
      var wrong = shuffleSeeded(E.pool.filter(function (x) {
        return x.meaning !== w.meaning &&
               x.meaning.indexOf(w.meaning) < 0 && w.meaning.indexOf(x.meaning) < 0;
      }), d * 31 + i).slice(0, 3).map(function (x) { return x.meaning; });
      var ch = shuffleSeeded(wrong.concat([w.meaning]), d * 17 + i * 5 + 3);
      items.push({ t: "wmcq", w: w, choices: ch, answer: ch.indexOf(w.meaning) + 1 });
    });

    var spellN = Math.min(all.length, grade <= 2 ? 3 : 5);
    E.fresh.concat(shuffleSeeded(E.review, d)).slice(0, spellN).forEach(function (w) {
      /* 뜻이 같은 낱말이 또 있으면(예: '잡다' — catch, hold) 그것도 정답으로 인정한다.
         아래 학년에서 배운 낱말을 떠올려 쓴 것도 맞다고 본다. */
      var alts = allEnglishWords().filter(function (x) { return x.meaning === w.meaning; })
                                  .map(function (x) { return x.word.toLowerCase(); });
      if (alts.indexOf(w.word.toLowerCase()) < 0) alts.push(w.word.toLowerCase());
      items.push({ t: "spell", w: w, alts: alts });
    });
    return items;
  }

  function countItems(sub) {
    var g = G(), d = day(), P = window.PLAN;
    if (sub === "ko") {
      var pl = P.ko(g, d);
      var q = pl.reduce(function (a, e) { return a + P.questionsFor(e).questions.length; }, 0);
      return "지문 " + pl.length + "편 · 문제 " + q + "개 — " + pl.map(function (e) { return e.slot; }).join(" / ");
    }
    if (sub === "ma") {
      var m = window.MathBank.make(g, P.maSeed(g, d));
      return m.count + "문제 · " + m.unit + " 중심 · 펜으로 풀이";
    }
    var E = P.en(g, d);
    return (g <= 2 ? "알파벳 " + E.letters.length + "자 · " : "") +
      "새 낱말 " + E.fresh.length + "개 · 복습 " + E.review.length + "개";
  }

  /* ---------------------------------------------------------
     4. 화면 전환
     --------------------------------------------------------- */
  function go(id) {
    $$(".screen").forEach(function (s) { s.classList.toggle("on", s.id === id); });
    window.scrollTo(0, 0);
  }
  $$("[data-go]").forEach(function (b) {
    b.onclick = function () {
      if (b.dataset.go === "scSubject" && P.live && !confirm("지금 나가면 이 과목은 처음부터 다시 해야 해요. 나갈까요?")) return;
      P.live = false;
      if (P.hl) { try { P.hl.destroy(); } catch (e) {} P.hl = null; }
      if (b.dataset.go === "scSubject") renderSubject(); else if (b.dataset.go === "scHome") renderHome();
      go(b.dataset.go);
    };
  });

  /* ---------------------------------------------------------
     5. 홈
     --------------------------------------------------------- */
  function renderHome() {
    $("#homeBear").innerHTML = bearSVG(96, "hi");
    $("#homeMsg").textContent = S.name ? (S.name + "야, 오늘도 반가워! 몇 학년이야?") : "오늘도 반가워! 몇 학년이야?";
    var g = $("#gradeGrid"); g.innerHTML = "";
    [1, 2, 3, 4, 5, 6].forEach(function (n) {
      var d = Math.min(window.PLAN.TOTAL, Math.max(1, S.day[n] || 1));
      var b = el("button", "gbtn" + (S.grade === n ? " sel" : ""),
        '<div class="num">' + n + '</div><div class="lb">' + n + "학년</div>" +
        '<div class="lb" style="margin-top:3px;color:#C88A4B">' + d + " / 190일</div>");
      b.onclick = function () { S.grade = n; save(); renderSubject(); go("scSubject"); };
      g.appendChild(b);
    });
    $("#homeProgress").innerHTML =
      '<p class="tiny" style="text-align:center">학습 내용은 날짜가 아니라 <b>일차</b>로 이어집니다. ' +
      '며칠 쉬어도 배울 것을 건너뛰지 않아요.</p>';
    $("#who").textContent = S.name || "";
    if (typeof renderInstallCard === "function") { renderInstallCard(); updateInstallBtn(); }
  }

  /* ---------------------------------------------------------
     6. 과목 고르기
     --------------------------------------------------------- */
  function renderSubject() {
    if (!S.grade) { renderHome(); return go("scHome"); }
    var r = rec(), d = day(), pc = pace();
    var doneCnt = ORDER.filter(function (k) { return r[k] && r[k].done; }).length;

    $("#subjBear").innerHTML = bearSVG(84, doneCnt === 3 ? "cheer" : "hi");
    $("#subjMsg").textContent =
      doneCnt === 3 ? d + "일차 끝! 내일은 " + Math.min(190, d + 1) + "일차야 🎉"
      : doneCnt === 0 ? (S.grade + "학년 " + d + "일차, 국어부터 시작해 볼까?")
      : "좋아! " + SUBJ[ORDER[doneCnt]].name + " 차례야.";

    $("#dayBar").style.width = ((d - 1 + doneCnt / 3) / window.PLAN.TOTAL * 100) + "%";
    $("#dayPct").textContent = Math.round((d - 1) / window.PLAN.TOTAL * 100) + "% 마침";
    $("#dayText").innerHTML = "<b>" + d + "일차</b> / 190일  ·  오늘 " + doneCnt + " / 3 과목";

    var note = $("#paceNote");
    if (pc.expected === 0) {
      note.className = "pacenote";
      note.textContent = "학년도 시작 전이에요. 미리 해 두면 좋아요.";
    } else if (pc.diff === 0) {
      note.className = "pacenote ok";
      note.textContent = "학사일정과 딱 맞아요 (오늘은 " + pc.expected + "일차).";
    } else if (pc.diff > 0) {
      note.className = "pacenote ok";
      note.textContent = "학사일정보다 " + pc.diff + "일 앞서 있어요. 잘하고 있어요!";
    } else {
      note.className = "pacenote warn";
      note.textContent = "학사일정은 " + pc.expected + "일차예요. " + (-pc.diff) + "일 뒤처져 있어요.";
    }

    var box = $("#subjList"); box.innerHTML = "";
    ORDER.forEach(function (k, i) {
      var x = r[k], done = x && x.done;
      var sub = done ? ("점수 " + x.correct + " / " + x.total + " · " + 분초(x.sec)) : countItems(k);
      var c = el("button", "scard " + k + (done ? " done" : ""),
        '<div class="ic">' + bearSVG(44, done ? "cheer" : "soft", SUBJ_TONE[k]) + "</div>" +
        '<div class="tt"><b><span class="stepno">' + (i + 1) + "</span>" + SUBJ[k].name +
          (done ? '<span class="badge ok">완료</span>' : "") + "</b><span>" + esc(sub) + "</span></div>" +
        '<div class="go">' + (done ? "↻" : "›") + "</div>");
      c.onclick = function () { startSubject(k); };
      box.appendChild(c);
    });
    $("#who").textContent = (S.name ? S.name + " · " : "") + S.grade + "학년 " + d + "일차";
  }

  /* ---------------------------------------------------------
     7. 학습 진행
     --------------------------------------------------------- */
  var P = { live: false };
  var timerT = null;

  function startSubject(sub) {
    P = {
      live: true, sub: sub, grade: G(), day: day(),
      items: buildSession(sub, G(), day()),
      i: 0, correct: 0, total: 0, wrong: [], longs: [], penKeys: [],
      t0: Date.now(), checked: false, pad: null, cur: "", sel: 0
    };
    clearInterval(timerT);
    timerT = setInterval(function () {
      if (!P.live) return clearInterval(timerT);
      $("#qTimer").textContent = mmss((Date.now() - P.t0) / 1000);
    }, 1000);
    go("scPlay"); renderItem();
  }

  function renderItem() {
    if (P.pad) { try { P.pad.destroy(); } catch (e) {} P.pad = null; }
    if (P.hl) { try { P.hl.destroy(); } catch (e) {} P.hl = null; }   // 칠한 것 저장
    if (P.i >= P.items.length) return finishSubject();

    $("#qBar").style.width = (P.i / P.items.length * 100) + "%";
    $("#qMeta").textContent = SUBJ[P.sub].name + "  " + (P.i + 1) + " / " + P.items.length;

    P.checked = false; P.cur = ""; P.sel = 0;
    var it = P.items[P.i], body = $("#playBody"), next = $("#btnNext");
    body.innerHTML = ""; next.disabled = false;

    if (it.t === "read") {
      next.textContent = "다 읽었어요";
      body.appendChild(el("div", "qtag",
        (it.isNew ? "📖 오늘의 새 글" : "🔁 다시 읽기") + " · " + esc(it.round)));
      var area = el("div", "passage");
      body.appendChild(area);
      var pobj = {
        no: 1, genre: it.p.genre, title: it.p.title, body: it.p.body,
        hard_words: (it.p.words || []).map(function (w) { return { word: w.w, meaning: w.m }; })
      };
      try { P.hl = window.HL.make(area, "hl-" + it.p.id, pobj); }
      catch (e) {
        area.innerHTML = "<h3>" + esc(it.p.title) + '</h3><div class="gen">' + esc(it.p.genre) + "</div>" +
          it.p.body.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") +
          (pobj.hard_words.length ? '<div class="hardw">' + pobj.hard_words.map(function (w) {
            return "<b>" + esc(w.word) + "</b> — " + esc(w.meaning); }).join("<br>") + "</div>" : "");
      }
      return;
    }

    if (it.t === "alpha") {
      next.textContent = "다음";
      body.appendChild(el("div", "qtag", "🔤 오늘의 알파벳"));
      body.appendChild(el("div", "wordcard",
        '<div class="alpha">' + esc(it.a.letter) + "</div>" +
        '<div class="ko" style="margin-top:14px">' + esc(it.a.word) + " — " + esc(it.a.meaning) + "</div>"));
      body.appendChild(speakBtn(it.a.word));
      return;
    }

    if (it.t === "wcard") {
      next.textContent = "외웠어요";
      var w = it.w;
      body.appendChild(el("div", "qtag", it.fresh ? "🌱 새 낱말" : "🔁 복습 낱말"));
      body.appendChild(el("div", "wordcard",
        '<div class="en">' + esc(w.word) + "</div>" +
        (w.pos ? '<div class="pos">' + esc(w.pos) + "</div>" : "") +
        '<div class="ko">' + esc(w.meaning) + "</div>"));
      body.appendChild(speakBtn(w.word));
      return;
    }

    if (it.t === "mcq" || it.t === "wmcq") {
      next.textContent = "확인"; next.disabled = true;
      var q = it.t === "mcq" ? it.q : null;
      var qText = q ? q.q : ("‘" + it.w.word + "’ 의 뜻은 무엇일까요?");
      var choices = q ? q.choices : it.choices;
      body.appendChild(el("div", "qtag", "✏️ " + esc(q ? q.type : "낱말 뜻")));
      var card = el("div", "qcard");
      card.appendChild(el("div", "qtext", esc(qText)));
      if (it.t === "mcq") {
        var pv = el("button", "btn ghost sm", "📖 지문 다시 보기");
        pv.onclick = function () { showPassage(it.p); };
        card.appendChild(pv);
      } else card.appendChild(speakBtn(it.w.word));
      var wrap = el("div", "choices");
      choices.forEach(function (t, idx) {
        var b = el("button", "ch", "<b>" + (idx + 1) + "</b><span>" + esc(t) + "</span>");
        b.onclick = function () {
          if (P.checked) return;
          wrap.querySelectorAll(".ch").forEach(function (x) { x.classList.remove("sel"); });
          b.classList.add("sel"); P.sel = idx + 1; next.disabled = false;
        };
        wrap.appendChild(b);
      });
      card.appendChild(wrap);
      body.appendChild(card);
      return;
    }

    if (it.t === "spell") {
      next.textContent = "확인";
      body.appendChild(el("div", "qtag", "✍️ 철자 쓰기"));
      var c2 = el("div", "qcard");
      c2.appendChild(el("div", "qtext", "‘" + esc(it.w.meaning) + "’ 를 영어로 쓰면?"));
      c2.appendChild(el("div", "tiny", "힌트 — 첫 글자는 <b>" + esc(it.w.word[0]) + "</b>, 모두 " + it.w.word.length + "글자" +
        ((it.alts && it.alts.length > 1) ? " · 뜻이 같은 다른 낱말도 정답이에요" : "")));
      var inp = el("input");
      inp.className = "ansbox"; inp.style.width = "100%";
      inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocomplete", "off");
      inp.setAttribute("spellcheck", "false"); inp.placeholder = "여기에 쓰세요";
      inp.oninput = function () { P.cur = inp.value; };
      var row = el("div", "ansrow"); row.appendChild(inp); c2.appendChild(row);
      body.appendChild(c2);
      body.appendChild(speakBtn(it.w.word, "🔊 듣고 쓰기"));
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 120);
      return;
    }

    if (it.t === "long") {
      next.textContent = "다 썼어요";
      body.appendChild(el("div", "qtag", "🖊️ 생각을 쓰는 문제"));
      var c3 = el("div", "qcard");
      c3.appendChild(el("div", "qtext", esc(it.q.q)));
      var pv2 = el("button", "btn ghost sm", "📖 지문 다시 보기");
      pv2.onclick = function () { showPassage(it.p); };
      c3.appendChild(pv2);
      var ta = el("textarea", "long");
      ta.placeholder = "여기에 자기 생각을 써 보세요.";
      ta.oninput = function () { P.cur = ta.value; };
      c3.appendChild(ta);
      body.appendChild(c3);
      body.appendChild(el("div", "penlabel", "✏️ 손으로 쓰고 싶으면 여기에 써도 좋아요"));
      var ph = el("div", "penbox"); body.appendChild(ph);
      var k = "pen-g" + P.grade + "-d" + P.day + "-" + it.key;
      P.pad = new window.Pen.Pad(ph, k, { height: 210 });
      if (P.penKeys.indexOf(k) < 0) P.penKeys.push(k);
      return;
    }

    if (it.t === "num") {
      next.textContent = "확인";
      var pr = it.pr;
      body.appendChild(el("div", "qtag", "🔢 " + esc(pr.unit)));
      var c4 = el("div", "qcard");
      c4.appendChild(el("div", "qtext", esc(pr.q)));
      if (pr.choices) {
        next.disabled = true;
        var mw = el("div", "choices");
        pr.choices.forEach(function (t, idx) {
          var b = el("button", "ch", "<b>" + (idx + 1) + "</b><span>" + esc(t) + "</span>");
          b.onclick = function () {
            if (P.checked) return;
            mw.querySelectorAll(".ch").forEach(function (x) { x.classList.remove("sel"); });
            b.classList.add("sel"); P.sel = idx + 1; next.disabled = false;
          };
          mw.appendChild(b);
        });
        c4.appendChild(mw);
      } else {
        var ab = el("div", "ansbox"); ab.id = "ansBox"; ab.textContent = "";
        var row2 = el("div", "ansrow"); row2.appendChild(ab); c4.appendChild(row2);
        var np = el("div"); c4.appendChild(np);
        window.Pen.NumPad(np, pr.answer, function (v) {
          if (P.checked) return;
          if (v === "←") P.cur = P.cur.slice(0, -1); else P.cur += v;
          ab.textContent = P.cur;
        });
      }
      body.appendChild(c4);
      body.appendChild(el("div", "penlabel", "✏️ 풀이는 여기에 — 애플펜슬 · S펜 모두 됩니다"));
      var ph2 = el("div", "penbox"); body.appendChild(ph2);
      var k2 = "pen-g" + P.grade + "-d" + P.day + "-" + it.key;
      P.pad = new window.Pen.Pad(ph2, k2, { height: 250 });
      if (P.penKeys.indexOf(k2) < 0) P.penKeys.push(k2);
    }
  }

  function speakBtn(word, label) {
    var b = el("button", "btn ghost sm", label || "🔊 소리 듣기");
    b.onclick = function () { speak(word); };
    return b;
  }
  var voice = null;
  function speak(text) {
    if (!("speechSynthesis" in window)) return toast("이 기기는 소리 읽기를 지원하지 않아요");
    try {
      var u = new SpeechSynthesisUtterance(text);
      if (!voice) {
        var vs = speechSynthesis.getVoices() || [];
        voice = vs.filter(function (v) { return /en(-|_)US/i.test(v.lang); })[0] ||
                vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
      }
      if (voice) u.voice = voice;
      u.lang = "en-US"; u.rate = 0.85;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { toast("소리를 낼 수 없어요"); }
  }
  if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = function () { voice = null; };

  function showPassage(p) {
    var ov = el("div");
    ov.style.cssText = "position:fixed;inset:0;background:rgba(61,43,31,.55);z-index:60;overflow:auto;padding:24px 14px";
    var inner = el("div");
    inner.style.cssText = "max-width:700px;margin:0 auto;background:var(--cream);border-radius:20px;padding:14px";
    var d = el("div", "passage");
    inner.appendChild(d);
    var hl = null;
    /* 읽을 때 칠한 형광펜이 그대로 보이도록 같은 열쇠로 다시 그린다 */
    try {
      hl = window.HL.make(d, "hl-" + p.id, {
        no: 1, genre: p.genre, title: p.title, body: p.body,
        hard_words: (p.words || []).map(function (w) { return { word: w.w, meaning: w.m }; })
      });
    } catch (e) {
      d.innerHTML = "<h3>" + esc(p.title) + "</h3>" +
        p.body.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
    }
    var close = el("button", "btn sm", "닫기");
    close.onclick = function () { if (hl) { try { hl.destroy(); } catch (e) {} } ov.remove(); };
    inner.appendChild(close); ov.appendChild(inner);
    ov.onclick = function (e) {
      if (e.target === ov) { if (hl) { try { hl.destroy(); } catch (e2) {} } ov.remove(); }
    };
    document.body.appendChild(ov);
  }

  /* ---------- 채점 ---------- */
  function normAns(v) {
    return String(v).trim().toLowerCase().replace(/\s+/g, "")
      .replace(/,/g, "").replace(/^0+(?=\d)/, "").replace(/[·∙]/g, "");
  }
  function sameAns(a, b) {
    if (window.Pen && window.Pen.norm && window.Pen.norm(a) === window.Pen.norm(b)) return true;
    return normAns(a) === normAns(b);
  }

  $("#btnNext").onclick = function () {
    var it = P.items[P.i], next = $("#btnNext");

    if (it.t === "read" || it.t === "wcard" || it.t === "alpha") { P.i++; return renderItem(); }

    if (it.t === "long") {
      var text = (P.cur || "").trim();
      var hasPen = P.pad && !P.pad.isEmpty();
      if (!P.checked) {
        if (!text && !hasPen) { toast("한 줄이라도 써 볼까요?"); return; }
        P.longs.push({ q: it.q.q, my: text, sample: it.q.sample || "", rubric: it.q.rubric || [] });
        P.checked = true; next.textContent = (P.i === P.items.length - 1) ? "끝내기" : "다음 문제";
        var fb = el("div", "fb ok");
        fb.innerHTML = "<b>잘 썼어요! 예시와 견주어 볼까요?</b>" + esc(it.q.sample || "") +
          (it.q.rubric && it.q.rubric.length
            ? '<div class="tiny" style="margin-top:8px">확인할 점 — ' + it.q.rubric.map(esc).join(" / ") + "</div>" : "");
        $("#playBody").appendChild(fb);
        fb.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      P.i++; return renderItem();
    }

    if (!P.checked) {
      var ok, my, right;
      if (it.t === "mcq" || it.t === "wmcq") {
        if (!P.sel) { toast("답을 하나 골라 보세요"); return; }
        var ans = it.t === "mcq" ? it.q.answer : it.answer;
        var chs = it.t === "mcq" ? it.q.choices : it.choices;
        ok = P.sel === ans; my = chs[P.sel - 1]; right = chs[ans - 1];
        $$("#playBody .ch").forEach(function (n, i) {
          if (i + 1 === ans) n.classList.add("right");
          else if (i + 1 === P.sel) n.classList.add("wrong");
          n.classList.remove("sel");
        });
      } else if (it.t === "spell") {
        my = (P.cur || "").trim(); right = it.w.word;
        var alts = it.alts || [right.toLowerCase()];
        ok = alts.indexOf(my.toLowerCase()) >= 0;
        if (ok && my.toLowerCase() !== right.toLowerCase()) right = my;   // 다른 정답을 썼으면 그대로 인정
        var box = $("#playBody .ansbox"); if (box) box.classList.add(ok ? "right" : "wrong");
      } else if (it.pr.choices) {
        if (!P.sel) { toast("답을 하나 골라 보세요"); return; }
        ok = P.sel === it.pr.answerNo; my = it.pr.choices[P.sel - 1]; right = it.pr.answer;
        $$("#playBody .ch").forEach(function (n, i) {
          if (i + 1 === it.pr.answerNo) n.classList.add("right");
          else if (i + 1 === P.sel) n.classList.add("wrong");
          n.classList.remove("sel");
        });
      } else {
        my = (P.cur || "").trim(); right = it.pr.answer;
        ok = my !== "" && sameAns(my, right);
        var ab = $("#ansBox"); if (ab) ab.classList.add(ok ? "right" : "wrong");
      }

      P.total++;
      if (ok) P.correct++;
      else P.wrong.push({
        no: P.total,
        q: it.t === "mcq" ? it.q.q
          : it.t === "wmcq" ? ("‘" + it.w.word + "’ 의 뜻")
          : it.t === "spell" ? ("‘" + it.w.meaning + "’ 를 영어로") : it.pr.q,
        my: my || "(안 씀)", ans: right,
        explain: it.t === "mcq" ? it.q.explain
          : it.t === "num" ? it.pr.explain
          : ("낱말 " + (it.w ? it.w.word : "") + " — " + (it.w ? it.w.meaning : ""))
      });

      var expl = it.t === "mcq" ? (it.q.explain || "") : it.t === "num" ? (it.pr.explain || "") : "";
      var f = el("div", "fb " + (ok ? "ok" : "no"));
      f.innerHTML = (ok ? "<b>🐻 맞았어요!</b>" : "<b>아쉬워요. 정답은 " + esc(right) + "</b>") + esc(expl);
      $("#playBody").appendChild(f);
      f.scrollIntoView({ behavior: "smooth", block: "center" });
      P.checked = true;
      next.textContent = (P.i === P.items.length - 1) ? "끝내기" : "다음 문제";
      return;
    }
    P.i++; renderItem();
  };

  /* ---------------------------------------------------------
     8. 과목 마치기 → 결과 → 일차 넘기기
     --------------------------------------------------------- */
  function finishSubject() {
    P.live = false; clearInterval(timerT);
    if (P.hl) { try { P.hl.destroy(); } catch (e) {} P.hl = null; }
    var r = rec();
    r.date = todayKey();
    r[P.sub] = {
      done: true, total: P.total, correct: P.correct,
      sec: Math.round((Date.now() - P.t0) / 1000),
      wrong: P.wrong, longs: P.longs, penKeys: P.penKeys, at: new Date().toISOString()
    };
    logSubject(P.sub, r[P.sub]);
    save();
    renderResult(P.sub);
    go("scResult");

    if (ORDER.every(function (k) { return r[k] && r[k].done; })) {
      if (S.auto && S.mail && S.svc && S.tpl && S.key) setTimeout(function () { sendMail(); }, 700);
    }
  }

  function advanceDay() {
    var g = G(), r = rec();
    if (!ORDER.every(function (k) { return r[k] && r[k].done; })) { toast("세 과목을 모두 끝내야 넘어가요"); return; }
    var tot = 0, cor = 0, sec = 0;
    ORDER.forEach(function (k) { tot += r[k].total; cor += r[k].correct; sec += r[k].sec; });
    S.hist.push({ g: g, day: day(), date: r.date, total: tot, correct: cor, sec: sec });
    while (S.hist.length > 80) S.hist.shift();
    S.day[g] = Math.min(window.PLAN.TOTAL, day() + 1);
    S.cur[g] = { date: todayKey() };
    save();
    toast(S.day[g] + "일차로 넘어갔어요");
    renderSubject(); go("scSubject");
  }

  function renderResult(justDone) {
    var r = rec(), d = day();
    var done = ORDER.filter(function (k) { return r[k] && r[k].done; });
    var all = done.length === 3;
    var x = r[justDone];
    var pct = x && x.total ? Math.round(x.correct / x.total * 100) : 100;

    $("#resBear").innerHTML = bearSVG(96, pct >= 80 ? "cheer" : "soft");
    $("#resMsg").textContent = all ? (d + "일차 국어·수학·영어 모두 끝냈어요! 🎉")
      : pct >= 90 ? "와, 거의 다 맞았어요!"
      : pct >= 70 ? "잘했어요! 틀린 것만 한 번 더 볼까요?"
      : "괜찮아요. 틀린 문제를 같이 보면 금방 늘어요.";

    var g = $("#resScores"); g.innerHTML = "";
    ORDER.forEach(function (k) {
      var y = r[k];
      g.appendChild(el("div", "sc " + k,
        '<div class="t">' + SUBJ[k].name + '</div><div class="v">' +
        (y && y.done ? y.correct + " / " + y.total : "—") + "</div>" +
        '<div class="t">' + (y && y.done ? 분초(y.sec) : "아직") + "</div>"));
    });

    var w = $("#resWrong"); w.innerHTML = "";
    var anyWrong = false;
    ORDER.forEach(function (k) {
      var y = r[k];
      if (!y || !y.done || !y.wrong.length) return;
      anyWrong = true;
      var box = el("div", "wronglist");
      box.appendChild(el("h4", null, "🔁 " + SUBJ[k].name + " 다시 볼 문제 " + y.wrong.length + "개"));
      y.wrong.forEach(function (q) {
        box.appendChild(el("div", "wi",
          '<div class="q">' + esc(q.q) + "</div>" +
          '<div>내 답 <span class="a">' + esc(q.my) + '</span> · 정답 <span class="c">' + esc(q.ans) + "</span></div>" +
          (q.explain ? '<div class="tiny">' + esc(q.explain) + "</div>" : "")));
      });
      w.appendChild(box);
    });
    if (!anyWrong && done.length) w.innerHTML = '<div class="wronglist"><h4>🎯 틀린 문제가 없어요!</h4></div>';

    var pw = $("#resPenWrap"), img = buildPenImage();
    pw.innerHTML = "";
    if (img) {
      var box2 = el("div", "wronglist");
      box2.appendChild(el("h4", null, "✏️ 펜으로 쓴 풀이"));
      var im = new Image(); im.src = img;
      im.style.cssText = "width:100%;border-radius:12px;border:2px solid var(--line)";
      box2.appendChild(im); pw.appendChild(box2);
    }
    $("#btnSaveImg").style.display = img ? "block" : "none";
    $("#btnNextDay").style.display = all ? "block" : "none";
    $("#btnNextDay").textContent = "➡️ " + Math.min(190, d + 1) + "일차로 넘어가기";
    $("#mailStat").style.display = "none";
  }

  $("#btnNextDay").onclick = advanceDay;
  $("#btnResultPeek").onclick = function () {
    var r = rec();
    var d = ORDER.filter(function (k) { return r[k] && r[k].done; });
    if (!d.length) return toast("아직 끝낸 과목이 없어요");
    renderResult(d[d.length - 1]); go("scResult");
  };

  /* ---------------------------------------------------------
     9. 펜 풀이 그림
     --------------------------------------------------------- */
  function penInk() { try { return JSON.parse(localStorage.getItem("penInk")) || {}; } catch (e) { return {}; } }

  function buildPenImage() {
    var ink = penInk(), r = rec(), keys = [];
    ORDER.forEach(function (k) {
      var x = r[k];
      if (x && x.penKeys) x.penKeys.forEach(function (kk) {
        if (ink[kk] && ink[kk].length) keys.push({ k: kk, s: ink[kk], sub: k });
      });
    });
    if (!keys.length) return null;
    keys = keys.slice(0, 12);
    var COLW = 460, ROWH = 250, cols = 2;
    var rows = Math.ceil(keys.length / cols);
    var cv = document.createElement("canvas");
    cv.width = COLW * cols; cv.height = ROWH * rows + 34;
    var c = cv.getContext("2d");
    c.fillStyle = "#ffffff"; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = "#3D2B1F"; c.font = "bold 17px sans-serif";
    c.fillText((S.name || "학생") + " · " + G() + "학년 " + day() + "일차 · " + todayKey(), 12, 23);

    keys.forEach(function (item, i) {
      var cx = (i % cols) * COLW, cy = Math.floor(i / cols) * ROWH + 34;
      c.strokeStyle = "#E5D9C8"; c.lineWidth = 1;
      c.strokeRect(cx + 5, cy + 5, COLW - 10, ROWH - 10);
      c.fillStyle = "#8A7461"; c.font = "bold 12px sans-serif";
      c.fillText(SUBJ[item.sub].name + " " + item.k.split("-").pop(), cx + 12, cy + 22);
      c.save();
      c.beginPath(); c.rect(cx + 6, cy + 27, COLW - 12, ROWH - 33); c.clip();
      c.lineCap = "round"; c.lineJoin = "round";
      var X = function (v) { return cx + 8 + v * (COLW - 16); };
      var Y = function (v) { return cy + 30 + v * (ROWH - 40); };
      item.s.forEach(function (st) {
        var p = st.p; if (!p || !p.length) return;
        var erase = !!st.e;
        c.strokeStyle = erase ? "#ffffff" : "#1B3A5C";
        if (p.length === 1) {
          c.beginPath(); c.arc(X(p[0][0]), Y(p[0][1]), erase ? 11 : 1.4, 0, 6.2832);
          c.fillStyle = c.strokeStyle; c.fill(); return;
        }
        for (var j = 1; j < p.length; j++) {
          c.beginPath();
          c.moveTo(X(p[j - 1][0]), Y(p[j - 1][1]));
          c.lineTo(X(p[j][0]), Y(p[j][1]));
          c.lineWidth = erase ? 20 : (0.9 + (p[j][2] || 0.5) * 2.8);
          c.stroke();
        }
      });
      c.restore();
    });
    try { return cv.toDataURL("image/png"); } catch (e) { return null; }
  }

  $("#btnSaveImg").onclick = function () {
    var img = buildPenImage();
    if (!img) return toast("저장할 필기가 없어요");
    var a = document.createElement("a");
    a.href = img; a.download = "펜풀이_" + G() + "학년_" + day() + "일차.png"; a.click();
    toast("그림으로 저장했어요");
  };

  /* ---------------------------------------------------------
     10. 메일
     --------------------------------------------------------- */
  function mailHTML() {
    var r = rec(), d = day(), pc = pace();
    var rows = ORDER.map(function (k) {
      var x = r[k];
      if (!x || !x.done) return "<tr><td style='padding:8px 10px;border:1px solid #E5D9C8'>" + SUBJ[k].name +
        "</td><td colspan='3' style='padding:8px 10px;border:1px solid #E5D9C8;color:#999'>아직 하지 않음</td></tr>";
      return "<tr><td style='padding:8px 10px;border:1px solid #E5D9C8'><b>" + SUBJ[k].name + "</b></td>" +
        "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + x.correct + " / " + x.total + "</td>" +
        "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + (x.total ? Math.round(x.correct / x.total * 100) : 100) + "%</td>" +
        "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + 분초(x.sec) + "</td></tr>";
    }).join("");

    var wrongHTML = "";
    ORDER.forEach(function (k) {
      var x = r[k];
      if (!x || !x.done || !x.wrong.length) return;
      wrongHTML += "<h3 style='margin:18px 0 6px;font-size:15px'>" + SUBJ[k].name + " — 틀린 문제 " + x.wrong.length + "개</h3><ol style='margin:0;padding-left:20px'>";
      x.wrong.forEach(function (q) {
        wrongHTML += "<li style='margin-bottom:8px'>" + esc(q.q) +
          "<br><span style='color:#C0392B'>학생 답: " + esc(q.my) + "</span>" +
          " · <span style='color:#1E8449'>정답: " + esc(q.ans) + "</span>" +
          (q.explain ? "<br><span style='color:#777;font-size:13px'>" + esc(q.explain) + "</span>" : "") + "</li>";
      });
      wrongHTML += "</ol>";
    });
    if (!wrongHTML) wrongHTML = "<p style='color:#1E8449'><b>틀린 문제가 없습니다.</b></p>";

    var longHTML = "";
    ORDER.forEach(function (k) {
      var x = r[k];
      if (!x || !x.done || !x.longs) return;
      x.longs.forEach(function (L) {
        if (!L.my) return;
        longHTML += "<div style='margin:10px 0;padding:10px 12px;background:#FAF6F0;border-left:4px solid #C88A4B'>" +
          "<div style='font-weight:bold;font-size:14px'>" + esc(L.q) + "</div>" +
          "<div style='margin-top:5px;white-space:pre-wrap'>" + esc(L.my) + "</div></div>";
      });
    });

    var totC = 0, totN = 0, totS = 0;
    ORDER.forEach(function (k) { var x = r[k]; if (x && x.done) { totC += x.correct; totN += x.total; totS += x.sec; } });

    var paceMsg = pc.expected === 0 ? "학년도 시작 전"
      : pc.diff === 0 ? "학사일정과 일치"
      : pc.diff > 0 ? ("학사일정보다 " + pc.diff + "일 앞섬")
      : ("학사일정보다 " + (-pc.diff) + "일 뒤처짐 (오늘 학사일정 " + pc.expected + "일차)");

    return "<div style='font-family:Apple SD Gothic Neo,Malgun Gothic,sans-serif;color:#3D2B1F;line-height:1.7'>" +
      "<h2 style='margin:0 0 4px'>🐻 곰돌이 학습장 — " + d + "일차 학습 결과</h2>" +
      "<p style='margin:0 0 14px;color:#8A7461'>" + esc(S.name || "학생") + " · " + G() + "학년 · " +
      todayKey() + " · 진도 " + d + "/190일 (" + paceMsg + ")</p>" +
      "<table style='border-collapse:collapse;font-size:14px'><tr style='background:#F6EFE5'>" +
      "<th style='padding:8px 10px;border:1px solid #E5D9C8'>과목</th>" +
      "<th style='padding:8px 10px;border:1px solid #E5D9C8'>점수</th>" +
      "<th style='padding:8px 10px;border:1px solid #E5D9C8'>정답률</th>" +
      "<th style='padding:8px 10px;border:1px solid #E5D9C8'>소요 시간</th></tr>" + rows +
      "<tr style='background:#FFF8EF;font-weight:bold'><td style='padding:8px 10px;border:1px solid #E5D9C8'>합계</td>" +
      "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + totC + " / " + totN + "</td>" +
      "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + (totN ? Math.round(totC / totN * 100) : 0) + "%</td>" +
      "<td style='padding:8px 10px;border:1px solid #E5D9C8'>" + 분초(totS) + "</td></tr></table>" +
      "<h3 style='margin:20px 0 6px;font-size:15px'>다시 볼 문제</h3>" + wrongHTML +
      (longHTML ? "<h3 style='margin:20px 0 6px;font-size:15px'>서술형으로 쓴 글</h3>" + longHTML : "") +
      "<p style='margin-top:20px;color:#8A7461;font-size:13px'>펜으로 쓴 풀이는 첨부 파일을 확인해 주세요.</p></div>";
  }

  /* EmailJS 가 돌려주는 영어 오류를 무엇을 고쳐야 하는지로 바꿔 준다 */
  function explainMailError(raw) {
    var t = String(raw || "").toLowerCase();
    if (t.indexOf("recipient") >= 0 && t.indexOf("empty") >= 0) {
      return "받는 사람이 비었습니다 — EmailJS 템플릿의 'To Email' 칸을 확인하세요. " +
             "가장 확실한 방법은 그 칸에 변수 대신 받을 주소(" + (S.mail || "예: teacher@school.kr") +
             ")를 그대로 적는 것입니다. 변수를 쓰려면 {{to_email}} 이라고 정확히 적어야 합니다.";
    }
    if (t.indexOf("service id") >= 0 || t.indexOf("service_id") >= 0) {
      return "Service ID 가 맞지 않습니다 — EmailJS 의 Email Services 에서 service_ 로 시작하는 값을 다시 복사해 넣으세요.";
    }
    if (t.indexOf("template id") >= 0 || t.indexOf("template_id") >= 0) {
      return "Template ID 가 맞지 않습니다 — Email Templates 에서 template_ 로 시작하는 값을 다시 복사해 넣으세요.";
    }
    if (t.indexOf("public key") >= 0 || t.indexOf("user id") >= 0 || t.indexOf("account not found") >= 0) {
      return "Public Key 가 맞지 않습니다 — EmailJS 의 Account → General 에서 Public Key 를 다시 복사해 넣으세요.";
    }
    if (t.indexOf("gmail") >= 0 || t.indexOf("invalid grant") >= 0) {
      return "Gmail 연결이 풀렸습니다 — EmailJS 의 Email Services 에서 서비스를 지우고 Gmail 을 다시 연결하세요.";
    }
    if (t.indexOf("limit") >= 0 || t.indexOf("quota") >= 0) {
      return "이번 달 무료 발송 한도(200통)를 다 썼습니다. 다음 달에 다시 보낼 수 있습니다.";
    }
    if (t.indexOf("attachment") >= 0 || t.indexOf("size") >= 0) {
      return "첨부한 그림이 너무 큽니다 — 결과 화면의 '펜 풀이 그림으로 저장'으로 직접 받으세요.";
    }
    if (t.indexOf("failed to fetch") >= 0 || t.indexOf("network") >= 0) {
      return "인터넷 연결을 확인해 주세요. 광고 차단 확장 프로그램이 막고 있을 수도 있습니다.";
    }
    return "보내지 못했어요 — " + (raw || "알 수 없는 오류") + " (설정의 ID·키를 다시 확인해 주세요)";
  }

  function stat(node, kind, msg) {
    var n = $(node); n.style.display = "block";
    n.className = "mailstat " + kind; n.textContent = msg;
  }

  function shrink(dataURL, maxKB, cb) {
    if (!dataURL) return cb(null);
    var im = new Image();
    im.onload = function () {
      var scale = 1, out = dataURL;
      for (var i = 0; i < 4; i++) {
        if (out.length * 0.75 / 1024 <= maxKB) break;
        scale *= 0.72;
        var c = document.createElement("canvas");
        c.width = Math.max(200, Math.round(im.width * scale));
        c.height = Math.max(150, Math.round(im.height * scale));
        var g = c.getContext("2d");
        g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(im, 0, 0, c.width, c.height);
        try { out = c.toDataURL("image/jpeg", 0.6); } catch (e) { return cb(null); }
      }
      cb(out.length * 0.75 / 1024 <= maxKB ? out : null);
    };
    im.onerror = function () { cb(null); };
    im.src = dataURL;
  }

  function sendMail(node) {
    node = node || "#mailStat";
    if (!S.mail) return stat(node, "no", "받을 이메일 주소가 없어요. 설정에서 넣어 주세요.");
    if (!S.svc || !S.tpl || !S.key) return stat(node, "no", "EmailJS 설정(Service·Template·Public Key)이 아직 없어요.");
    if (!window.emailjs) return stat(node, "no", "인터넷에 연결되어 있어야 메일을 보낼 수 있어요.");

    stat(node, "wait", "보내는 중…");
    shrink(buildPenImage(), 40, function (small) {
      var params = {
        /* 템플릿 To Email 칸에 무엇을 적어 두었든 채워지도록 흔한 이름을 모두 보낸다.
           EmailJS 는 쓰지 않는 값은 그냥 무시한다. */
        to_email: S.mail,
        email: S.mail,
        user_email: S.mail,
        recipient: S.mail,
        to: S.mail,
        reply_to: S.mail,
        subject: "[곰돌이 학습장] " + (S.name || "학생") + " " + G() + "학년 " + day() + "일차 결과",
        student: S.name || "학생", grade: G() + "학년",
        date: todayKey(), day: String(day()),
        body_html: mailHTML()
      };
      if (small) params.solution_image = small;

      function fail(e) {
        var raw = (e && (e.text || e.message)) || "";
        stat(node, "no", explainMailError(raw));
      }
      window.emailjs.send(S.svc, S.tpl, params, { publicKey: S.key })
        .then(function () {
          stat(node, "ok", "보냈어요! " + S.mail + " 로 결과가 갔습니다." + (small ? " (펜 풀이 그림 포함)" : ""));
          toast("메일을 보냈어요");
        })
        .catch(function (e) {
          if (!small) return fail(e);
          delete params.solution_image;
          window.emailjs.send(S.svc, S.tpl, params, { publicKey: S.key })
            .then(function () {
              stat(node, "ok", "보냈어요! 다만 그림이 커서 글만 갔습니다. 그림은 '펜 풀이 그림으로 저장'으로 받으세요.");
            })
            .catch(fail);
        });
    });
  }
  $("#btnMail").onclick = function () { sendMail(); };

  /* ---------------------------------------------------------
     11. 설정
     --------------------------------------------------------- */
  $("#btnSet").onclick = function () {
    $("#fName").value = S.name; $("#fMail").value = S.mail; $("#fAuto").checked = !!S.auto;
    $("#fStart").value = S.start;
    $("#fDay").value = day();
    $("#fGas").value = S.gas; $("#fGasKey").value = S.gasKey;
    $("#fSvc").value = S.svc; $("#fTpl").value = S.tpl; $("#fKey").value = S.key;
    $("#gasStat").style.display = "none";
    $("#setStat").style.display = "none";
    var cal = calendar();
    $("#calInfo").textContent = "수업일 " + cal.length + "일 · " + cal[0] + " ~ " + cal[cal.length - 1] +
      " · 오늘은 학사일정상 " + (pace().expected || 0) + "일차";
    diag();
    go("scSet");
  };
  function readSet() {
    S.name = $("#fName").value.trim(); S.mail = $("#fMail").value.trim();
    S.auto = $("#fAuto").checked;
    var st = $("#fStart").value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(st)) S.start = st;
    S.gas = $("#fGas").value.trim(); S.gasKey = $("#fGasKey").value.trim();
    S.svc = $("#fSvc").value.trim(); S.tpl = $("#fTpl").value.trim(); S.key = $("#fKey").value.trim();
    var dv = parseInt($("#fDay").value, 10);
    if (dv >= 1 && dv <= window.PLAN.TOTAL && dv !== day()) { S.day[G()] = dv; S.cur[G()] = { date: todayKey() }; }
  }
  $("#btnSave").onclick = function () { readSet(); save(); toast("저장했어요"); renderHome(); };
  $("#btnTest").onclick = function () { readSet(); if (!S.grade) S.grade = 4; save(); sendMail("#setStat"); };

  $("#btnGasTest").onclick = function () {
    readSet(); save();
    if (!S.gas) return stat("#gasStat", "no", "웹앱 주소를 먼저 넣어 주세요.");
    if (S.gas.indexOf("/exec") < 0) {
      return stat("#gasStat", "no", "주소가 /exec 로 끝나야 합니다. /dev 주소는 다른 사람이 쓸 수 없어요.");
    }
    stat("#gasStat", "wait", "연결해 보는 중…");
    var probe = {
      student: S.name || "연결시험", grade: G(), day: day(), date: todayKey(),
      s: "ko", c: 0, t: 0, sec: 0, wrong: "연결 시험", ua: "test"
    };
    fetch(S.gas, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ key: S.gasKey, rows: [probe] })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok) {
          stat("#gasStat", "ok", "연결됐어요! 스프레드시트 '기록' 시트에 한 줄이 들어갔습니다. " +
                                 "(확인용 줄이니 지우셔도 됩니다)");
          flushQueue();
        } else {
          stat("#gasStat", "no", "서버가 거절했어요 — " + ((j && j.error) || "암호가 다를 수 있습니다"));
        }
      })
      .catch(function (e) {
        stat("#gasStat", "no", "연결하지 못했어요 — " + ((e && e.message) || "") +
          " · 배포할 때 '액세스 권한이 있는 사용자'를 모든 사용자로 했는지 확인하세요.");
      });
  };
  $("#btnReset").onclick = function () {
    if (!confirm("이 일차에 푼 기록을 지우고 처음부터 다시 할까요? (필기는 남습니다)")) return;
    S.cur[G()] = { date: todayKey() }; save(); toast("이 일차 기록을 지웠어요");
    renderSubject(); go("scSubject");
  };


  /* ---------------------------------------------------------
     12-2. 공부 기록 모으기 (Google Apps Script)
     --------------------------------------------------------- */
  function logSubject(sub, x) {
    var row = {
      student: S.name || "이름없음", grade: G(), day: day(), date: todayKey(),
      s: sub, c: x.correct, t: x.total, sec: x.sec,
      wrong: (x.wrong || []).slice(0, 8).map(function (q) { return q.q; }).join(" / ").slice(0, 800),
      ua: (navigator.userAgent || "").slice(0, 100)
    };
    S.log.push(row);
    while (S.log.length > 600) S.log.shift();
    S.queue.push(row);
    while (S.queue.length > 200) S.queue.shift();
    save();
    flushQueue();
  }

  var flushing = false;
  function flushQueue(cb) {
    if (flushing || !S.queue.length || !S.gas) { if (cb) cb(false); return; }
    flushing = true;
    var batch = S.queue.slice(0, 50);
    /* text/plain 으로 보내면 브라우저가 미리 묻는 절차(preflight)를 건너뛴다.
       Apps Script 웹앱은 이 방식만 제대로 받아 준다. */
    fetch(S.gas, {
      method: "POST", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ key: S.gasKey, rows: batch })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        flushing = false;
        if (j && j.ok) {
          S.queue = S.queue.slice(batch.length);
          save();
          updateSyncBadge();
          if (S.queue.length) return flushQueue(cb);
          if (cb) cb(true);
        } else { updateSyncBadge(); if (cb) cb(false, (j && j.error) || "서버가 거절했습니다"); }
      })
      .catch(function (e) {
        flushing = false; updateSyncBadge();
        if (cb) cb(false, (e && e.message) || "연결 실패");
      });
  }

  function updateSyncBadge() {
    var b = $("#syncBadge");
    if (!b) return;
    if (!S.gas) { b.className = ""; b.textContent = ""; return; }
    if (S.queue.length) { b.className = "synced wait"; b.textContent = "보낼 기록 " + S.queue.length + "개"; }
    else { b.className = "synced"; b.textContent = "서버와 맞춤"; }
  }

  /* ---------------------------------------------------------
     12-3. 공부 기록 화면
     --------------------------------------------------------- */
  var statRange = 30, remoteRows = null;
  var C_KO = "#FF8A4C", C_MA = "#3FAF6E", C_EN = "#4C93F0";

  function statRows() {
    var rows = (remoteRows && remoteRows.length) ? remoteRows : S.log;
    var who = S.name || "";
    if (remoteRows && who) rows = rows.filter(function (r) { return r.student === who; });
    if (!statRange) return rows.slice();
    var from = new Date(Date.now() - (statRange - 1) * 86400000);
    var key = todayKey(from);
    return rows.filter(function (r) { return String(r.date) >= key; });
  }

  function byDate(rows) {
    var map = {}, order = [];
    rows.forEach(function (r) {
      if (!map[r.date]) { map[r.date] = { date: r.date, ko: null, ma: null, en: null }; order.push(r.date); }
      var cur = map[r.date][r.s];
      map[r.date][r.s] = { c: (cur ? cur.c : 0) + r.c, t: (cur ? cur.t : 0) + r.t, sec: (cur ? cur.sec : 0) + r.sec };
    });
    order.sort();
    return order.map(function (d) { return map[d]; });
  }

  function renderStats() {
    updateSyncBadge();
    $("#statsWho").textContent = (S.name ? S.name + " · " : "") +
      (remoteRows ? "서버 기록" : "이 기기에 쌓인 기록") + " " + statRows().length + "줄";
    $$("#rangePick button").forEach(function (b) {
      b.classList.toggle("on", Number(b.dataset.r) === statRange);
    });

    var rows = statRows(), days = byDate(rows);
    var labels = days.map(function (d) { return d.date.slice(5).replace("-", "/"); });

    var totSec = 0, totC = 0, totT = 0;
    rows.forEach(function (r) { totSec += r.sec; totC += r.c; totT += r.t; });

    $("#statsKpi").innerHTML =
      '<div><div class="t">공부한 날</div><div class="v">' + days.length + "</div></div>" +
      '<div><div class="t">총 공부 시간</div><div class="v">' +
        (totSec >= 3600 ? (Math.round(totSec / 360) / 10) + "시간" : Math.round(totSec / 60) + "분") + "</div></div>" +
      '<div><div class="t">평균 정답률</div><div class="v">' + (totT ? Math.round(totC / totT * 100) : 0) + "%</div></div>";

    var min = function (k) {
      return days.map(function (d) { return d[k] ? Math.round(d[k].sec / 60 * 10) / 10 : 0; });
    };
    window.Chart2.bars($("#chDaily"), {
      labels: labels, stacked: true, height: 200,
      series: [{ name: "국어", color: C_KO, data: min("ko") },
               { name: "수학", color: C_MA, data: min("ma") },
               { name: "영어", color: C_EN, data: min("en") }]
    });

    var acc = function (k) {
      return days.map(function (d) { return d[k] && d[k].t ? Math.round(d[k].c / d[k].t * 100) : null; });
    };
    window.Chart2.lines($("#chAcc"), {
      labels: labels, yMax: 100, height: 200,
      series: [{ name: "국어", color: C_KO, data: acc("ko") },
               { name: "수학", color: C_MA, data: acc("ma") },
               { name: "영어", color: C_EN, data: acc("en") }]
    });

    var sum = { ko: 0, ma: 0, en: 0 }, cor = { ko: 0, ma: 0, en: 0 }, tot = { ko: 0, ma: 0, en: 0 };
    rows.forEach(function (r) {
      if (sum[r.s] === undefined) return;
      sum[r.s] += r.sec; cor[r.s] += r.c; tot[r.s] += r.t;
    });
    window.Chart2.donut($("#chPie"), {
      items: [{ name: "국어", value: sum.ko, color: C_KO },
              { name: "수학", value: sum.ma, color: C_MA },
              { name: "영어", value: sum.en, color: C_EN }],
      center: totSec >= 3600 ? (Math.round(totSec / 360) / 10) + "시간" : Math.round(totSec / 60) + "분",
      centerSub: "합계"
    });

    window.Chart2.bars($("#chAvg"), {
      labels: ["국어", "수학", "영어"], height: 170, everyLabel: 1,
      series: [{ name: "정답률", color: "#C88A4B",
        data: ["ko", "ma", "en"].map(function (k) { return tot[k] ? Math.round(cor[k] / tot[k] * 100) : 0; }) }]
    });
  }

  var bs = $("#btnStats");
  if (bs) bs.onclick = function () { renderStats(); go("scStats"); };
  $$("#rangePick button").forEach(function (b) {
    b.onclick = function () { statRange = Number(b.dataset.r); renderStats(); };
  });

  $("#btnPull").onclick = function () {
    if (!S.gas) return stat("#statsMsg", "no", "먼저 설정에서 Apps Script 주소를 넣어 주세요.");
    stat("#statsMsg", "wait", "불러오는 중…");
    fetch(S.gas + (S.gas.indexOf("?") < 0 ? "?" : "&") +
          "key=" + encodeURIComponent(S.gasKey) + "&limit=3000")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) return stat("#statsMsg", "no", "불러오지 못했어요 — " + ((j && j.error) || "알 수 없음"));
        remoteRows = j.rows || [];
        stat("#statsMsg", "ok", "서버에서 " + remoteRows.length + "줄을 불러왔어요" +
          (j.students && j.students.length > 1 ? " (학생 " + j.students.length + "명)" : ""));
        renderStats();
      })
      .catch(function (e) { stat("#statsMsg", "no", "불러오지 못했어요 — " + (e && e.message)); });
  };

  $("#btnCsv").onclick = function () {
    var rows = statRows();
    if (!rows.length) return toast("내려받을 기록이 없어요");
    var head = ["학생", "학년", "일차", "날짜", "과목", "맞은수", "문항수", "정답률", "걸린분"];
    var name = { ko: "국어", ma: "수학", en: "영어" };
    var body = rows.map(function (r) {
      return [r.student || S.name, r.grade, r.day, r.date, name[r.s] || r.s,
              r.c, r.t, r.t ? Math.round(r.c / r.t * 100) : "", Math.round(r.sec / 60 * 10) / 10];
    });
    var csv = "\uFEFF" + [head].concat(body).map(function (a) {
      return a.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(",");
    }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "곰돌이학습장_기록_" + todayKey() + ".csv";
    a.click();
    toast("CSV 로 내려받았어요");
  };

  /* ---------------------------------------------------------
     13. 홈 화면에 앱으로 두기
     --------------------------------------------------------- */
  var deferredPrompt = null;

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
    // iPadOS 13 부터 아이패드가 스스로를 맥이라고 말한다 — 손가락 입력 여부로 가려낸다
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;
  }
  function isAndroid() { return /Android/.test(navigator.userAgent); }
  function isSafari() {
    var ua = navigator.userAgent;
    return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium/.test(ua);
  }
  function isSecure() {
    return location.protocol === "https:" || location.hostname === "localhost";
  }
  function guessPlatform() { return isIOS() ? "ios" : isAndroid() ? "and" : "pc"; }

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallBtn();
    if ($("#scInstall").classList.contains("on")) renderInstallScreen(curPlat);
    renderInstallCard();
  });
  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    updateInstallBtn();
    renderInstallCard();
    toast("홈 화면에 앱으로 두었어요 🎉");
  });

  /* 머리글의 📲 단추 — 이미 앱으로 열려 있으면 감춘다 */
  function updateInstallBtn() {
    var b = $("#btnInstall");
    if (!b) return;
    b.style.display = isStandalone() ? "none" : "grid";
  }

  /* 홈 화면의 짧은 안내 카드 */
  function renderInstallCard() {
    var box = $("#installBox");
    if (!box) return;
    box.innerHTML = "";
    if (isStandalone()) return;
    var wrap = el("div", "instbox");
    wrap.appendChild(el("h4", null, "📲 홈 화면에 앱으로 두기"));
    wrap.appendChild(el("p", null,
      "설치하면 주소창 없이 열리고, 인터넷이 없어도 문제를 풀 수 있어요."));
    var b = el("button", "btn sm", deferredPrompt ? "지금 설치하기" : "설치하는 법 보기");
    b.onclick = function () { openInstall(); };
    wrap.appendChild(b);
    box.appendChild(wrap);
  }

  /* 설치 안내 화면 */
  var curPlat = null;
  function openInstall() {
    curPlat = curPlat || guessPlatform();
    renderInstallScreen(curPlat);
    go("scInstall");
  }
  var bi = $("#btnInstall");
  if (bi) bi.onclick = openInstall;

  $$("#platPick button").forEach(function (b) {
    b.onclick = function () { curPlat = b.dataset.p; renderInstallScreen(curPlat); };
  });

  function stepHTML(list) {
    return '<div class="steps">' + list.map(function (t, i) {
      return '<div class="step"><div class="n">' + (i + 1) + '</div><div class="tx">' + t + "</div></div>";
    }).join("") + "</div>";
  }

  function renderInstallScreen(plat) {
    $("#instBear").innerHTML = bearSVG(84, isStandalone() ? "cheer" : "hi");
    $("#appUrl").textContent = location.href.split("#")[0];
    $$("#platPick button").forEach(function (b) { b.classList.toggle("on", b.dataset.p === plat); });

    var st = $("#instState"), steps = $("#instSteps");
    st.innerHTML = ""; steps.innerHTML = "";

    if (isStandalone()) {
      st.innerHTML = '<div class="okbox">이미 앱으로 열려 있어요. 더 할 일이 없습니다 🎉</div>';
      return;
    }
    if (!isSecure()) {
      st.innerHTML = '<div class="warnbox">지금 주소로는 설치할 수 없습니다.<br>' +
        '홈 화면 설치는 <b>https 로 시작하는 주소</b>에서만 됩니다. ' +
        '파일을 직접 열었거나 http 로 열면 읽고 푸는 것만 됩니다.</div>';
    }

    if (plat === "and") {
      if (deferredPrompt) {
        st.innerHTML += '<div class="okbox">이 기기에 바로 설치할 수 있어요. 아래 단추를 누르세요.</div>';
        var b = el("button", "btn", "📲 지금 설치하기");
        b.onclick = function () {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function (r) {
            deferredPrompt = null;
            updateInstallBtn(); renderInstallCard(); renderInstallScreen(curPlat);
            if (r && r.outcome === "accepted") toast("설치했어요 🎉");
          });
        };
        steps.appendChild(b);
        steps.insertAdjacentHTML("beforeend",
          '<p class="tiny" style="margin-top:10px">단추가 안 눌리면 아래 방법으로 하세요.</p>');
      }
      steps.insertAdjacentHTML("beforeend", stepHTML([
        "브라우저 오른쪽 위 <span class=\"kbd\">⋮</span> 를 누르세요. <small>크롬 · 엣지 · 삼성 인터넷 모두 있습니다</small>",
        "<span class=\"kbd\">앱 설치</span> 또는 <span class=\"kbd\">홈 화면에 추가</span> 를 누르세요.",
        "<span class=\"kbd\">설치</span> 를 누르면 홈 화면에 곰돌이 아이콘이 생깁니다."
      ]));
      return;
    }

    if (plat === "ios") {
      if (!isSafari()) {
        st.innerHTML += '<div class="warnbox">아이폰·아이패드에서는 <b>사파리</b>에서만 홈 화면에 추가할 수 있습니다.<br>' +
          '크롬·네이버·카카오 안에서 열었다면, 아래 주소를 복사해 <b>사파리</b>로 여세요.</div>';
      }
      steps.insertAdjacentHTML("beforeend", stepHTML([
        "<b>사파리</b>로 이 주소를 엽니다. <small>다른 앱 안에서 열린 화면이면 안 됩니다</small>",
        "화면 <b>아래 가운데</b>의 <span class=\"kbd\">공유 ⬆️</span> 를 누르세요. " +
          "<small>아이패드는 오른쪽 위에 있습니다</small>",
        "목록을 아래로 내려 <span class=\"kbd\">홈 화면에 추가</span> 를 누르세요.",
        "오른쪽 위 <span class=\"kbd\">추가</span> 를 누르면 끝입니다."
      ]));
      return;
    }

    if (deferredPrompt) {
      st.innerHTML += '<div class="okbox">이 컴퓨터에 바로 설치할 수 있어요.</div>';
      var b2 = el("button", "btn", "📲 지금 설치하기");
      b2.onclick = function () {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function () {
          deferredPrompt = null;
          updateInstallBtn(); renderInstallCard(); renderInstallScreen(curPlat);
        });
      };
      steps.appendChild(b2);
    }
    steps.insertAdjacentHTML("beforeend", stepHTML([
      "주소창 오른쪽 끝의 <span class=\"kbd\">⊕</span> 또는 모니터 모양 아이콘을 누르세요. " +
        "<small>크롬 · 엣지에서 보입니다</small>",
      "안 보이면 오른쪽 위 <span class=\"kbd\">⋮</span> → <span class=\"kbd\">저장 및 공유</span> → " +
        "<span class=\"kbd\">페이지를 앱으로 설치</span>",
      "<span class=\"kbd\">설치</span> 를 누르면 창 하나로 따로 열립니다.",
      "<b>사파리(맥)</b>는 메뉴 <span class=\"kbd\">파일</span> → <span class=\"kbd\">Dock에 추가</span> 입니다."
    ]));
  }

  var bcu = $("#btnCopyUrl");
  if (bcu) bcu.onclick = function () {
    var u = location.href.split("#")[0];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(u).then(function () { toast("주소를 복사했어요"); },
                                            function () { toast("길게 눌러 복사해 주세요"); });
    } else toast("길게 눌러 복사해 주세요");
  };

  /* ---------- 설정: 앱 상태 점검 ---------- */
  function diag() {
    var box = $("#diagBox");
    if (!box) return;
    var rows = [];
    function add(label, ok, note) {
      rows.push('<div><span>' + label + '</span><b class="' + (ok ? "y" : "n") + '">' +
                (ok ? "정상" : (note || "확인 필요")) + "</b></div>");
    }
    add("https 주소", isSecure(), "http · 파일 열기");
    add("앱으로 열림", isStandalone(), "브라우저에서 열림");
    add("오프라인 저장(서비스워커)", !!(navigator.serviceWorker && navigator.serviceWorker.controller), "아직 안 켜짐");
    add("설치 제안 받음", !!deferredPrompt || isStandalone() || isIOS(), "아직 없음");
    box.innerHTML = rows.join("");

    fetch("manifest.webmanifest", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (m) {
        var icons = (m.icons || []).map(function (i) { return i.src; });
        box.insertAdjacentHTML("beforeend",
          '<div><span>앱 정보 파일</span><b class="y">읽음 · 아이콘 ' + icons.length + "개</b></div>");
        icons.forEach(function (src) {
          var im = new Image();
          im.onload = function () {
            box.insertAdjacentHTML("beforeend",
              '<div><span>' + esc(src) + '</span><b class="y">' + im.width + "px 정상</b></div>");
          };
          im.onerror = function () {
            box.insertAdjacentHTML("beforeend",
              '<div><span>' + esc(src) + '</span><b class="n">파일 없음</b></div>');
          };
          im.src = src;
        });
      })
      .catch(function () {
        box.insertAdjacentHTML("beforeend",
          '<div><span>앱 정보 파일</span><b class="n">못 읽음 — manifest.webmanifest 를 올렸는지 확인</b></div>');
      });
  }
  var btnDiag = $("#btnDiag");
  if (btnDiag) btnDiag.onclick = diag;

  /* ---------------------------------------------------------
     14. 시작
     --------------------------------------------------------- */
  renderHome();
  updateInstallBtn();
  renderInstallCard();
  updateSyncBadge();
  if (S.queue.length && S.gas) setTimeout(flushQueue, 1500);
  window.addEventListener("online", function () { flushQueue(); });
  if (S.grade) { renderSubject(); go("scSubject"); }
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js")
        .then(function (reg) { if (reg && reg.update) reg.update(); })
        .catch(function (e) { console.warn("서비스워커 등록 실패:", e && e.message); });
    });
  }
})();
