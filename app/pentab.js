/* ============================================================
   '펜으로 풀기' 탭 — 하루치를 한 문제씩 펜으로 풀기
   수학 10문제 → 문해력 서술형 1문제 순서로 넘어간다.
   ============================================================ */
(function () {
  "use strict";

  var pad = null;          // 지금 화면의 필기판
  var items = [];          // 오늘 풀 문제들
  var idx = 0;
  var day = null;
  var typed = "";
  var done = false;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function days() {
    var m = {};
    (REVIEW.math || []).forEach(function (p) { m[p.date] = p.day; });
    return Object.keys(m).sort().reverse().map(function (d) { return { date: d, day: m[d] }; });
  }

  /* ---------- 날짜 고르기 ---------- */
  function showPicker() {
    var ds = days();
    if (!ds.length) {
      el("penBody").innerHTML = '<div class="empty">아직 풀 문제가 없어요.</div>';
      return;
    }
    var html = '<div class="pensel"><b>어느 날 것을 풀까요?</b><div class="penchips">';
    ds.forEach(function (d) {
      var n = (REVIEW.math || []).filter(function (p) { return p.date === d.date; }).length;
      html += '<button class="penchip" data-d="' + d.date + '">DAY ' +
              String(d.day).padStart(3, "0") + '<span>' + d.date + ' · ' + n + '문제</span></button>';
    });
    html += "</div></div>";
    el("penBody").innerHTML = html;
    el("penBody").querySelectorAll(".penchip").forEach(function (b) {
      b.onclick = function () { start(b.dataset.d); };
    });
  }

  /* ---------- 시작 ---------- */
  function start(date) {
    day = date;
    items = (REVIEW.math || []).filter(function (p) { return p.date === date; })
              .slice().sort(function (a, b) { return a.no - b.no; })
              .map(function (p) { return { kind: "math", q: p }; });
    (REVIEW.essays || []).filter(function (q) { return q.date === date; })
      .forEach(function (q) { items.push({ kind: "essay", q: q }); });
    idx = 0;
    show();
  }

  /* ---------- 한 문제 ---------- */
  function show() {
    if (pad) { pad.destroy(); pad = null; }
    typed = ""; done = false;

    if (idx >= items.length) return finish();

    var it = items[idx], q = it.q;
    var isEssay = it.kind === "essay";
    var total = items.length;
    var head = isEssay
      ? '<span class="mchip" style="background:#FDECF1;color:#B0517A">문해력 · 서술형</span>'
      : '<span class="mchip">' + esc(q.unit) + '</span><span class="mchip" style="background:#FBEFCF;color:#8A6A1E">' +
        (q.kind === "calc" ? "계산" : "문장제") + "</span>";

    var html =
      '<div class="penhead">' +
        '<button class="btn s" id="penBack">◀ 날짜 다시</button>' +
        '<div class="penprog"><i style="width:' + (idx / total * 100) + '%"></i></div>' +
        '<span class="pencnt">' + (idx + 1) + " / " + total + "</span>" +
      "</div>" +
      '<div class="penq">' + head + "<br>" + (idx + 1) + ". " +
        esc(q.q).replace(/\n/g, "<br>") + "</div>";

    if (!isEssay && q.choices) {
      html += '<div class="penopts">';
      q.choices.forEach(function (c, i) {
        html += '<button class="opt" data-i="' + (i + 1) + '">' + ["①", "②", "③", "④"][i] + " " + esc(c) + "</button>";
      });
      html += "</div>";
    }

    html += '<div class="penpad" id="penPad"></div>';

    if (!isEssay && !q.choices) {
      html += '<div class="penans"><span class="penanslabel">답</span>' +
              '<span class="pentyped" id="penTyped"></span></div>' +
              '<div id="penNum"></div>' +
              '<div style="margin-top:10px"><button class="btn p" id="penGo">확인</button></div>';
    } else if (isEssay) {
      html += '<div style="margin-top:10px"><button class="btn p" id="penGo">다 썼어요 — 예시 답안 보기</button></div>';
    }

    html += '<div class="fb" id="penFb"></div>';
    el("penBody").innerHTML = html;

    pad = new Pen.Pad(el("penPad"), "ink:" + q.date + ":" + (isEssay ? "e" : "m") + (q.no || 1),
                      { height: isEssay ? 320 : 260 });

    el("penBack").onclick = function () { if (pad) pad.destroy(); showPicker(); };

    if (!isEssay && q.choices) {
      el("penBody").querySelectorAll(".penopts .opt").forEach(function (b) {
        b.onclick = function () { pick(Number(b.dataset.i)); };
      });
    } else if (!isEssay) {
      Pen.NumPad(el("penNum"), q.answer, function (k) {
        if (done) return;
        if (k === "←") typed = typed.slice(0, -1);
        else typed += k;
        el("penTyped").textContent = typed || " ";
      });
      el("penGo").onclick = check;
    } else {
      el("penGo").onclick = showSample;
    }
  }

  function mark(good, q) {
    var bad = [];
    try { bad = JSON.parse(localStorage.getItem("mWrong")) || []; } catch (e) {}
    var key = q.date + "#" + q.no;
    if (good) { var i = bad.indexOf(key); if (i > -1) bad.splice(i, 1); }
    else if (bad.indexOf(key) < 0) bad.push(key);
    try { localStorage.setItem("mWrong", JSON.stringify(bad)); } catch (e) {}
  }

  function feedback(good, q, shown) {
    done = true;
    var fb = el("penFb");
    fb.style.display = "block";
    fb.innerHTML = (good ? "⭕ 맞았어요! " : "❌ 아쉬워요. 정답은 <b>" + esc(shown) + "</b> 이에요. ") +
      '<div style="margin-top:6px">' + esc(q.explain) +
      ' <span style="color:#9AA7B5;font-size:12px">' + esc(q.std || "") + "</span></div>" +
      '<div style="margin-top:10px"><button class="btn s" id="penNext">다음 문제 ▶</button></div>';
    el("penNext").onclick = function () { idx++; show(); };
  }

  function pick(i) {
    var q = items[idx].q;
    if (done) return;
    var a = Number(q.answer);
    el("penBody").querySelectorAll(".penopts .opt").forEach(function (b, j) {
      b.disabled = true;
      if (j === a - 1) b.classList.add("ok");
      else if (j === i - 1) b.classList.add("no");
    });
    var good = i === a;
    mark(good, q);
    feedback(good, q, ["①", "②", "③", "④"][a - 1] + " " + q.choices[a - 1]);
  }

  function check() {
    var q = items[idx].q;
    if (done) { idx++; show(); return; }
    if (!typed.trim()) return;
    var good = Pen.norm(typed) === Pen.norm(q.answer);
    mark(good, q);
    el("penTyped").className = "pentyped " + (good ? "ok" : "no");
    feedback(good, q, q.answer);
  }

  function showSample() {
    var q = items[idx].q;
    done = true;
    var fb = el("penFb");
    fb.style.display = "block";
    var rub = (q.rubric || []).map(function (r) { return "· " + esc(r); }).join("<br>");
    fb.innerHTML = "<b>예시 답안</b><br>" + esc(q.sample || "") +
      (rub ? '<div style="margin-top:8px"><b>이런 점을 살펴보세요</b><br>' + rub + "</div>" : "") +
      '<div style="margin-top:10px;color:#6B6357;font-size:13px">' +
      "똑같이 쓰지 않아도 괜찮아요. 이유를 함께 썼는지 스스로 확인해 보세요.</div>" +
      '<div style="margin-top:10px"><button class="btn s" id="penNext">다음 ▶</button></div>';
    el("penNext").onclick = function () { idx++; show(); };
  }

  function finish() {
    el("penBody").innerHTML =
      '<div class="pendone"><div class="pendoneicon">🎉</div>' +
      "<b>" + day + " 다 풀었어요!</b>" +
      "<p>쓴 풀이는 저장되어 있어서 다시 열어 볼 수 있어요.</p>" +
      '<button class="btn p" id="penAgain">다른 날 풀기</button></div>';
    el("penAgain").onclick = showPicker;
  }

  /* ---------- 탭이 열릴 때 ---------- */
  window.penTabOpen = function () {
    if (!el("penBody")) return;
    if (!items.length) showPicker();
  };
})();
