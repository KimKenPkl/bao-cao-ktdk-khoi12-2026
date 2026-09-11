# -*- coding: utf-8 -*-
"""Phân tích điểm KTĐK L1-L2 khối 12, xuất data.json cho web."""
import openpyxl, json, statistics
from collections import defaultdict

L1 = r"C:\Users\LENOVO\Downloads\26-27 Khoi 12- Diem KTDK - Lan 1 (Da ra soat).xlsx"
L2 = r"C:\Users\LENOVO\Downloads\26-27 Khoi 12- Diem KTDK - Lan 2 (Da ra soat).xlsx"
OUT = r"D:\bao-cao-ktdk-khoi12\data.json"

SUBJECTS = ["Toán","Ngữ văn","Vật lí","Hóa học","Sinh học","Lịch sử","Tin học","Anh Văn","KTPL"]
COL = {"Toán":3,"Ngữ văn":4,"Vật lí":5,"Hóa học":6,"Sinh học":7,"Lịch sử":8,"Tin học":9,"Anh Văn":10,"KTPL":11}

def load(f):
    wb = openpyxl.load_workbook(f, data_only=True, read_only=True)
    ws = wb["TỔNG HỢP MÔN"]
    rows = list(ws.iter_rows(values_only=True))
    out = {}
    for r in rows[2:]:
        lop = str(r[1]).strip() if r[1] else ""
        if not lop.startswith("12A"):
            continue
        ten = str(r[2]).strip()
        key = (lop, ten)
        d = {}
        for s in SUBJECTS:
            v = r[COL[s]]
            try:
                d[s] = float(v) if v not in (None,"") else None
            except:
                d[s] = None
        out[key] = d
    return out

d1 = load(L1); d2 = load(L2)
print(f"L1={len(d1)} L2={len(d2)}")

all_keys = sorted(set(d1)|set(d2))
classes = sorted({k[0] for k in all_keys})

def avg(xs):
    xs=[x for x in xs if x is not None]
    return round(sum(xs)/len(xs),3) if xs else None

def pct_below(xs, th=5):
    xs=[x for x in xs if x is not None]
    return round(100*sum(1 for x in xs if x < th)/len(xs),1) if xs else None

# students merged
students=[]
for lop, ten in all_keys:
    rec={"lop":lop,"ten":ten,"l1":d1.get((lop,ten),{}),"l2":d2.get((lop,ten),{})}
    # delta per subject
    delta={}
    for s in SUBJECTS:
        a=rec["l1"].get(s); b=rec["l2"].get(s)
        if a is not None and b is not None:
            delta[s]=round(b-a,2)
        else:
            delta[s]=None
    rec["delta"]=delta
    students.append(rec)

# subject stats whole
subjects_stats={}
for s in SUBJECTS:
    v1=[d1[k].get(s) for k in d1 if d1[k].get(s) is not None]
    v2=[d2[k].get(s) for k in d2 if d2[k].get(s) is not None]
    # paired deltas
    pd=[d2[k][s]-d1[k][s] for k in set(d1)&set(d2) if d1[k].get(s) is not None and d2[k].get(s) is not None]
    subjects_stats[s]={
        "n1":len(v1),"n2":len(v2),
        "tb1":avg(v1),"tb2":avg(v2),
        "delta":round(avg(v2)-avg(v1),3) if avg(v1) is not None and avg(v2) is not None else None,
        "duoi5_l1":sum(1 for x in v1 if x<5),"duoi5_l2":sum(1 for x in v2 if x<5),
        "pct_duoi5_l1":pct_below(v1),"pct_duoi5_l2":pct_below(v2),
        "gioi_l2":sum(1 for x in v2 if x>=8),
        "kha_l2":sum(1 for x in v2 if 6.5<=x<8),
        "tb_y_l2":sum(1 for x in v2 if 5<=x<6.5),
        "avg_delta_paired":round(sum(pd)/len(pd),3) if pd else None,
        "tang":sum(1 for x in pd if x>0),"giam":sum(1 for x in pd if x<0),"bang":sum(1 for x in pd if x==0),
    }

# per class x subject
class_stats={}  # lop -> subject -> stats
class_lists={}  # lop -> subject -> {phudao, quantam, boiduong}
for lop in classes:
    class_stats[lop]={}; class_lists[lop]={}
    keys=[k for k in all_keys if k[0]==lop]
    for s in SUBJECTS:
        v1=[d1[k][s] for k in keys if k in d1 and d1[k][s] is not None]
        v2=[d2[k][s] for k in keys if k in d2 and d2[k][s] is not None]
        class_stats[lop][s]={
            "n1":len(v1),"n2":len(v2),
            "tb1":avg(v1),"tb2":avg(v2),
            "delta":(round(avg(v2)-avg(v1),2) if v1 and v2 else None),
            "duoi5_l1":sum(1 for x in v1 if x<5),
            "duoi5_l2":sum(1 for x in v2 if x<5),
        }
        phudao=[]; quantam=[]; boiduong=[]; tienbo=[]; thutlui=[]
        for k in keys:
            ten=k[1]
            a=d1.get(k,{}).get(s); b=d2.get(k,{}).get(s)
            if b is None: continue
            item={"ten":ten,"l1":a,"l2":b,"delta":round(b-a,2) if a is not None else None}
            if b<5: phudao.append(item)
            elif 5<=b<6.5: quantam.append(item)
            if b>=8: boiduong.append(item)
            if a is not None:
                if b-a>=1.5: tienbo.append(item)
                if b-a<=-2: thutlui.append(item)
        # sort
        phudao.sort(key=lambda x:x["l2"])
        quantam.sort(key=lambda x:x["l2"])
        boiduong.sort(key=lambda x:-x["l2"])
        tienbo.sort(key=lambda x:-x["delta"])
        thutlui.sort(key=lambda x:x["delta"])
        class_lists[lop][s]={"phudao":phudao,"quantam":quantam,"boiduong":boiduong,"tienbo":tienbo,"thutlui":thutlui}

# whole-block lists per subject
block_lists={}
for s in SUBJECTS:
    ph=[]; bd=[]
    for k in all_keys:
        lop,ten=k
        b=d2.get(k,{}).get(s) if k in d2 else None
        if b is None: continue
        a=d1.get(k,{}).get(s) if k in d1 else None
        item={"lop":lop,"ten":ten,"l1":a,"l2":b,"delta":round(b-a,2) if a is not None else None}
        if b<5: ph.append(item)
        if b>=8: bd.append(item)
    ph.sort(key=lambda x:x["l2"]); bd.sort(key=lambda x:-x["l2"])
    block_lists[s]={"phudao":ph,"boiduong":bd}

# top changes per subject (paired)
top_changes={}
for s in SUBJECTS:
    arr=[]
    for k in set(d1)&set(d2):
        a=d1[k][s]; b=d2[k][s]
        if a is None or b is None: continue
        arr.append({"lop":k[0],"ten":k[1],"l1":a,"l2":b,"delta":round(b-a,2)})
    arr_sorted=sorted(arr,key=lambda x:x["delta"])
    top_changes[s]={"giam_manh_nhat":arr_sorted[:10],"tang_manh_nhat":sorted(arr,key=lambda x:-x["delta"])[:10]}

# class overall (avg of student's available subjects? use mean of subject avgs? simpler: per-class avg Toán as proxy + count)
overview_classes=[]
for lop in classes:
    keys=[k for k in all_keys if k[0]==lop]
    overview_classes.append({
        "lop":lop,"siso_l1":sum(1 for k in keys if k in d1),"siso_l2":sum(1 for k in keys if k in d2),
        "stats":class_stats[lop]
    })

data={
    "meta":{"truong":"THPT Chi Lăng - Gia Lai","khoi":"Khối 12","lan1":"KTĐK Lần 1 (23/8/2026)","lan2":"KTĐK Lần 2","siso_l1":len(d1),"siso_l2":len(d2),"subjects":SUBJECTS,"classes":classes},
    "subjects_stats":subjects_stats,
    "overview_classes":overview_classes,
    "class_stats":class_stats,
    "class_lists":class_lists,
    "block_lists":block_lists,
    "top_changes":top_changes,
    "students":students,
}
with open(OUT,"w",encoding="utf-8") as f:
    json.dump(data,f,ensure_ascii=False)
print("wrote",OUT)

# print insights
for s in SUBJECTS:
    st=subjects_stats[s]
    print(f"{s}: n1={st['n1']} TB1={st['tb1']} | n2={st['n2']} TB2={st['tb2']} | Δ={st['delta']} | <5: {st['duoi5_l1']}({st['pct_duoi5_l1']}%) → {st['duoi5_l2']}({st['pct_duoi5_l2']}%) | ≥8: {st['gioi_l2']}")
print("--- per class Toán ---")
for lop in classes:
    st=class_stats[lop]["Toán"]
    print(lop, f"TB {st['tb1']}→{st['tb2']} Δ={st['delta']} | <5: {st['duoi5_l1']}→{st['duoi5_l2']}")
