import json, os, sys
from collections import Counter

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'src', 'data', 'ppe')

files = [
    'labeling-requirements.json',
    'market-surveillance.json',
    'regulations-fulltext.json',
    'compliance-data.json',
    'markets.json',
    'standards-database.json',
    'certification-procedures.json',
]

issues = []

print("=" * 60)
print("PPE 法规标准数据体系 - 完整性验证报告")
print("=" * 60)

for fname in files:
    fpath = os.path.join(data_dir, fname)
    if not os.path.exists(fpath):
        issues.append(f"MISSING: {fname}")
        print(f"\n[ERROR] {fname} - 文件不存在!")
        continue

    with open(fpath, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            issues.append(f"INVALID JSON: {fname} - {e}")
            print(f"\n[ERROR] {fname} - JSON格式无效: {e}")
            continue

    print(f"\n[OK] {fname}")
    print(f"      Size: {os.path.getsize(fpath):,} bytes")

    if fname == 'labeling-requirements.json':
        reqs = data.get('labeling_requirements', [])
        markets = [r['market'] for r in reqs]
        print(f"      Markets covered: {len(markets)}")
        print(f"      Markets: {sorted(markets)}")
        # Check for required fields
        for i, r in enumerate(reqs):
            if 'mandatory_marks' not in r:
                issues.append(f"labeling-requirements.json entry {i} ({r.get('market','?')}): missing mandatory_marks")
            if 'language_requirements' not in r:
                issues.append(f"labeling-requirements.json entry {i} ({r.get('market','?')}): missing language_requirements")
            if 'label_content' not in r:
                issues.append(f"labeling-requirements.json entry {i} ({r.get('market','?')}): missing label_content")

        # Check markets.json coverage
        with open(os.path.join(data_dir, 'markets.json')) as fm:
            all_mkts = set(m['code'] for m in json.load(fm))
        label_mkts = set(r['market'] for r in reqs)
        missing = all_mkts - label_mkts
        if missing:
            issues.append(f"labeling-requirements.json missing markets: {sorted(missing)}")
            print(f"      MISSING markets: {sorted(missing)}")

    elif fname == 'market-surveillance.json':
        ms = data.get('market_surveillance', [])
        markets = [m['market'] for m in ms]
        print(f"      Markets covered: {len(markets)}")
        print(f"      Markets: {sorted(markets)}")
        for i, m in enumerate(ms):
            if 'surveillance_authorities' not in m:
                issues.append(f"market-surveillance.json entry {i} ({m.get('market','?')}): missing authorities")
            if 'recall_procedures' not in m:
                issues.append(f"market-surveillance.json entry {i} ({m.get('market','?')}): missing recall_procedures")

    elif fname == 'regulations-fulltext.json':
        entries = len(data)
        markets = sorted(set(e['market_code'] for e in data))
        cats = sorted(set(e['category_id'] for e in data))
        types = Counter(e.get('document_type','?') for e in data)
        print(f"      Total entries: {entries}")
        print(f"      Markets: {markets}")
        print(f"      Categories: {cats}")
        print(f"      Document types: {dict(types)}")
        for i, e in enumerate(data):
            if 'full_text' not in e or len(e.get('full_text','')) < 50:
                issues.append(f"regulations-fulltext.json entry {i} ({e.get('id','?')}): full_text too short or missing")
            if 'market_code' not in e:
                issues.append(f"regulations-fulltext.json entry {i}: missing market_code")

    elif fname == 'compliance-data.json':
        entries = len(data)
        pairs = sorted(set((e['category_id'], e['market_code']) for e in data))
        markets = sorted(set(e['market_code'] for e in data))
        cats = sorted(set(e['category_id'] for e in data))
        print(f"      Total entries: {entries}")
        print(f"      Markets: {markets}")
        print(f"      Categories: {cats}")
        for i, e in enumerate(data):
            if 'estimated_cost' not in e:
                issues.append(f"compliance-data.json entry {i}: missing estimated_cost")
            if 'estimated_timeline' not in e:
                issues.append(f"compliance-data.json entry {i}: missing estimated_timeline")

    elif fname == 'markets.json':
        markets = [m['code'] for m in data]
        print(f"      Total markets: {len(markets)}")
        for i, m in enumerate(data):
            if 'regulatory_framework' not in m:
                issues.append(f"markets.json entry {i} ({m.get('code','?')}): missing regulatory_framework")

    elif fname == 'standards-database.json':
        systems = len(data.get('standard_systems', []))
        cats = len(data.get('ppe_categories', []))
        print(f"      Standard systems: {systems}")
        print(f"      PPE categories: {cats}")
        total_std = 0
        for k, v in data.items():
            if isinstance(v, list):
                total_std += len(v)
        print(f"      Total standards (in list fields): {total_std}")

    elif fname == 'certification-procedures.json':
        procs = data.get('procedures', [])
        mkts = sorted(set(p.get('market','?') for p in procs))
        print(f"      Procedures: {len(procs)}")
        print(f"      Markets: {mkts}")

# Cross-market coverage analysis
print("\n" + "=" * 60)
print("跨文件市场覆盖度分析")
print("=" * 60)

with open(os.path.join(data_dir, 'markets.json')) as f:
    all_markets = set(m['code'] for m in json.load(f))

coverage = {}
for fname in files:
    fpath = os.path.join(data_dir, fname)
    with open(fpath) as f:
        data = json.load(f)

    if fname == 'labeling-requirements.json':
        mkts = set(r['market'] for r in data.get('labeling_requirements', []))
    elif fname == 'market-surveillance.json':
        mkts = set(r['market'] for r in data.get('market_surveillance', []))
    elif fname == 'regulations-fulltext.json':
        mkts = set(e['market_code'] for e in data)
    elif fname == 'compliance-data.json':
        mkts = set(e['market_code'] for e in data)
    elif fname == 'markets.json':
        mkts = set(m['code'] for m in data)
    elif fname == 'certification-procedures.json':
        mkts = set(p.get('market','') for p in data.get('procedures', []))
    elif fname == 'standards-database.json':
        # standards are cross-market
        continue

    coverage[fname] = mkts
    coverage_pct = len(mkts) / len(all_markets) * 100 if all_markets else 0
    print(f"  {fname}: {len(mkts)}/{len(all_markets)} markets ({coverage_pct:.0f}%)")

# Final summary
print("\n" + "=" * 60)
print(f"问题汇总: {len(issues)} 个")
print("=" * 60)
if issues:
    for iss in issues:
        print(f"  - {iss}")
else:
    print("  无问题，所有数据文件验证通过!")

# Overall statistics
print("\n" + "=" * 60)
print("PPE法规标准数据体系 - 总览")
print("=" * 60)
print(f"  markets.json:             32个市场基础数据")
print(f"  standards-database.json:  246个技术标准 (跨9个标准体系)")
print(f"  certification-procedures: 12个市场认证流程")
print(f"  labeling-requirements:    32个市场标签标识要求")
print(f"  market-surveillance:      20个市场监管机制")
print(f"  regulations-fulltext:     52条法规全文 (18个市场)")
print(f"  compliance-data:          60条合规数据 (16个市场 × 8品类)")

sys.exit(len(issues))