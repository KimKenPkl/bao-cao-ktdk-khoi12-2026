# -*- coding: utf-8 -*-
"""Them siso_l3 vao meta + overview_classes (HS co it nhat 1 diem L3)."""
import json, os, shutil
from datetime import datetime

ROOT = r'D:\bao-cao-ktdk-khoi12'
DATA = os.path.join(ROOT, 'data.json')

bk = DATA + '.bak_%s' % datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy2(DATA, bk)

data = json.load(open(DATA, encoding='utf-8'))

def has_l3(s):
    l3 = s.get('l3') or {}
    return any(v is not None for v in l3.values())

per_lop = {}
total = set()
for s in data['students']:
    if has_l3(s):
        per_lop.setdefault(s['lop'], set()).add(s['ten'])
        total.add((s['lop'], s['ten']))

for o in data['overview_classes']:
    o['siso_l3'] = len(per_lop.get(o['lop'], set()))
    print(o['lop'], 'L1:', o['siso_l1'], 'L2:', o['siso_l2'], 'L3:', o['siso_l3'])

data['meta']['siso_l3'] = len(total)
print('META siso_l3:', len(total))
json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False)
print('wrote', DATA)
