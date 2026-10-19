/* Báo cáo KTĐK Khối 12 (L1 -> L7) — logic hiển thị, có lớp bảo mật.
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
var DOTS = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"];

function $(id) {
  return document.getElementById(id);
}

function fmt(v) {
  if (v === null || v === undefined || v === "") {
    return "—";
  }
  return Number(v).toFixed(2).replace(/\.00$/, "");
}

function tbAllCalc(s, mon) {
  var vals = [];
  for (var k = 1; k <= 7; k++) {
    var lk = "l" + k;
    var v = s[lk] ? s[lk][mon] : null;
    if (v !== null && v !== undefined && v !== "") {
      vals.push(Number(v));
    }
  }
  if (!vals.length) {
    return null;
  }
  var sum = vals.reduce(function (a, b) { return a + b; }, 0);
  return Math.round(sum / vals.length * 100) / 100;
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
  var d = (t.delta56 !== null && t.delta56 !== undefined) ? t.delta56 : t.delta;
  if (d === null || d === undefined) {
    return '<span class="pill flat">chưa đủ đợt</span>';
  }
  if (d > 0) {
    return '<span class="pill up">cải thiện</span>';
  }
  if (d < 0) {
    return '<span class="pill down">giảm</span>';
  }
  return '<span class="pill flat">ổn định</span>';
}

function coverBadge(t) {
  if (t.n7 && t.n7 > 0 && t.n7 < t.n6) {
    return ' <span class="pill warn">L7: ' + t.n7 + " bài (12A10)</span>";
  }
  return "";
}

function fullCover(mon) {
  var t = PUB.subjects_stats[mon];
  if (!t || t.tb6 === null || t.tb6 === undefined) {
    return false;
  }
  return t.n6 >= 10;
}

/* ---------- 1. Phần công khai ---------- */

function renderMeta() {
  var m = PUB.meta;
  var txt = "Sĩ số các đợt: L1 " + m.siso_l1 + " • L2 " + m.siso_l2
    + " • L3 " + (m.siso_l3 || "—")
    + " • L4 " + (m.siso_l4 || "—")
    + " • L5 " + (m.siso_l5 || "—")
    + " • L6 " + (m.siso_l6 || "—")
    + " • L7 " + (m.siso_l7 || "—") + " HS (12A10 đã lên điểm)";
  txt += " • " + m.classes.length + " lớp";
  txt += " • Cập nhật: " + (m.cap_nhat || "");
  $("metaLine").textContent = txt;
  $("verBadge").textContent = "Bản " + (m.cap_nhat || "");
}

function renderAlerts() {
  var s = PUB.subjects_stats;
  var toan = s["Toán"];
  var ly = s["Vật lí"];
  var hoa = s["Hóa học"];
  var sinh = s["Sinh học"];
  var items = [];
  items.push("<li><b>Toán (L6 toàn khối &amp; L7 12A10):</b> L6 đạt TB <b>" + fmt(toan.tb6)
    + "</b> (" + toan.duoi5_l6 + " em &lt;5/" + toan.n6 + " bài, hồi phục " + pill(toan.delta56)
    + " so với L5) • L7 (12A10): TB <b>" + fmt(toan.tb7) + "</b> (" + toan.duoi5_l7 + "/33 em &lt;5).</li>");
  items.push("<li><b>Vật lí (L6):</b> TB <b>" + fmt(ly.tb6) + "</b> " + pill(ly.delta56)
    + " so với L5, chỉ còn " + ly.duoi5_l6 + "/" + ly.n6 + " bài dưới 5 (" + ly.gioi_l6 + " bài ≥8).</li>");
  items.push("<li><b>Hóa học (L6 toàn khối &amp; L7 12A10):</b> L6 đạt TB <b>" + fmt(hoa.tb6)
    + "</b> (" + hoa.gioi_l6 + " bài ≥8) • L7 (12A10): TB <b>" + fmt(hoa.tb7)
    + "</b> (chỉ " + hoa.duoi5_l7 + " em &lt;5).</li>");
  items.push("<li><b>Sinh học (L6 &amp; L7 12A10):</b> L6 đạt TB <b>" + fmt(sinh.tb6)
    + "</b> • L7 (12A10): TB <b>" + fmt(sinh.tb7) + "</b> (" + sinh.duoi5_l7 + "/33 em &lt;5).</li>");
  $("alertBox").innerHTML = items.join("");
}

function renderKPIs() {
  var s = PUB.subjects_stats;
  var defs = ["Toán", "Vật lí", "Hóa học", "Sinh học"];
  var h = defs.map(function (mon) {
    var t = s[mon];
    var subL7 = (t.n7 && t.tb7 !== null)
      ? (" • L7 (12A10): <b>" + fmt(t.tb7) + "</b>")
      : "";
    return "<div class='card kpi'>"
      + "<div class='k'>" + mon + " TB (L6 / L7)</div>"
      + "<div class='v'>" + fmt(t.tb6) + "</div>"
      + "<div>" + pill(t.delta56) + " <small style='color:var(--mut)'>vs L5</small></div>"
      + "<div class='s'>" + t.duoi5_l6 + " em &lt;5 (L6)" + subL7 + "</div></div>";
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
    + "style='background:#4f46e5'></span>L5</span><span><span class='dot' "
    + "style='background:#10b981'></span>L6 (kèm L7)</span></div>";
}

function renderCharts() {
  var s = PUB.subjects_stats;
  var mons = MON_ALL.filter(fullCover);
  var avg = mons.map(function (mon) {
    var t = s[mon];
    var tail = (t.tb7 !== null && t.tb7 !== undefined) ? (" | L7: " + fmt(t.tb7)) : "";
    return barRow(mon, [t.tb1, t.tb5, t.tb6],
      fmt(t.tb1) + " → " + fmt(t.tb5) + " → " + fmt(t.tb6) + tail, ["l1", "l2", "l3"]);
  });
  $("chartAvg").innerHTML = avg.join("") + legend3();
  var bel = mons.map(function (mon) {
    var t = s[mon];
    var a = t.pct_duoi5_l1 || 0;
    var b = t.pct_duoi5_l5 || 0;
    var c = t.pct_duoi5_l6 || 0;
    return barRow(mon, [a / 10, b / 10, c / 10], a + "% → " + b + "% → " + c + "%", ["l1", "bad", "l3"]);
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
    var r = "<tr><td class='l big'>" + mon + coverBadge(t) + "</td>";
    r += "<td>" + fmt(t.tb1) + "</td>";
    r += "<td>" + fmt(t.tb2) + "</td>";
    r += "<td>" + fmt(t.tb3) + "</td>";
    r += "<td>" + fmt(t.tb4) + "</td>";
    r += "<td>" + fmt(t.tb5) + "</td>";
    r += "<td class='big' style='color:#1d4ed8'>" + fmt(t.tb6) + "</td>";
    r += "<td class='big' style='color:#6d28d9'>" + fmt(t.tb7) + "</td>";
    r += "<td>" + pill(t.delta56) + "</td>";
    var d5 = t.n5 ? (t.duoi5_l5 + " (" + t.pct_duoi5_l5 + "%)") : "—";
    var d6 = t.n6 ? (t.duoi5_l6 + " (" + t.pct_duoi5_l6 + "%)") : "—";
    var d7 = t.n7 ? (t.duoi5_l7 + " (" + t.pct_duoi5_l7 + "%)") : "—";
    r += "<td>" + d5 + "</td>";
    r += "<td class='big' style='color:var(--red)'>" + d6 + "</td>";
    r += "<td>" + d7 + "</td>";
    r += "<td class='big' style='color:var(--green)'>" + (t.n6 ? t.gioi_l6 : "—") + "</td>";
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
  h += "<th>Sĩ số (L6 / L7)</th></tr></thead><tbody>";
  PUB.meta.classes.forEach(function (lop) {
    h += "<tr><td class='l big'>" + lop + "</td>";
    MON_CHINH.forEach(function (mon) {
      var t = (PUB.class_stats[lop] || {})[mon];
      if (!t || !t.latest_dot) {
        h += "<td style='color:#cbd5e1'>—</td>";
        return;
      }
      var tag = t.latest_dot;
      var k = Number(tag.slice(1));
      var tb = t["tb" + k];
      var below = t["duoi5_l" + k];
      var dv = t.delta_latest;
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
    var sisoTxt = "—";
    if (ov) {
      sisoTxt = ov.siso_l7 ? (ov.siso_l6 + " (L7: " + ov.siso_l7 + ")") : String(ov.siso_l6 || ov.siso_l3 || ov.siso_l2);
    }
    h += "<td>" + sisoTxt + "</td></tr>";
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
      + "<span>Đã mở khóa — danh sách tên đang hiển thị (L1 → L7).</span>"
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
  return "<tr><td colspan='7' class='empty'>"
    + "Đã khóa — mở khóa ở hộp phía trên để xem tên.</td></tr>";
}

/* ---------- 3. Phần khóa (cần SEC) ---------- */

function rowLopItem(x) {
  var l14 = [x.l1, x.l2, x.l3, x.l4].map(fmt).join(" / ");
  var d = (x.delta_latest !== undefined && x.delta_latest !== null) ? x.delta_latest : x.delta;
  var h = "<tr><td class='l nm'>" + esc(x.ten) + "</td>";
  h += "<td style='font-size:11.5px;color:var(--mut)'>" + l14 + "</td>";
  h += "<td>" + fmt(x.l5) + "</td>";
  h += "<td class='big'>" + fmt(x.l6) + "</td>";
  h += "<td class='big' style='color:#6d28d9'>" + fmt(x.l7) + "</td>";
  h += "<td class='big' style='" + tb3color(x.tb) + ";font-weight:800'>" + fmt(x.tb) + "</td>";
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
    tb.innerHTML = "<tr><td colspan='7' class='empty'>Không có</td></tr>";
  } else {
    tb.innerHTML = list.map(rowLopItem).join("");
  }
  $(countId).textContent = list.length + " em";
}

function computeLopLists(lop, mon, dotMode) {
  if (!dotMode || dotMode === "AUTO") {
    return SEC.class_lists[lop][mon];
  }
  var phudao = [];
  var quantam = [];
  var boiduong = [];
  var tienbo = [];
  var thutlui = [];
  SEC.students.forEach(function (s) {
    if (s.lop !== lop) return;
    var tb = tbAllCalc(s, mon);
    var vCur = null;
    var vPrev = null;
    if (dotMode === "TB") {
      vCur = tb;
      vPrev = s.l1 ? s.l1[mon] : null;
    } else {
      var k = Number(dotMode.slice(1));
      vCur = s["l" + k] ? s["l" + k][mon] : null;
      for (var p = k - 1; p >= 1; p--) {
        var vp = s["l" + p] ? s["l" + p][mon] : null;
        if (vp !== null && vp !== undefined) {
          vPrev = vp;
          break;
        }
      }
    }
    if (vCur === null || vCur === undefined) return;
    var dLat = (vPrev !== null && vPrev !== undefined) ? Math.round((vCur - vPrev) * 100) / 100 : null;
    var item = {
      ten: s.ten,
      l1: s.l1 ? s.l1[mon] : null,
      l2: s.l2 ? s.l2[mon] : null,
      l3: s.l3 ? s.l3[mon] : null,
      l4: s.l4 ? s.l4[mon] : null,
      l5: s.l5 ? s.l5[mon] : null,
      l6: s.l6 ? s.l6[mon] : null,
      l7: s.l7 ? s.l7[mon] : null,
      tb: tb,
      latest: vCur,
      delta_latest: dLat
    };
    if (vCur < 5) phudao.push(item);
    else if (vCur < 6.5) quantam.push(item);
    if (vCur >= 8) boiduong.push(item);
    if (dLat !== null) {
      if (dLat >= 1.5) tienbo.push(item);
      if (dLat <= -2) thutlui.push(item);
    }
  });
  phudao.sort(function (a, b) { return a.latest - b.latest; });
  quantam.sort(function (a, b) { return a.latest - b.latest; });
  boiduong.sort(function (a, b) { return b.latest - a.latest; });
  tienbo.sort(function (a, b) { return b.delta_latest - a.delta_latest; });
  thutlui.sort(function (a, b) { return a.delta_latest - b.delta_latest; });
  return { phudao: phudao, quantam: quantam, boiduong: boiduong, tienbo: tienbo, thutlui: thutlui };
}

function renderLop() {
  var lop = $("selLop").value || "12A10";
  var mon = $("selMon").value || "Toán";
  var dotMode = ($("selDotLop") && $("selDotLop").value) || "AUTO";
  var st = PUB.class_stats[lop][mon];
  var parts = [];
  for (var k = 1; k <= 7; k++) {
    if (st["n" + k] > 0 && st["tb" + k] !== null) {
      parts.push("L" + k + ": <b>" + fmt(st["tb" + k]) + "</b> (" + st["duoi5_l" + k] + " &lt;5)");
    }
  }
  var stat = "Lớp <b>" + lop + "</b> • Môn <b>" + mon + "</b> • Đợt mới nhất: <b>"
    + (st.latest_dot || "—") + "</b> " + pill(st.delta_latest)
    + "<br>" + parts.join(" → ");
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
  var L = computeLopLists(lop, mon, dotMode);
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
  h += "<td>" + fmt(x.l5) + "</td>";
  h += "<td class='big'>" + fmt(x.l6) + "</td>";
  h += "<td class='big' style='color:#6d28d9'>" + fmt(x.l7) + "</td>";
  h += "<td style='" + tb3color(x.tb) + ";font-weight:800'>" + fmt(x.tb) + "</td></tr>";
  return h;
}

function topRows(list) {
  return list.map(function (x) {
    var tag = (x.from_dot && x.to_dot) ? (" <small>(" + x.from_dot + "→" + x.to_dot + ")</small>") : "";
    var h = "<tr><td>" + x.lop + "</td>";
    h += "<td class='l'>" + esc(x.ten) + "</td>";
    h += "<td>" + fmt(x.l1) + "→<b>" + fmt(x.l2) + "</b>" + tag + "</td>";
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
    : "<tr><td colspan='6' class='empty'>Không có</td></tr>";
  $("kTbBoi").innerHTML = B.boiduong.length
    ? B.boiduong.map(rowKhoi).join("")
    : "<tr><td colspan='6' class='empty'>Không có</td></tr>";
  $("kPhu").textContent = B.phudao.length + " em";
  $("kBoi").textContent = B.boiduong.length + " em";
  $("kTopTangT").textContent = "Đợt mới nhất";
  $("kTopGiamT").textContent = "Đợt mới nhất";
  $("kTopTang").innerHTML = T.tang_manh_nhat.length
    ? topRows(T.tang_manh_nhat)
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
  $("kTopGiam").innerHTML = T.giam_manh_nhat.length
    ? topRows(T.giam_manh_nhat)
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
}

/* ---------- 4. Tra cứu ---------- */

function normStr(s) {
  return (s || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

function groupChip(v) {
  if (v === null || v === undefined) {
    return "—";
  }
  if (v < 5) {
    return '<span class="pill down">phụ đạo</span>';
  }
  if (v >= 8) {
    return '<span class="pill up">bồi dưỡng</span>';
  }
  if (v < 6.5) {
    return '<span class="pill warn">quan tâm</span>';
  }
  return '<span class="pill flat">đạt</span>';
}

function latestScoreOf(s, mon) {
  for (var k = 7; k >= 1; k--) {
    var v = s["l" + k] ? s["l" + k][mon] : null;
    if (v !== null && v !== undefined) {
      return v;
    }
  }
  return null;
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
      return latestScoreOf(s, mon) !== null;
    });
    var body = rows.map(function (mon) {
      var vals = [1, 2, 3, 4, 5, 6, 7].map(function (k) {
        return s["l" + k] ? s["l" + k][mon] : null;
      });
      var tb = tbAllCalc(s, mon);
      var dLat = s.delta_latest ? s.delta_latest[mon] : null;
      var latV = latestScoreOf(s, mon);
      var r = "<tr><td class='l'>" + mon + "</td>";
      vals.forEach(function (v, idx) {
        var cls = (idx >= 5) ? " class='big'" : "";
        r += "<td" + cls + ">" + fmt(v) + "</td>";
      });
      r += "<td class='big' style='" + tb3color(tb) + "'>" + fmt(tb) + "</td>";
      r += "<td>" + pill(dLat) + "</td>";
      r += "<td>" + groupChip(latV) + "</td><td>" + spark7(vals) + "</td></tr>";
      return r;
    });
    var c = "<div class='card'><h3>" + esc(s.ten);
    c += " <span class='pill flat'>" + s.lop + "</span></h3>";
    c += "<p class='hint'>Điểm 7 đợt KTĐK (L1 → L7) • TB = trung bình các đợt đã thi • Δ = chênh lệch 2 đợt gần nhất.</p>";
    c += "<div class='tblwrap'><table class='tbl'><thead><tr>";
    c += "<th class='l'>Môn</th><th>L1</th><th>L2</th><th>L3</th><th>L4</th><th>L5</th><th>L6</th><th>L7</th><th>TB</th>";
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
  var csv = "\uFEFF" + rows.map(function (r) {
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
    var rows = [["Nhom", "Lop", "Ho ten", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "TB", "Delta_moi_nhat"]];
    B.phudao.forEach(function (x) {
      rows.push(["Phu dao", x.lop, x.ten, x.l1, x.l2, x.l3, x.l4, x.l5, x.l6, x.l7, x.tb, x.delta_latest]);
    });
    B.boiduong.forEach(function (x) {
      rows.push(["Boi duong", x.lop, x.ten, x.l1, x.l2, x.l3, x.l4, x.l5, x.l6, x.l7, x.tb, x.delta_latest]);
    });
    downloadCSV("toankhoi_" + curMonKhoi + "_L1-L7.csv", rows);
    return;
  }
  var lop = $("selLop").value;
  var mon = $("selMon").value;
  var dotMode = ($("selDotLop") && $("selDotLop").value) || "AUTO";
  var L = computeLopLists(lop, mon, dotMode);
  var r2 = [["Nhom", "Ho ten", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "TB", "Delta_moi_nhat"]];
  [["Phu dao", L.phudao], ["Quan tam", L.quantam], ["Boi duong", L.boiduong]].forEach(function (pair) {
    pair[1].forEach(function (x) {
      r2.push([pair[0], x.ten, x.l1, x.l2, x.l3, x.l4, x.l5, x.l6, x.l7, x.tb, x.delta_latest]);
    });
  });
  downloadCSV(lop + "_" + mon + "_L1-L7.csv", r2);
}

/* ---------- 6. Bang diem L1-L7 kieu Sheets ---------- */

var bdSort = { key: "ten", dir: 1 };

function activeDotsForLop(lop) {
  var dotSel = $("selDotBd");
  var mode = (dotSel && dotSel.value) || "ALL";
  if (mode !== "ALL") {
    return [mode, "TB"];
  }
  var out = [];
  for (var k = 1; k <= 7; k++) {
    var hasAny = SEC.students.some(function (s) {
      if (s.lop !== lop) return false;
      var lk = s["l" + k] || {};
      return Object.keys(lk).some(function (m) { return lk[m] !== null && lk[m] !== undefined; });
    });
    if (hasAny) {
      out.push("L" + k);
    }
  }
  out.push("TB");
  return out;
}

function bdVal(s, key) {
  if (key === "ten") {
    return s.ten;
  }
  var p = key.split("|");
  var mon = p[0];
  var k = p[1];
  if (k === "TB") {
    return tbAllCalc(s, mon);
  }
  var idx = Number(k.slice(1));
  var v = s["l" + idx] ? s["l" + idx][mon] : null;
  return (v === undefined) ? null : v;
}

function bdSubjects(lop) {
  var seen = {};
  SEC.students.forEach(function (s) {
    if (s.lop !== lop) {
      return;
    }
    PUB.meta.subjects.forEach(function (mon) {
      if (latestScoreOf(s, mon) !== null) {
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

function bdVals(rows, mon, k) {
  var out = [];
  rows.forEach(function (s) {
    var v = bdVal(s, mon + "|" + k);
    if (v !== null && v !== undefined && v !== "") {
      out.push(Number(v));
    }
  });
  return out;
}

function bdStatCell(vals, op) {
  if (!vals.length) {
    return "<td>—</td>";
  }
  if (op === "below5") {
    var c = vals.filter(function (x) {
      return x < 5;
    }).length;
    return "<td>" + c + "</td>";
  }
  var v = null;
  if (op === "avg") {
    var sum = vals.reduce(function (a, b) {
      return a + b;
    }, 0);
    v = Math.round(sum / vals.length * 100) / 100;
  } else if (op === "max") {
    v = Math.max.apply(null, vals);
  } else if (op === "min") {
    v = Math.min.apply(null, vals);
  }
  return "<td>" + fmt(v) + "</td>";
}

function renderBangDiem() {
  var tbl = $("bdTable");
  var sel = $("selLopBd");
  var lop = (sel && sel.value) || "12A10";
  if (!SEC) {
    tbl.innerHTML = "<thead><tr><th>Bảng điểm</th></tr></thead>"
      + "<tbody><tr><td class='empty'>Đã khóa — mở khóa ở mục 3 để xem.</td></tr></tbody>";
    $("bdStat").innerHTML = "";
    return;
  }
  var mons = bdSubjects(lop);
  var cols = activeDotsForLop(lop);
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
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;
    if (a < b) return -1 * sd;
    if (a > b) return 1 * sd;
    return 0;
  });
  var arrow = sd === 1 ? " sorted-asc" : " sorted-desc";
  var h = "<thead><tr><th class='c0'>STT</th>";
  h += "<th class='c1 l sortable" + (sk === "ten" ? arrow : "") + "' data-k='ten'>Họ tên</th>";
  mons.forEach(function (mon, i) {
    var g = " g" + (i % 2);
    cols.forEach(function (k) {
      var key = mon + "|" + k;
      var cls = "sortable" + g + (sk === key ? arrow : "");
      h += "<th class='" + cls + "' data-k='" + key + "'>" + mon + " " + k + "</th>";
    });
  });
  h += "</tr></thead><tbody>";
  var span = 2 + mons.length * cols.length;
  if (!rows.length) {
    h += "<tr><td colspan='" + span + "' class='empty'>Không có học sinh nào.</td></tr>";
  }
  rows.forEach(function (s, idx) {
    h += "<tr><td class='c0'>" + (idx + 1) + "</td>";
    h += "<td class='c1 l nm'>" + esc(s.ten) + "</td>";
    mons.forEach(function (mon) {
      cols.forEach(function (k) {
        var v = bdVal(s, mon + "|" + k);
        h += bdCell(v, k === "TB");
      });
    });
    h += "</tr>";
  });
  [["TB lớp", "avg"], ["Cao nhất", "max"], ["Thấp nhất", "min"], ["Dưới 5", "below5"]].forEach(function (pair) {
    h += "<tr class='avgrow'><td class='c0'>—</td><td class='c1 l'>" + pair[0] + "</td>";
    mons.forEach(function (mon) {
      cols.forEach(function (k) {
        h += bdStatCell(bdVals(rows, mon, k), pair[1]);
      });
    });
    h += "</tr>";
  });
  h += "</tbody>";
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
    + mons.length + " môn (" + cols.join(", ") + ") • Click tiêu đề cột để sắp xếp";
}

function exportBangDiem() {
  if (!SEC) {
    return;
  }
  var sel = $("selLopBd");
  var lop = (sel && sel.value) || "12A10";
  var mons = bdSubjects(lop);
  var cols = activeDotsForLop(lop);
  var head = ["STT", "Ho ten"];
  mons.forEach(function (mon) {
    cols.forEach(function (k) {
      head.push(mon + " " + k);
    });
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
      cols.forEach(function (k) {
        var v = bdVal(s, mon + "|" + k);
        r.push(v === undefined || v === null ? "" : v);
      });
    });
    out.push(r);
  });
  downloadCSV("bangdiem_" + lop + "_L1-L7.csv", out);
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
var curCombo = "B00";

function dotVal(s, mon, dot) {
  if (dot === "TB") {
    return tbAllCalc(s, mon);
  }
  var idx = Number(dot.slice(1));
  var v = s["l" + idx] ? s["l" + idx][mon] : null;
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
  var dot = (dotSel && dotSel.value) || "L6";
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
    h += "<tr><td colspan='7' class='empty'>Không có em nào đủ 3 môn ở đợt này.</td></tr>";
  }
  var sum = 0;
  rows.forEach(function (r, i) {
    sum += r.total;
    var rank = 1 + rows.filter(function (o) { return o.total > r.total; }).length;
    h += "<tr><td class='big'>" + rank + "</td>";
    h += "<td class='l nm'>" + esc(r.ten) + "</td><td>" + r.lop + "</td>";
    h += "<td>" + fmt(r.m[0]) + "</td><td>" + fmt(r.m[1]) + "</td><td>" + fmt(r.m[2]) + "</td>";
    h += "<td class='big' style='" + totalColor(r.total) + "'>" + fmt(r.total) + "</td></tr>";
  });
  h += "</tbody>";
  tbl.innerHTML = h;
  var avg = rows.length ? (Math.round(sum / rows.length * 100) / 100) : null;
  var mx = rows.length ? rows[0].total : null;
  var below15 = rows.filter(function (r) {
    return r.total < 15;
  }).length;
  $("thStat").innerHTML = "Tổ hợp <b>" + curCombo + "</b> (" + mons.join(" + ") + ") • Đợt <b>" + dot
    + "</b> • " + rows.length + " em đủ điểm • Cao nhất <b>" + fmt(mx)
    + "</b> • TB <b>" + fmt(avg) + "</b> • Dưới 15: <b>" + below15 + "</b> em";
}

function exportToHop() {
  if (!SEC) {
    return;
  }
  var lop = ($("selLopTh").value) || "ALL";
  var dot = ($("selDotTh").value) || "L6";
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
  rows.forEach(function (s) {
    var tot = comboTotal(s, mons, dot);
    var rk = 1 + rows.filter(function (o) { return comboTotal(o, mons, dot) > tot; }).length;
    out.push([rk, s.ten, s.lop, dotVal(s, mons[0], dot),
      dotVal(s, mons[1], dot), dotVal(s, mons[2], dot), tot]);
  });
  downloadCSV("tohop_" + curCombo + "_" + dot + ".csv", out);
}

/* ---------- 8. So sanh giua cac lop (cong khai) ---------- */

function ssKeys(dot) {
  var k = Number(dot.slice(1)) || 6;
  return { n: "n" + k, tb: "tb" + k, d: "duoi5_l" + k };
}

function renderSoSanh() {
  var tbl = $("ssTable");
  var dotSel = $("selDotSs");
  var dot = (dotSel && dotSel.value) || "L6";
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
  var dot = ($("selDotSs").value) || "L6";
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
  var head = ["MON"];
  DOTS.forEach(function (d, i) {
    var k = i + 1;
    head.push("DTB L" + k, "SL L" + k, "% duoi5 L" + k);
  });
  var rows = [head];
  MON_ALL.forEach(function (mon) {
    var t = s[mon];
    if (!t) {
      return;
    }
    var r = [mon];
    for (var k = 1; k <= 7; k++) {
      r.push(t["tb" + k], t["n" + k], t["pct_duoi5_l" + k]);
    }
    rows.push(r);
  });
  downloadCSV("tonghop_SoGD_L1-L7.csv", rows);
}

function spark7(vals) {
  var h = "<span class='spark'>";
  vals.forEach(function (v, i) {
    var lbl = "L" + (i + 1);
    if (v === null || v === undefined || v === "") {
      h += "<i title='" + lbl + ": —' style='height:3px;background:#e2e8f0'></i>";
    } else {
      var col = v < 5 ? "#ef4444" : (v >= 8 ? "#22c55e" : "#6366f1");
      h += "<i title='" + lbl + ": " + v + "' style='height:"
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
  if ($("selDotLop")) {
    $("selDotLop").innerHTML = "<option value='AUTO'>Mới nhất (L7/L6)</option>"
      + "<option value='TB'>TB tất cả các lần</option>"
      + ["L7", "L6", "L5", "L4", "L3", "L2", "L1"].map(function (d) {
        return "<option value='" + d + "'>" + d + "</option>";
      }).join("");
    $("selDotLop").value = "AUTO";
    $("selDotLop").addEventListener("change", renderLop);
  }
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
  if ($("selDotBd")) {
    $("selDotBd").innerHTML = "<option value='ALL'>Tất cả đợt có điểm (L1–L7)</option>"
      + ["L7", "L6", "L5", "L4", "L3", "L2", "L1"].map(function (d) {
        return "<option value='" + d + "'>Chỉ " + d + " + TB</option>";
      }).join("");
    $("selDotBd").value = "ALL";
    $("selDotBd").addEventListener("change", renderBangDiem);
  }
  $("bdQ").addEventListener("input", renderBangDiem);
  $("btnCsvBd").addEventListener("click", exportBangDiem);
  $("selLopTh").innerHTML = "<option value='ALL'>Tất cả lớp</option>" + PUB.meta.classes.map(function (c) {
    return "<option>" + c + "</option>";
  }).join("");
  $("selDotTh").innerHTML = ["L7", "L6", "L5", "L4", "L3", "L2", "L1", "TB"].map(function (d) {
    return "<option>" + d + "</option>";
  }).join("");
  $("selDotTh").value = "L6";
  $("selDotSs").innerHTML = ["L6", "L7", "L5", "L4", "L3", "L2", "L1"].map(function (d) {
    return "<option>" + d + "</option>";
  }).join("");
  $("selDotSs").value = "L6";
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
