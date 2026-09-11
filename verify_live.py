# -*- coding: utf-8 -*-
"""Kiểm chứng live sau purge: khóa hoạt động, không tên plaintext, JS sạch."""
import re
import subprocess
import urllib.request

URL = "https://kimkenpkl.github.io/bao-cao-ktdk-khoi12-2026/"
html = urllib.request.urlopen(URL, timeout=60).read().decode("utf-8")
print("live bytes:", len(html))
assert "window.__PUB__" in html, "thieu public"
assert "window.__LOCK__" in html, "thieu lockbox"
assert "Mở khóa" in html, "thieu nut mo khoa"
for probe in ["Tường Anh", "Trúc Chi", "Ngô Võ Ngọc Anh", "Bảo Trang"]:
    assert probe not in html, "LO TEN: " + probe
print("khong lo ten plaintext: OK")
# data.json gốc không còn phục vụ?
try:
    urllib.request.urlopen(URL + "data.json", timeout=30)
    print("CANH BAO: data.json van ton tai tren Pages");
except Exception as e:
    print("data.json da go (tot):", getattr(e, "code", e))
scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
open(r"C:\Users\LENOVO\AppData\Local\Temp\opencode\live3.js", "w", encoding="utf-8").write(scripts[-1])
r = subprocess.run(["node", "--check", r"C:\Users\LENOVO\AppData\Local\Temp\opencode\live3.js"],
                   capture_output=True, text=True)
print("live JS check exit:", r.returncode)
assert r.returncode == 0, r.stderr[:300]
print("LIVE OK")
