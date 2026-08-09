/* ============================================================
   형광펜 — 지문을 읽으며 낱말에 색칠하기
   ------------------------------------------------------------
   · 낱말 하나하나에 칠해집니다. 그래서 글자 크기가 바뀌거나
     화면을 돌려도 칠한 자리가 틀어지지 않습니다.
   · 색 세 가지 — 노랑(중요) · 파랑(사실) · 분홍(의견)
     제작지침의 '사실과 의견 색칠' 수업에 그대로 쓸 수 있습니다.
   · 펜을 쓰면 손가락으로는 화면을 넘길 수 있습니다.
   ============================================================ */
(function () {
  "use strict";

  var LSK = "hlMark";
  var COLORS = [
    { k: "y", name: "노랑", why: "중요한 곳", css: "#FFE9A8" },
    { k: "b", name: "파랑", why: "사실",     css: "#CFE6FA" },
    { k: "p", name: "분홍", why: "의견",     css: "#FBD5E2" }
  ];
  var sawPen = false;

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(LSK)) || {}; }
    catch (e) { return {}; }
  }
  function save(key, marks) {
    var all = loadAll();
    if (!Object.keys(marks).length) delete all[key];
    else all[key] = marks;
    try { localStorage.setItem(LSK, JSON.stringify(all)); } catch (e) {}
  }
  function load(key) { return loadAll()[key] || {}; }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* 문단을 낱말 단위로 쪼개 <span> 으로 감싼다.
     낱말 번호는 지문 전체에서 이어지므로, 저장한 번호가 늘 같은 낱말을 가리킨다. */
  function wrap(body, startIndex) {
    var i = startIndex, html = "";
    body.forEach(function (para) {
      html += "<p>";
      String(para).split(/(\s+)/).forEach(function (tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { html += tok; return; }
        html += '<span class="hw" data-i="' + i + '">' + esc(tok) + "</span>";
        i++;
      });
      html += "</p>";
    });
    return { html: html, next: i };
  }

  /* ---------- 형광펜 붙이기 ----------
     host      : 지문을 그릴 자리
     key       : 저장 열쇠 (예: "hl:2026-08-08:1")
     passage   : {no, genre, title, body, hard_words}
  */
  function Highlighter(host, key, passage) {
    this.key = key;
    this.marks = load(key);
    this.color = "y";
    this.on = false;
    this.build(host, passage);
  }

  Highlighter.prototype.build = function (host, p) {
    var self = this;
    var w = wrap(p.body, 0);

    var hw = (p.hard_words || []).map(function (h) {
      return "<b>" + esc(h.word) + "</b> " + esc(h.meaning);
    }).join(" &nbsp;·&nbsp; ");

    host.innerHTML =
      '<div class="hlbar">' +
        '<button class="hltool" data-a="toggle">🖍 형광펜 켜기</button>' +
        '<span class="hlcolors">' +
          COLORS.map(function (c, i) {
            return '<button class="hlc' + (i === 0 ? " on" : "") + '" data-c="' + c.k +
                   '" style="background:' + c.css + '" title="' + c.name + " — " + c.why +
                   '">' + c.why + "</button>";
          }).join("") +
        "</span>" +
        '<button class="hltool" data-a="erase">지우개</button>' +
        '<button class="hltool" data-a="clear">모두 지우기</button>' +
      "</div>" +
      '<div class="hlpassage">' +
        '<span class="genre">지문 ' + p.no + " · " + esc(p.genre) + "</span>" +
        "<h4>" + esc(p.title) + "</h4>" + w.html +
        (hw ? '<div class="hlwords">낱말 풀이 &nbsp;' + hw + "</div>" : "") +
      "</div>";

    this.box = host.querySelector(".hlpassage");
    this.bar = host.querySelector(".hlbar");
    this.paint();

    this.bar.querySelectorAll(".hlc").forEach(function (b) {
      b.onclick = function () {
        self.color = b.dataset.c;
        self.erasing = false;
        self.bar.querySelectorAll(".hlc").forEach(function (x) {
          x.classList.toggle("on", x === b);
        });
        self.bar.querySelector('[data-a="erase"]').classList.remove("on");
        if (!self.on) self.toggle(true);
      };
    });
    this.bar.querySelectorAll(".hltool").forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a;
        if (a === "toggle") return self.toggle();
        if (a === "clear") {
          if (!Object.keys(self.marks).length) return;
          self.marks = {}; save(self.key, self.marks); self.paint(); return;
        }
        if (a === "erase") {
          self.erasing = !self.erasing;
          b.classList.toggle("on", self.erasing);
          if (self.erasing && !self.on) self.toggle(true);
        }
      };
    });

    var box = this.box;
    box.addEventListener("pointerdown", function (e) { self.down(e); });
    box.addEventListener("pointermove", function (e) { self.move(e); });
    box.addEventListener("pointerup", function () { self.drawing = false; });
    box.addEventListener("pointercancel", function () { self.drawing = false; });
    box.addEventListener("pointerleave", function () { self.drawing = false; });
  };

  Highlighter.prototype.toggle = function (force) {
    this.on = (force === undefined) ? !this.on : force;
    var b = this.bar.querySelector('[data-a="toggle"]');
    b.textContent = this.on ? "🖍 형광펜 끄기" : "🖍 형광펜 켜기";
    b.classList.toggle("on", this.on);
    this.box.classList.toggle("marking", this.on);
    // 펜을 쓰는 기기는 손가락으로 화면을 넘길 수 있게 남겨 둔다
    this.box.style.touchAction = this.on ? (sawPen ? "pan-y" : "none") : "";
  };

  Highlighter.prototype.hit = function (e) {
    var el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList && el.classList.contains("hw")) return el;
    return null;
  };

  Highlighter.prototype.apply = function (el) {
    if (!el) return;
    var i = el.dataset.i;
    if (this.erasing) delete this.marks[i];
    else this.marks[i] = this.color;
    el.className = "hw" + (this.marks[i] ? " m-" + this.marks[i] : "");
  };

  Highlighter.prototype.down = function (e) {
    if (e.pointerType === "pen" || e.pointerType === "eraser") sawPen = true;
    if (!this.on) return;
    if (e.pointerType === "touch" && sawPen) return;   // 펜을 쓰면 손가락은 넘기기용
    if (e.pointerType === "eraser") this.erasing = true;
    e.preventDefault();
    this.drawing = true;
    this.apply(this.hit(e));
  };

  Highlighter.prototype.move = function (e) {
    if (!this.drawing || !this.on) return;
    if (e.pointerType === "touch" && sawPen) return;
    e.preventDefault();
    this.apply(this.hit(e));
  };

  Highlighter.prototype.paint = function () {
    var m = this.marks;
    this.box.querySelectorAll(".hw").forEach(function (el) {
      var c = m[el.dataset.i];
      el.className = "hw" + (c ? " m-" + c : "");
    });
  };

  Highlighter.prototype.flush = function () { save(this.key, this.marks); };

  /* 지문을 화면에서 뗄 때 저장한다 */
  Highlighter.prototype.destroy = function () { this.flush(); };

  window.HL = {
    make: function (host, key, passage) {
      var h = new Highlighter(host, key, passage);
      // 칠할 때마다 저장하면 느려지므로 잠깐씩 모아 저장한다
      var t = null;
      var _apply = h.apply.bind(h);
      h.apply = function (el) {
        _apply(el);
        clearTimeout(t);
        t = setTimeout(function () { h.flush(); }, 400);
      };
      return h;
    },
    colors: COLORS
  };
})();
