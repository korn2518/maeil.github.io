/* ============================================================
   펜으로 풀기 — 애플펜슬 · 갤럭시 S펜 필기 기능
   ------------------------------------------------------------
   · 필압에 따라 선 굵기가 달라집니다
   · 펜을 한 번 쓰면 그 뒤로 손바닥·손가락은 무시합니다 (팜 리젝션)
   · S펜 뒤쪽 지우개를 지원하고, 지우개 단추도 따로 있습니다
   · 쓴 것은 기기 안에 저장되어 다시 열어도 남아 있습니다
   ============================================================ */
(function () {
  "use strict";

  var LSK = "penInk";           // 필기 저장 열쇠
  var sawPen = false;           // 이 기기에서 펜을 쓴 적이 있는가
  var fingerOK = false;         // 손가락으로도 쓰기 허용 여부

  /* ---------- 저장소 ---------- */
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(LSK)) || {}; }
    catch (e) { return {}; }
  }
  function saveInk(key, strokes) {
    var all = loadAll();
    if (!strokes.length) delete all[key];
    else all[key] = strokes;
    try {
      localStorage.setItem(LSK, JSON.stringify(all));
    } catch (e) {
      // 저장 공간이 다 차면 오래된 것부터 버린다
      var ks = Object.keys(all);
      for (var i = 0; i < ks.length && i < 20; i++) delete all[ks[i]];
      all[key] = strokes;
      try { localStorage.setItem(LSK, JSON.stringify(all)); } catch (e2) {}
    }
  }
  function loadInk(key) { return loadAll()[key] || []; }

  /* ---------- 필기판 ---------- */
  function PenPad(host, key, opts) {
    opts = opts || {};
    this.key = key;
    this.height = opts.height || 260;
    this.lined = opts.lined !== false;      // 옅은 줄 배경
    this.strokes = loadInk(key);
    this.redo = [];
    this.erasing = false;
    this.build(host);
  }

  PenPad.prototype.build = function (host) {
    var self = this;
    host.innerHTML = "";

    var bar = document.createElement("div");
    bar.className = "penbar";
    bar.innerHTML =
      '<button class="pentool on" data-t="pen">✏️ 펜</button>' +
      '<button class="pentool" data-t="eraser">🧽 지우개</button>' +
      '<button class="pentool" data-t="undo">↩︎ 되돌리기</button>' +
      '<button class="pentool" data-t="clear">전체 지우기</button>' +
      '<label class="penfinger"><input type="checkbox"> 손가락으로도 쓰기</label>';
    host.appendChild(bar);

    var wrap = document.createElement("div");
    wrap.className = "penwrap";
    wrap.style.height = this.height + "px";
    var cv = document.createElement("canvas");
    cv.className = "pencanvas";
    wrap.appendChild(cv);
    host.appendChild(wrap);

    this.canvas = cv;
    this.ctx = cv.getContext("2d");

    bar.querySelectorAll(".pentool").forEach(function (b) {
      b.onclick = function () {
        var t = b.dataset.t;
        if (t === "undo") return self.undo();
        if (t === "clear") return self.clear();
        self.erasing = (t === "eraser");
        bar.querySelectorAll('.pentool[data-t="pen"],.pentool[data-t="eraser"]')
           .forEach(function (x) { x.classList.toggle("on", x.dataset.t === t); });
      };
    });
    var fchk = bar.querySelector(".penfinger input");
    if (fchk) {
      fchk.checked = fingerOK;
      fchk.onchange = function () { fingerOK = fchk.checked; };
    }

    this.resize();
    this._onResize = function () { self.resize(); };
    window.addEventListener("resize", this._onResize);

    cv.addEventListener("pointerdown", function (e) { self.down(e); });
    cv.addEventListener("pointermove", function (e) { self.move(e); });
    cv.addEventListener("pointerup", function (e) { self.up(e); });
    cv.addEventListener("pointercancel", function (e) { self.up(e); });
    cv.addEventListener("pointerleave", function (e) { self.up(e); });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  };

  PenPad.prototype.destroy = function () {
    window.removeEventListener("resize", this._onResize);
  };

  PenPad.prototype.resize = function () {
    var cv = this.canvas;
    var r = cv.parentNode.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    cv.width = Math.round(this.w * dpr);
    cv.height = Math.round(this.h * dpr);
    cv.style.width = this.w + "px";
    cv.style.height = this.h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  };

  /* 좌표는 0~1 로 저장한다 — 화면 크기가 달라져도 그대로 살아난다 */
  PenPad.prototype.pt = function (e) {
    var r = this.canvas.getBoundingClientRect();
    var p = (e.pressure && e.pressure > 0 && e.pressure < 1) ? e.pressure : 0.5;
    return [
      Math.round(((e.clientX - r.left) / r.width) * 1000) / 1000,
      Math.round(((e.clientY - r.top) / r.height) * 1000) / 1000,
      Math.round(p * 100) / 100
    ];
  };

  PenPad.prototype.accepts = function (e) {
    if (e.pointerType === "pen" || e.pointerType === "eraser") return true;
    if (e.pointerType === "mouse") return true;
    if (e.pointerType === "touch") return fingerOK || !sawPen;   // 팜 리젝션
    return true;
  };

  PenPad.prototype.down = function (e) {
    if (e.pointerType === "pen" || e.pointerType === "eraser") sawPen = true;
    if (!this.accepts(e)) return;
    e.preventDefault();
    try { this.canvas.setPointerCapture(e.pointerId); } catch (err) {}
    // S펜 뒤쪽 지우개 또는 버튼 누른 채 긋기 → 지우개
    var erase = this.erasing || e.pointerType === "eraser" || e.buttons === 32 || e.button === 5;
    this.cur = { e: erase ? 1 : 0, p: [this.pt(e)] };
    this.drawing = true;
  };

  PenPad.prototype.move = function (e) {
    if (!this.drawing || !this.cur) return;
    if (!this.accepts(e)) return;
    e.preventDefault();
    var pts = (e.getCoalescedEvents && e.getCoalescedEvents().length)
            ? e.getCoalescedEvents() : [e];
    for (var i = 0; i < pts.length; i++) this.cur.p.push(this.pt(pts[i]));
    this.render();
  };

  PenPad.prototype.up = function (e) {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.cur && this.cur.p.length) {
      this.strokes.push(this.cur);
      this.redo = [];
      saveInk(this.key, this.strokes);
    }
    this.cur = null;
    this.render();
  };

  PenPad.prototype.undo = function () {
    if (!this.strokes.length) return;
    this.redo.push(this.strokes.pop());
    saveInk(this.key, this.strokes);
    this.render();
  };

  PenPad.prototype.clear = function () {
    if (!this.strokes.length) return;
    this.strokes = [];
    saveInk(this.key, this.strokes);
    this.render();
  };

  PenPad.prototype.isEmpty = function () { return !this.strokes.length; };

  PenPad.prototype.stroke = function (s) {
    var c = this.ctx, W = this.w, H = this.h, p = s.p;
    if (!p.length) return;
    c.lineCap = "round";
    c.lineJoin = "round";
    if (s.e) {
      c.globalCompositeOperation = "destination-out";
      c.strokeStyle = "rgba(0,0,0,1)";
    } else {
      c.globalCompositeOperation = "source-over";
      c.strokeStyle = "#1F3A5F";
    }
    if (p.length === 1) {
      c.beginPath();
      c.arc(p[0][0] * W, p[0][1] * H, (s.e ? 14 : 1.6), 0, 6.2832);
      c.fillStyle = c.strokeStyle;
      if (!s.e) c.fill(); else { c.globalCompositeOperation = "destination-out"; c.fill(); }
      return;
    }
    for (var i = 1; i < p.length; i++) {
      c.beginPath();
      c.moveTo(p[i - 1][0] * W, p[i - 1][1] * H);
      c.lineTo(p[i][0] * W, p[i][1] * H);
      c.lineWidth = s.e ? 26 : (1 + p[i][2] * 3.6);
      c.stroke();
    }
  };

  PenPad.prototype.render = function () {
    var c = this.ctx;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.restore();
    for (var i = 0; i < this.strokes.length; i++) this.stroke(this.strokes[i]);
    if (this.cur) this.stroke(this.cur);
    c.globalCompositeOperation = "source-over";
  };

  /* ---------- 답 입력 숫자판 ---------- */
  /* 문제의 정답 모양을 보고 필요한 글쇠만 만든다.
     (문제에 이미 "쓰는 법: 4kg200g" 처럼 형식이 적혀 있으므로 힌트가 새지 않는다) */
  function keysFor(answer) {
    var a = String(answer);
    var rows = [["7", "8", "9"], ["4", "5", "6"], ["1", "2", "3"], ["0"]];
    var extra = [];
    function add(t) { if (t && extra.indexOf(t) < 0) extra.push(t); }

    /* 숫자를 뺀 나머지 부분을 그대로 글쇠로 만든다.
       "5…3", "2m30cm", "몫 5, 나머지 3", "2와1/3" 처럼 어떤 답이든 칠 수 있게 된다.
       문제에 이미 "(예: 몫 3, 나머지 1)" 처럼 쓰는 법이 적혀 있으므로 힌트가 새지 않는다.
       — 낱말 자체가 답인 문제(도형 이름 등)는 숫자판을 쓰지 않고 골라 답하게 한다. */
    a.split(/\d+/).forEach(function (seg) {
      if (!seg) return;
      seg.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) add("공백"); else add(t);
      });
    });
    if (/^[월화수목금토일]$/.test(a)) extra = ["월", "화", "수", "목", "금"];
    if (/^[가나다라]$/.test(a)) extra = ["가", "나", "다", "라"];
    return { rows: rows, extra: extra };
  }

  function NumPad(host, answer, onInput) {
    var k = keysFor(answer);
    var html = '<div class="npd">';
    k.rows.forEach(function (r) {
      html += '<div class="nprow">';
      r.forEach(function (d) { html += '<button class="npk" data-k="' + d + '">' + d + "</button>"; });
      if (r[0] === "0") {
        html += '<button class="npk wide" data-k="←">← 지우기</button>';
      }
      html += "</div>";
    });
    if (k.extra.length) {
      html += '<div class="nprow extra">';
      k.extra.forEach(function (d) {
        var label = d === "공백" ? "␣" : d;
        html += '<button class="npk sm" data-k="' + d + '">' + label + "</button>";
      });
      html += "</div>";
    }
    html += "</div>";
    host.innerHTML = html;
    host.querySelectorAll(".npk").forEach(function (b) {
      b.onclick = function () {
        var v = b.dataset.k;
        if (v === "공백") v = " ";
        onInput(v);
      };
    });
  }

  /* ---------- 답 맞히기 (index.html 의 mNorm 과 같은 규칙) ---------- */
  function norm(v) {
    return String(v).trim().toLowerCase()
      .replace(/\s+/g, "").replace(/,/g, "").replace(/\.\.\./g, "…")
      .replace(/과/g, "").replace(/[·∙]/g, "")
      .replace(/원|개|명|권|장|쌍|도|번째/g, "");
  }

  /* ---------- 밖으로 내보내기 ---------- */
  window.Pen = {
    Pad: PenPad,
    NumPad: NumPad,
    norm: norm,
    keysFor: keysFor,
    sawPen: function () { return sawPen; }
  };
})();
