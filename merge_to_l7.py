# -*- coding: utf-8 -*-
"""Gộp dữ liệu KTĐK Khối 12 từ Lần 1 đến Lần 7 (L1–L6 toàn khối 11 lớp + L7 lớp 12A10 và mở rộng dần).
Đảm bảo idempotent: luôn đọc từ bản gốc L1-L3 (hoặc backup chuẩn trước L4) rồi áp toàn bộ L1->L7.
"""
import datetime as dt
import json
import os
import re
import shutil
import unicodedata
from openpyxl import load_workbook

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data.json")
BASE_SNAPSHOT = os.path.join(ROOT, "data_base_l1_l3.json")
DL = r"C:\Users\LENOVO\Downloads"
BASE6_DIR = os.path.join(DL, "lan 6", "ĐIỂM KTĐK K12_2026-2027")

LOPS = [f"12A{i}" for i in range(1, 12)]
SUBJECTS = ["Toán", "Ngữ văn", "Vật lí", "Hóa học", "Sinh học", "Lịch sử", "Tin học", "Anh Văn", "KTPL"]
DOTS = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"]
HDR2MON = {
    "toán": "Toán",
    "lý": "Vật lí",
    "vật lí": "Vật lí",
    "hóa": "Hóa học",
    "hoá": "Hóa học",
    "văn": "Ngữ văn",
    "ngữ văn": "Ngữ văn",
    "anh": "Anh Văn",
    "sinh": "Sinh học",
    "sử": "Lịch sử",
    "tin": "Tin học",
    "ktpl": "KTPL",
}


def norm(s):
    s = unicodedata.normalize("NFC", str(s or ""))
    return re.sub(r"\s+", " ", s.strip())


def dedup_tok(s):
    out = []
    for t in norm(s).split(" "):
        if not out or out[-1].lower() != t.lower():
            out.append(t)
    return " ".join(out)


def key_norm(s):
    return dedup_tok(s).lower()


def fnum(v):
    if v in (None, ""):
        return None
    if isinstance(v, dt.datetime):
        return None
    if isinstance(v, str) and v.strip().startswith("#"):
        return None
    try:
        val = float(v)
        if val < 0 or val > 10:
            return None
        return round(val, 2)
    except (TypeError, ValueError):
        return None


def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs) / len(xs), 3) if xs else None


def pct_below(xs, th=5):
    xs = [x for x in xs if x is not None]
    return round(100 * sum(1 for x in xs if x < th) / len(xs), 1) if xs else None


def main():
    if not os.path.exists(BASE_SNAPSHOT):
        shutil.copy2(DATA, BASE_SNAPSHOT)
        print("Created clean L1-L3 snapshot:", BASE_SNAPSHOT)

    data = json.load(open(BASE_SNAPSHOT, encoding="utf-8"))

    # 1. Xử lý chuyển lớp giữa L3 và L4-L6 + gộp bản ghi trùng (Lê Duy Thái) + xoá HS nghỉ học (Phạm Hữu Nam Huy)
    transfer_map = {
        ("12A7", "tăng long hiển"): "12A1",
        ("12A7", "nguyễn anh quân"): "12A1",
        ("12A7", "trịnh đức tài"): "12A1",
        ("12A7", "trịnh quang trường"): "12A1",
        ("12A3", "lê anh tuấn"): "12A1",
        ("12A1", "ngụy gia bảo"): "12A3",
        ("12A1", "trần minh đức"): "12A3",
        ("12A1", "nguyễn ngọc đăng quân"): "12A3",
        ("12A8", "nguyễn minh đức"): "12A4",
        ("12A8", "nguyễn lê anh thư"): "12A4",
        ("12A1", "lê bùi tiến đạt"): "12A7",
        ("12A1", "trần lê bảo huy"): "12A7",
        ("12A9", "phạm hữu bảo nam"): "12A7",
        ("12A1", "lâm tâm như"): "12A7",
        ("12A9", "phạm tấn quốc"): "12A7",
        ("12A9", "huỳnh anh trí"): "12A7",
        ("12A11", "nguyễn hoàng gia bảo"): "12A9",
        ("12A11", "trần thanh gia bảo"): "12A9",
        ("12A11", "phạm trung ngọc hiền"): "12A9",
        ("12A11", "nguyễn thái hưng phát"): "12A9",
        ("12A11", "bùi gia thịnh"): "12A9",
    }

    # Gộp Lê Duy Thái (12A5 + 12A11 -> 12A7) và xoá Phạm Hữu Nam Huy (12A10 nghỉ học)
    ldt_merged = None
    cleaned_students = []
    for s in data["students"]:
        kn = key_norm(s["ten"])
        s["ten"] = dedup_tok(s["ten"])
        if s["lop"] == "12A10" and kn == "phạm hữu nam huy":
            continue
        if kn == "lê duy thái" and s["lop"] in ("12A5", "12A11"):
            if ldt_merged is None:
                ldt_merged = {
                    "lop": "12A7",
                    "ten": "Lê Duy Thái",
                    "l1": {},
                    "l2": {},
                    "l3": {},
                }
                cleaned_students.append(ldt_merged)
            for lk in ("l1", "l2", "l3"):
                for m, val in (s.get(lk) or {}).items():
                    if val is not None:
                        ldt_merged[lk][m] = val
            continue
        if (s["lop"], kn) in transfer_map:
            s["lop"] = transfer_map[(s["lop"], kn)]
        cleaned_students.append(s)

    data["students"] = cleaned_students

    # Khởi tạo l1..l7 cho tất cả học sinh
    bykey = {}
    for s in data["students"]:
        for k in range(1, 8):
            lk = f"l{k}"
            if not isinstance(s.get(lk), dict):
                s[lk] = {}
            for m in SUBJECTS:
                s[lk].setdefault(m, None)
        bykey[(s["lop"], key_norm(s["ten"]))] = s

    def get_or_create_student(lop, full_name, allow_create=True):
        clean_name = dedup_tok(full_name)
        kn = key_norm(clean_name)
        if (lop, kn) in transfer_map:
            lop = transfer_map[(lop, kn)]
        rec = bykey.get((lop, kn))
        if rec is not None:
            return rec
        # Thử khớp tiền tố trong cùng lớp
        cands = [
            k for k in bykey
            if k[0] == lop and (k[1] == kn or k[1].startswith(kn) or kn.startswith(k[1]))
        ]
        if len(cands) == 1:
            return bykey[cands[0]]
        if not allow_create:
            return None
        rec = {
            "lop": lop,
            "ten": clean_name,
        }
        for k in range(1, 8):
            rec[f"l{k}"] = {m: None for m in SUBJECTS}
        data["students"].append(rec)
        bykey[(lop, kn)] = rec
        return rec

    # 2. Hàm nạp file toàn khối 11 lớp (L4..L6)
    def merge_khoi_workbook(lk, filepath, only_fill_missing=False, allow_create=True):
        if not os.path.exists(filepath):
            print(f"SKIP missing {filepath}")
            return
        wb = load_workbook(filepath, data_only=True, read_only=True)
        cnt = 0
        for lop in LOPS:
            if lop not in wb.sheetnames:
                continue
            ws = wb[lop]
            rows = list(ws.iter_rows(values_only=True))
            if len(rows) < 4:
                continue
            hmap = {}
            for c, val in enumerate(rows[2]):
                if val is None:
                    continue
                h = norm(val).lower()
                for k, mon in HDR2MON.items():
                    if h.startswith(k):
                        hmap[c] = mon
                        break
            for r in rows[3:]:
                if not r or r[1] in (None, ""):
                    continue
                sbd_str = str(r[1]).strip().replace(".0", "")
                if not sbd_str.isdigit():
                    continue
                ho = r[2] if r[2] is not None else ""
                ten = r[3] if r[3] is not None else ""
                full = dedup_tok(f"{ho} {ten}")
                if not full:
                    continue
                rec = get_or_create_student(lop, full, allow_create=allow_create)
                if rec is None:
                    continue
                rec["sbd"] = sbd_str
                for c, mon in hmap.items():
                    if c >= len(r):
                        continue
                    v = fnum(r[c])
                    if v is not None and v > 0:
                        if not only_fill_missing or rec[lk].get(mon) is None:
                            rec[lk][mon] = v
                            cnt += 1
        print(f"Merged {lk} from {os.path.basename(filepath)}: {cnt} scores")

    # Bổ sung điểm còn khuyết ở L1, L2 từ bộ file chuẩn toàn khối (không tạo HS mới trùng)
    merge_khoi_workbook("l1", os.path.join(DL, "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 1 - HK1 2026-2027.xlsx"), only_fill_missing=True, allow_create=False)
    merge_khoi_workbook("l2", os.path.join(DL, "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 2 - HK1 2026-2027.xlsx"), only_fill_missing=True, allow_create=False)

    # Nạp L4, L5, L6 toàn khối (11 lớp)
    merge_khoi_workbook("l4", os.path.join(DL, "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 4 - HK1 2026-2027 (1).xlsx"), only_fill_missing=False, allow_create=True)
    merge_khoi_workbook("l5", os.path.join(DL, "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 5 - HK1 2026-2027 (2).xlsx"), only_fill_missing=False, allow_create=True)
    merge_khoi_workbook("l6", os.path.join(DL, "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 6 - HK1 2026-2027.xlsx"), only_fill_missing=False, allow_create=True)

    # Bổ sung Ngữ văn L3/L4 từ các file lớp trong lan 6 (12A5 L3, 12A6 L3+L4, 12A8 L3, 12A7 Thống kê Văn L3)
    for lop, lk, fn in [
        ("12A5", "l3", os.path.join(BASE6_DIR, "12A5", "12A5 - Điểm KTĐK Lần 3.xlsx")),
        ("12A6", "l3", os.path.join(BASE6_DIR, "12A6", "12A6_ĐIỂM KTĐK_LẦN 3.xlsx")),
        ("12A6", "l4", os.path.join(BASE6_DIR, "12A6", "12A6_ĐIỂM KTĐK_LẦN 4.xlsx")),
        ("12A8", "l3", os.path.join(BASE6_DIR, "12A8", "12A8_L3.xlsx")),
    ]:
        if os.path.exists(fn):
            wb = load_workbook(fn, data_only=True, read_only=True)
            ws = wb[wb.sheetnames[-1]]
            rows = list(ws.iter_rows(values_only=True))
            van_cols = [i for i, h in enumerate(rows[2]) if h and "văn" in str(h).lower()]
            if van_cols:
                vc = van_cols[0]
                c_van = 0
                for r in rows[3:]:
                    if not r or r[1] in (None, ""):
                        continue
                    sbd_str = str(r[1]).strip().replace(".0", "")
                    if not sbd_str.isdigit():
                        continue
                    full = dedup_tok(f"{r[2] or ''} {r[3] or ''}")
                    v = fnum(r[vc]) if vc < len(r) else None
                    if full and v is not None and v > 0:
                        rec = get_or_create_student(lop, full)
                        rec[lk]["Ngữ văn"] = v
                        c_van += 1
                print(f"Enriched {lop} {lk} Ngữ văn: {c_van} scores")

    # 12A7 Văn L3 từ 12A7_THỐNG KÊ ĐIỂM.xlsx
    fn_a7_tk = os.path.join(BASE6_DIR, "12A7", "12A7_THỐNG KÊ ĐIỂM.xlsx")
    if os.path.exists(fn_a7_tk):
        wb = load_workbook(fn_a7_tk, data_only=True, read_only=True)
        if "MÔN VĂN" in wb.sheetnames:
            ws = wb["MÔN VĂN"]
            c_van = 0
            for r in list(ws.iter_rows(values_only=True))[3:]:
                if not r or r[1] in (None, ""):
                    continue
                sbd_str = str(r[1]).strip().replace(".0", "")
                if not sbd_str.isdigit():
                    continue
                full = dedup_tok(f"{r[2] or ''} {r[3] or ''}")
                v = fnum(r[7]) if len(r) > 7 else None  # col 7 is LẦN 3
                if full and v is not None and v > 0:
                    rec = get_or_create_student("12A7", full)
                    rec["l3"]["Ngữ văn"] = v
                    c_van += 1
            print(f"Enriched 12A7 l3 Ngữ văn: {c_van} scores")

    # 3. Chuẩn hoá 100% lớp 12A10 từ Lần 1 -> Lần 7 theo data.js của bao-diem-12A10-web & file định kỳ (6).xlsx
    a10_js_path = os.path.join(os.path.dirname(ROOT), "bao-diem-12A10-web", "data.js")
    txt_a10 = open(a10_js_path, encoding="utf-8").read()
    m_a10 = re.search(r"const DATA = (\{.*\});", txt_a10)
    a10_data = json.loads(m_a10.group(1))
    valid_a10_names = set()
    for k in range(1, 8):
        lk = f"l{k}"
        lan_key = f"Lần {k}"
        for item in a10_data.get(lan_key, []):
            full = dedup_tok(item["hoten"])
            if k == 7:
                valid_a10_names.add(key_norm(full))
            rec = get_or_create_student("12A10", full)
            rec["sbd"] = str(item["sbd"])
            rec[lk]["Toán"] = fnum(item.get("toan"))
            rec[lk]["Hóa học"] = fnum(item.get("hoa"))
            rec[lk]["Sinh học"] = fnum(item.get("sinh"))
            rec[lk]["Ngữ văn"] = fnum(item.get("van"))

    # Chỉ giữ đúng 33 HS chính thức của 12A10
    data["students"] = [
        s for s in data["students"]
        if s["lop"] != "12A10" or key_norm(s["ten"]) in valid_a10_names
    ]
    print("12A10 count after sync:", sum(1 for s in data["students"] if s["lop"] == "12A10"))

    # Sắp xếp học sinh theo Lớp (12A1..12A11) và Tên (theo từ cuối của tên)
    lop_order = {l: i for i, l in enumerate(LOPS)}
    def sort_key_hs(s):
        parts = s["ten"].split(" ")
        first_name = parts[-1].lower() if parts else ""
        return (lop_order.get(s["lop"], 99), s.get("sbd") or "9999", first_name, s["ten"].lower())

    data["students"].sort(key=sort_key_hs)

    # 4. Tính delta giữa các đợt cho từng học sinh
    pairs = [("l1", "l2", "delta"), ("l2", "l3", "delta23"), ("l3", "l4", "delta34"),
             ("l4", "l5", "delta45"), ("l5", "l6", "delta56"), ("l6", "l7", "delta67")]
    for s in data["students"]:
        for la, lb, dk in pairs:
            s[dk] = {}
            for m in SUBJECTS:
                va = s[la].get(m)
                vb = s[lb].get(m)
                s[dk][m] = round(vb - va, 2) if (va is not None and vb is not None) else None
        s["delta_latest"] = {}
        for m in SUBJECTS:
            vals = [(k, s[f"l{k}"].get(m)) for k in range(1, 8) if s[f"l{k}"].get(m) is not None]
            if len(vals) >= 2:
                s["delta_latest"][m] = round(vals[-1][1] - vals[-2][1], 2)
            else:
                s["delta_latest"][m] = None

    # 5. Tính subjects_stats toàn khối (L1 -> L7)
    subjects_stats = {}
    for m in SUBJECTS:
        st = {}
        for k in range(1, 8):
            lk = f"l{k}"
            vals = [s[lk].get(m) for s in data["students"] if s[lk].get(m) is not None]
            st[f"n{k}"] = len(vals)
            st[f"tb{k}"] = avg(vals)
            st[f"duoi5_l{k}"] = sum(1 for x in vals if x < 5)
            st[f"pct_duoi5_l{k}"] = pct_below(vals)
            st[f"gioi_l{k}"] = sum(1 for x in vals if x >= 8)
        st["kha_l2"] = sum(1 for s in data["students"] if s["l2"].get(m) is not None and 6.5 <= s["l2"].get(m) < 8)
        st["tb_y_l2"] = sum(1 for s in data["students"] if s["l2"].get(m) is not None and 5 <= s["l2"].get(m) < 6.5)
        st["delta"] = round(st["tb2"] - st["tb1"], 3) if (st["tb1"] is not None and st["tb2"] is not None) else None
        st["delta23"] = round(st["tb3"] - st["tb2"], 3) if (st["tb2"] is not None and st["tb3"] is not None) else None
        st["delta34"] = round(st["tb4"] - st["tb3"], 3) if (st["tb3"] is not None and st["tb4"] is not None) else None
        st["delta45"] = round(st["tb5"] - st["tb4"], 3) if (st["tb4"] is not None and st["tb5"] is not None) else None
        st["delta56"] = round(st["tb6"] - st["tb5"], 3) if (st["tb5"] is not None and st["tb6"] is not None) else None
        st["delta67"] = round(st["tb7"] - st["tb6"], 3) if (st["tb6"] is not None and st["tb7"] is not None) else None

        # Xác định đợt toàn khối mới nhất của môn này (có >= 10 bài thi)
        latest_full = 1
        for k in range(6, 0, -1):
            if st[f"n{k}"] >= 10:
                latest_full = k
                break
        st["latest_full_dot"] = f"L{latest_full}"
        subjects_stats[m] = st

    data["subjects_stats"] = subjects_stats

    # 6. Tính class_stats + overview_classes + class_lists (L1 -> L7)
    class_stats = {}
    class_lists = {}
    overview_classes = []

    for lop in LOPS:
        class_stats[lop] = {}
        class_lists[lop] = {}
        lop_hs = [s for s in data["students"] if s["lop"] == lop]
        ov_entry = {"lop": lop, "stats": {}}
        for k in range(1, 8):
            lk = f"l{k}"
            ov_entry[f"siso_l{k}"] = sum(
                1 for s in lop_hs if any(v is not None for v in s[lk].values())
            )

        for m in SUBJECTS:
            cst = {}
            for k in range(1, 8):
                lk = f"l{k}"
                vals = [s[lk].get(m) for s in lop_hs if s[lk].get(m) is not None]
                cst[f"n{k}"] = len(vals)
                cst[f"tb{k}"] = avg(vals)
                cst[f"duoi5_l{k}"] = sum(1 for x in vals if x < 5)
            cst["delta"] = round(cst["tb2"] - cst["tb1"], 2) if (cst["tb1"] is not None and cst["tb2"] is not None) else None
            cst["delta23"] = round(cst["tb3"] - cst["tb2"], 2) if (cst["tb2"] is not None and cst["tb3"] is not None) else None
            cst["delta56"] = round(cst["tb6"] - cst["tb5"], 2) if (cst["tb5"] is not None and cst["tb6"] is not None) else None
            cst["delta67"] = round(cst["tb7"] - cst["tb6"], 2) if (cst["tb6"] is not None and cst["tb7"] is not None) else None

            latest_k = None
            prev_k = None
            for k in range(7, 0, -1):
                if cst[f"n{k}"] > 0 and cst[f"tb{k}"] is not None:
                    if latest_k is None:
                        latest_k = k
                    elif prev_k is None:
                        prev_k = k
                        break
            cst["latest_dot"] = f"L{latest_k}" if latest_k else None
            cst["prev_dot"] = f"L{prev_k}" if prev_k else None
            cst["delta_latest"] = (
                round(cst[f"tb{latest_k}"] - cst[f"tb{prev_k}"], 2)
                if (latest_k and prev_k)
                else None
            )

            class_stats[lop][m] = cst
            ov_entry["stats"][m] = dict(cst)

            # Xây dựng class_lists dựa trên đợt mới nhất của lớp ở môn đó (mặc định)
            phudao, quantam, boiduong, tienbo, thutlui = [], [], [], [], []
            target_k = latest_k or 2
            prev_target_k = prev_k or 1
            for s in lop_hs:
                v_cur = s[f"l{target_k}"].get(m) if target_k else None
                if v_cur is None:
                    continue
                v_prev = s[f"l{prev_target_k}"].get(m) if prev_target_k else None
                all_v = [s[f"l{k}"].get(m) for k in range(1, 8) if s[f"l{k}"].get(m) is not None]
                tb_all = round(sum(all_v) / len(all_v), 2) if all_v else None
                d_lat = round(v_cur - v_prev, 2) if v_prev is not None else None
                item = {
                    "ten": s["ten"],
                    "l1": s["l1"].get(m),
                    "l2": s["l2"].get(m),
                    "l3": s["l3"].get(m),
                    "l4": s["l4"].get(m),
                    "l5": s["l5"].get(m),
                    "l6": s["l6"].get(m),
                    "l7": s["l7"].get(m),
                    "tb": tb_all,
                    "latest": v_cur,
                    "latest_dot": f"L{target_k}",
                    "delta": s["delta"].get(m),
                    "delta23": s["delta23"].get(m),
                    "delta_latest": d_lat,
                }
                if v_cur < 5:
                    phudao.append(item)
                elif 5 <= v_cur < 6.5:
                    quantam.append(item)
                if v_cur >= 8:
                    boiduong.append(item)
                if d_lat is not None:
                    if d_lat >= 1.5:
                        tienbo.append(item)
                    if d_lat <= -2.0:
                        thutlui.append(item)

            phudao.sort(key=lambda x: x["latest"])
            quantam.sort(key=lambda x: x["latest"])
            boiduong.sort(key=lambda x: -x["latest"])
            tienbo.sort(key=lambda x: -x["delta_latest"])
            thutlui.sort(key=lambda x: x["delta_latest"])
            class_lists[lop][m] = {
                "phudao": phudao,
                "quantam": quantam,
                "boiduong": boiduong,
                "tienbo": tienbo,
                "thutlui": thutlui,
            }

        overview_classes.append(ov_entry)

    data["class_stats"] = class_stats
    data["class_lists"] = class_lists
    data["overview_classes"] = overview_classes

    # 7. block_lists + top_changes toàn khối
    block_lists = {}
    top_changes = {}
    for m in SUBJECTS:
        ph, bd, changes = [], [], []
        for s in data["students"]:
            lop = s["lop"]
            cst = class_stats[lop][m]
            lk_str = cst.get("latest_dot")
            if not lk_str:
                continue
            tk = int(lk_str[1:])
            pk_str = cst.get("prev_dot")
            pk = int(pk_str[1:]) if pk_str else None
            v_cur = s[f"l{tk}"].get(m)
            if v_cur is None:
                continue
            v_prev = s[f"l{pk}"].get(m) if pk else None
            d_lat = round(v_cur - v_prev, 2) if v_prev is not None else None
            all_v = [s[f"l{k}"].get(m) for k in range(1, 8) if s[f"l{k}"].get(m) is not None]
            tb_all = round(sum(all_v) / len(all_v), 2) if all_v else None
            item = {
                "lop": lop,
                "ten": s["ten"],
                "l1": s["l1"].get(m),
                "l2": s["l2"].get(m),
                "l3": s["l3"].get(m),
                "l4": s["l4"].get(m),
                "l5": s["l5"].get(m),
                "l6": s["l6"].get(m),
                "l7": s["l7"].get(m),
                "tb": tb_all,
                "latest": v_cur,
                "latest_dot": lk_str,
                "delta": s["delta"].get(m),
                "delta_latest": d_lat,
            }
            if v_cur < 5:
                ph.append(item)
            if v_cur >= 8:
                bd.append(item)
            if d_lat is not None:
                changes.append({
                    "lop": lop,
                    "ten": s["ten"],
                    "l1": v_prev,
                    "l2": v_cur,
                    "from_dot": pk_str,
                    "to_dot": lk_str,
                    "delta": d_lat,
                })
        ph.sort(key=lambda x: x["latest"])
        bd.sort(key=lambda x: -x["latest"])
        block_lists[m] = {"phudao": ph, "boiduong": bd}
        top_changes[m] = {
            "tang_manh_nhat": sorted([c for c in changes if c["delta"] > 0], key=lambda x: -x["delta"])[:10],
            "giam_manh_nhat": sorted([c for c in changes if c["delta"] < 0], key=lambda x: x["delta"])[:10],
        }

    data["block_lists"] = block_lists
    data["top_changes"] = top_changes

    # 8. Cập nhật meta
    meta = data["meta"]
    meta["dots"] = DOTS
    for k in range(1, 8):
        lk = f"l{k}"
        meta[f"siso_l{k}"] = sum(
            1 for s in data["students"] if any(v is not None for v in s[lk].values())
        )
    meta["lan4"] = "KTĐK Lần 4 (11 lớp khối 12, 20/09/2026)"
    meta["lan5"] = "KTĐK Lần 5 (11 lớp khối 12, 04/10/2026)"
    meta["lan6"] = "KTĐK Lần 6 (11 lớp khối 12, 11/10/2026)"
    meta["lan7"] = "KTĐK Lần 7 (18/10/2026 — đã có 12A10 đủ 33 HS, đang cập nhật dần các lớp)"
    meta["cap_nhat"] = dt.datetime.now().strftime("%H:%M %d/%m/%Y") + " • L1–L6 (11 lớp) + L7 (12A10)"
    for src_name in [
        "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 4 - HK1 2026-2027 (1).xlsx",
        "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 5 - HK1 2026-2027 (2).xlsx",
        "THPT Chi Lang - Khoi 12 - Diem KTDK Lan 6 - HK1 2026-2027.xlsx",
        "2026-2027- 12A10 Bảng điểm định kì hằng tuần  (7).xlsx (L1–L7 chuẩn 33 HS)",
    ]:
        if src_name not in meta["nguon"]:
            meta["nguon"].append(src_name)

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

    print("WROTE data.json:", os.path.getsize(DATA), "bytes | students:", len(data["students"]))
    for k in range(1, 8):
        print(f"  Sĩ số L{k}: {meta[f'siso_l{k}']} | Toán TB L{k}: {subjects_stats['Toán'][f'tb{k}']} (n={subjects_stats['Toán'][f'n{k}']}, <5={subjects_stats['Toán'][f'duoi5_l{k}']})")
    print("  12A10 L7:", {m: class_stats["12A10"][m]["tb7"] for m in ["Toán", "Hóa học", "Sinh học"]})


if __name__ == "__main__":
    main()
