import pandas as pd

xl = pd.ExcelFile('data/price.xlsx', engine='openpyxl')
print('Sheets:', xl.sheet_names)

for sheet in xl.sheet_names:
    df = xl.parse(sheet)
    print(f'\n=== Sheet: {sheet} ===')
    print(f'Shape: {df.shape}')
    print('Columns:', list(df.columns))
    
    # Check for 'Призначення' and 'Тип шкіри' columns
    cols = df.columns.tolist()
    for i, col in enumerate(cols):
        if 'признач' in str(col).lower() or 'тип' in str(col).lower():
            print(f'  Col {i}: {col}')
    
    # Count empty cells in key columns
    for i, col in enumerate(df.columns):
        if 'признач' in str(col).lower() or 'тип' in str(col).lower():
            col_data = df.iloc[:, i]
            empty_count = col_data.isna().sum() + (col_data.astype(str).str.strip() == '').sum()
            print(f'  {col}: {empty_count} empty out of {len(col_data)}')

print("\n=== Checking specific products ===")
for sheet_name in xl.sheet_names:
    df = xl.parse(sheet_name)
    for _, row in df.iterrows():
        name = str(row.iloc[1]) if len(row) > 1 else ''
        name_lower = str(name).lower()
        if any(kw in name_lower for kw in ['anubis', 'регенеруючий', 'сухо', 'жирн', 'чутлив', 'проблем', 'акне']):
            print(f"  Row: {[str(c)[:50] for c in row]}")