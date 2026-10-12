import openpyxl
import shutil
from datetime import datetime

# ============ MANUAL MAPPING ============
# Based on control examples and product knowledge

# Format: (keywords in product name) -> (purpose, skin_type)
PRODUCT_MAPPING = {
    # Control examples
    'aqua o2xy vitality fresh toner': (
        'Зволоження; Відновлення; Заспокоєння та почервоніння; Освіження та тонізація',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy pro-collagen eye cream': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy pro-collagen night': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy pro-collagen serum': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy pro-collagen day': (
        'Зволоження; Антивіковий догляд; Сонцезахист',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy velvet glow mousse': (
        'Очищення; Зволоження',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy pro-collagen': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'aqua o2xy': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'illumination quadro c elixir': (
        'Освітлення та пігментація; Антивіковий догляд; Зволоження; Антиоксидантний захист',
        'Всі типи'
    ),
    'illumination quadro': (
        'Освітлення та пігментація; Антивіковий догляд; Зволоження; Антиоксидантний захист',
        'Всі типи'
    ),
    'smart4derma illumination': (
        'Освітлення та пігментація; Зволоження; Делікатні зони',
        'Чутлива'
    ),
    'smart4derma acne balance': (
        'Акне та проблемна шкіра; Матування та пори; Заспокоєння та почервоніння; Себорегуляція',
        'Жирна; Комбінована; Проблемна'
    ),
    'smart4derma aquagen': (
        'Зволоження; Відновлення; Заспокоєння та почервоніння',
        'Суха; Нормальна; Чутлива; Комбінована'
    ),
    'smart4derma age performance': (
        'Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист',
        'Всі типи'
    ),
    'smart4derma age': (
        'Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист',
        'Всі типи'
    ),
    'smart4derma rediance': (
        'Освітлення та пігментація; Антивіковий догляд; Зволоження',
        'Нормальна; Суха; Комбінована'
    ),
    'smart4derma': (
        'Зволоження; Антивіковий догляд; Освітлення та пігментація',
        'Нормальна; Суха; Чутлива'
    ),
    'cef lab b-biotic calmine peel mask': (
        'Очищення; Матування та пори; Заспокоєння та почервоніння; Акне та проблемна шкіра',
        'Жирна; Комбінована; Проблемна'
    ),
    'cef lab b-biotic': (
        'Акне та проблемна шкіра; Матування та пори; Себорегуляція; Очищення',
        'Жирна; Комбінована; Проблемна'
    ),
    'cef lab aqua': (
        'Зволоження; Антивіковий догляд; Відновлення',
        'Нормальна; Суха; Чутлива'
    ),
    'cef lab': (
        'Акне та проблемна шкіра; Матування та пори; Себорегуляція; Очищення',
        'Жирна; Комбінована; Проблемна'
    ),
    'anna logor oil control': (
        'Матування та пори; Акне та проблемна шкіра; Себорегуляція',
        'Жирна; Комбінована'
    ),
    'anna logor': (
        'Матування та пори; Акне та проблемна шкіра; Себорегуляція',
        'Жирна; Комбінована'
    ),
    'anubis new even cleansing gel': (
        'Очищення; Зволоження; Заспокоєння та почервоніння',
        'Жирна; Комбінована; Проблемна; Чутлива'
    ),
    'anubis new even tonifying lotion': (
        'Освіження та тонізація; Себорегуляція; Матування та пори',
        'Жирна; Комбінована; Проблемна'
    ),
    'anubis new even oxygen cream': (
        'Зволоження; Сонцезахист; Відновлення',
        'Нормальна; Суха; Комбінована'
    ),
    'anubis new even glyco gel': (
        'Очищення; Освітлення та пігментація; Матування та пори',
        'Жирна; Комбінована; Проблемна'
    ),
    'anubis': (
        'Очищення; Себорегуляція; Матування та пори',
        'Жирна; Комбінована; Проблемна'
    ),
    'smart4derma acne balance': (
        'Акне та проблемна шкіра; Матування та пори; Себорегуляція; Заспокоєння та почервоніння',
        'Жирна; Комбінована; Проблемна'
    ),
    'smart4derma aquagen': (
        'Зволоження; Відновлення; Заспокоєння та почервоніння',
        'Суха; Нормальна; Чутлива; Комбінована'
    ),
    'smart4derma age performance': (
        'Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист',
        'Всі типи'
    ),
    'smart4derma age performance homekit': (
        'Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист',
        'Всі типи'
    ),
    'smart4derma rediance': (
        'Освітлення та пігментація; Антивіковий догляд; Зволоження',
        'Нормальна; Суха; Комбінована'
    ),
    'smart4derma acne balance homekit': (
        'Акне та проблемна шкіра; Матування та пори; Себорегуляція; Заспокоєння та почервоніння',
        'Жирна; Комбінована; Проблемна'
    ),
    'smart4derma aquagen homekit': (
        'Зволоження; Відновлення; Заспокоєння та почервоніння',
        'Суха; Нормальна; Чутлива; Комбінована'
    ),
}

# Default fallbacks by brand
BRAND_DEFAULTS = {
    'smart4derma': ('Зволоження; Антивіковий догляд; Освітлення та пігментація', 'Нормальна; Суха; Чутлива'),
    'cef lab': ('Акне та проблемна шкіра; Матування та пори; Себорегуляція; Очищення', 'Жирна; Комбінована; Проблемна'),
    'anna logon': ('Матування та пори; Акне та проблемна шкіра; Себорегуляція', 'Жирна; Комбінована'),
    'cef lab b-biotic': ('Акне та проблемна шкіра; Матування та пори; Себорегуляція; Очищення', 'Жирна; Комбінована; Проблемна'),
    'cef lab aqua': ('Зволоження; Антивіковий догляд; Відновлення', 'Нормальна; Суха; Чутлива'),
    'cef lab aqua o2xy': ('Зволоження; Антивіковий догляд; Відновлення', 'Нормальна; Суха; Чутлива'),
    'anna logon': ('Матування та пори; Акне та проблемна шкіра; Себорегуляція', 'Жирна; Комбінована'),
    'anubis': ('Очищення; Себорегуляція; Матування та пори', 'Жирна; Комбінована; Проблемна'),
    'smart4derma': ('Зволоження; Антивіковий догляд; Освітлення та пігментація', 'Нормальна; Суха; Чутлива'),
    'smart4derma aqua': ('Зволоження; Відновлення; Заспокоєння та почервоніння', 'Суха; Нормальна; Чутлива; Комбінована'),
    'smart4derma acne': ('Акне та проблемна шкіра; Матування та пори; Себорегуляція', 'Жирна; Комбінована; Проблемна'),
    'smart4derma age': ('Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист', 'Всі типи'),
    'illumination': ('Освітлення та пігментація; Антивіковий догляд; Зволоження; Антиоксидантний захист', 'Всі типи'),
    'anubis': ('Очищення; Себорегуляція; Матування та пори', 'Жирна; Комбінована; Проблемна'),
    'smart4derma rediance': ('Освітлення та пігментація; Антивіковий догляд; Зволоження', 'Нормальна; Суха; Комбінована'),
    'smart4derma aquagen': ('Зволоження; Відновлення; Заспокоєння та почервоніння', 'Суха; Нормальна; Чутлива; Комбінована'),
    'smart4derma acne': ('Акне та проблемна шкіра; Матування та пори; Себорегуляція', 'Жирна; Комбінована; Проблемна'),
    'smart4derma age': ('Антивіковий догляд; Зволоження; Освітлення та пігментація; Антиоксидантний захист', 'Всі типи'),
}

# Generic fallbacks
GENERIC_PURPOSE = 'Зволоження; Очищення; Відновлення'
GENERIC_TYPE = 'Нормальна; Суха; Чутлива'

def normalize(text):
    if not text:
        return ''
    return str(text).lower().replace('’', "'").replace('–', '-').replace('—', '-')

def find_match(name, brand=''):
    """Find matching product mapping"""
    name_lower = str(name).lower()
    brand_lower = str(brand).lower()
    
    # Try exact product name matches first
    for key, (purpose, skin_type) in PRODUCT_MAPPING.items():
        if key in name.lower():
            return purpose, skin_type
    
    # Try brand-based fallbacks
    for brand_key, (purpose, skin_type) in BRAND_DEFAULTS.items():
        if brand_key in name_lower or brand_key in brand.lower():
            return purpose, skin_type
    
    return None, None

# ============ MAIN ============
import openpyxl
import shutil
from datetime import datetime

print("Loading workbook...")
wb = openpyxl.load_workbook('data/price.xlsx', data_only=False)

# Backup
backup_path = f'data/backup/price_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
shutil.copy2('data/price.xlsx', backup_path)
print(f"Backup created: {backup_path}")

total_filled_type = 0
total_filled_purpose = 0
report_rows = []
manual_fill = []

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\nProcessing sheet: {sheet_name}")
    
    sheet_filled_type = 0
    sheet_filled_purpose = 0
    
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=False), start=2):
        sku_cell = row[0]
        name_cell = row[1]
        type_cell = row[2]
        purpose_cell = row[3]
        
        sku = sku_cell.value
        name = name_cell.value
        
        if not sku:
            continue
            
        type_val = type_cell.value
        purpose_val = purpose_cell.value
        
        type_empty = type_val is None or (isinstance(type_val, str) and type_val.strip() == '')
        purpose_empty = purpose_val is None or (isinstance(purpose_val, str) and purpose_val.strip() == '')
        
        if not type_empty and not purpose_empty:
            continue
        
        name_str = str(name_cell.value) if name_cell.value else ''
        
        purpose, skin_type = find_match(name_cell.value, '')
        
        filled = False
        if purpose_empty and purpose_cell.value is None or (purpose_cell.value and isinstance(purpose_cell.value, str) and purpose_cell.value.strip() == ''):
            if purpose:
                purpose_cell.value = purpose
                total_filled_purpose += 1
                report_rows.append([ws.title, row_idx, sku, name, 'Призначення', purpose, 'агент'])
        
        # For type, we need to check the cell directly
        type_val = ws.cell(row=row_idx, column=3).value
        purpose_val = ws.cell(row=row_idx, column=4).value
        
        type_empty = type_val is None or (isinstance(type_val, str) and type_val.strip() == '')
        purpose_empty = purpose_val is None or (isinstance(purpose_val, str) and purpose_val.strip() == '')
        
        if type_empty and skin_type:
            ws.cell(row=row_idx, column=3).value = skin_type
            report_rows.append([ws.title, row_idx, sku, name, 'Тип шкіри', skin_type, 'агент'])
        
        if purpose_empty and purpose:
            ws.cell(row=row_idx, column=4).value = purpose
            report_rows.append([ws.title, row_idx, sku, name, 'Призначення', purpose, 'агент'])

# Save
wb.save('data/price.xlsx')
print(f"\nFilled Тип шкіри: {total_filled_type}")
print(f"Filled Призначення: {total_filled_purpose}")

# Verify controls
print("\n=== VERIFICATION ===")
wb2 = openpyxl.load_workbook('data/price.xlsx', data_only=False)
control_skus = {
    'aqua o2xy': ['aqua o2xy'],
    'illumination quadro': ['illumination quadro', 'quadro c elixir'],
    'smart4derma illumination': ['smart4derma illumination', 'пінка для делікатних зон'],
}

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    for row in ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=False):
        name = row[1].value
        type_val = row[2].value
        purpose_val = row[3].value
        
        name_str = str(name) if name else ''
        for control_name, keywords in {
            'aqua o2xy': ['aqua o2xy'],
            'illumination quadro': ['illumination quadro', 'quadro c elixir'],
            'smart4derma illumination': ['smart4derma illumination', 'пінка для делікатних зон'],
        }.items():
            if any(kw.lower() in str(name).lower() for kw in keywords):
                print(f"\n=== CONTROL: {control_name} ===")
                print(f"  SKU: {row[0].value}")
                print(f"  Name: {name}")
                print(f"  Type: {type_val}")
                print(f"  Purpose: {purpose_val}")

wb.save('data/price.xlsx')
print(f"\nSaved.")