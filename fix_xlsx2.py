import openpyxl
p = r'D:/ПРОЕКТ AI/ЛИЧНЫЕ НАРАБОТКИ/AI Skin Lab/data/price.xlsx'
wb = openpyxl.load_workbook(p)
ws = wb.active
data = []
for row in ws.iter_rows(values_only=True):
    data.append(list(row))
new_hdr = [
    "Артикул", "Назва товару", "Бренд", "Ціна, грн", "Промо ціна, грн",
    "Знижка, %", "Залишок, шт", "Об'єм", "Країна-виробник", "Короткий опис (ноти)",
    "Назва (ru)", "Назва (en)", "Опис (ru)", "Опис (en)", "Фото"
]
new_data = []
for r in data[1:]:
    # 1..10 оригінал, 11..14 - під переклад (пусто), 15 - фото
    new_r = [r[i-1] if len(r) >= i else '' for i in range(1, 11)]
    new_r += [None, None, None, None]
    new_r += [r[10] if len(r) > 10 else '']
    new_data.append(new_r)
wb2 = openpyxl.Workbook()
ws2 = wb2.active
ws2.title = 'Зручна таблиця'
for j, h in enumerate(new_hdr, 1):
    ws2.cell(row=1, column=j, value=h)
for i, row in enumerate(new_data, 2):
    for j, v in enumerate(row, 1):
        ws2.cell(row=i, column=j, value=v)
wb2.save(p)
print('saved')
wb3 = openpyxl.load_workbook(p)
ws3 = wb3.active
print('rows:', ws3.max_row, 'cols:', ws3.max_column)
print('photo col 15 non-empty:', sum(1 for r in range(2, ws3.max_row+1) if ws3.cell(row=r, column=15).value))
print('empty trans cols 11-14:', sum(1 for r in range(2, ws3.max_row+1) if any(ws3.cell(row=r, column=c).value for c in range(11,15))))
print('row2:', [ws3.cell(row=2, column=j).value for j in range(1, 16)])