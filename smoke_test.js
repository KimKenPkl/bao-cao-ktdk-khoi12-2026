// Smoke test v2: public render không lộ tên + giải mã AES kiểm tra interop.
const fs = require("fs");
const path = require("path");
const ROOT = "D:/bao-cao-ktdk-khoi12";

function makeElem(id) {
  return {
    id: id || "",
    innerHTML: "",
    textContent: "",
    value: "",
    title: "",
    _handlers: {},
    addEventListener: function (ev, fn) {
      this._handlers[ev] = fn;
    },
    querySelectorAll: function () {
      return [];
    },
    appendChild: function () {},
    removeChild: function () {},
    click: function () {},
    focus: function () {}
  };
}

const ids = {};
global.document = {
  getElementById: function (id) {
    if (!ids[id]) {
      ids[id] = makeElem(id);
    }
    return ids[id];
  },
  createElement: function () {
    return makeElem("dyn");
  },
  body: makeElem("body")
};

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf-8");
function take(marker) {
  const i = html.indexOf(marker);
  if (i === -1) {
    throw new Error("thieu marker " + marker);
  }
  const j = html.indexOf("</script>", i);
  let s = html.slice(i + marker.length, j).trim();
  if (s.endsWith(";")) {
    s = s.slice(0, -1);
  }
  return s;
}
global.window = {};
global.window.__PUB__ = JSON.parse(take("window.__PUB__ = "));
global.window.__LOCK__ = JSON.parse(take("window.__LOCK__ = "));
global.URL = { createObjectURL: function () { return "blob:x"; } };
global.Blob = function () {};

const appSrc = fs.readFileSync(path.join(ROOT, "src", "app.js"), "utf-8");
eval.call(global, appSrc);

let fail = 0;
function ok(cond, label) {
  if (!cond) {
    console.log("FAIL [" + label + "]");
    fail = 1;
  } else {
    console.log("PASS [" + label + "]");
  }
}

ok(ids.tbKhoi.innerHTML.indexOf("138") !== -1, "public: bang khoi co so");
ok(ids.gateBox.innerHTML.indexOf("password") !== -1, "khoa: hien o khoa");
ok(ids.tbPhu.innerHTML.indexOf("Anh") === -1, "khoa: list lop khong lo ten");
ok(ids.kTbPhu.innerHTML.indexOf("12A6") === -1, "khoa: list khoi khong lo ten");
ok(ids.matrixWrap.innerHTML.indexOf("12A6") !== -1, "public: ma tran van hien");
ok(ids.bdTable.innerHTML.indexOf("mở khóa ở mục 3") !== -1 && ids.bdStat.innerHTML === "", "bang diem: khoa khi chua mo khoa");

// Giải mã bằng WebCrypto của node (giống trình duyệt) với mật khẩu thật
async function unlockTest() {
  const LOCK = global.window.__LOCK__;
  const pw = fs.readFileSync(path.join(ROOT, ".passwd"), "utf-8").trim();
  const enc = new TextEncoder();
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(LOCK.salt), iterations: LOCK.iter, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(LOCK.iv) }, key, b64(LOCK.ct));
  const sec = JSON.parse(new TextDecoder().decode(plain));
  ok(sec.class_lists["12A10"]["Toán"].phudao.length === 15, "giai ma: du 15 em 12A10 Toan");
  ok(sec.students.length >= 460, "giai ma: du danh sach HS");
  // sai mật khẩu phải thất bại
  try {
    const bk2 = await crypto.subtle.importKey("raw", enc.encode("sai-mat-khau"), "PBKDF2", false, ["deriveKey"]);
    const k2 = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(LOCK.salt), iterations: LOCK.iter, hash: "SHA-256" },
      bk2,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(LOCK.iv) }, k2, b64(LOCK.ct));
    ok(false, "sai mk phai that bai");
  } catch (e) {
    ok(true, "sai mk phai that bai");
  }
  if (!fail) {
    console.log("SMOKE OK");
  }
  process.exit(fail ? 1 : 0);
}

unlockTest().catch((e) => {
  console.log("FAIL [decrypt crash]: " + e.message);
  process.exit(1);
});
