/* Báo cáo KTĐK Khối 12 — logic hiển thị, có lớp bảo mật.
   Công khai: số liệu tổng hợp (window.__PUB__).
   Tên HS nằm trong khối mã hóa (window.__LOCK__), chỉ mở bằng mật khẩu. */
(function () {
"use strict";

var PUB = window.__PUB__ || null;
var LOCK = window.__LOCK__ || null;
var SEC = null;
var curMonKhoi = "Toán";
var fails = 0;
var lockUntil = 0;
var MON_CHINH = ["Toán", "Vật lí", "Hóa học", "Sinh học", "Anh Văn"];
var MON_ALL = ["Toán", "Vật lí", "Hóa học", "Sinh học", "Anh Văn",
  "Tin học", "Lịch sử", "KTPL", "Ngữ văn"];

function $(id) {
  return document.getElementById(id);
}

function fmt(v) {
  if (v === null || v === undefined || v === "") {
    return "—";
  }
  return Number(v).toFixed(2).replace(/\.00$/, "");
}

function tb3calc(a, b, c) {
  if (a === null || a === undefined || a === "") return null;
  if (b === null || b === undefined || b === "") return null;
  if (c === null || c === undefined || c === "") return null;
  var v = (Number(a) + Number(b) + Number(c)) / 3;
  return Math.round(v * 100) / 100;
}

function r3(v) {
  if (v === null || v === undefined) {
    return null;
  }
  return Math.round(v * 1000) / 1000;
}

function tb3color(v) {
  if (v === null || v === undefined) return "";
  if (v >= 7) return "color:var(--green)";
  if (v >= 6.5) return "color:#1d4ed8";
  if (v >= 5) return "color:var(--amber)";
  return "color:var(--red)";
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

function pill(d) {
  if (d === null || d === undefined) {
    return '<span class="pill flat">—</span>';
  }
  var cls = d > 0 ? "up" : (d < 0 ? "down" : "flat");
  var t = (d > 0 ? "+" : "") + d;
  return '<span class="pill ' + cls + '">' + t + "</span>";
}

function trendBadge(t) {
  if (t.delta === null || t.delta === undefined) {
    return '<span class="pill flat">chỉ thi L1</span>';
  }
  if (t.delta > 0) {
    return '<span class="pill up">cải thiện</span>';
  }
  if (t.delta < 0) {
    return '<span class="pill down">giảm</span>';
  }
  return '<span class="pill flat">ổn định</span>';
}

function coverBadge(t) {
  if (t.tb2 === null || t.tb2 === undefined) {
    return "";
  }
  if (t.n1 > 0 && t.n2 < 0.7 * t.n1) {
    return ' <span class="pill warn">L2 mới có '
      + t.n2 + "/" + t.n1 + " bài</span>";
  }
  return "";
}

function fullCover(mon) {
  var t = PUB.subjects_stats[mon];
  if (!t || t.tb2 === null || t.tb2 === undefined) {
    return false;
  }
  return t.n2 >= 0.7 * t.n1;
}

/* ---------- 1. Phần công khai ---------- */

function renderMeta() {
  var m = PUB.meta;
  var txt = "Sĩ số: " + m.siso_l1 + " HS (L1) • " + m.siso_l2 + " HS (L2)";
  if (m.siso_l3 !== null && m.siso_l3 !== undefined) {
    txt += " • " + m.siso_l3 + " HS (L3)";
  }
  txt += " • " + m.classes.length + " lớp";
  txt += " • Dữ liệu cập nhật: " + (m.cap_nhat || "");
  if (m.lan3) {
    txt += " • " + m.lan3;
  }
  $("metaLine").textContent = txt;
  $("verBadge").textContent = "Bản " + (m.cap_nhat || "");
}

function renderAlerts() {
  var s = PUB.subjects_stats;
  var toan = s["Toán"];
  var ly = s["Vật lí"];
  var hoa = s["Hóa học"];
  var items = [];
  items.push("<li><b>Toán (L3):</b> TB " + fmt(toan.tb3) + " (" + toan.duoi5_l3
    + " em dưới 5/" + toan.n3 + " bài) — hồi phục " + pill(toan.delta23) + " so với L2.</li>");
  items.push("<li><b>Vật lí (L3):</b> TB " + fmt(ly.tb3) + " " + pill(ly.delta23)
    + " so với L2, còn " + ly.duoi5_l3 + " em dưới 5.</li>");
  items.push("<li><b>Hóa học (L3):</b> TB " + fmt(hoa.tb3) + " " + pill(hoa.delta23)
    + " so với L2 — giữ vững nhóm đầu khối.</li>");
  items.push("<li><b>Sinh học (L3):</b> " + s["Sinh học"].pct_duoi5_l3
    + "% dưới 5 — khối B00 cần phụ đạo gấp.</li>");
  $("alertBox").innerHTML = items.join("");
}

function renderKPIs() {
  var s = PUB.subjects_stats;
  var defs = ["Toán", "Vật lí", "Hóa học", "Anh Văn"];
  var h = defs.map(function (mon) {
    var t = s[mon];
    var has3 = t.tb3 !== null && t.tb3 !== undefined;
    var tag = has3 ? "L3" : "L2";
    var tb = has3 ? t.tb3 : t.tb2;
    var d = has3 ? t.delta23 : t.delta;
    var below = has3 ? t.duoi5_l3 : t.duoi5_l2;
    return "<div class='card kpi'>"
      + "<div class='k'>" + mon + " TB (" + tag + ")</div>"
      + "<div class='v'>" + fmt(tb) + "</div>"
      + "<div>" + pill(d) + "</div>"
      + "<div class='s'>" + below + " em <5 (" + tag + ")</div></div>";
  });
  $("kpiGrid").innerHTML = h.join("");
}

function barRow(label, vals, txt, clss) {
  var h = "<div class='barrow'>";
  h += "<div class='bl'>" + label + "</div>";
  h += "<div class='track'>";
  vals.forEach(function (v, i) {
    var p = (v === null || v === undefined) ? 0 : Math.max(0, Math.min(10, v)) * 10;
    h += "<div class='fill " + clss[i] + "' style='width:" + p.toFixed(1) + "%'></div>";
  });
  h += "</div>";
  h += "<div class='bv'>" + txt + "</div></div>";
  return h;
}

function legend3() {
  return "<div class='legend'><span><span class='dot' "
    + "style='background:#94a3b8'></span>L1</span><span><span class='dot' "
    + "style='background:#4f46e5'></span>L2</span><span><span class='dot' "
    + "style='background:#10b981'></span>L3</span></div>";
}

function renderCharts() {
  var s = PUB.subjects_stats;
  var mons = MON_ALL.filter(fullCover);
  var avg = mons.map(function (mon) {
    var t = s[mon];
    return barRow(mon, [t.tb1, t.tb2, t.tb3],
      fmt(t.tb1) + " → " + fmt(t.tb2) + " → " + fmt(t.tb3), ["l1", "l2", "l3"]);
  });
  $("chartAvg").innerHTML = avg.join("") + legend3();
  var bel = mons.map(function (mon) {
    var t = s[mon];
    var a = t.pct_duoi5_l1 || 0;
    var b = t.pct_duoi5_l2 || 0;
    var c = t.pct_duoi5_l3 || 0;
    return barRow(mon, [a, b, c], a + "% → " + b + "% → " + c + "%", ["l1", "bad", "l3"]);
  });
  $("chartBelow").innerHTML = bel.join("") + legend3();
}

function renderTableKhoi() {
  var s = PUB.subjects_stats;
  var h = MON_ALL.map(function (mon) {
    var t = s[mon];
    if (!t) {
      return "";
    }
    var pct2 = t.pct_duoi5_l2 === null ? "—" : t.pct_duoi5_l2;
    var r = "<tr><td class='l big'>" + mon + coverBadge(t) + "</td>";
    r += "<td>" + t.n1 + "/" + t.n2 + "</td>";
    r += "<td>" + fmt(t.tb1) + "</td>";
    r += "<td class='big'>" + fmt(t.tb2) + "</td>";
    r += "<td class='big' style='color:#1d4ed8'>" + fmt(t.tb3) + "</td>";
    r += "<td>" + pill(t.delta) + "</td>";
    r += "<td>" + t.duoi5_l1 + " (" + t.pct_duoi5_l1 + "%)</td>";
    r += "<td class='big' style='color:var(--red)'>" + t.duoi5_l2;
    r += " (" + pct2 + "%)</td>";
    var d3 = (t.duoi5_l3 === null || t.duoi5_l3 === undefined) ? "—" : t.duoi5_l3;
    var pct3 = (t.pct_duoi5_l3 === null || t.pct_duoi5_l3 === undefined) ? "—" : t.pct_duoi5_l3;
    r += "<td>" + d3 + " (" + pct3 + "%)</td>";
    r += "<td class='big' style='color:var(--green)'>" + t.gioi_l2 + "</td>";
    r += "<td>" + trendBadge(t) + "</td></tr>";
    return r;
  });
  $("tbKhoi").innerHTML = h.join("");
}

function renderMatrix() {
  var h = "<table class='tbl'><thead><tr><th class='l'>Lớp</th>";
  MON_CHINH.forEach(function (mon) {
    h += "<th>" + mon + "</th>";
  });
  h += "<th>Sĩ số L3</th></tr></thead><tbody>";
  PUB.meta.classes.forEach(function (lop) {
    h += "<tr><td class='l big'>" + lop + "</td>";
    MON_CHINH.forEach(function (mon) {
      var t = (PUB.class_stats[lop] || {})[mon];
      if (!t || (!t.n2 && !t.n3)) {
        h += "<td style='color:#cbd5e1'>—</td>";
        return;
      }
      var use3 = t.n3 && t.tb3 !== null && t.tb3 !== undefined;
      var tb = use3 ? t.tb3 : t.tb2;
      var dv = (use3 && t.tb2 !== null && t.tb2 !== undefined) ? r3(t.tb3 - t.tb2) : t.delta;
      var below = use3 ? t.duoi5_l3 : t.duoi5_l2;
      var tag = use3 ? "L3" : "L2";
      var hot = (tb !== null && tb < 5.5) || below >= 10;
      h += hot ? "<td class='hot'>" : "<td>";
      h += "<span class='big'>" + fmt(tb) + "</span> <small>" + tag + "</small> " + pill(dv);
      h += "<br><small";
      if (below > 0) {
        h += " style='color:var(--red);font-weight:800'";
      }
      h += ">" + below + " em &lt;5</small></td>";
    });
    var ov = null;
    PUB.overview_classes.forEach(function (o) {
      if (o.lop === lop) {
        ov = o;
      }
    });
    h += "<td>" + (ov ? (ov.siso_l3 || ov.siso_l2) : "—") + "</td></tr>";
  });
  h += "</tbody></table>";
  $("matrixWrap").innerHTML = h;
}

/* ---------- 2. Cổng bảo mật ---------- */

function b64ToBytes(b64) {
  var bin = atob(b64);
  var out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

function renderGate() {
  var box = $("gateBox");
  if (SEC) {
    box.innerHTML = "<div class='gate open'>"
      + "<span>Đã mở khóa — danh sách tên đang hiển thị.</span>"
      + "<button type='button' class='btn' id='btnLock'>Khóa lại</button>"
      + "</div>";
    $("btnLock").addEventListener("click", function () {
      SEC = null;
      fails = 0;
      renderGate();
      renderLop();
      renderKhoi();
      renderBangDiem();
      renderToHop();
      $("kq").innerHTML = "";
      var q = $("q");
      if (q) {
        q.value = "";
      }
    });
    return;
  }
  var now = Date.now();
  var locked = now < lockUntil;
  var h = "<div class='gate shut'>";
  h += "<div class='gate-ic'>KHÓA</div>";
  h += "<div><b>Danh sách tên học sinh được mã hóa.</b>";
  h += "<br><span class='hintline'>Nhập mật khẩu của tổ để mở phụ đạo / bồi dưỡng / tra cứu.</span></div>";
  h += "<input type='password' id='pwInput' placeholder='Mật khẩu…'"
    + " autocomplete='off'" + (locked ? " disabled" : "") + ">";
  h += "<button type='button' class='btn pri' id='btnUnlock'"
    + (locked ? " disabled" : "") + ">Mở khóa</button>";
  h += "<span class='hintline' id='pwMsg'></span>";
  h += "</div>";
  box.innerHTML = h;
  var go = function () {
    doUnlock($("pwInput").value);
  };
  $("btnUnlock").addEventListener("click", go);
  $("pwInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      go();
    }
  });
  if (locked) {
    tickLock();
  }
}

function tickLock() {
  var msg = $("pwMsg");
  var btn = $("btnUnlock");
  var inp = $("pwInput");
  if (!msg) {
    return;
  }
  var left = Math.ceil((lockUntil - Date.now()) / 1000);
  if (left <= 0) {
    renderGate();
    return;
  }
  msg.textContent = "Sai nhiều lần. Thử lại sau " + left + " giây.";
  if (btn) {
    btn.disabled = true;
  }
  if (inp) {
    inp.disabled = true;
  }
  setTimeout(tickLock, 1000);
}

function doUnlock(pw) {
  var msg = $("pwMsg");
  if (!pw) {
    msg.textContent = "Hãy nhập mật khẩu.";
    return;
  }
  msg.textContent = "Đang kiểm tra…";
  var salt = b64ToBytes(LOCK.salt);
  var iv = b64ToBytes(LOCK.iv);
  var ct = b64ToBytes(LOCK.ct);
  var subtle = window.crypto && window.crypto.subtle;
  if (!subtle) {
    msg.textContent = "Trình duyệt quá cũ, không mở được khóa.";
    return;
  }
  var pwBytes = new TextEncoder().encode(pw);
  subtle.importKey("raw", pwBytes, "PBKDF2", false, ["deriveKey"])
    .then(function (baseKey) {
      var alg = { name: "PBKDF2", salt: salt, iterations: LOCK.iter, hash: "SHA-256" };
      return subtle.deriveKey(alg, baseKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    })
    .then(function (key) {
      return subtle.decrypt({ name: "AES-GCM", iv: iv }, key, ct);
    })
    .then(function (plain) {
      var obj = JSON.parse(new TextDecoder().decode(plain));
      SEC = obj;
      fails = 0;
      renderGate();
      renderLop();
      renderKhoi();
      renderBangDiem();
      renderToHop();
    })
    .catch(function () {
      fails += 1;
      if (fails >= 5) {
        lockUntil = Date.now() + 30000;
        renderGate();
        return;
      }
      msg.textContent = "Sai mật khẩu (lần " + fails + "/5).";
    });
}

function needUnlockHTML() {
  return "<tr><td colspan='6' class='empty'>"
    + "Đã khóa — mở khóa ở hộp phía trên để xem tên.</td></tr>";
}

/* ---------- 3. Phần khóa (cần SEC) ---------- */

function row4(x) {
  var tb3 = tb3calc(x.l1, x.l2, x.l3);
  var d = (x.delta23 !== undefined && x.delta23 !== null) ? x.delta23 : x.delta;
  var h = "<tr><td class='l nm'>" + esc(x.ten) + "</td>";
  h += "<td>" + fmt(x.l1) + "</td>";
  h += "<td class='big'>" + fmt(x.l2) + "</td>";
  h += "<td class='big'>" + fmt(x.l3) + "</td>";
  h += "<td class='big' style='" + tb3color(tb3) + ";font-weight:800'>" + fmt(tb3) + "</td>";
  h += "<td>" + pill(d) + "</td></tr>";
  return h;
}

function fillList(tbodyId, countId, list) {
  var tb = $(tbodyId);
  if (!SEC) {
    tb.innerHTML = needUnlockHTML();
    $(countId).textContent = "";
    return;
  }
  if (!list.length) {
    tb.innerHTML = "<tr><td colspan='6' class='empty'>Không có</td></tr>";
  } else {
    tb.innerHTML = list.map(row4).join("");
  }
  $(countId).textContent = list.length + " em";
}

function renderLop() {
  var lop = $("selLop").value;
  var mon = $("selMon").value;
  var st = PUB.class_stats[lop][mon];
  var stat = "Lớp <b>" + lop + "</b> • Môn <b>" + mon + "</b> • TB <b>"
    + fmt(st.tb1) + " → " + fmt(st.tb2) + "</b> " + pill(st.delta)
    + " • Dưới 5: <b>" + st.duoi5_l1 + " → " + st.duoi5_l2
    + "</b> / " + st.n2 + " bài";
  if (st.tb3 !== null && st.tb3 !== undefined) {
    stat += " • <b>L3 TB " + fmt(st.tb3) + "</b> (" + st.n3 + " bài, "
      + st.duoi5_l3 + " em <5)";
  }
  $("lopStat").innerHTML = stat;
  if (!SEC) {
    ["tbPhu", "tbQuan", "tbBoi", "tbTien", "tbThut"].forEach(function (id) {
      $(id).innerHTML = needUnlockHTML();
    });
    ["cPhu", "cQuan", "cBoi", "cTien", "cThut"].forEach(function (id) {
      $(id).textContent = "";
    });
    return;
  }
  var L = SEC.class_lists[lop][mon];
  fillList("tbPhu", "cPhu", L.phudao);
  fillList("tbQuan", "cQuan", L.quantam);
  fillList("tbBoi", "cBoi", L.boiduong);
  fillList("tbTien", "cTien", L.tienbo);
  fillList("tbThut", "cThut", L.thutlui);
}

function renderMonTabs() {
  var h = MON_ALL.map(function (mon) {
    var cls = mon === curMonKhoi ? "tab on" : "tab";
    return "<button type='button' class='" + cls + "' data-mon='"
      + mon + "'>" + mon + "</button>";
  });
  $("monTabs").innerHTML = h.join("");
  var btns = $("monTabs").querySelectorAll("button");
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      curMonKhoi = b.getAttribute("data-mon");
      renderMonTabs();
      renderKhoi();
    });
  });
}

function rowKhoi(x) {
  var h = "<tr><td class='big'>" + x.lop + "</td>";
  h += "<td class='l nm'>" + esc(x.ten) + "</td>";
  h += "<td>" + fmt(x.l1) + "</td>";
  h += "<td class='big'>" + fmt(x.l2) + "</td>";
  h += "<td>" + fmt(x.l3) + "</td></tr>";
  return h;
}

function d23of(x) {
  if (x.l3 === null || x.l3 === undefined || x.l2 === null || x.l2 === undefined) {
    return "";
  }
  return Math.round((x.l3 - x.l2) * 100) / 100;
}

function top23(mon) {
  var arr = [];
  SEC.students.forEach(function (s) {
    var b = s.l2 ? s.l2[mon] : null;
    var c = s.l3 ? s.l3[mon] : null;
    if (b === null || b === undefined || c === null || c === undefined) {
      return;
    }
    arr.push({ lop: s.lop, ten: s.ten, l1: b, l2: c, delta: Math.round((c - b) * 100) / 100 });
  });
  arr.sort(function (x, y) {
    return y.delta - x.delta;
  });
  return arr;
}

function topRows(list) {
  return list.map(function (x) {
    var h = "<tr><td>" + x.lop + "</td>";
    h += "<td class='l'>" + esc(x.ten) + "</td>";
    h += "<td>" + fmt(x.l1) + "→<b>" + fmt(x.l2) + "</b></td>";
    h += "<td>" + pill(x.delta) + "</td></tr>";
    return h;
  }).join("");
}

function renderKhoi() {
  var ids = ["kTbPhu", "kTbBoi", "kTopTang", "kTopGiam"];
  if (!SEC) {
    ids.forEach(function (id) {
      $(id).innerHTML = needUnlockHTML();
    });
    $("kPhu").textContent = "";
    $("kBoi").textContent = "";
    return;
  }
  var B = SEC.block_lists[curMonKhoi];
  var T = SEC.top_changes[curMonKhoi];
  $("kTbPhu").innerHTML = B.phudao.length
    ? B.phudao.map(rowKhoi).join("")
    : "<tr><td colspan='5' class='empty'>Không có</td></tr>";
  $("kTbBoi").innerHTML = B.boiduong.length
    ? B.boiduong.map(rowKhoi).join("")
    : "<tr><td colspan='5' class='empty'>Không có</td></tr>";
  $("kPhu").textContent = B.phudao.length + " em";
  $("kBoi").textContent = B.boiduong.length + " em";
  var T23 = top23(curMonKhoi);
  var rangeT = "L1→L2";
  var tangList = T.tang_manh_nhat;
  var giamList = T.giam_manh_nhat;
  if (T23.length) {
    rangeT = "L2→L3";
    tangList = T23.filter(function (x) {
      return x.delta > 0;
    }).slice(0, 10);
    giamList = T23.filter(function (x) {
      return x.delta < 0;
    }).slice(-10).reverse();
  }
  $("kTopTangT").textContent = rangeT;
  $("kTopGiamT").textContent = rangeT;
  $("kTopTang").innerHTML = tangList.length
    ? topRows(tangList)
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
  $("kTopGiam").innerHTML = giamList.length
    ? topRows(giamList)
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
}

/* ---------- 4. Tra cứu ---------- */

function normStr(s) {
  return (s || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

function groupChip(l2) {
  if (l2 === null || l2 === undefined) {
    return "—";
  }
  if (l2 < 5) {
    return '<span class="pill down">phụ đạo</span>';
  }
  if (l2 >= 8) {
    return '<span class="pill up">bồi dưỡng</span>';
  }
  if (l2 < 6.5) {
    return '<span class="pill warn">quan tâm</span>';
  }
  return '<span class="pill flat">đạt</span>';
}

function searchHS(q) {
  var box = $("kq");
  if (!SEC) {
    box.innerHTML = "<p class='empty'>Đã khóa — mở khóa ở mục 3 để tra cứu.</p>";
    return;
  }
  if (!q || q.trim().length < 2) {
    box.innerHTML = "";
    return;
  }
  var nq = normStr(q.trim());
  var res = SEC.students.filter(function (s) {
    return normStr(s.ten).indexOf(nq) !== -1;
  }).slice(0, 12);
  if (!res.length) {
    box.innerHTML = "<p class='empty'>Không tìm thấy. Thử gõ tên không dấu.</p>";
    return;
  }
  var h = res.map(function (s) {
    var rows = PUB.meta.subjects.filter(function (mon) {
      var a = s.l1[mon];
      var b = s.l2[mon];
      var c = s.l3 ? s.l3[mon] : null;
      var hasA = a !== null && a !== undefined;
      var hasB = b !== null && b !== undefined;
      var hasC = c !== null && c !== undefined;
      return hasA || hasB || hasC;
    });
    var showL3 = rows.some(function (mon) {
      var c = s.l3 ? s.l3[mon] : null;
      return c !== null && c !== undefined;
    });
    var body = rows.map(function (mon) {
      var a1 = s.l1[mon];
      var b1 = s.l2[mon];
      var c1 = s.l3 ? s.l3[mon] : null;
      var t3 = tb3calc(a1, b1, c1);
      var d23 = (s.delta23 && s.delta23[mon] !== undefined) ? s.delta23[mon] : s.delta[mon];
      var r = "<tr><td class='l'>" + mon + "</td>";
      r += "<td>" + fmt(a1) + "</td>";
      r += "<td class='big'>" + fmt(b1) + "</td>";
      if (showL3) {
        var c3 = s.l3 ? s.l3[mon] : null;
        r += "<td class='big'>" + fmt(c3) + "</td>";
        r += "<td class='big' style='" + tb3color(t3) + "'>" + fmt(t3) + "</td>";
      }
      r += "<td>" + pill(d23) + "</td>";
      r += "<td>" + groupChip(s.l2[mon]) + "</td><td>" + spark(a1, b1, c1) + "</td></tr>";
      return r;
    });
    var c = "<div class='card'><h3>" + esc(s.ten);
    c += " <span class='pill flat'>" + s.lop + "</span></h3>";
    if (showL3) {
      c += "<p class='hint'>TB 3 lần = (L1+L2+L3)/3 — chỉ hiện khi đủ 3 đợt. Δ ưu tiên L2→L3.</p>";
    }
    c += "<div class='tblwrap'><table class='tbl'><thead><tr>";
    c += "<th class='l'>Môn</th><th>L1</th><th>L2</th>";
    if (showL3) {
      c += "<th>L3</th><th>TB 3 lần</th>";
    }
    c += "<th>Δ</th><th>Nhóm</th><th>Tiến triển</th>";
    c += "</tr></thead><tbody>" + body.join("") + "</tbody></table></div></div>";
    return c;
  });
  box.innerHTML = h.join("");
}

/* ---------- 5. CSV ---------- */

function csvCell(v) {
  var t = v === null || v === undefined ? "" : String(v);
  return '"' + t.replace(/"/g, '""') + '"';
}

function downloadCSV(fname, rows) {
  var csv = "﻿" + rows.map(function (r) {
    return r.map(csvCell).join(",");
  }).join("\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCSV(whole) {
  if (!SEC) {
    return;
  }
  if (whole) {
    var B = SEC.block_lists[curMonKhoi];
    var rows = [["Nhom", "Lop", "Ho ten", "L1", "L2", "L3", "Delta", "Delta23"]];
    B.phudao.forEach(function (x) {
      rows.push(["Phu dao", x.lop, x.ten, x.l1, x.l2, x.l3 === undefined ? "" : x.l3,
        x.delta, d23of(x)]);
    });
    B.boiduong.forEach(function (x) {
      rows.push(["Boi duong", x.lop, x.ten, x.l1, x.l2, x.l3 === undefined ? "" : x.l3,
        x.delta, d23of(x)]);
    });
    downloadCSV("toankhoi_" + curMonKhoi + ".csv", rows);
    return;
  }
  var lop = $("selLop").value;
  var mon = $("selMon").value;
  var L = SEC.class_lists[lop][mon];
  var r2 = [["Nhom", "Ho ten", "L1", "L2", "L3", "TB_3lan", "Delta", "Delta23"]];
  L.phudao.forEach(function (x) {
    r2.push(["Phu dao", x.ten, x.l1, x.l2, x.l3 === undefined ? "" : x.l3,
      tb3calc(x.l1, x.l2, x.l3) === null ? "" : tb3calc(x.l1, x.l2, x.l3),
      x.delta, x.delta23 === undefined ? "" : x.delta23]);
  });
  L.quantam.forEach(function (x) {
    r2.push(["Quan tam", x.ten, x.l1, x.l2, x.l3 === undefined ? "" : x.l3,
      tb3calc(x.l1, x.l2, x.l3) === null ? "" : tb3calc(x.l1, x.l2, x.l3),
      x.delta, x.delta23 === undefined ? "" : x.delta23]);
  });
  L.boiduong.forEach(function (x) {
    r2.push(["Boi duong", x.ten, x.l1, x.l2, x.l3 === undefined ? "" : x.l3,
      tb3calc(x.l1, x.l2, x.l3) === null ? "" : tb3calc(x.l1, x.l2, x.l3),
      x.delta, x.delta23 === undefined ? "" : x.delta23]);
  });
  downloadCSV(lop + "_" + mon + ".csv", r2);
}

/* ---------- Khởi động ---------- */

/* ---------- 6. Bang diem 3 lan kieu Sheets ---------- */

var bdSort = { key: "ten", dir: 1 };

function bdVal(s, key) {
  if (key === "ten") {
    return s.ten;
  }
  var p = key.split("|");
  var mon = p[0];
  var k = p[1];
  var v = null;
  if (k === "L1") {
    v = s.l1 ? s.l1[mon] : null;
  } else if (k === "L2") {
    v = s.l2 ? s.l2[mon] : null;
  } else if (k === "L3") {
    v = s.l3 ? s.l3[mon] : null;
  } else {
    var a = s.l1 ? s.l1[mon] : null;
    var b = s.l2 ? s.l2[mon] : null;
    var c = s.l3 ? s.l3[mon] : null;
    v = tb3calc(a, b, c);
  }
  return (v === undefined) ? null : v;
}

function bdSubjects(lop) {
  var seen = {};
  SEC.students.forEach(function (s) {
    if (s.lop !== lop) {
      return;
    }
    PUB.meta.subjects.forEach(function (mon) {
      var a = s.l1 ? s.l1[mon] : null;
      var b = s.l2 ? s.l2[mon] : null;
      var c = s.l3 ? s.l3[mon] : null;
      var has = (a !== null && a !== undefined)
        || (b !== null && b !== undefined)
        || (c !== null && c !== undefined);
      if (has) {
        seen[mon] = 1;
      }
    });
  });
  return PUB.meta.subjects.filter(function (m) {
    return seen[m];
  });
}

function bdCell(v, isTB) {
  if (v === null || v === undefined || v === "") {
    return "<td>—</td>";
  }
  var cls = v < 5 ? "neg" : (v >= 8 ? "good" : "");
  if (isTB) {
    cls += " big";
  }
  var pre = cls ? " class='" + cls.trim() + "'" : "";
  var sty = isTB ? " style='" + tb3color(v) + "'" : "";
  return "<td" + pre + sty + ">" + fmt(v) + "</td>";
}

function bdAvg(rows, mon, k) {
  var sum = 0;
  var n = 0;
  rows.forEach(function (s) {
    var v = bdVal(s, mon + "|" + k);
    if (v !== null && v !== undefined && v !== "") {
      sum += Number(v);
      n += 1;
    }
  });
  if (!n) {
    return null;
  }
  return Math.round(sum / n * 100) / 100;
}

function renderBangDiem() {
  var tbl = $("bdTable");
  var sel = $("selLopBd");
  var lop = (sel && sel.value) || PUB.meta.classes[0];
  if (!SEC) {
    tbl.innerHTML = "<thead><tr><th>Bảng điểm</th></tr></thead>"
      + "<tbody><tr><td class='empty'>Đã khóa — mở khóa ở mục 3 để xem.</td></tr></tbody>";
    $("bdStat").innerHTML = "";
    return;
  }
  var mons = bdSubjects(lop);
  var qEl = $("bdQ");
  var q = normStr(((qEl && qEl.value) || "").trim());
  var rows = SEC.students.filter(function (s) {
    if (s.lop !== lop) {
      return false;
    }
    if (q && normStr(s.ten).indexOf(q) === -1) {
      return false;
    }
    return true;
  });
  var sk = bdSort.key;
  var sd = bdSort.dir;
  rows.sort(function (x, y) {
    var a = bdVal(x, sk);
    var b = bdVal(y, sk);
    var an = (a === null || a === undefined);
    var bn = (b === null || b === undefined);
    if (an && bn) {
      return 0;
    }
    if (an) {
      return 1;
    }
    if (bn) {
      return -1;
    }
    if (a < b) {
      return -1 * sd;
    }
    if (a > b) {
      return 1 * sd;
    }
    return 0;
  });
  var arrow = sd === 1 ? " sorted-asc" : " sorted-desc";
  var h = "<thead><tr><th class='c0'>STT</th>";
  h += "<th class='c1 l sortable" + (sk === "ten" ? arrow : "") + "' data-k='ten'>Họ tên</th>";
  mons.forEach(function (mon, i) {
    var g = " g" + (i % 2);
    ["L1", "L2", "L3", "TB"].forEach(function (k) {
      var key = mon + "|" + k;
      var cls = "sortable" + g + (sk === key ? arrow : "");
      h += "<th class='" + cls + "' data-k='" + key + "'>" + mon + " " + k + "</th>";
    });
  });
  h += "</tr></thead><tbody>";
  var span = 2 + mons.length * 4;
  if (!rows.length) {
    h += "<tr><td colspan='" + span + "' class='empty'>Không có học sinh nào.</td></tr>";
  }
  rows.forEach(function (s, idx) {
    h += "<tr><td class='c0'>" + (idx + 1) + "</td>";
    h += "<td class='c1 l nm'>" + esc(s.ten) + "</td>";
    mons.forEach(function (mon) {
      var a = s.l1 ? s.l1[mon] : null;
      var b = s.l2 ? s.l2[mon] : null;
      var c = s.l3 ? s.l3[mon] : null;
      var t = tb3calc(a, b, c);
      h += bdCell(a, false) + bdCell(b, false) + bdCell(c, false) + bdCell(t, true);
    });
    h += "</tr>";
  });
  h += "<tr class='avgrow'><td class='c0'>—</td><td class='c1 l'>TB lớp</td>";
  mons.forEach(function (mon) {
    ["L1", "L2", "L3"].forEach(function (k) {
      var av = bdAvg(rows, mon, k);
      h += av === null ? "<td>—</td>" : "<td>" + fmt(av) + "</td>";
    });
    h += "<td>—</td>";
  });
  h += "</tr></tbody>";
  tbl.innerHTML = h;
  var ths = tbl.querySelectorAll("th.sortable");
  ths.forEach(function (th) {
    th.addEventListener("click", function () {
      var k = th.getAttribute("data-k");
      if (bdSort.key === k) {
        bdSort.dir = -bdSort.dir;
      } else {
        bdSort.key = k;
        bdSort.dir = 1;
      }
      renderBangDiem();
    });
  });
  $("bdStat").innerHTML = "Lớp <b>" + lop + "</b> • " + rows.length + " em • "
    + mons.length + " môn có điểm • Click tiêu đề cột để sắp xếp";
}

function exportBangDiem() {
  if (!SEC) {
    return;
  }
  var sel = $("selLopBd");
  var lop = (sel && sel.value) || PUB.meta.classes[0];
  var mons = bdSubjects(lop);
  var head = ["STT", "Ho ten"];
  mons.forEach(function (mon) {
    head.push(mon + " L1", mon + " L2", mon + " L3", mon + " TB");
  });
  var out = [head];
  var i = 0;
  SEC.students.forEach(function (s) {
    if (s.lop !== lop) {
      return;
    }
    i += 1;
    var r = [i, s.ten];
    mons.forEach(function (mon) {
      var a = s.l1 ? s.l1[mon] : null;
      var b = s.l2 ? s.l2[mon] : null;
      var c = s.l3 ? s.l3[mon] : null;
      var t = tb3calc(a, b, c);
      r.push(a === undefined || a === null ? "" : a);
      r.push(b === undefined || b === null ? "" : b);
      r.push(c === undefined || c === null ? "" : c);
      r.push(t === null ? "" : t);
    });
    out.push(r);
  });
  downloadCSV("bangdiem_" + lop + "_3lan.csv", out);
}

/* ---------- 7. Xet to hop mon ---------- */

var COMBOS = {
  "A00": ["Toán", "Vật lí", "Hóa học"],
  "A01": ["Toán", "Vật lí", "Anh Văn"],
  "B00": ["Toán", "Hóa học", "Sinh học"],
  "C03": ["Toán", "Ngữ văn", "Lịch sử"],
  "D01": ["Toán", "Ngữ văn", "Anh Văn"],
  "D07": ["Toán", "Hóa học", "Anh Văn"]
};
var curCombo = "A00";

function dotVal(s, mon, dot) {
  var v = dot === "L1" ? (s.l1 ? s.l1[mon] : null)
    : dot === "L2" ? (s.l2 ? s.l2[mon] : null)
    : (s.l3 ? s.l3[mon] : null);
  return (v === undefined) ? null : v;
}

function comboTotal(s, mons, dot) {
  var sum = 0;
  for (var i = 0; i < mons.length; i++) {
    var v = dotVal(s, mons[i], dot);
    if (v === null || v === "") {
      return null;
    }
    sum += Number(v);
  }
  return Math.round(sum * 100) / 100;
}

function totalColor(t) {
  if (t >= 24) {
    return "color:var(--green)";
  }
  if (t < 15) {
    return "color:var(--red)";
  }
  return "";
}

function renderComboTabs() {
  var h = Object.keys(COMBOS).map(function (k) {
    var cls = k === curCombo ? "tab on" : "tab";
    return "<button type='button' class='" + cls + "' data-cb='" + k + "'>" + k + "</button>";
  });
  $("comboTabs").innerHTML = h.join("");
  var btns = $("comboTabs").querySelectorAll("button");
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      curCombo = b.getAttribute("data-cb");
      renderComboTabs();
      renderToHop();
    });
  });
}

function renderToHop() {
  var tbl = $("thTable");
  var lopSel = $("selLopTh");
  var lop = (lopSel && lopSel.value) || "ALL";
  var dotSel = $("selDotTh");
  var dot = (dotSel && dotSel.value) || "L3";
  if (!SEC) {
    tbl.innerHTML = "<thead><tr><th>Tổ hợp " + curCombo + "</th></tr></thead>"
      + "<tbody><tr><td class='empty'>Đã khóa — mở khóa ở mục 3 để xem.</td></tr></tbody>";
    $("thStat").innerHTML = "";
    return;
  }
  var mons = COMBOS[curCombo];
  var rows = [];
  SEC.students.forEach(function (s) {
    if (lop !== "ALL" && s.lop !== lop) {
      return;
    }
    var t = comboTotal(s, mons, dot);
    if (t === null) {
      return;
    }
    rows.push({ ten: s.ten, lop: s.lop, m: [dotVal(s, mons[0], dot),
      dotVal(s, mons[1], dot), dotVal(s, mons[2], dot)], total: t });
  });
  rows.sort(function (x, y) {
    return y.total - x.total;
  });
  var h = "<thead><tr><th>Hạng</th><th class='l'>Họ tên</th><th>Lớp</th>";
  mons.forEach(function (mon) {
    h += "<th>" + mon + "</th>";
  });
  h += "<th>Tổng " + dot + "</th></tr></thead><tbody>";
  if (!rows.length) {
    h += "<tr><td colspan='7' class='empty'>Không có em nào đủ 3 môn.</td></tr>";
  }
  var sum = 0;
  rows.forEach(function (r, i) {
    sum += r.total;
    h += "<tr><td class='big'>" + (i + 1) + "</td>";
    h += "<td class='l nm'>" + esc(r.ten) + "</td><td>" + r.lop + "</td>";
    h += "<td>" + fmt(r.m[0]) + "</td><td>" + fmt(r.m[1]) + "</td><td>" + fmt(r.m[2]) + "</td>";
    h += "<td class='big' style='" + totalColor(r.total) + "'>" + fmt(r.total) + "</td></tr>";
  });
  h += "</tbody>";
  tbl.innerHTML = h;
  var avg = rows.length ? (Math.round(sum / rows.length * 100) / 100) : null;
  var mx = rows.length ? rows[0].total : null;
  $("thStat").innerHTML = "Tổ hợp <b>" + curCombo + "</b> (" + mons.join(" + ") + ") • Đợt <b>" + dot
    + "</b> • " + rows.length + " em đủ điểm • Cao nhất <b>" + fmt(mx)
    + "</b> • TB <b>" + fmt(avg) + "</b>";
}

function exportToHop() {
  if (!SEC) {
    return;
  }
  var lop = ($("selLopTh").value) || "ALL";
  var dot = ($("selDotTh").value) || "L3";
  var mons = COMBOS[curCombo];
  var head = ["Hang", "Ho ten", "Lop", mons[0], mons[1], mons[2], "Tong " + dot];
  var out = [head];
  var rows = [];
  SEC.students.forEach(function (s) {
    if (lop !== "ALL" && s.lop !== lop) {
      return;
    }
    var t = comboTotal(s, mons, dot);
    if (t === null) {
      return;
    }
    rows.push(s);
  });
  rows.sort(function (x, y) {
    return comboTotal(y, mons, dot) - comboTotal(x, mons, dot);
  });
  rows.forEach(function (s, i) {
    out.push([i + 1, s.ten, s.lop, dotVal(s, mons[0], dot),
      dotVal(s, mons[1], dot), dotVal(s, mons[2], dot), comboTotal(s, mons, dot)]);
  });
  downloadCSV("tohop_" + curCombo + "_" + dot + ".csv", out);
}

/* ---------- 8. So sanh giua cac lop (cong khai) ---------- */

function ssKeys(dot) {
  if (dot === "L1") {
    return { n: "n1", tb: "tb1", d: "duoi5_l1" };
  }
  if (dot === "L2") {
    return { n: "n2", tb: "tb2", d: "duoi5_l2" };
  }
  return { n: "n3", tb: "tb3", d: "duoi5_l3" };
}

function renderSoSanh() {
  var tbl = $("ssTable");
  var dotSel = $("selDotSs");
  var dot = (dotSel && dotSel.value) || "L3";
  var keys = ssKeys(dot);
  var lops = PUB.meta.classes;
  var h = "<thead><tr><th class='l'>Môn (" + dot + ")</th>";
  lops.forEach(function (lop) {
    h += "<th>" + lop + "</th>";
  });
  h += "</tr></thead><tbody>";
  MON_ALL.forEach(function (mon) {
    h += "<tr><td class='l'>" + mon + "</td>";
    lops.forEach(function (lop) {
      var st = (PUB.class_stats[lop] || {})[mon] || {};
      var n = st[keys.n];
      var tb = st[keys.tb];
      var d = st[keys.d];
      if (!n || tb === null || tb === undefined) {
        h += "<td style='color:#cbd5e1'>—</td>";
        return;
      }
      var p = Math.round(d / n * 1000) / 10;
      var cls = "";
      if (tb < 5.5 || d >= 10) {
        cls = " class='hot'";
      } else if (tb >= 8) {
        cls = " class='cool'";
      }
      h += "<td" + cls + "><span class='big'>" + fmt(tb) + "</span><br><small";
      if (d > 0) {
        h += " style='color:var(--red);font-weight:800'";
      }
      h += ">" + d + " em &lt;5 (" + p + "%)</small>";
      h += "<br><small style='color:var(--mut)'>" + n + " bài</small></td>";
    });
    h += "</tr>";
  });
  h += "</tbody>";
  tbl.innerHTML = h;
  $("ssStat").innerHTML = "Đợt <b>" + dot + "</b> • " + lops.length
    + " lớp • Ô đỏ: TB &lt;5.5 hoặc ≥10 em dưới 5 • Ô xanh: TB ≥8";
}

function exportSoSanh() {
  var dot = ($("selDotSs").value) || "L3";
  var keys = ssKeys(dot);
  var lops = PUB.meta.classes;
  var head = ["Mon", "Chi tieu"];
  lops.forEach(function (lop) {
    head.push(lop);
  });
  var out = [head];
  MON_ALL.forEach(function (mon) {
    var rTB = [mon, "TB " + dot];
    var rD = [mon, "Duoi 5 (em)"];
    var rP = [mon, "% duoi 5"];
    lops.forEach(function (lop) {
      var st = (PUB.class_stats[lop] || {})[mon] || {};
      var n = st[keys.n];
      var tb = st[keys.tb];
      var d = st[keys.d];
      if (!n || tb === null || tb === undefined) {
        rTB.push("");
        rD.push("");
        rP.push("");
        return;
      }
      rTB.push(tb);
      rD.push(d);
      rP.push(Math.round(d / n * 1000) / 10);
    });
    out.push(rTB, rD, rP);
  });
  downloadCSV("sosanh_lop_" + dot + ".csv", out);
}

function exportSo() {
  var s = PUB.subjects_stats;
  var head = ["MON", "DTB L1", "SL L1", "% duoi5 L1", "DTB L2", "SL L2",
    "% duoi5 L2", "DTB L3", "SL L3", "% duoi5 L3"];
  var rows = [head];
  MON_ALL.forEach(function (mon) {
    var t = s[mon];
    if (!t) {
      return;
    }
    rows.push([mon, t.tb1, t.n1, t.pct_duoi5_l1, t.tb2, t.n2, t.pct_duoi5_l2,
      (t.tb3 === undefined ? null : t.tb3), (t.n3 === undefined ? null : t.n3),
      (t.pct_duoi5_l3 === undefined ? null : t.pct_duoi5_l3)]);
  });
  downloadCSV("tonghop_SoGD_L1-L3.csv", rows);
}

function spark(a, b, c) {
  var vals = [a, b, c];
  var L = ["L1", "L2", "L3"];
  var h = "<span class='spark'>";
  vals.forEach(function (v, i) {
    if (v === null || v === undefined || v === "") {
      h += "<i title='" + L[i] + ": —' style='height:3px;background:#e2e8f0'></i>";
    } else {
      var col = v < 5 ? "#ef4444" : (v >= 8 ? "#22c55e" : "#6366f1");
      h += "<i title='" + L[i] + ": " + v + "' style='height:"
        + Math.max(8, v * 10) + "%;background:" + col + "'></i>";
    }
  });
  return h + "</span>";
}

/* ---------- 0. Dieu huong tab ---------- */

var TABS = ["tong-quan", "ma-tran", "lop", "khoi", "timkiem", "bang-diem", "to-hop", "so-sanh"];
var curTab = "tong-quan";

function tabFromHash() {
  try {
    var h = (window.location && window.location.hash) ? window.location.hash.replace("#", "") : "";
    return TABS.indexOf(h) !== -1 ? h : TABS[0];
  } catch (e) {
    return TABS[0];
  }
}

function switchTab(id) {
  if (TABS.indexOf(id) === -1) {
    id = TABS[0];
  }
  curTab = id;
  TABS.forEach(function (t) {
    var sec = document.getElementById(t);
    if (sec && sec.style) {
      sec.style.display = (t === id) ? "" : "none";
    }
  });
  var btns = document.querySelectorAll ? document.querySelectorAll(".navlink[data-tab]") : [];
  btns.forEach(function (b) {
    if (!b.classList) {
      return;
    }
    if (b.getAttribute("data-tab") === id) {
      b.classList.add("on");
    } else {
      b.classList.remove("on");
    }
  });
  try {
    if (window.location && window.location.hash !== "#" + id) {
      window.location.hash = "#" + id;
    }
  } catch (e) {}
}

function init() {
  renderMeta();
  renderAlerts();
  renderKPIs();
  renderCharts();
  renderTableKhoi();
  renderMatrix();
  $("selLop").innerHTML = PUB.meta.classes.map(function (c) {
    return "<option>" + c + "</option>";
  }).join("");
  $("selMon").innerHTML = MON_ALL.map(function (x) {
    return "<option>" + x + "</option>";
  }).join("");
  $("selLop").value = "12A10";
  $("selMon").value = "Toán";
  $("selLop").addEventListener("change", renderLop);
  $("selMon").addEventListener("change", renderLop);
  $("btnCsvLop").addEventListener("click", function () {
    exportCSV(false);
  });
  $("btnCsvKhoi").addEventListener("click", function () {
    exportCSV(true);
  });
  $("q").addEventListener("input", function (e) {
    searchHS(e.target.value);
  });
  $("selLopBd").innerHTML = PUB.meta.classes.map(function (c) {
    return "<option>" + c + "</option>";
  }).join("");
  $("selLopBd").value = "12A10";
  $("selLopBd").addEventListener("change", renderBangDiem);
  $("bdQ").addEventListener("input", renderBangDiem);
  $("btnCsvBd").addEventListener("click", exportBangDiem);
  $("selLopTh").innerHTML = "<option value='ALL'>Tất cả lớp</option>" + PUB.meta.classes.map(function (c) {
    return "<option>" + c + "</option>";
  }).join("");
  $("selDotTh").innerHTML = ["L1", "L2", "L3"].map(function (d) {
    return "<option>" + d + "</option>";
  }).join("");
  $("selDotTh").value = "L3";
  $("selDotSs").innerHTML = ["L1", "L2", "L3"].map(function (d) {
    return "<option>" + d + "</option>";
  }).join("");
  $("selDotSs").value = "L3";
  $("selLopTh").addEventListener("change", renderToHop);
  $("selDotTh").addEventListener("change", renderToHop);
  $("selDotSs").addEventListener("change", renderSoSanh);
  $("btnCsvTh").addEventListener("click", exportToHop);
  $("btnCsvSs").addEventListener("click", exportSoSanh);
  $("btnCsvSo").addEventListener("click", exportSo);
  var navBtns = document.querySelectorAll ? document.querySelectorAll(".navlink[data-tab]") : [];
  navBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      switchTab(b.getAttribute("data-tab"));
      if (window.scrollTo) {
        window.scrollTo(0, 0);
      }
    });
  });
  if (window.addEventListener) {
    window.addEventListener("hashchange", function () {
      switchTab(tabFromHash());
    });
  }
  renderGate();
  renderLop();
  renderMonTabs();
  renderKhoi();
  renderBangDiem();
  renderComboTabs();
  renderToHop();
  renderSoSanh();
  switchTab(tabFromHash());
}

if (!PUB) {
  $("metaLine").textContent = "Lỗi dữ liệu. Hãy tải lại trang.";
} else {
  init();
}

})();
