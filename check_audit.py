import pandas as pd

df = pd.read_csv('data/directions_audit_20261012_031333.csv', encoding='utf-8-sig')
print('Total rows:', len(df))
print('Actions:', df['дія'].value_counts().to_dict())
for i, row in df.iterrows():
    print(f'{row["артикул"]} | {str(row["назва"])[:50]} | дія: {row["дія"]} | тип: {str(row["новий_тип"])[:50]} | призначення: {str(row["нове_призначення"])[:50]}')