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
old_photo_col = 11
new_data = []
for r in data[1:]:
    # 15 елементів: 14 звичайних (стара 11 -> 15 позиція) + фото
    new_r = [r[i-1] if len(r) >= i else '' for i in range(1, 14)]
    new_r += [r[old_photo_col-1] if len(r) >= old_photo_col else '']
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
print('headers:', [ws3.cell(row=1, column=j).value for j in range(1, 16)])
print('rows:', ws3.max_row, 'cols:', ws3.max_column)