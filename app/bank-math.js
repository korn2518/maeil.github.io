/* 곰돌이 학습장 — 수학 문제은행 (1~6학년)
   2022 개정 교육과정 성취기준 연계. 날짜+학년 시드 고정 → 같은 날 같은 문제.
   확장: UNITS[학년] 배열에 {name, std, gen} 를 추가하면 자동으로 순환에 들어간다. */
(function (global) {
  'use strict';

  /* ---------- 시드 난수 ---------- */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function mk(R) {
    return {
      i: function (a, b) { return a + Math.floor(R() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(R() * arr.length)]; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      }
    };
  }

  var 이름 = ['지민', '서준', '하윤', '도윤', '수아', '시우', '아영', '민준', '예린', '지호', '나은', '건우'];
  var 물건 = ['사탕', '색연필', '딱지', '구슬', '스티커', '공책', '블록', '지우개'];

  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* 조사 자동 선택 — 받침 유무로 이/가, 을/를, 은/는, 과/와 를 고른다 */
  function jong(w) {
    var c = w.charCodeAt(w.length - 1);
    if (c < 0xAC00 || c > 0xD7A3) return false;
    return (c - 0xAC00) % 28 !== 0;
  }
  function J(w, pair) { var p = pair.split('/'); return w + (jong(w) ? p[0] : p[1]); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function red(n, d) { var g = gcd(n, d); return [n / g, d / g]; }

  /* =====================================================================
     1학년
     ===================================================================== */
  var G1 = [
    { name: '9까지의 수', std: '[2수01-01]', gen: function (r) {
        var n = r.i(3, 9), t = r.i(0, 2);
        if (t === 0) return { q: n + '보다 1 큰 수는 얼마인가요?', answer: String(n + 1), explain: n + ' 다음 수는 ' + (n + 1) + '입니다.' };
        if (t === 1) return { q: n + '보다 1 작은 수는 얼마인가요?', answer: String(n - 1), explain: n + ' 바로 앞의 수는 ' + (n - 1) + '입니다.' };
        var a = r.i(1, 9), b = r.i(1, 9); while (b === a) b = r.i(1, 9);
        return { q: a + '와(과) ' + b + ' 중에서 더 큰 수를 쓰세요.', answer: String(Math.max(a, b)), explain: '수를 순서대로 세어 보면 ' + Math.max(a, b) + '이(가) 더 뒤에 있습니다.' };
      } },
    { name: '한 자리 수의 덧셈', std: '[2수01-05]', gen: function (r) {
        var a = r.i(1, 8), b = r.i(1, 9 - a);
        return { q: a + ' + ' + b + ' = ', answer: String(a + b), explain: a + '에서 ' + b + '만큼 이어 세면 ' + (a + b) + '입니다.' };
      } },
    { name: '한 자리 수의 뺄셈', std: '[2수01-05]', gen: function (r) {
        var a = r.i(4, 9), b = r.i(1, a - 1);
        return { q: a + ' − ' + b + ' = ', answer: String(a - b), explain: a + '개에서 ' + b + '개를 덜어 내면 ' + (a - b) + '개입니다.' };
      } },
    { name: '50까지의 수', std: '[2수01-02]', gen: function (r) {
        var t = r.i(1, 4), o = r.i(1, 9);
        if (r.i(0, 1)) return { q: '10개씩 ' + t + '묶음과 낱개 ' + o + '개는 모두 몇 개인가요?', answer: String(t * 10 + o), explain: '10이 ' + t + '개면 ' + (t * 10) + ', 낱개 ' + o + '개를 더하면 ' + (t * 10 + o) + '입니다.' };
        var n = t * 10 + o;
        return { q: n + '은 10개씩 몇 묶음과 낱개 몇 개인가요? (예: 2묶음 3개)', answer: t + '묶음 ' + o + '개', explain: n + ' = ' + (t * 10) + ' + ' + o + ' 이므로 ' + t + '묶음과 낱개 ' + o + '개입니다.' };
      } },
    { name: '100까지의 수', std: '[2수01-02]', gen: function (r) {
        var a = r.i(51, 98), b = r.i(51, 99); while (b === a) b = r.i(51, 99);
        if (r.i(0, 1)) return { q: a + '과 ' + b + ' 중 더 큰 수는?', answer: String(Math.max(a, b)), explain: '십의 자리부터 비교합니다. ' + Math.max(a, b) + '이(가) 더 큽니다.' };
        return { q: a + '보다 10 큰 수는 얼마인가요?', answer: String(a + 10), explain: '십의 자리 숫자가 1 커지므로 ' + (a + 10) + '입니다.' };
      } },
    { name: '받아올림 없는 덧셈·뺄셈', std: '[2수01-06]', gen: function (r) {
        var a = r.i(11, 40), b = r.i(11, 50);
        var au = a % 10, bu = b % 10;
        if (au + bu > 9) b = b - bu + (9 - au);
        if (r.i(0, 1)) return { q: a + ' + ' + b + ' = ', answer: String(a + b), explain: '십의 자리끼리, 낱개끼리 각각 더합니다.' };
        var big = Math.max(a, b), sml = Math.min(a, b);
        if (big % 10 < sml % 10) big = big - (big % 10) + 9;
        return { q: big + ' − ' + sml + ' = ', answer: String(big - sml), explain: '십의 자리끼리, 낱개끼리 각각 뺍니다.' };
      } },
    { name: '시계 보기', std: '[2수03-13]', gen: function (r) {
        var h = r.i(1, 12), half = r.i(0, 1);
        return { q: '시곗바늘이 짧은바늘 ' + h + ', 긴바늘 ' + (half ? 6 : 12) + '을 가리킵니다. 몇 시 몇 분인가요? (예: 3시 30분)',
          answer: h + '시 ' + (half ? '30분' : '00분'),
          explain: '긴바늘이 12면 정각, 6이면 30분입니다.' };
      } },
    { name: '길이·무게 비교', std: '[2수03-15]', pick: true, gen: function (r) {
        var n1 = r.pick(이름), n2 = r.pick(이름); while (n2 === n1) n2 = r.pick(이름);
        var a = r.i(10, 30), b = r.i(10, 30); while (b === a) b = r.i(10, 30);
        return { q: n1 + '의 색 테이프는 ' + a + '칸, ' + n2 + '의 색 테이프는 ' + b + '칸입니다. 누구의 것이 더 긴가요?',
          answer: a > b ? n1 : n2, choices: [n1, n2],
          explain: '칸 수가 많을수록 더 깁니다. ' + Math.max(a, b) + ' > ' + Math.min(a, b) };
      } }
  ];

  /* =====================================================================
     2학년
     ===================================================================== */
  var G2 = [
    { name: '세 자리 수', std: '[2수01-03]', gen: function (r) {
        var n = r.i(123, 879), t = r.i(0, 2);
        if (t === 0) return { q: fmt(n) + '에서 백의 자리 숫자는 무엇인가요?', answer: String(Math.floor(n / 100)), explain: '백의 자리는 왼쪽 첫 번째 자리입니다.' };
        if (t === 1) return { q: fmt(n) + '보다 100 큰 수를 쓰세요.', answer: String(n + 100), explain: '백의 자리 숫자가 1 커집니다.' };
        return { q: fmt(n) + '에서 십의 자리 숫자는 무엇인가요?',
          answer: String(Math.floor(n / 10) % 10),
          explain: '오른쪽에서 두 번째 자리가 십의 자리입니다.' };
      } },
    { name: '받아올림 있는 덧셈', std: '[2수01-06]', gen: function (r) {
        var a = r.i(25, 89), b = r.i(15, 79);
        if ((a % 10) + (b % 10) < 10) b = b - (b % 10) + r.i(10 - (a % 10), 9);
        return { q: a + ' + ' + b + ' = ', answer: String(a + b), explain: '낱개끼리 더해 10이 넘으면 십의 자리로 1을 올립니다.' };
      } },
    { name: '받아내림 있는 뺄셈', std: '[2수01-06]', gen: function (r) {
        var a = r.i(31, 95), b = r.i(12, a - 10);
        if ((a % 10) >= (b % 10)) b = b - (b % 10) + r.i((a % 10) + 1, 9);
        if (b >= a) b = a - r.i(11, 20);
        return { q: a + ' − ' + b + ' = ', answer: String(a - b), explain: '낱개끼리 뺄 수 없으면 십의 자리에서 10을 빌려 옵니다.' };
      } },
    { name: '곱셈구구', std: '[2수01-11]', gen: function (r) {
        var a = r.i(2, 9), b = r.i(2, 9);
        if (r.i(0, 1)) return { q: a + ' × ' + b + ' = ', answer: String(a * b), explain: a + '씩 ' + b + '묶음이므로 ' + (a * b) + '입니다.' };
        var n = r.pick(이름), m = r.pick(물건);
        return { q: J(n, '이/가') + ' ' + J(m, '을/를') + ' 한 봉지에 ' + a + '개씩 ' + b + '봉지 담았습니다. 모두 몇 개인가요?',
          answer: String(a * b) + '개', explain: a + ' × ' + b + ' = ' + (a * b) };
      } },
    { name: '길이 재기 (cm·m)', std: '[2수03-16]', gen: function (r) {
        var m = r.i(1, 5), c = r.i(1, 99);
        if (r.i(0, 1)) return { q: m + 'm ' + c + 'cm는 몇 cm인가요?', answer: String(m * 100 + c) + 'cm', explain: '1m는 100cm이므로 ' + (m * 100) + ' + ' + c + ' = ' + (m * 100 + c) };
        var tot = m * 100 + c;
        return { q: tot + 'cm는 몇 m 몇 cm인가요? (예: 2m 30cm)', answer: m + 'm ' + c + 'cm', explain: '100cm씩 묶으면 ' + m + '묶음이 되고 ' + c + 'cm가 남습니다.' };
      } },
    { name: '시각과 시간', std: '[2수03-14]', gen: function (r) {
        var h = r.i(1, 9), m = r.pick([5, 10, 15, 20, 25, 35, 40, 45, 50]);
        var add = r.pick([20, 30, 40, 50]);
        var tot = h * 60 + m + add, nh = Math.floor(tot / 60), nm = tot % 60;
        return { q: h + '시 ' + m + '분에서 ' + add + '분이 지나면 몇 시 몇 분인가요? (예: 3시 40분)',
          answer: nh + '시 ' + pad2(nm) + '분', explain: '1시간은 60분입니다. ' + m + ' + ' + add + ' = ' + (m + add) + '분' };
      } },
    { name: '분류와 표·그래프', std: '[2수04-01]', gen: function (r) {
        var a = r.i(3, 9), b = r.i(3, 9), c = r.i(3, 9);
        return { q: '좋아하는 과일을 조사했더니 사과 ' + a + '명, 딸기 ' + b + '명, 포도 ' + c + '명이었습니다. 조사한 학생은 모두 몇 명인가요?',
          answer: String(a + b + c) + '명', explain: a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) };
      } },
    { name: '규칙 찾기', std: '[2수02-01]', gen: function (r) {
        var s = r.i(2, 9), d = r.i(2, 6);
        return { q: s + ', ' + (s + d) + ', ' + (s + 2 * d) + ', ' + (s + 3 * d) + ', □ — □에 알맞은 수는?',
          answer: String(s + 4 * d), explain: d + '씩 커지는 규칙입니다.' };
      } },
    { name: '네 자리 수', std: '[2수01-04]', gen: function (r) {
        var n = r.i(1234, 9876);
        if (r.i(0, 1)) return { q: fmt(n) + '에서 천의 자리 숫자는 무엇인가요?', answer: String(Math.floor(n / 1000)), explain: '가장 왼쪽 자리가 천의 자리입니다.' };
        return { q: fmt(n) + '보다 1000 큰 수를 쓰세요.', answer: String(n + 1000), explain: '천의 자리 숫자가 1 커집니다.' };
      } }
  ];

  /* =====================================================================
     3학년
     ===================================================================== */
  var G3 = [
    { name: '세 자리 수의 덧셈·뺄셈', std: '[4수01-03]', gen: function (r) {
        var a = r.i(135, 899), b = r.i(126, 799);
        if (r.i(0, 1)) return { q: fmt(a) + ' + ' + fmt(b) + ' = ', answer: String(a + b), explain: '일의 자리부터 차례로 더하고 받아올림에 주의합니다.' };
        var big = Math.max(a, b) + 100, sml = Math.min(a, b);
        return { q: fmt(big) + ' − ' + fmt(sml) + ' = ', answer: String(big - sml), explain: '일의 자리부터 차례로 빼고 받아내림에 주의합니다.' };
      } },
    { name: '나눗셈', std: '[4수01-06]', gen: function (r) {
        var b = r.i(2, 9), q = r.i(2, 9), rem = r.i(0, b - 1), a = b * q + rem;
        if (rem === 0) return { q: a + ' ÷ ' + b + ' = ', answer: String(q), explain: b + ' × ' + q + ' = ' + a };
        return { q: a + ' ÷ ' + b + ' 의 몫과 나머지를 구하세요. (몫…나머지 로 쓰세요. 예: 3…1)',
          answer: q + '…' + rem, explain: b + ' × ' + q + ' = ' + (b * q) + ', 남는 수 ' + rem + ' → ' + q + '…' + rem };
      } },
    { name: '곱셈', std: '[4수01-04]', gen: function (r) {
        var a = r.i(12, 99), b = r.i(3, 9);
        if (r.i(0, 1)) return { q: a + ' × ' + b + ' = ', answer: String(a * b), explain: '일의 자리, 십의 자리를 차례로 곱해 더합니다.' };
        var c = r.i(11, 40), d = r.i(11, 30);
        return { q: c + ' × ' + d + ' = ', answer: String(c * d), explain: d + '을(를) 십의 자리와 일의 자리로 나누어 곱한 뒤 더합니다.' };
      } },
    { name: '길이와 시간', std: '[4수03-15]', gen: function (r) {
        var t = r.i(0, 2);
        if (t === 0) { var km = r.i(1, 9), m = r.i(100, 999); return { q: km + 'km ' + m + 'm는 몇 m인가요?', answer: String(km * 1000 + m) + 'm', explain: '1km = 1000m' }; }
        if (t === 1) { var mm = r.i(2, 9), c = r.i(1, 9); return { q: mm + 'cm ' + c + 'mm는 몇 mm인가요?', answer: String(mm * 10 + c) + 'mm', explain: '1cm = 10mm' }; }
        var s = r.i(70, 200); return { q: s + '초는 몇 분 몇 초인가요? (예: 2분 10초)', answer: Math.floor(s / 60) + '분 ' + (s % 60) + '초', explain: '1분 = 60초' };
      } },
    { name: '분수와 소수', std: '[4수01-09]', gen: function (r) {
        var t = r.i(0, 2);
        if (t === 0) { var d = r.i(4, 9), n = r.i(1, d - 1); return { q: '전체를 똑같이 ' + d + '로 나눈 것 중 ' + n + '만큼을 분수로 쓰세요. (예: 3/5)', answer: n + '/' + d, explain: '분모는 나눈 수, 분자는 색칠한 수입니다.' }; }
        if (t === 1) { var d2 = r.i(4, 9), a = r.i(1, d2 - 1), b = r.i(1, d2 - 1); while (b === a) b = r.i(1, d2 - 1);
          return { q: a + '/' + d2 + ' , ' + b + '/' + d2 + ' 중 더 큰 수는? (예: 3/5)', answer: Math.max(a, b) + '/' + d2, explain: '분모가 같으면 분자가 클수록 큽니다.' }; }
        var w = r.i(1, 9), f = r.i(1, 9);
        return { q: w + ' 과 ' + f + '/10을 소수로 쓰세요. (예: 2.4)', answer: w + '.' + f, explain: '1/10은 소수 0.1입니다.' };
      } },
    { name: '원', std: '[4수03-06]', gen: function (r) {
        var rd = r.i(3, 15);
        if (r.i(0, 1)) return { q: '반지름이 ' + rd + 'cm인 원의 지름은 몇 cm인가요?', answer: String(rd * 2) + 'cm', explain: '지름 = 반지름 × 2' };
        return { q: '지름이 ' + (rd * 2) + 'cm인 원의 반지름은 몇 cm인가요?', answer: String(rd) + 'cm', explain: '반지름 = 지름 ÷ 2' };
      } },
    { name: '평면도형', std: '[4수03-01]', pick: true, gen: function (r) {
        return r.pick([
          { q: '변이 3개, 꼭짓점이 3개인 도형의 이름은?', answer: '삼각형', explain: '변과 꼭짓점이 각각 3개인 도형입니다.' },
          { q: '네 각이 모두 직각인 사각형의 이름은?', answer: '직사각형', explain: '네 각이 모두 직각인 사각형입니다.' },
          { q: '네 변의 길이가 모두 같고 네 각이 모두 직각인 사각형은?', answer: '정사각형', explain: '변의 길이와 각이 모두 같습니다.' },
          { q: '한 점에서 그은 두 반직선이 이루는 도형을 무엇이라 하나요?', answer: '각', explain: '꼭짓점과 두 변으로 이루어집니다.' },
          { q: '직각보다 작은 각을 무엇이라 하나요?', answer: '예각', explain: '0°보다 크고 직각(90°)보다 작은 각입니다.' },
          { q: '직각보다 크고 180°보다 작은 각을 무엇이라 하나요?', answer: '둔각', explain: '직각보다 벌어진 각입니다.' },
          { q: '양쪽으로 끝없이 뻗은 곧은 선을 무엇이라 하나요?', answer: '직선', explain: '양끝이 없는 곧은 선입니다.' },
          { q: '한쪽으로만 끝없이 뻗은 곧은 선을 무엇이라 하나요?', answer: '반직선', explain: '시작점이 있고 한쪽으로만 뻗습니다.' },
          { q: '두 점을 곧게 이은 선을 무엇이라 하나요?', answer: '선분', explain: '양끝이 있는 곧은 선입니다.' },
          { q: '각을 이루는 두 변이 만나는 점을 무엇이라 하나요?', answer: '꼭짓점', explain: '두 변이 만나는 자리입니다.' },
          { q: '원의 중심을 지나 원 위의 두 점을 잇는 선분을 무엇이라 하나요?', answer: '지름', explain: '원에서 가장 긴 선분입니다.' }
        ]);
      } },
    { name: '자료의 정리', std: '[4수04-01]', gen: function (r) {
        var t = r.i(0, 2);
        var big = r.i(10, 28), sml = r.i(3, 9);
        if (t === 0) return { q: '표에서 1반은 ' + big + '명, 2반은 ' + sml + '명이 참여했습니다. 1반은 2반보다 몇 명 더 많은가요?',
          answer: String(big - sml) + '명', explain: big + ' − ' + sml + ' = ' + (big - sml) };
        if (t === 1) { var a = r.i(5, 20), b = r.i(5, 20), c = r.i(5, 20);
          return { q: '조사 결과가 ' + a + '명, ' + b + '명, ' + c + '명입니다. 모두 몇 명인가요?',
            answer: String(a + b + c) + '명', explain: a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) }; }
        var one = r.pick([2, 5, 10]), cnt = r.i(3, 9);
        return { q: '그림그래프에서 그림 하나가 ' + one + '명을 나타냅니다. 그림이 ' + cnt + '개이면 몇 명인가요?',
          answer: String(one * cnt) + '명', explain: one + ' × ' + cnt + ' = ' + (one * cnt) };
      } }
  ];

  /* =====================================================================
     4학년
     ===================================================================== */
  var G4 = [
    { name: '큰 수', std: '[4수01-01]', gen: function (r) {
        var n = r.i(10000, 99999) * r.pick([1, 10]);
        if (r.i(0, 1)) return { q: fmt(n) + '에서 만의 자리 숫자는 무엇인가요?', answer: String(Math.floor(n / 10000) % 10), explain: '오른쪽에서 다섯 번째 자리가 만의 자리입니다.' };
        return { q: fmt(n) + '보다 10000 큰 수를 쓰세요.', answer: String(n + 10000), explain: '만의 자리 숫자가 1 커집니다.' };
      } },
    { name: '곱셈', std: '[4수01-04]', gen: function (r) {
        var a = r.i(120, 899), b = r.i(12, 79);
        return { q: fmt(a) + ' × ' + b + ' = ', answer: String(a * b), explain: b + '을(를) 십의 자리와 일의 자리로 나누어 곱한 뒤 더합니다.' };
      } },
    { name: '나눗셈', std: '[4수01-07]', gen: function (r) {
        var b = r.i(12, 45), q = r.i(6, 40), rem = r.i(0, b - 1), a = b * q + rem;
        if (rem === 0) return { q: fmt(a) + ' ÷ ' + b + ' = ', answer: String(q), explain: b + ' × ' + q + ' = ' + fmt(a) };
        return { q: fmt(a) + ' ÷ ' + b + ' 의 몫과 나머지를 구하세요. (몫…나머지 로 쓰세요. 예: 12…3)',
          answer: q + '…' + rem, explain: b + ' × ' + q + ' = ' + fmt(b * q) + ', 남는 수 ' + rem + ' → ' + q + '…' + rem };
      } },
    { name: '어림셈', std: '[4수01-08]', gen: function (r) {
        var n = r.i(1234, 98765), p = r.pick([100, 1000]);
        var up = Math.ceil(n / p) * p, down = Math.floor(n / p) * p;
        var half = (n % p) >= p / 2 ? up : down;
        return { q: fmt(n) + '을(를) 반올림하여 ' + (p === 100 ? '백' : '천') + '의 자리까지 나타내세요.',
          answer: String(half), explain: (p === 100 ? '십' : '백') + '의 자리 숫자를 보고 5 이상이면 올리고 4 이하면 버립니다.' };
      } },
    { name: '분수', std: '[4수01-10]', gen: function (r) {
        var d = r.i(3, 9), w = r.i(1, 4), n = r.i(1, d - 1);
        if (r.i(0, 1)) return { q: w + ' 과 ' + n + '/' + d + ' 를 가분수로 나타내세요. (예: 7/3)',
          answer: (w * d + n) + '/' + d, explain: w + ' × ' + d + ' + ' + n + ' = ' + (w * d + n) };
        var imp = w * d + n;
        return { q: imp + '/' + d + ' 를 대분수로 나타내세요. (예: 2와 1/3 → 2와1/3)',
          answer: w + '와' + n + '/' + d, explain: imp + ' ÷ ' + d + ' = 몫 ' + w + ', 나머지 ' + n };
      } },
    { name: '분수의 덧셈과 뺄셈', std: '[4수01-15]', gen: function (r) {
        var d = r.i(4, 9), a = r.i(1, d - 1), b = r.i(1, d - 1);
        if (r.i(0, 1)) return { q: a + '/' + d + ' + ' + b + '/' + d + ' = (분수로 쓰세요)', answer: (a + b) + '/' + d, explain: '분모가 같으면 분자끼리 더합니다.' };
        var big = Math.max(a, b), sml = Math.min(a, b);
        return { q: big + '/' + d + ' − ' + sml + '/' + d + ' = (분수로 쓰세요)', answer: (big - sml) + '/' + d, explain: '분모가 같으면 분자끼리 뺍니다.' };
      } },
    { name: '소수', std: '[4수01-13]', gen: function (r) {
        var n = r.i(101, 999) / 100;
        if (r.i(0, 1)) return { q: n.toFixed(2) + '에서 소수 첫째 자리 숫자는 무엇인가요?', answer: String(Math.floor(n * 10) % 10), explain: '소수점 바로 오른쪽이 소수 첫째 자리입니다.' };
        var m = r.i(11, 99) / 10;
        return { q: m.toFixed(1) + '의 10배는 얼마인가요?', answer: String(Math.round(m * 10)), explain: '10배 하면 소수점이 오른쪽으로 한 칸 옮겨집니다.' };
      } },
    { name: '소수의 덧셈과 뺄셈', std: '[4수01-16]', gen: function (r) {
        var a = r.i(15, 250) / 10, b = r.i(12, 180) / 10;
        if (r.i(0, 1)) return { q: a.toFixed(1) + ' + ' + b.toFixed(1) + ' = ', answer: (a + b).toFixed(1), explain: '소수점의 자리를 맞추어 더합니다.' };
        var big = Math.max(a, b), sml = Math.min(a, b);
        return { q: big.toFixed(1) + ' − ' + sml.toFixed(1) + ' = ', answer: (big - sml).toFixed(1), explain: '소수점의 자리를 맞추어 뺍니다.' };
      } },
    { name: '규칙 찾기', std: '[4수02-01]', gen: function (r) {
        var s = r.i(3, 20), d = r.i(3, 12);
        if (r.i(0, 1)) return { q: s + ', ' + (s + d) + ', ' + (s + 2 * d) + ', ' + (s + 3 * d) + ', □ — □에 알맞은 수는?', answer: String(s + 4 * d), explain: d + '씩 커집니다.' };
        var m = r.i(2, 4), b0 = r.i(2, 6);
        return { q: b0 + ', ' + (b0 * m) + ', ' + (b0 * m * m) + ', □ — □에 알맞은 수는?', answer: String(b0 * m * m * m), explain: m + '배씩 커집니다.' };
      } },
    { name: '등호와 동치 관계', std: '[4수02-03]', gen: function (r) {
        var a = r.i(12, 60), b = r.i(5, 40), c = r.i(3, 30);
        return { q: a + ' + ' + b + ' = ' + c + ' + □ — □에 알맞은 수는?', answer: String(a + b - c), explain: '양쪽의 값이 같아야 하므로 ' + (a + b) + ' − ' + c + ' = ' + (a + b - c) };
      } },
    { name: '각도', std: '[4수03-02]', gen: function (r) {
        var t = r.i(0, 2);
        if (t === 0) { var a = r.i(20, 120), b = r.i(15, 60); return { q: a + '° 와 ' + b + '° 의 합은 몇 도인가요?', answer: String(a + b) + '°', explain: a + ' + ' + b + ' = ' + (a + b) }; }
        if (t === 1) { var x = r.i(25, 110), y = r.i(20, 100); var z = 180 - x - y; if (z < 10) { x = 60; y = 70; z = 50; }
          return { q: '삼각형의 두 각이 ' + x + '° , ' + y + '° 입니다. 나머지 한 각은 몇 도인가요?', answer: String(180 - x - y) + '°', explain: '삼각형 세 각의 합은 180°입니다.' }; }
        var p = r.i(40, 140), q2 = r.i(40, 140), s = r.i(40, 140);
        return { q: '사각형의 세 각이 ' + p + '° , ' + q2 + '° , ' + s + '° 입니다. 나머지 한 각은 몇 도인가요?', answer: String(360 - p - q2 - s) + '°', explain: '사각형 네 각의 합은 360°입니다.' };
      } },
    { name: '삼각형', std: '[4수03-08]', pick: true, gen: function (r) {
        return r.pick([
          { q: '세 변의 길이가 모두 같은 삼각형의 이름은?', answer: '정삼각형', explain: '세 변과 세 각이 모두 같습니다.' },
          { q: '두 변의 길이가 같은 삼각형의 이름은?', answer: '이등변삼각형', explain: '두 변이 같으면 두 각도 같습니다.' },
          { q: '한 각이 직각인 삼각형의 이름은?', answer: '직각삼각형', explain: '90°인 각이 하나 있습니다.' },
          { q: '한 각이 둔각인 삼각형의 이름은?', answer: '둔각삼각형', explain: '90°보다 큰 각이 하나 있습니다.' },
          { q: '세 각이 모두 예각인 삼각형의 이름은?', answer: '예각삼각형', explain: '세 각이 모두 90°보다 작습니다.' },
          { q: '정삼각형의 한 각의 크기는 몇 도인가요?', answer: '60°', explain: '180° ÷ 3 = 60°' },
          { q: '삼각형 세 각의 크기의 합은 몇 도인가요?', answer: '180°', explain: '어떤 삼각형이든 세 각의 합은 180°입니다.' },
          { q: '이등변삼각형에서 길이가 같은 두 변이 만드는 두 각을 무엇이라 하나요?', answer: '밑각', explain: '두 밑각의 크기는 서로 같습니다.' },
          { q: '직각삼각형에서 직각의 맞은편에 있는 가장 긴 변을 무엇이라 하나요?', answer: '빗변', explain: '직각과 마주 보는 변입니다.' }
        ]);
      } },
    { name: '사각형과 다각형', std: '[4수03-10]', pick: true, gen: function (r) {
        return r.pick([
          { q: '마주 보는 한 쌍의 변이 평행한 사각형의 이름은?', answer: '사다리꼴', explain: '평행한 변이 한 쌍 있습니다.' },
          { q: '마주 보는 두 쌍의 변이 서로 평행한 사각형의 이름은?', answer: '평행사변형', explain: '평행한 변이 두 쌍입니다.' },
          { q: '네 변의 길이가 모두 같은 사각형의 이름은?', answer: '마름모', explain: '네 변의 길이가 같습니다.' },
          { q: '변이 6개인 다각형의 이름은?', answer: '육각형', explain: '변의 수로 이름을 붙입니다.' },
          { q: '변이 5개인 다각형의 이름은?', answer: '오각형', explain: '변의 수로 이름을 붙입니다.' },
          { q: '변이 8개인 다각형의 이름은?', answer: '팔각형', explain: '변의 수로 이름을 붙입니다.' },
          { q: '변의 길이가 모두 같고 각의 크기도 모두 같은 다각형을 무엇이라 하나요?', answer: '정다각형', explain: '변과 각이 모두 같은 다각형입니다.' },
          { q: '다각형에서 이웃하지 않은 두 꼭짓점을 이은 선분을 무엇이라 하나요?', answer: '대각선', explain: '마주 보는 꼭짓점을 잇습니다.' },
          { q: '사각형 네 각의 크기의 합은 몇 도인가요?', answer: '360°', explain: '삼각형 두 개로 나눌 수 있어 180° × 2 = 360°' },
          { q: '두 대각선이 서로 수직으로 만나는 사각형의 이름은?', answer: '마름모', explain: '마름모의 두 대각선은 수직으로 만납니다.' }
        ]);
      } },
    { name: '시각과 시간', std: '[4수03-14]', gen: function (r) {
        var h = r.i(1, 9), m = r.pick([10, 15, 20, 25, 35, 40, 50]);
        var ah = r.i(1, 3), am = r.pick([20, 25, 35, 45, 50]);
        var tot = h * 60 + m + ah * 60 + am;
        return { q: h + '시 ' + m + '분에서 ' + ah + '시간 ' + am + '분이 지나면 몇 시 몇 분인가요? (예: 5시 20분)',
          answer: (Math.floor(tot / 60) % 24) + '시 ' + pad2(tot % 60) + '분', explain: '분끼리 더해 60이 넘으면 1시간으로 올립니다.' };
      } },
    { name: '길이·들이·무게', std: '[4수03-18]', gen: function (r) {
        var t = r.i(0, 2);
        if (t === 0) { var l = r.i(1, 9), ml = r.i(100, 900); return { q: l + 'L ' + ml + 'mL는 몇 mL인가요?', answer: String(l * 1000 + ml) + 'mL', explain: '1L = 1000mL' }; }
        if (t === 1) { var kg = r.i(1, 9), g = r.i(100, 900); return { q: kg + 'kg ' + g + 'g는 몇 g인가요?', answer: String(kg * 1000 + g) + 'g', explain: '1kg = 1000g' }; }
        var t1 = r.i(1, 5), kg2 = r.i(100, 900); return { q: t1 + 't ' + kg2 + 'kg는 몇 kg인가요?', answer: String(t1 * 1000 + kg2) + 'kg', explain: '1t = 1000kg' };
      } },
    { name: '자료와 그래프', std: '[4수04-02]', gen: function (r) {
        var a = r.i(20, 60), b = r.i(20, 60), c = r.i(20, 60), d = r.i(20, 60);
        var arr = [a, b, c, d];
        return { q: '네 반의 도서 대출 수가 ' + arr.join(', ') + '권입니다. 가장 많은 반과 가장 적은 반의 차는 몇 권인가요?',
          answer: String(Math.max.apply(null, arr) - Math.min.apply(null, arr)) + '권',
          explain: Math.max.apply(null, arr) + ' − ' + Math.min.apply(null, arr) };
      } }
  ];

  /* =====================================================================
     5학년
     ===================================================================== */
  var G5 = [
    { name: '자연수의 혼합 계산', std: '[6수01-01]', gen: function (r) {
        var a = r.i(3, 12), b = r.i(2, 9), c = r.i(2, 9), d = r.i(2, 9);
        if (r.i(0, 1)) return { q: a + ' + ' + b + ' × ' + c + ' = ', answer: String(a + b * c), explain: '곱셈을 먼저 계산합니다.' };
        return { q: '(' + a + ' + ' + b + ') × ' + c + ' − ' + d + ' = ', answer: String((a + b) * c - d), explain: '괄호 → 곱셈 → 덧셈·뺄셈 순서입니다.' };
      } },
    { name: '약수와 배수', std: '[6수01-02]', gen: function (r) {
        var a = r.pick([12, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48]), b = r.pick([8, 9, 12, 15, 16, 18, 20, 24]);
        if (r.i(0, 1)) return { q: a + ', ' + b + ' 의 최대공약수를 구하세요.', answer: String(gcd(a, b)), explain: '두 수를 모두 나누어떨어지게 하는 가장 큰 수입니다.' };
        return { q: a + ', ' + b + ' 의 최소공배수를 구하세요.', answer: String(a * b / gcd(a, b)), explain: 'a × b ÷ 최대공약수 로 구합니다.' };
      } },
    { name: '약분과 통분', std: '[6수01-04]', gen: function (r) {
        var k = r.i(2, 6), n = r.i(2, 8), d = n + r.i(1, 7);
        var N = n * k, D = d * k, s = red(N, D);
        return { q: N + '/' + D + ' 를 기약분수로 나타내세요. (예: 2/3)', answer: s[0] + '/' + s[1],
          explain: '분자와 분모를 최대공약수 ' + gcd(N, D) + '(으)로 나눕니다.' };
      } },
    { name: '분수의 덧셈과 뺄셈', std: '[6수01-05]', gen: function (r) {
        var d1 = r.pick([2, 3, 4, 5, 6, 8]), d2 = r.pick([3, 4, 5, 6, 8, 9]);
        while (d2 === d1) d2 = r.pick([3, 4, 5, 6, 8, 9]);
        var n1 = r.i(1, d1 - 1), n2 = r.i(1, d2 - 1);
        var N = n1 * d2 + n2 * d1, D = d1 * d2, s = red(N, D);
        if (r.i(0, 1)) return { q: n1 + '/' + d1 + ' + ' + n2 + '/' + d2 + ' = (기약분수로)', answer: s[0] + '/' + s[1], explain: '통분한 뒤 분자끼리 더하고 약분합니다.' };
        var N2 = n1 * d2 - n2 * d1;
        if (N2 <= 0) { var t = red(Math.abs(N2) || 1, D); return { q: n2 + '/' + d2 + ' − ' + n1 + '/' + d1 + ' = (기약분수로)', answer: t[0] + '/' + t[1], explain: '통분한 뒤 분자끼리 뺍니다.' }; }
        var s2 = red(N2, D);
        return { q: n1 + '/' + d1 + ' − ' + n2 + '/' + d2 + ' = (기약분수로)', answer: s2[0] + '/' + s2[1], explain: '통분한 뒤 분자끼리 뺍니다.' };
      } },
    { name: '다각형의 둘레와 넓이', std: '[6수03-03]', gen: function (r) {
        var t = r.i(0, 2);
        if (t === 0) { var a = r.i(4, 20), b = r.i(4, 20); return { q: '가로 ' + a + 'cm, 세로 ' + b + 'cm인 직사각형의 넓이는 몇 cm²인가요?', answer: String(a * b) + 'cm²', explain: '넓이 = 가로 × 세로' }; }
        if (t === 1) { var bb = r.i(4, 20), h = r.i(4, 18); return { q: '밑변 ' + bb + 'cm, 높이 ' + h + 'cm인 삼각형의 넓이는 몇 cm²인가요?', answer: String(bb * h / 2) + 'cm²', explain: '넓이 = 밑변 × 높이 ÷ 2' }; }
        var u = r.i(4, 14), l = r.i(6, 20), hh = r.i(4, 12);
        return { q: '윗변 ' + u + 'cm, 아랫변 ' + l + 'cm, 높이 ' + hh + 'cm인 사다리꼴의 넓이는 몇 cm²인가요?',
          answer: String((u + l) * hh / 2) + 'cm²', explain: '넓이 = (윗변 + 아랫변) × 높이 ÷ 2' };
      } },
    { name: '분수의 곱셈', std: '[6수01-06]', gen: function (r) {
        var n1 = r.i(1, 5), d1 = n1 + r.i(1, 5), n2 = r.i(1, 5), d2 = n2 + r.i(1, 5);
        var s = red(n1 * n2, d1 * d2);
        if (r.i(0, 1)) return { q: n1 + '/' + d1 + ' × ' + n2 + '/' + d2 + ' = (기약분수로)', answer: s[0] + '/' + s[1], explain: '분자끼리, 분모끼리 곱한 뒤 약분합니다.' };
        var w = r.i(2, 9), s2 = red(n1 * w, d1);
        return { q: n1 + '/' + d1 + ' × ' + w + ' = (기약분수 또는 자연수로)', answer: s2[1] === 1 ? String(s2[0]) : s2[0] + '/' + s2[1], explain: '분자에 자연수를 곱한 뒤 약분합니다.' };
      } },
    { name: '소수의 곱셈', std: '[6수01-08]', gen: function (r) {
        var a = r.i(11, 99) / 10, b = r.i(2, 9);
        if (r.i(0, 1)) return { q: a.toFixed(1) + ' × ' + b + ' = ', answer: String(+(a * b).toFixed(2)), explain: '자연수처럼 곱한 뒤 소수점을 찍습니다.' };
        var c = r.i(11, 49) / 10, d = r.i(11, 39) / 10;
        return { q: c.toFixed(1) + ' × ' + d.toFixed(1) + ' = ', answer: String(+(c * d).toFixed(2)), explain: '소수점 아래 자리 수를 더한 만큼 소수점을 찍습니다.' };
      } },
    { name: '합동과 대칭', std: '[6수03-01]', pick: true, gen: function (r) {
        return r.pick([
          { q: '모양과 크기가 같아 완전히 포개어지는 두 도형을 무엇이라 하나요?', answer: '합동', explain: '대응변과 대응각의 크기가 모두 같습니다.' },
          { q: '한 직선을 따라 접었을 때 완전히 겹쳐지는 도형을 무엇이라 하나요?', answer: '선대칭도형', explain: '접는 직선을 대칭축이라고 합니다.' },
          { q: '한 점을 중심으로 180° 돌렸을 때 처음과 완전히 겹쳐지는 도형은?', answer: '점대칭도형', explain: '중심이 되는 점을 대칭의 중심이라고 합니다.' },
          { q: '선대칭도형에서 접는 기준이 되는 직선을 무엇이라 하나요?', answer: '대칭축', explain: '이 직선을 따라 접으면 완전히 겹칩니다.' },
          { q: '점대칭도형에서 중심이 되는 점을 무엇이라 하나요?', answer: '대칭의 중심', explain: '이 점을 중심으로 180° 돌리면 겹칩니다.' },
          { q: '합동인 두 도형에서 서로 겹치는 변을 무엇이라 하나요?', answer: '대응변', explain: '대응변의 길이는 서로 같습니다.' },
          { q: '합동인 두 도형에서 서로 겹치는 각을 무엇이라 하나요?', answer: '대응각', explain: '대응각의 크기는 서로 같습니다.' },
          { q: '정사각형의 대칭축은 모두 몇 개인가요?', answer: '4개', explain: '가로·세로 각 1개, 대각선 2개입니다.' },
          { q: '원의 대칭축은 모두 몇 개인가요?', answer: '셀 수 없이 많다', explain: '중심을 지나는 모든 직선이 대칭축입니다.' }
        ]);
      } },
    { name: '직육면체', std: '[6수03-05]', gen: function (r) {
        return r.pick([
          { q: '직육면체의 면은 모두 몇 개인가요?', answer: '6개', explain: '마주 보는 면이 3쌍입니다.' },
          { q: '직육면체의 모서리는 모두 몇 개인가요?', answer: '12개', explain: '길이가 같은 모서리가 4개씩 3묶음입니다.' },
          { q: '직육면체의 꼭짓점은 모두 몇 개인가요?', answer: '8개', explain: '위아래 각 4개씩입니다.' },
          { q: '직육면체에서 한 면과 마주 보는 면은 몇 개인가요?', answer: '1개', explain: '마주 보는 면은 한 쌍씩입니다.' },
          { q: '직육면체에서 한 면과 수직으로 만나는 면은 몇 개인가요?', answer: '4개', explain: '마주 보는 면 1개를 뺀 나머지입니다.' },
          { q: '모든 면이 정사각형인 직육면체를 무엇이라 하나요?', answer: '정육면체', explain: '모서리 길이가 모두 같습니다.' },
          { q: '직육면체를 잘라 펼친 그림을 무엇이라 하나요?', answer: '전개도', explain: '접으면 다시 입체가 됩니다.' },
          { q: '직육면체에서 서로 평행한 모서리는 한 모서리마다 몇 개인가요?', answer: '3개', explain: '길이가 같은 모서리 4개가 한 묶음이므로 자기 자신을 뺀 3개입니다.' }
        ]);
      } },
    { name: '평균과 가능성', std: '[6수04-02]', gen: function (r) {
        var n = 4, arr = [], sum = 0;
        for (var i = 0; i < n; i++) { var v = r.i(4, 20) * 5; arr.push(v); sum += v; }
        var avg = sum / n;
        if (avg % 1 !== 0) { arr[3] = arr[3] + (n - (sum % n)) % n; sum = arr.reduce(function (a, b) { return a + b; }, 0); avg = sum / n; }
        return { q: '네 번의 기록이 ' + arr.join(', ') + '입니다. 평균은 얼마인가요?', answer: String(avg), explain: '합 ' + sum + ' ÷ ' + n + ' = ' + avg };
      } }
  ];

  /* =====================================================================
     6학년
     ===================================================================== */
  var G6 = [
    { name: '분수의 나눗셈', std: '[6수01-07]', gen: function (r) {
        var n = r.i(1, 6), d = n + r.i(1, 5), w = r.i(2, 9);
        if (r.i(0, 1)) { var s = red(n, d * w); return { q: n + '/' + d + ' ÷ ' + w + ' = (기약분수로)', answer: s[0] + '/' + s[1], explain: '나누는 수의 역수를 곱합니다.' }; }
        var n2 = r.i(1, 5), d2 = n2 + r.i(1, 5), s2 = red(n * d2, d * n2);
        return { q: n + '/' + d + ' ÷ ' + n2 + '/' + d2 + ' = (기약분수 또는 자연수로)',
          answer: s2[1] === 1 ? String(s2[0]) : s2[0] + '/' + s2[1], explain: '÷ ' + n2 + '/' + d2 + ' 는 × ' + d2 + '/' + n2 + ' 와 같습니다.' };
      } },
    { name: '소수의 나눗셈', std: '[6수01-09]', gen: function (r) {
        var b = r.i(2, 9), q = r.i(11, 99) / 10;
        var a = +(q * b).toFixed(2);
        return { q: a + ' ÷ ' + b + ' = ', answer: String(+q.toFixed(2)), explain: '자연수처럼 나눈 뒤 소수점을 그대로 내려 찍습니다.' };
      } },
    { name: '비와 비율', std: '[6수02-01]', gen: function (r) {
        var whole = r.pick([20, 25, 40, 50, 200, 250]), part = Math.round(whole * r.pick([0.1, 0.2, 0.25, 0.4, 0.5, 0.6]));
        if (r.i(0, 1)) return { q: '전체 ' + whole + '명 중 ' + part + '명이 찬성했습니다. 찬성한 사람의 비율을 백분율로 나타내세요.',
          answer: String(Math.round(part / whole * 100)) + '%', explain: part + ' ÷ ' + whole + ' × 100' };
        return { q: whole + '에 대한 ' + part + '의 비를 기호 : 를 써서 나타내세요. (예: 3:4)', answer: part + ':' + whole, explain: '비교하는 양 : 기준량' };
      } },
    { name: '비례식과 비례배분', std: '[6수02-03]', gen: function (r) {
        var a = r.i(2, 9), b = r.i(2, 9), k = r.i(2, 6);
        if (r.i(0, 1)) return { q: a + ' : ' + b + ' = ' + (a * k) + ' : □ — □에 알맞은 수는?', answer: String(b * k), explain: '두 비의 비율이 같아야 하므로 ' + b + ' × ' + k };
        var tot = (a + b) * k;
        return { q: '사탕 ' + tot + '개를 ' + a + ' : ' + b + '으로 나누면 각각 몇 개인가요? (예: 12개, 8개)',
          answer: (a * k) + '개, ' + (b * k) + '개', explain: '전체를 ' + (a + b) + '묶음으로 보고 한 묶음은 ' + k + '개입니다.' };
      } },
    { name: '각기둥과 각뿔', std: '[6수03-06]', gen: function (r) {
        var n = r.i(3, 8), names = { 3: '삼', 4: '사', 5: '오', 6: '육', 7: '칠', 8: '팔' };
        if (r.i(0, 1)) return { q: names[n] + '각기둥의 모서리는 모두 몇 개인가요?', answer: String(n * 3) + '개', explain: '밑면 모서리 ' + n + '개 × 2 + 옆모서리 ' + n + '개' };
        return { q: names[n] + '각뿔의 꼭짓점은 모두 몇 개인가요?', answer: String(n + 1) + '개', explain: '밑면 꼭짓점 ' + n + '개 + 뿔의 꼭짓점 1개' };
      } },
    { name: '직육면체의 부피와 겉넓이', std: '[6수03-08]', gen: function (r) {
        var a = r.i(2, 12), b = r.i(2, 12), c = r.i(2, 12);
        if (r.i(0, 1)) return { q: '가로 ' + a + 'cm, 세로 ' + b + 'cm, 높이 ' + c + 'cm인 직육면체의 부피는 몇 cm³인가요?',
          answer: String(a * b * c) + 'cm³', explain: '부피 = 가로 × 세로 × 높이' };
        return { q: '가로 ' + a + 'cm, 세로 ' + b + 'cm, 높이 ' + c + 'cm인 직육면체의 겉넓이는 몇 cm²인가요?',
          answer: String(2 * (a * b + b * c + a * c)) + 'cm²', explain: '겉넓이 = 2 × (가로×세로 + 세로×높이 + 가로×높이)' };
      } },
    { name: '원주와 원의 넓이', std: '[6수03-09]', gen: function (r) {
        var rd = r.i(2, 15);
        if (r.i(0, 1)) return { q: '반지름이 ' + rd + 'cm인 원의 원주는 몇 cm인가요? (원주율 3.14)',
          answer: String(+(2 * rd * 3.14).toFixed(2)) + 'cm', explain: '원주 = 지름 × 원주율 = ' + (rd * 2) + ' × 3.14' };
        return { q: '반지름이 ' + rd + 'cm인 원의 넓이는 몇 cm²인가요? (원주율 3.14)',
          answer: String(+(rd * rd * 3.14).toFixed(2)) + 'cm²', explain: '넓이 = 반지름 × 반지름 × 원주율' };
      } },
    { name: '원기둥·원뿔·구', std: '[6수03-10]', pick: true, gen: function (r) {
        return r.pick([
          { q: '원기둥에서 두 밑면은 서로 어떤 관계인가요? (한 낱말로)', answer: '평행', explain: '두 밑면은 서로 평행하고 합동인 원입니다.' },
          { q: '원뿔에서 꼭짓점과 밑면인 원의 둘레의 한 점을 이은 선분을 무엇이라 하나요?', answer: '모선', explain: '모선의 길이는 어디를 재도 같습니다.' },
          { q: '구를 어느 방향으로 잘라도 그 단면은 항상 어떤 도형인가요?', answer: '원', explain: '구는 모든 방향에서 중심까지의 거리가 같습니다.' },
          { q: '원기둥의 밑면은 모두 몇 개인가요?', answer: '2개', explain: '위와 아래에 하나씩 있습니다.' },
          { q: '원뿔의 밑면은 모두 몇 개인가요?', answer: '1개', explain: '아래쪽 원 하나뿐입니다.' },
          { q: '원기둥의 전개도에서 옆면은 어떤 도형이 되나요?', answer: '직사각형', explain: '펼치면 직사각형이 됩니다.' },
          { q: '구의 중심에서 겉면의 한 점까지의 거리를 무엇이라 하나요?', answer: '반지름', explain: '어느 방향으로 재도 같습니다.' },
          { q: '직사각형을 한 변을 축으로 한 바퀴 돌리면 어떤 입체가 되나요?', answer: '원기둥', explain: '회전시키면 원기둥이 만들어집니다.' },
          { q: '직각삼각형을 직각을 낀 한 변을 축으로 한 바퀴 돌리면 어떤 입체가 되나요?', answer: '원뿔', explain: '회전시키면 원뿔이 만들어집니다.' }
        ]);
      } },
    { name: '비율그래프', std: '[6수04-03]', gen: function (r) {
        var p = r.pick([10, 15, 20, 25, 30, 40]), tot = r.pick([200, 300, 400, 500]);
        return { q: '띠그래프에서 어떤 항목이 전체의 ' + p + '%를 차지합니다. 전체가 ' + tot + '명이라면 그 항목은 몇 명인가요?',
          answer: String(tot * p / 100) + '명', explain: tot + ' × ' + p + ' ÷ 100' };
      } },
    { name: '자료의 표현', std: '[6수04-01]', gen: function (r) {
        var arr = [r.i(10, 40), r.i(10, 40), r.i(10, 40), r.i(10, 40), r.i(10, 40)];
        var sum = arr.reduce(function (a, b) { return a + b; }, 0);
        var sorted = arr.slice().sort(function (a, b) { return a - b; });
        return { q: '자료 ' + arr.join(', ') + ' 의 중앙값을 구하세요.', answer: String(sorted[2]),
          explain: '크기순으로 늘어놓으면 ' + sorted.join(', ') + ' 이고 가운데 값은 ' + sorted[2] + '입니다. (합 ' + sum + ')' };
      } }
  ];

  var UNITS = { 1: G1, 2: G2, 3: G3, 4: G4, 5: G5, 6: G6 };

  /* 학년별 하루 문항 수 — 1일 적정 학습량 기준 문서 반영 */
  var COUNT = { 1: 8, 2: 9, 3: 12, 4: 14, 5: 15, 6: 15 };

  function make(grade, dateStr, count) {
    grade = Math.min(6, Math.max(1, grade | 0));
    var units = UNITS[grade];
    var n = count || COUNT[grade];
    var R = rng(hash('math|' + grade + '|' + dateStr));
    var r = mk(R);
    var dayNo = Math.floor(hash(dateStr) % units.length);
    // 오늘 단원 2문제 → 다음 단원부터 2문제씩 나선형 복습. 한 단원이 3번 넘게 나오지 않는다.
    var order = [];
    for (var k = 0; k < n; k++) order.push(units[(dayNo + Math.floor(k / 2)) % units.length]);

    var out = [], seen = {};
    for (var i = 0; i < n; i++) {
      var u = order[i];
      var p = u.gen(r), tries = 0;
      while (seen[p.q] && tries < 12) { p = u.gen(r); tries++; }
      seen[p.q] = 1;

      var item = { no: i + 1, unit: u.name, std: u.std, q: p.q, answer: String(p.answer), explain: p.explain };

      /* 낱말 자체가 답인 단원은 숫자판으로 칠 수 없으므로 보기에서 고르게 한다 */
      if (u.pick) {
        var ch = p.choices ? p.choices.slice() : [String(p.answer)];
        for (var t2 = 0; t2 < 20 && ch.length < 4; t2++) {
          var alt = String(u.gen(r).answer);
          if (ch.indexOf(alt) < 0) ch.push(alt);
        }
        item.choices = r.shuffle(ch);
        item.answerNo = item.choices.indexOf(String(p.answer)) + 1;
      }
      out.push(item);
    }
    return { grade: grade, date: dateStr, unit: units[dayNo].name, count: out.length, problems: out };
  }

  global.MathBank = { make: make, units: UNITS, count: COUNT };
})(window);
