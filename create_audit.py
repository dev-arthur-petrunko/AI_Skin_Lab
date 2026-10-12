import pandas as pd
import openpyxl
import shutil
from datetime import datetime
from pathlib import Path
import re

# ============ DICTIONARIES ============
PURPOSE_KEYWORDS = {
    'зволож': ['зволож', 'hydrat', 'moistur', 'гиалурон', 'гидру', 'влажн', 'комфорт'],
    'відновл': ['відновл', 'регенерац', 'репейр', 'repair', 'нориш', 'nourish'],
    'заспокоєнн': ['заспок', 'спок', 'calm', 'sooth', 'купероз', 'розецеа', 'розацеа', 'почервон'],
    'освітленн': ['освітл', 'піднижен', 'тон', 'віт c', 'вітамін c', 'пigмент', 'спотил', 'bright', 'white', 'illumina', 'radiance', 'пigмент', 'pigment'],
    'антивіков': ['антивік', 'омолодж', 'ліфтинг', 'ретинол', 'ретінал', 'пепт', 'перепід', 'wrinkl', 'anti.age', 'anti-age', 'age'],
    'антиоксид': ['антиокс', 'антіокс', 'вітамін e', 'ферулова', 'coenzyme', 'q10', 'antiox'],
    'очищенн': ['очищ', 'пена', 'гель', 'мус', 'мусс', 'гідрофільн', 'зімне масло', 'cleans', 'wash', 'foam'],
    'тоніз': ['тоніз', 'тонік', 'лосьйон', 'toner', 'locion'],
    'матуванн': ['матув', 'себо', 'пор', 'пір', 'глян', 'blot', 'matt', 'oil.control'],
    'акне': ['акне', 'acne', 'проблем', 'вугр', 'pimple', 'blemish', 'sebo.active'],
    'сонцезах': ['spf', 'сонцезах', 'sunscreen', 'sun.protect', 'uv', 'уф'],
    'оч': ['оч', 'перелічк', 'eye', 'contour'],
    'делікатн': ['інтим', 'бікіні', 'делікат', 'intimate', 'bikini'],
}

SKIN_TYPE_KEYWORDS = {
    'сух': ['сух', 'dry', 'дегідрат'],
    'жирн': ['жирн', 'oily', 'себо', 'матув', 'глян', 'комбін', 't-zone'],
    'чутлив': ['чутлив', 'sensitive', 'сенсив', 'геперчут', 'атонік', 'купероз'],
    'нормальн': ['нормальн', 'normal'],
    'комбін': ['комбін', 'combined', 'mixed', 't-zone', 't-зона'],
    'акне': ['акне', 'acne', 'проблем', 'вугр', 'pimple'],
    'всі': ['всі типи', 'all skin', 'all skin types', 'універсальн'],
}

PURPOSE_LABEL_MAP = {
    'зволож': 'Зволоження',
    'відновл': 'Відновлення',
    'заспокоєнн': 'Заспокоєння та почервоніння',
    'освітленн': 'Освітлення та пігментація',
    'антивіков': 'Антивіковий догляд',
    'антиоксид': 'Антиоксидантний захист',
    'очищенн': 'Очищення',
    'тоніз': 'Освіження та тонізація',
    'матуванн': 'Матування та пори',
    'акне': 'Акне та проблемна шкіра',
    'сонцезах': 'Сонцезахист',
    'оч': 'Догляд за очима',
    'делікатн': 'Делікатні зони',
}

SKIN_TYPE_LABEL_MAP = {
    'сух': 'Суха',
    'жирн': 'Жирна',
    'чутлив': 'Чутлива',
    'нормальн': 'Нормальна',
    'комбін': 'Комбінована',
    'акне': 'Акне та проблемна шкіра',
    'всі': 'Всі типи',
}

def normalize(text):
    if not text:
        return ''
    return str(text).lower().replace('’', "'").replace('–', '-').replace('—', '-')

def extract_purpose(text, name=''):
    if not text:
        text = ''
    text = normalize(text + ' ' + name)
    found = set()
    for key, kws in PURPOSE_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                found.add(PURPOSE_LABEL_MAP[key])
    return '; '.join(sorted(found)) if found else ''

def extract_skin_type(text, name=''):
    if not text:
        text = ''
    text = normalize(text + ' ' + name)
    found = set()
    for skin, kws in SKIN_TYPE_KEYWORDS.items():
        for kw in kws:
            if kw in text:
                if skin == 'сух':
                    found.add('Суха')
                elif skin == 'жирн':
                    found.add('Жирна')
                elif skin == 'чутлив':
                    found.add('Чутлива')
                elif skin == 'нормальн':
                    found.add('Нормальна')
                elif skin == 'комбін':
                    found.add('Комбінована')
                elif skin == 'акне':
                    pass  # don't add as skin type
                elif skin == 'всі':
                    found.add('Всі типи')
    return '; '.join(sorted(found)) if found else ''

def clean_value(val):
    if not val:
        return ''
    val = str(val).strip()
    parts = re.split(r'[;,\n•]', val)
    cleaned = []
    for p in parts:
        p = p.strip()
        p = re.sub(r'[^\w\s\-/+%().\']', '', p)
        p = p.strip(' .')
        if p:
            cleaned.append(p)
    return '; '.join(sorted(set(cleaned))) if cleaned else ''

# ============ MAIN ============
import openpyxl
import pandas as pd
import shutil
from datetime import datetime
from pathlib import Path

print("Loading workbook...")
wb = openpyxl.load_workbook('data/price.xlsx', data_only=False)

# Backup
backup_path = f'data/backup/price_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
shutil.copy2('data/price.xlsx', backup_path)
print(f"Backup created: {backup_path}")

# Audit report
audit_rows = []

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    if sheet_name.strip().lower() == 'sets':
        continue
        
    print(f"Processing sheet: {sheet_name}")
    
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=False), start=2):
        sku_cell = row[0]
        name_cell = row[1]
        type_cell = row[2]
        purpose_cell = row[3]
        desc_cell = row[11] if len(row) > 11 else None
        
        sku = sku_cell.value
        name = name_cell.value
        
        if not sku:
            continue
            
        type_val = type_cell.value
        purpose_val = purpose_cell.value
        desc = desc_cell.value if desc_cell else None
        
        type_empty = type_val is None or (isinstance(type_val, str) and type_val.strip() == '')
        purpose_empty = purpose_val is None or (isinstance(purpose_val, str) and purpose_val.strip() == '')
        
        if not type_val or str(type_val).strip() == '' or str(type_val).strip() == 'nan':
            type_empty = True
        else:
            type_empty = False
            
        if not purpose_val or (isinstance(purpose_val, str) and purpose_val.strip() == ''):
            purpose_empty = True
        else:
            purpose_empty = False
            
        if not type_empty and not purpose_empty:
            continue
            
        name_text = str(name_cell.value) if name_cell.value else ''
        desc_text = str(desc_cell.value) if desc_cell and desc_cell.value else ''
        
        # Extract purpose and skin type
        purpose = extract_purpose(desc_text + ' ' + name_text, name_text)
        skin_type = extract_skin_type(desc_text + ' ' + name_text, name_text)
        
        # Brand-based fallback
        brand = ''
        # We'll use the brand column (index 4)
        
        action = 'залишити'
        new_type = str(type_cell.value) if not type_empty else ''
        new_purpose = str(purpose_cell.value) if not purpose_empty else ''
        
        if type_empty and skin_type:
            new_type = skin_type
            action = 'замінити'
        elif purpose_empty and purpose:
            new_purpose = purpose
            action = 'замінити'
        elif type_empty and not skin_type:
            action = 'очистити'
        elif purpose_empty and not purpose:
            action = 'очистити'
            
        audit_rows.append({
            'лист': 'Anubis',
            'рядок': row_idx + 1,
            'артикул': str(sku_cell.value) if sku_cell.value else '',
            'назва': str(row[1].value)[:80] if row[1].value else '',
            'поточний_тип': str(type_cell.value) if type_cell.value else '',
            'поточне_призначення': str(purpose_cell.value)[:80] if purpose_cell and purpose_cell.value else '',
            'новий_тип': skin_type,
            'нове_призначення': purpose,
            'дія': action,
            'основання': f"desc: {str(row[11].value)[:100] if row[11].value else ''}" if len(row) > 11 and row[11].value else ''
        })

# Write audit CSV
audit_df = pd.DataFrame(audit_rows)
audit_path = f'data/directions_audit_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
audit_df.to_csv(audit_path, index=False, encoding='utf-8-sig')
print(f"Audit report saved: {audit_path}")
print(f"Total rows to review: {len(audit_rows)}")

# Show summary
if audit_rows:
    df_audit = pd.DataFrame(audit_rows)
    print(f"\nAction summary:")
    print(df_audit['дія'].value_counts())
    print(f"\nSample rows:")
    print(df_audit.head(10).to_string())