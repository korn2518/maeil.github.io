/* ============================================================
   곰돌이 학습장 — 작은 그래프 모듈
   ------------------------------------------------------------
   · 바깥 라이브러리를 쓰지 않는다 → 인터넷 없이도 그려진다
   · SVG 로 그려서 화면 크기가 달라져도 깨지지 않는다
   · 막대(누적 가능) · 선 · 도넛 세 가지
   ============================================================ */
(function (global) {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var INK = "#3D2B1F", SUB = "#8A7461", LINE = "#EFE2D2";

  function el(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function txt(x, y, s, opt) {
    opt = opt || {};
    var t = el("text", {
      x: x, y: y, fill: opt.fill || SUB,
      "font-size": opt.size || 11, "font-weight": opt.weight || 700,
      "text-anchor": opt.anchor || "middle", "font-family": "inherit"
    });
    t.textContent = s;
    return t;
  }
  function svg(w, h) {
    var s = el("svg", {
      viewBox: "0 0 " + w + " " + h, width: "100%",
      style: "display:block;overflow:visible", role: "img"
    });
    return s;
  }
  function nice(max) {
    if (max <= 0) return 1;
    var e = Math.pow(10, Math.floor(Math.log(max) / Math.LN10));
    var f = max / e;
    var m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return m * e;
  }

  /* ---------- 막대 (누적 가능) ----------
     opt = { labels:[], series:[{name,color,data:[]}], stacked:true,
             unit:"분", height:190, everyLabel:1 }                       */
  function bars(host, opt) {
    host.innerHTML = "";
    var labels = opt.labels || [], series = opt.series || [];
    var n = labels.length;
    if (!n) { host.appendChild(empty()); return; }

    var W = 640, H = opt.height || 190;
    var padL = 34, padR = 8, padT = 12, padB = 26;
    var plotW = W - padL - padR, plotH = H - padT - padB;

    var totals = [];
    for (var i = 0; i < n; i++) {
      var t = 0;
      for (var j = 0; j < series.length; j++) t += (series[j].data[i] || 0);
      totals.push(opt.stacked ? t : Math.max.apply(null, series.map(function (s) { return s.data[i] || 0; })));
    }
    var yMax = nice(Math.max.apply(null, totals.concat([0])) || 1);

    var s = svg(W, H);
    /* 눈금 */
    [0, 0.5, 1].forEach(function (r) {
      var y = padT + plotH * (1 - r);
      s.appendChild(el("line", { x1: padL, y1: y, x2: W - padR, y2: y, stroke: LINE, "stroke-width": 1 }));
      s.appendChild(txt(padL - 6, y + 4, fmtNum(yMax * r), { anchor: "end", size: 10 }));
    });

    var slot = plotW / n, bw = Math.max(4, Math.min(26, slot * 0.62));
    for (var i2 = 0; i2 < n; i2++) {
      var cx = padL + slot * (i2 + 0.5);
      var acc = 0;
      for (var j2 = 0; j2 < series.length; j2++) {
        var v = series[j2].data[i2] || 0;
        if (v <= 0) continue;
        var h = plotH * (v / yMax);
        var y0 = opt.stacked ? padT + plotH - (acc + v) / yMax * plotH : padT + plotH - h;
        s.appendChild(el("rect", {
          x: cx - bw / 2, y: y0, width: bw, height: Math.max(1.5, h),
          fill: series[j2].color, rx: 3
        }));
        acc += v;
      }
      var every = opt.everyLabel || Math.ceil(n / 10);
      if (i2 % every === 0 || i2 === n - 1) {
        var an = i2 === 0 && n > 6 ? "start" : (i2 === n - 1 && n > 6 ? "end" : "middle");
        s.appendChild(txt(cx, H - 8, labels[i2], { size: 10, anchor: an }));
      }
    }
    host.appendChild(s);
    if (series.length > 1) host.appendChild(legend(series));
  }

  /* ---------- 선 ----------
     opt = { labels:[], series:[{name,color,data:[] (null 허용)}], yMax, unit }  */
  function lines(host, opt) {
    host.innerHTML = "";
    var labels = opt.labels || [], series = opt.series || [];
    var n = labels.length;
    if (!n) { host.appendChild(empty()); return; }

    var W = 640, H = opt.height || 190;
    var padL = 34, padR = 8, padT = 12, padB = 26;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var yMax = opt.yMax || 100;

    var s = svg(W, H);
    [0, 0.5, 1].forEach(function (r) {
      var y = padT + plotH * (1 - r);
      s.appendChild(el("line", { x1: padL, y1: y, x2: W - padR, y2: y, stroke: LINE, "stroke-width": 1 }));
      s.appendChild(txt(padL - 6, y + 4, Math.round(yMax * r), { anchor: "end", size: 10 }));
    });

    var X = function (i) { return n === 1 ? padL + plotW / 2 : padL + plotW * (i / (n - 1)); };
    var Y = function (v) { return padT + plotH * (1 - Math.min(1, v / yMax)); };

    series.forEach(function (se) {
      var d = "", started = false;
      se.data.forEach(function (v, i) {
        if (v == null) { started = false; return; }
        d += (started ? " L" : " M") + X(i) + "," + Y(v);
        started = true;
      });
      if (d) s.appendChild(el("path", {
        d: d.trim(), fill: "none", stroke: se.color, "stroke-width": 2.6,
        "stroke-linecap": "round", "stroke-linejoin": "round"
      }));
      se.data.forEach(function (v, i) {
        if (v == null) return;
        s.appendChild(el("circle", { cx: X(i), cy: Y(v), r: n > 24 ? 2 : 3.2, fill: se.color }));
      });
    });

    var every = opt.everyLabel || Math.ceil(n / 8);
    labels.forEach(function (L, i) {
      if (i % every !== 0 && i !== n - 1) return;
      /* 양끝 글자가 잘리지 않도록 맞춤을 바꾼다 */
      var anchor = i === 0 ? "start" : (i === n - 1 ? "end" : "middle");
      s.appendChild(txt(X(i), H - 8, L, { size: 10, anchor: anchor }));
    });
    host.appendChild(s);
    if (series.length > 1) host.appendChild(legend(series));
  }

  /* ---------- 도넛 ----------
     opt = { items:[{name,value,color}], center:"3시간", unit:"분" }  */
  function donut(host, opt) {
    host.innerHTML = "";
    var items = (opt.items || []).filter(function (i) { return i.value > 0; });
    var sum = items.reduce(function (a, b) { return a + b.value; }, 0);
    if (!sum) { host.appendChild(empty()); return; }

    var S = 190, R = 74, r = 46, C = S / 2;
    var s = svg(S, S);
    s.setAttribute("style", "display:block;width:190px;max-width:100%;margin:0 auto");

    var a0 = -Math.PI / 2;
    items.forEach(function (it) {
      var a1 = a0 + Math.PI * 2 * (it.value / sum);
      var big = (a1 - a0) > Math.PI ? 1 : 0;
      var p = ["M", C + R * Math.cos(a0), C + R * Math.sin(a0),
        "A", R, R, 0, big, 1, C + R * Math.cos(a1), C + R * Math.sin(a1),
        "L", C + r * Math.cos(a1), C + r * Math.sin(a1),
        "A", r, r, 0, big, 0, C + r * Math.cos(a0), C + r * Math.sin(a0), "Z"].join(" ");
      s.appendChild(el("path", { d: p, fill: it.color }));
      a0 = a1;
    });
    if (opt.center) {
      s.appendChild(txt(C, C + 2, opt.center, { size: 20, weight: 900, fill: INK }));
      if (opt.centerSub) s.appendChild(txt(C, C + 20, opt.centerSub, { size: 11 }));
    }
    host.appendChild(s);
    host.appendChild(legend(items.map(function (i) {
      return { name: i.name + " " + Math.round(i.value / sum * 100) + "%", color: i.color };
    })));
  }

  function legend(series) {
    var d = document.createElement("div");
    d.className = "lgd";
    d.innerHTML = series.map(function (s) {
      return '<span><i style="background:' + s.color + '"></i>' + s.name + "</span>";
    }).join("");
    return d;
  }
  function empty() {
    var d = document.createElement("div");
    d.className = "chempty";
    d.textContent = "아직 기록이 없어요";
    return d;
  }
  function fmtNum(v) {
    if (v >= 100) return Math.round(v);
    if (v >= 10) return Math.round(v);
    return Math.round(v * 10) / 10;
  }

  global.Chart2 = { bars: bars, lines: lines, donut: donut };
})(window);
