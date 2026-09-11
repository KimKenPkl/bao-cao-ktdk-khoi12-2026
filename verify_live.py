# -*- coding: utf-8 -*-
"""Kiểm chứng web live sau deploy."""
import re
import subprocess
import urllib.request

URL = "https://kimkenpkl.github.io/bao-cao-ktdk-khoi12-2026/"
html = urllib.request.urlopen(URL, timeout=60).read().decode("utf-8")
print("live bytes:", len(html))
assert "window.__DB__" in html, "thieu data nhung"
assert "Đang tải dữ liệu" not in html, "con chu treo"
assert "23:14 11/09/2026" in html, "sai version stamp"
assert "Ngô Võ Ngọc Anh" in html, "thieu ten HS"
print("markers OK")

scripts = re.findall(r"<script>(.*?)</script>", html, re.S)
print("inline scripts:", len(scripts), [len(s) for s in scripts])
open(r"C:\Users\LENOVO\AppData\Local\Temp\opencode\live2.js", "w", encoding="utf-8").write(scripts[-1])
r = subprocess.run(["node", "--check", r"C:\Users\LENOVO\AppData\Local\Temp\opencode\live2.js"],
                   capture_output=True, text=True)
print("live JS check exit:", r.returncode)
assert r.returncode == 0, r.stderr[:500]
print("LIVE OK")
