import openpyxl
import pandas as pd

wb = openpyxl.load_workbook('data/price.xlsx', read_only=True)
print("Sheets:", wb.sheetnames)

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\n=== Sheet: {sheet_name} ===")
    print(f"Max row: {ws.max_row}, Max col: {ws.max_column}")
    
    # Find header row
    for row in ws.iter_rows(max_row=5, values_only=False):
        vals = [str(c.value).strip() if c.value else '' for c in row]
        if any('признач' in v.lower() or 'тип' in v.lower() and ('шкір' in v.lower() or 'кожи' in v.lower()) for v in vals):
            print(f"Header row: {vals}")
            break
    
    # Count rows and empty cells
    rows = list(ws.iter_rows(min_row=2, values_only=False))
    print(f"Data rows: {len(rows)}")
    
    # Find column indices
    header = [str(c.value).strip().lower() if c.value else '' for c in next(ws.iter_rows(max_row=1, values_only=False))]
    print(f"Headers: {header}")
    
    priz_col = None
    type_col = None
    desc_col = None
    sku_col = None
    name_col = None
    
    for i, h in enumerate(header):
        if 'признач' in h:
            priz_col = i
        elif 'тип' in h and ('шкір' in h or 'кожи' in h):
            type_col = i
        elif 'опис' in h or 'ноти' in h:
            desc_col = i
        elif 'артикул' in h or 'sku' in h or 'id' == h:
            sku_col = i
        elif 'назва' in h or 'name' in h:
            name_col = i
    
    print(f"Призначення col: {priz_col}, Тип шкіри col: {type_col}, Опис col: {desc_col}, Артикул col: {sku_col}, Назва col: {name_col}")
    
    if priz_col is not None and type_col is not None:
        empty_priz = 0
        empty_type = 0
        for row in ws.iter_rows(min_row=2, max_row=min(ws.max_row, 10), values_only=False):
            priz_val = row[priz_col].value if priz_col < len(row) else None
            type_val = row[type_col].value if type_col < len(row) else None
            sku_val = row[sku_col].value if sku_col is not None and sku_col < len(row) else None
            name_val = row[name_col].value if name_col is not None and name_col < len(row) else None
            if priz_val is None or str(priz_val).strip() == '':
                empty_priz += 1
            if type_val is None or str(type_val).strip() == '':
                empty_type += 1
            print(f"  SKU: {sku_val}, Name: {str(name_val)[:40] if name_val else 'N/A'}, Призначення: {priz_val}, Тип: {type_val}")
        print(f"Empty Призначення: {empty_priz}, Empty Тип шкіри: {empty_type}")

wb.close()