# -*- coding: utf-8 -*-
"""Bo sung tong hop L3 vao data.json: subjects_stats (n3/tb3/duoi5_l3/pct/delta23)
+ block_lists items (l3). Khong doi nhom L1->L2 hien co."""
import json, os, shutil
from datetime import datetime

ROOT = r'D:\bao-cao-ktdk-khoi12'
DATA = os.path.join(ROOT, 'data.json')
SUBJECTS = ['Toán', 'Ngữ văn', 'Vật lí', 'Hóa học', 'Sinh học',
            'Lịch sử', 'Tin học', 'Anh Văn', 'KTPL']

def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs) / len(xs), 3) if xs else None

bk = DATA + '.bak_%s' % datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(DATA, bk)
print('backup:', bk)

data = json.load(open(DATA, encoding='utf-8'))
bykey = {(s['lop'], s['ten']): s for s in data['students']}

for mon in SUBJECTS:
    vals = [(s.get('l3') or {}).get(mon) for s in data['students']]
    vals = [v for v in vals if v is not None]
    st = data['subjects_stats'][mon]
    st['n3'] = len(vals)
    st['tb3'] = avg(vals)
    st['duoi5_l3'] = sum(1 for x in vals if x < 5)
    st['pct_duoi5_l3'] = round(100 * st['duoi5_l3'] / len(vals), 1) if vals else None
    tb2 = st.get('tb2')
    st['delta23'] = round(st['tb3'] - tb2, 3) if (st['tb3'] is not None and tb2 is not None) else None
    print(f"{mon}: n3={st['n3']} tb3={st['tb3']} <5={st['duoi5_l3']} pct={st['pct_duoi5_l3']} d23={st['delta23']}")

n = 0
for mon, groups in data['block_lists'].items():
    for grp, items in groups.items():
        for item in items:
            rec = bykey.get((item.get('lop'), item.get('ten')))
            item['l3'] = (rec.get('l3') or {}).get(mon) if rec else None
            n += 1
print('block items +l3:', n)

data['meta']['cap_nhat'] = datetime.now().strftime('%H:%M %d/%m/%Y') + ' + tong quan L3'
json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False)
print('wrote', DATA, os.path.getsize(DATA))
