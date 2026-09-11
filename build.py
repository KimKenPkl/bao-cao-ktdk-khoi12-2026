# -*- coding: utf-8 -*-
"""Build index.html single-file, có lớp bảo mật:
- CÔNG KHAI (plaintext): meta, subjects_stats, class_stats, overview_classes.
- NHẠY CẢM (tên HS): class_lists, block_lists, top_changes, students
  → mã hóa AES-256-GCM, khóa từ mật khẩu (.passwd) qua PBKDF2-HMAC-SHA256.
Không fetch, node --check 2 vòng, abort khi lỗi.
"""
import base64
import json
import os
import re
import subprocess
import sys

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ROOT = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(ROOT, "src", "template.html")
CSS = os.path.join(ROOT, "src", "style.css")
JS = os.path.join(ROOT, "src", "app.js")
DATA = os.path.join(ROOT, "data.json")
PASS = os.path.join(ROOT, ".passwd")
OUT = os.path.join(ROOT, "index.html")
TMP = os.path.join(ROOT, ".build_check.js")

PUB_KEYS = ["meta", "subjects_stats", "class_stats", "overview_classes"]
SEC_KEYS = ["class_lists", "block_lists", "top_changes", "students"]
ITER = 200000


def check_js(code, label):
    with open(TMP, "w", encoding="utf-8") as f:
        f.write(code)
    r = subprocess.run(["node", "--check", TMP], capture_output=True, text=True)
    if r.returncode != 0:
        print("JS LOI [%s]:" % label)
        print((r.stderr or "")[:2000])
        sys.exit(1)
    print("node --check OK [%s]" % label)


def b64(b):
    return base64.b64encode(b).decode("ascii")


def main():
    app = open(JS, encoding="utf-8").read()
    long_lines = [(k + 1, len(ln)) for k, ln in enumerate(app.split("\n")) if len(ln) > 1000]
    if long_lines:
        print("LOI: app.js có dòng quá dài:", long_lines)
        sys.exit(1)
    check_js(app, "src/app.js")

    password = open(PASS, encoding="utf-8").read().strip()
    if len(password) < 8:
        print("LOI: mat khau trong .passwd qua ngan")
        sys.exit(1)

    data = json.load(open(DATA, encoding="utf-8"))
    pub = {k: data[k] for k in PUB_KEYS}
    sec = {k: data[k] for k in SEC_KEYS}
    sec_raw = json.dumps(sec, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    salt = os.urandom(16)
    iv = os.urandom(12)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER)
    key = kdf.derive(password.encode("utf-8"))
    ct = AESGCM(key).encrypt(iv, sec_raw, None)
    lock = {"v": 1, "iter": ITER, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}

    # tự kiểm: không tên HS nào lọt ra phần công khai
    pub_txt = json.dumps(pub, ensure_ascii=False)
    sample_names = [s["ten"] for s in data["students"][:30]]
    leaked = [n for n in sample_names if n in pub_txt]
    if leaked:
        print("LOI RO RI TEN HS RA PUBLIC:", leaked[:5])
        sys.exit(1)
    print("kiem ro ri: OK (%d HS mau, 0 lot)" % len(sample_names))

    css = open(CSS, encoding="utf-8").read()
    tpl = open(TPL, encoding="utf-8").read()
    html = tpl.replace("/*__STYLE__*/", css)
    html = html.replace("/*__DATA__*/", "window.__PUB__ = " + json.dumps(pub, ensure_ascii=False) + ";")
    html = html.replace("/*__LOCK__*/", "window.__LOCK__ = " + json.dumps(lock) + ";")
    html = html.replace("/*__APP__*/", app)
    for tag in ("/*__STYLE__*/", "/*__DATA__*/", "/*__LOCK__*/", "/*__APP__*/"):
        assert tag not in html, "Thieu thay the %s" % tag
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)

    scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
    check_js(scripts[-1], "index.html inline")
    print("build OK: %s (%d bytes, kin %d bytes)" % (OUT, os.path.getsize(OUT), len(sec_raw)))
    try:
        os.remove(TMP)
    except OSError:
        pass


if __name__ == "__main__":
    main()
