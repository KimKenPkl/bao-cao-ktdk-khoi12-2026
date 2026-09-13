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
  var gap = (toan.duoi5_l2 / Math.max(1, toan.duoi5_l1)).toFixed(1);
  var items = [];
  items.push("<li><b>Toán:</b> " + toan.duoi5_l2
    + " em dưới 5 ở L2 (gấp " + gap + " lần L1) — TB "
    + fmt(toan.tb1) + " → " + fmt(toan.tb2) + ".</li>");
  items.push("<li><b>Vật lí:</b> giảm sâu nhất ("
    + fmt(ly.delta) + " điểm), " + ly.duoi5_l2 + " em dưới 5.</li>");
  items.push("<li><b>Hóa học &amp; KTPL</b> là 2 môn duy nhất "
    + "<b>tăng điểm</b> (+" + s["Hóa học"].delta
    + " và +" + s["KTPL"].delta + ").</li>");
  items.push("<li><b>Sinh học:</b> " + s["Sinh học"].pct_duoi5_l2
    + "% dưới 5 ở L2 — khối B00 cần phụ đạo gấp.</li>");
  $("alertBox").innerHTML = items.join("");
}

function renderKPIs() {
  var s = PUB.subjects_stats;
  var defs = ["Toán", "Vật lí", "Hóa học", "Anh Văn"];
  var h = defs.map(function (mon) {
    var t = s[mon];
    var sub = t.duoi5_l2 + " em <5";
    if (mon === "Hóa học") {
      sub = t.gioi_l2 + " em ≥8";
    }
    return "<div class='card kpi'>"
      + "<div class='k'>" + mon + " TB (L2)</div>"
      + "<div class='v'>" + fmt(t.tb2) + "</div>"
      + "<div>" + pill(t.delta) + "</div>"
      + "<div class='s'>" + sub + "</div></div>";
  });
  $("kpiGrid").innerHTML = h.join("");
}

function barRow(label, v1, v2, txt, cls2) {
  var p1 = v1 === null ? 0 : Math.max(0, Math.min(10, v1)) * 10;
  var p2 = v2 === null ? 0 : Math.max(0, Math.min(10, v2)) * 10;
  var h = "<div class='barrow'>";
  h += "<div class='bl'>" + label + "</div>";
  h += "<div class='track'>";
  h += "<div class='fill l1' style='width:" + p1.toFixed(1) + "%'></div>";
  h += "<div class='fill " + cls2 + "' style='width:" + p2.toFixed(1) + "%'></div>";
  h += "</div>";
  h += "<div class='bv'>" + txt + "</div></div>";
  return h;
}

function renderCharts() {
  var s = PUB.subjects_stats;
  var mons = MON_ALL.filter(fullCover);
  var avg = mons.map(function (mon) {
    var t = s[mon];
    return barRow(mon, t.tb1, t.tb2, fmt(t.tb1) + " → " + fmt(t.tb2), "l2");
  });
  var leg = "<div class='legend'><span><span class='dot' "
    + "style='background:#94a3b8'></span>L1</span><span><span class='dot' "
    + "style='background:#4f46e5'></span>L2</span></div>";
  $("chartAvg").innerHTML = avg.join("") + leg;
  var bel = mons.map(function (mon) {
    var t = s[mon];
    var a = t.pct_duoi5_l1 || 0;
    var b = t.pct_duoi5_l2 || 0;
    return barRow(mon, a, b, a + "% → " + b + "%", "bad");
  });
  $("chartBelow").innerHTML = bel.join("") + leg;
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
    r += "<td>" + pill(t.delta) + "</td>";
    r += "<td>" + t.duoi5_l1 + " (" + t.pct_duoi5_l1 + "%)</td>";
    r += "<td class='big' style='color:var(--red)'>" + t.duoi5_l2;
    r += " (" + pct2 + "%)</td>";
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
  h += "<th>Sĩ số L2</th></tr></thead><tbody>";
  PUB.meta.classes.forEach(function (lop) {
    h += "<tr><td class='l big'>" + lop + "</td>";
    MON_CHINH.forEach(function (mon) {
      var t = (PUB.class_stats[lop] || {})[mon];
      if (!t || !t.n2) {
        h += "<td style='color:#cbd5e1'>—</td>";
        return;
      }
      var hot = (t.tb2 !== null && t.tb2 < 5.5) || t.duoi5_l2 >= 10;
      h += hot ? "<td class='hot'>" : "<td>";
      h += "<span class='big'>" + fmt(t.tb2) + "</span> " + pill(t.delta);
      h += "<br><small";
      if (t.duoi5_l2 > 0) {
        h += " style='color:var(--red);font-weight:800'";
      }
      h += ">" + t.duoi5_l2 + " em &lt;5</small></td>";
    });
    var ov = null;
    PUB.overview_classes.forEach(function (o) {
      if (o.lop === lop) {
        ov = o;
      }
    });
    h += "<td>" + (ov ? ov.siso_l2 : "—") + "</td></tr>";
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
  h += "<td class='big'>" + fmt(x.l2) + "</td></tr>";
  return h;
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
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
  $("kTbBoi").innerHTML = B.boiduong.length
    ? B.boiduong.map(rowKhoi).join("")
    : "<tr><td colspan='4' class='empty'>Không có</td></tr>";
  $("kPhu").textContent = B.phudao.length + " em";
  $("kBoi").textContent = B.boiduong.length + " em";
  $("kTopTang").innerHTML = T.tang_manh_nhat.map(function (x) {
    var h = "<tr><td>" + x.lop + "</td>";
    h += "<td class='l'>" + esc(x.ten) + "</td>";
    h += "<td>" + fmt(x.l1) + "→<b>" + fmt(x.l2) + "</b></td>";
    h += "<td>" + pill(x.delta) + "</td></tr>";
    return h;
  }).join("");
  $("kTopGiam").innerHTML = T.giam_manh_nhat.map(function (x) {
    var h = "<tr><td>" + x.lop + "</td>";
    h += "<td class='l'>" + esc(x.ten) + "</td>";
    h += "<td>" + fmt(x.l1) + "→<b>" + fmt(x.l2) + "</b></td>";
    h += "<td>" + pill(x.delta) + "</td></tr>";
    return h;
  }).join("");
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
      r += "<td>" + groupChip(s.l2[mon]) + "</td></tr>";
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
    c += "<th>Δ</th><th>Nhóm</th>";
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
    var rows = [["Nhom", "Lop", "Ho ten", "L1", "L2", "Delta"]];
    B.phudao.forEach(function (x) {
      rows.push(["Phu dao", x.lop, x.ten, x.l1, x.l2, x.delta]);
    });
    B.boiduong.forEach(function (x) {
      rows.push(["Boi duong", x.lop, x.ten, x.l1, x.l2, x.delta]);
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
  renderGate();
  renderLop();
  renderMonTabs();
  renderKhoi();
}

if (!PUB) {
  $("metaLine").textContent = "Lỗi dữ liệu. Hãy tải lại trang.";
} else {
  init();
}

})();
