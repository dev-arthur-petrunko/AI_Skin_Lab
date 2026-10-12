import pandas as pd
import sys

# Set stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd

xl = pd.ExcelFile('data/price.xlsx', engine='openpyxl')
df = xl.parse('Anubis')
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

empty_count = 0
for i, row in df.iterrows():
    sku = str(row.iloc[0]) if len(row) > 0 else ''
    name = str(row.iloc[1]) if len(row) > 1 else ''
    type_val = str(row.iloc[2]) if len(row) > 2 else ''
    purpose_val = str(row.iloc[3]) if len(row) > 3 else ''
    desc = str(row.iloc[11]) if len(row) > 11 else ''
    
    type_empty = not type_val or str(type_val).strip() == '' or str(type_val).strip() == 'nan'
    purpose_empty = not purpose_val or str(purpose_val).strip() == '' or str(purpose_val).strip() == 'nan'
    
    if type_empty or purpose_empty:
        print(f"SKU: {sku}")
        print(f"  Name: {name[:80]}")
        print(f"  Type: '{type_val}' (empty: {type_empty})")
        print(f"  Purpose: '{purpose_val}' (empty: {purpose_empty})")
        desc_short = str(desc)[:200] if desc else 'None'
        print(f"  Desc: {desc_short}")
        print()