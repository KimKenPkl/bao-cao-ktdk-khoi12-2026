# -*- coding: utf-8 -*-
"""Gộp file lớp mới nhất (12A7, 12A10) vào data tổng hợp rồi tái xuất data.json."""
import openpyxl, glob, os, json, re
from datetime import datetime

D = r"C:\Users\LENOVO\Downloads"
BASE_L1 = os.path.join(D, "26-27 Khoi 12- Diem KTDK - Lan 1 (Da ra soat).xlsx")
BASE_L2 = os.path.join(D, "26-27 Khoi 12- Diem KTDK - Lan 2 (Da ra soat).xlsx")
OUT = r"D:\bao-cao-ktdk-khoi12\data.json"

SUBJECTS = ["Toán","Ngữ văn","Vật lí","Hóa học","Sinh học","Lịch sử","Tin học","Anh Văn","KTPL"]
COL = {"Toán":3,"Ngữ văn":4,"Vật lí":5,"Hóa học":6,"Sinh học":7,"Lịch sử":8,"Tin học":9,"Anh Văn":10,"KTPL":11}

def norm(s):
    return re.sub(r"\s+", " ", str(s).strip()) if s not in (None,"") else ""

def load_base(f):
    wb = openpyxl.load_workbook(f, data_only=True, read_only=True)
    ws = wb["TỔNG HỢP MÔN"]
    out = {}
    for r in list(ws.iter_rows(values_only=True))[2:]:
        lop = norm(r[1])
        if not lop.startswith("12A"):
            continue
        ten = norm(r[2])
        d = {}
        for s in SUBJECTS:
            v = r[COL[s]]
            try: d[s] = float(v) if v not in (None,"") else None
            except: d[s] = None
        out[(lop, ten)] = d
    return out

d1 = load_base(BASE_L1); d2 = load_base(BASE_L2)
print(f"BASE L1={len(d1)} L2={len(d2)}")
applied = []

# ---------- 12A7: file 12A7_L2 (2).xlsx sheets L1/L2: STT,SBD,Họ,Tên,Toán,Lý,Hóa,Văn ----------
f7 = os.path.join(D, "12A7_L2 (2).xlsx")
wb7 = openpyxl.load_workbook(f7, data_only=True, read_only=True)
for sn, DD, rnd in [("L1", d1, "L1"), ("L2", d2, "L2")]:
    ws = wb7[sn]
    rows = list(ws.iter_rows(values_only=True))
    n_ok = n_new = n_diff = 0
    for r in rows[3:]:
        if r[1] in (None, ""): continue
        ten = norm(f"{r[2]} {r[3]}")
        vals = {"Toán": r[4], "Vật lí": r[5], "Hóa học": r[6], "Ngữ văn": r[7]}
        key = ("12A7", ten)
        if key not in DD:
            # thử khớp không phân biệt thứ tự họ tên
            cand = [k for k in DD if k[0]=="12A7" and norm(k[1])==ten]
            if not cand:
                n_new += 1; continue
            key = cand[0]
        for s, v in vals.items():
            try: nv = float(v) if v not in (None,"") else None
            except: nv = None
            ov = DD[key].get(s)
            if nv is None: continue
            if ov is None:
                DD[key][s] = nv; n_diff += 1
            elif abs(ov - nv) > 1e-9:
                print(f"  12A7 {rnd} {ten} {s}: base={ov} -> file={nv}")
                DD[key][s] = nv; n_diff += 1
            else: n_ok += 1
    msg = f"12A7-{rnd}: khớp {n_ok}, cập nhật/thêm {n_diff}, lạ {n_new}"
    print(msg); applied.append(f"{os.path.basename(f7)}[{sn}] ({msg})")

# ---------- 12A10 L1: 2 bản, chọn bản có Văn đầy đủ hơn ----------
cands = glob.glob(os.path.join(D, "*12A10*Lan 1*")) + glob.glob(os.path.join(D, "*12A10*Lần 1*")) + glob.glob(os.path.join(D, "*môn Văn*"))
print("12A10-L1 candidates:", [os.path.basename(c) for c in cands])
def van_count(f):
    wb = openpyxl.load_workbook(f, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [norm(c) for c in rows[3]]
    iv = hdr.index("Văn") if "Văn" in hdr else None
    if iv is None: return (f, -1, None)
    n = sum(1 for r in rows[4:] if r[0] not in (None,"") and len(r) > iv and r[iv] not in (None,""))
    return (f, n, os.path.getmtime(f))
ranked = sorted([van_count(f) for f in cands], key=lambda x: (x[1], x[2]))
print("ranked:", [(os.path.basename(f), n) for f, n, _ in ranked])
best10 = ranked[-1][0]

def apply_10(f, DD, rnd, colmap):
    wb = openpyxl.load_workbook(f, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    rows = list(ws.iter_rows(values_only=True))
    hdr = [norm(c) for c in rows[3]]
    idx = {name: hdr.index(h) for name, h in colmap.items() if h in hdr}
    n_ok = n_diff = n_new = 0
    for r in rows[4:]:
        if r[0] in (None, ""): continue
        ten = norm(f"{r[hdr.index('Họ')]} {r[hdr.index('Tên')]}")
        key = ("12A10", ten)
        if key not in DD:
            n_new += 1; continue
        for s, h in colmap.items():
            if h not in hdr: continue
            v = r[hdr.index(h)]
            try: nv = float(v) if v not in (None,"") else None
            except: nv = None
            if nv is None: continue
            ov = DD[key].get(s)
            if ov is None or abs(ov - nv) > 1e-9:
                if ov is not None and abs(ov-nv) > 1e-9:
                    print(f"  12A10 {rnd} {ten} {s}: base={ov} -> file={nv}")
                DD[key][s] = nv; n_diff += 1
            else: n_ok += 1
    msg = f"12A10-{rnd}: khớp {n_ok}, cập nhật/thêm {n_diff}, lạ {n_new}"
    print(msg); applied.append(f"{os.path.basename(f)} ({msg})")

apply_10(best10, d1, "L1", {"Toán":"Toán","Hóa học":"Hoá","Sinh học":"Sinh","Ngữ văn":"Văn"})

# ---------- 12A10 L2: bản (3) mới nhất ----------
c2 = sorted(glob.glob(os.path.join(D, "12A10- KTĐK-LẦN 2*.xlsx")), key=os.path.getmtime)
print("12A10-L2 cands:", [(os.path.basename(c)) for c in c2])
apply_10(c2[-1], d2, "L2", {"Toán":"Toán","Hóa học":"Hoá","Sinh học":"Sinh","Ngữ văn":"Văn"})

# ---------- tái tính toán (giống analyze.py) ----------
all_keys = sorted(set(d1) | set(d2))
classes = sorted({k[0] for k in all_keys})
def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs)/len(xs), 3) if xs else None
def pct_below(xs, th=5):
    xs = [x for x in xs if x is not None]
    return round(100*sum(1 for x in xs if x < th)/len(xs), 1) if xs else None

students = []
for lop, ten in all_keys:
    rec = {"lop": lop, "ten": ten, "l1": d1.get((lop, ten), {}), "l2": d2.get((lop, ten), {})}
    delta = {}
    for s in SUBJECTS:
        a = rec["l1"].get(s); b = rec["l2"].get(s)
        delta[s] = round(b-a, 2) if (a is not None and b is not None) else None
    rec["delta"] = delta
    students.append(rec)

subjects_stats = {}
for s in SUBJECTS:
    v1 = [d1[k].get(s) for k in d1 if d1[k].get(s) is not None]
    v2 = [d2[k].get(s) for k in d2 if d2[k].get(s) is not None]
    pd = [d2[k][s]-d1[k][s] for k in set(d1)&set(d2) if d1[k].get(s) is not None and d2[k].get(s) is not None]
    subjects_stats[s] = {
        "n1": len(v1), "n2": len(v2),
        "tb1": avg(v1), "tb2": avg(v2),
        "delta": round(avg(v2)-avg(v1), 3) if (avg(v1) is not None and avg(v2) is not None) else None,
        "duoi5_l1": sum(1 for x in v1 if x < 5), "duoi5_l2": sum(1 for x in v2 if x < 5),
        "pct_duoi5_l1": pct_below(v1), "pct_duoi5_l2": pct_below(v2),
        "gioi_l2": sum(1 for x in v2 if x >= 8),
        "kha_l2": sum(1 for x in v2 if 6.5 <= x < 8),
        "tb_y_l2": sum(1 for x in v2 if 5 <= x < 6.5),
        "tang": sum(1 for x in pd if x > 0), "giam": sum(1 for x in pd if x < 0), "bang": sum(1 for x in pd if x == 0),
    }

class_stats = {}; class_lists = {}
for lop in classes:
    class_stats[lop] = {}; class_lists[lop] = {}
    keys = [k for k in all_keys if k[0] == lop]
    for s in SUBJECTS:
        v1 = [d1[k][s] for k in keys if k in d1 and d1[k][s] is not None]
        v2 = [d2[k][s] for k in keys if k in d2 and d2[k][s] is not None]
        class_stats[lop][s] = {"n1": len(v1), "n2": len(v2), "tb1": avg(v1), "tb2": avg(v2),
            "delta": (round(avg(v2)-avg(v1), 2) if v1 and v2 else None),
            "duoi5_l1": sum(1 for x in v1 if x < 5), "duoi5_l2": sum(1 for x in v2 if x < 5)}
        phudao, quantam, boiduong, tienbo, thutlui = [], [], [], [], []
        for k in keys:
            ten = k[1]
            a = d1.get(k, {}).get(s); b = d2.get(k, {}).get(s)
            if b is None: continue
            item = {"ten": ten, "l1": a, "l2": b, "delta": round(b-a, 2) if a is not None else None}
            if b < 5: phudao.append(item)
            elif 5 <= b < 6.5: quantam.append(item)
            if b >= 8: boiduong.append(item)
            if a is not None:
                if b-a >= 1.5: tienbo.append(item)
                if b-a <= -2: thutlui.append(item)
        phudao.sort(key=lambda x: x["l2"]); quantam.sort(key=lambda x: x["l2"])
        boiduong.sort(key=lambda x: -x["l2"]); tienbo.sort(key=lambda x: -x["delta"]); thutlui.sort(key=lambda x: x["delta"])
        class_lists[lop][s] = {"phudao": phudao, "quantam": quantam, "boiduong": boiduong, "tienbo": tienbo, "thutlui": thutlui}

block_lists = {}
for s in SUBJECTS:
    ph, bd = [], []
    for k in all_keys:
        lop, ten = k
        b = d2.get(k, {}).get(s) if k in d2 else None
        if b is None: continue
        a = d1.get(k, {}).get(s) if k in d1 else None
        item = {"lop": lop, "ten": ten, "l1": a, "l2": b, "delta": round(b-a, 2) if a is not None else None}
        if b < 5: ph.append(item)
        if b >= 8: bd.append(item)
    ph.sort(key=lambda x: x["l2"]); bd.sort(key=lambda x: -x["l2"])
    block_lists[s] = {"phudao": ph, "boiduong": bd}

top_changes = {}
for s in SUBJECTS:
    arr = []
    for k in set(d1) & set(d2):
        a, b = d1[k][s], d2[k][s]
        if a is None or b is None: continue
        arr.append({"lop": k[0], "ten": k[1], "l1": a, "l2": b, "delta": round(b-a, 2)})
    top_changes[s] = {"giam_manh_nhat": sorted(arr, key=lambda x: x["delta"])[:10],
                      "tang_manh_nhat": sorted(arr, key=lambda x: -x["delta"])[:10]}

data = {
    "meta": {"truong": "THPT Chi Lăng - Gia Lai", "khoi": "Khối 12",
             "lan1": "KTĐK Lần 1 (23/8/2026)", "lan2": "KTĐK Lần 2",
             "cap_nhat": datetime.now().strftime("%H:%M %d/%m/%Y"),
             "nguon": ["26-27 Khoi 12- Diem KTDK - Lan 1 (Da ra soat).xlsx",
                        "26-27 Khoi 12- Diem KTDK - Lan 2 (Da ra soat).xlsx"] + applied,
             "siso_l1": len(d1), "siso_l2": len(d2), "subjects": SUBJECTS, "classes": classes},
    "subjects_stats": subjects_stats,
    "overview_classes": [{"lop": lop, "siso_l1": sum(1 for k in all_keys if k[0]==lop and k in d1),
                          "siso_l2": sum(1 for k in all_keys if k[0]==lop and k in d2),
                          "stats": class_stats[lop]} for lop in classes],
    "class_stats": class_stats, "class_lists": class_lists,
    "block_lists": block_lists, "top_changes": top_changes, "students": students,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)
print("wrote", OUT, os.path.getsize(OUT))
for s in SUBJECTS:
    st = subjects_stats[s]
    print(f"{s}: n1={st['n1']} TB1={st['tb1']} | n2={st['n2']} TB2={st['tb2']} | Δ={st['delta']} | <5: {st['duoi5_l1']}→{st['duoi5_l2']} | ≥8: {st['gioi_l2']}")
# mẫu tên phụ đạo/bồi dưỡng Toán 12A10 + Văn
print("12A10 Toán phụ đạo:", [(x['ten'], x['l2']) for x in class_lists['12A10']['Toán']['phudao'][:5]])
print("12A10 Văn L1 n =", class_stats['12A10']['Ngữ văn']['n1'], "TB:", class_stats['12A10']['Ngữ văn']['tb1'])
print("12A7 Văn L1 n =", class_stats['12A7']['Ngữ văn']['n1'], "TB:", class_stats['12A7']['Ngữ văn']['tb1'])
