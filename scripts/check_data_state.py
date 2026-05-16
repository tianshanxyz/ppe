import json, os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base, 'src', 'data', 'ppe')

files_status = {
    'regulations-fulltext.json': None,
    'compliance-data.json': None,
    'markets.json': None,
    'standards-database.json': None,
    'certification-procedures.json': None,
}

# regulations-fulltext.json
with open(os.path.join(data_dir, 'regulations-fulltext.json')) as f:
    d = json.load(f)
markets = sorted(set(i['market_code'] for i in d))
cats = sorted(set(i['category_id'] for i in d))
types = sorted(set(i.get('document_type','') for i in d))
print(f'regulations-fulltext.json: {len(d)} entries')
print(f'  Markets ({len(markets)}): {markets}')
print(f'  Categories ({len(cats)}): {cats}')
print(f'  Types: {types}')

# compliance-data.json
with open(os.path.join(data_dir, 'compliance-data.json')) as f:
    d2 = json.load(f)
entries = sorted(set((i['category_id'], i['market_code']) for i in d2))
mkts2 = sorted(set(i['market_code'] for i in d2))
cats2 = sorted(set(i['category_id'] for i in d2))
print(f'\ncompliance-data.json: {len(d2)} entries')
print(f'  Markets ({len(mkts2)}): {mkts2}')
print(f'  Categories ({len(cats2)}): {cats2}')

# markets.json
with open(os.path.join(data_dir, 'markets.json')) as f:
    d3 = json.load(f)
codes = sorted([m['code'] for m in d3])
names = [m['name_zh'] for m in d3]
print(f'\nmarkets.json: {len(d3)} markets')
print(f'  Codes: {codes}')

# standards-database.json
with open(os.path.join(data_dir, 'standards-database.json')) as f:
    d4 = json.load(f)
systems = list(d4.get('standard_systems', {}).keys())
cats4 = list(d4.get('ppe_categories', {}).keys())
print(f'\nstandards-database.json:')
print(f'  Standard systems ({len(systems)}): {sorted(systems)}')
print(f'  PPE categories ({len(cats4)}): {sorted(cats4)}')
total_std = 0
for k, v in d4.items():
    if isinstance(v, list):
        total_std += len(v)
print(f'  Total standards in lists: {total_std}')

# certification-procedures.json
with open(os.path.join(data_dir, 'certification-procedures.json')) as f:
    d5 = json.load(f)
procs = d5.get('procedures', [])
mkts5 = sorted(set(p.get('market_code','') or p.get('code','') for p in procs))
print(f'\ncertification-procedures.json: {len(procs)} procedures')
print(f'  Markets: {mkts5}')

# Gaps analysis
print('\n=== GAP ANALYSIS ===')
all_markets_31 = set(codes)
reg_markets = set(markets)
comp_markets = set(mkts2)
proc_markets = set(mkts5)

print(f'regulations-fulltext covers: {len(reg_markets)}/{len(all_markets_31)} markets')
missing_reg = all_markets_31 - reg_markets
if missing_reg:
    print(f'  Missing markets: {sorted(missing_reg)}')

print(f'compliance-data covers: {len(comp_markets)}/{len(all_markets_31)} markets')
missing_comp = all_markets_31 - comp_markets
if missing_comp:
    print(f'  Missing markets: {sorted(missing_comp)}')

print(f'certification-procedures covers: {len(proc_markets)}/{len(all_markets_31)} markets')
missing_proc = all_markets_31 - proc_markets
if missing_proc:
    print(f'  Missing markets: {sorted(missing_proc)}')

# Check standards-database cross-ref
std_countries = set()
for k, v in d4.items():
    if k.startswith('standards_'):
        std_countries.add(k.replace('standards_','').upper())
    elif k in ['international_standards']:
        std_countries.add('INTL')
print(f'\nstandards-database country sections: {sorted(std_countries)}')