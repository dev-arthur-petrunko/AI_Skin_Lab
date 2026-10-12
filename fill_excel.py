import openpyxl
import re
import shutil
from datetime import datetime
from pathlib import Path

# ============ DICTIONARIES ============
PURPOSE_MAP = {
    # format: (keywords) -> purpose value
    ('зволож', 'гидр', 'влажн', ' увлажн', 'hydrat', 'moistur', 'гиалурон'): 'Зволоження',
    ('відновл', 'регенерац', 'репейр', 'repair', 'нориш', 'норишмент'): 'Відновлення',
    ('заспоко', 'почервон', 'розмаз', 'купероз', 'розецеа', 'розацеа', 'спок', 'calm', 'sooth'): 'Заспокоєння та почервоніння',
    ('освітл', 'піднижен', 'тон', 'віт C', 'вітамін c', 'пigмент', 'спотил', 'bright', 'white', 'illumina', 'radiance'): 'Освітлення та пігментація',
    ('антивік', 'антивік', 'омолодж', 'лiфтинг', 'ліфтинг', 'ретинол', 'ретінал', 'peptid', 'перепід', 'wrinkl', 'anti.age', 'anti-age', 'age', 'ретейн'): 'Антивіковий догляд',
    ('антиокс', 'антіокс', 'витамин e', 'ферулова', 'coenzyme', 'q10', 'antiox'): 'Антиоксидантний захист',
    ('очищ', 'очищ', 'пена', 'гель', 'мус', 'мусс', 'гідрофільн', 'зімне масло', 'cleans', 'wash', 'foam'): 'Очищення',
    ('тоніз', 'тонік', 'лосьйон', 'toner', 'locion'): 'Освіження та тонізація',
    ('матув', 'себо', 'пор', 'пір', 'глян', 'blot', 'matt', 'oil.control'): 'Матування та пори',
    ('акне', 'акне', 'проблем', 'вугр', 'пimple', 'blemish', 'sebo.active', 'sebo.active'): 'Акне та проблемна шкіра',
    ('spf', 'сонцезах', 'sunscreen', 'sun.protect', 'uv', 'уф', 'захист від сонця'): 'Сонцезахист',
    ('оч', 'очі', 'перелічни', 'перелічков', 'eye', 'contour'): 'Догляд за очима',
    ('інтим', 'бікіні', 'делікат', 'делікат', 'intimate', 'bikini'): 'Делікатні зони',
}

SKIN_TYPE_MAP = {
    ('нормальн', 'normal'): 'Нормальна',
    ('сух', 'dry', 'дегідрат'): 'Суха',
    ('жирн', 'oily', 'себо', 'combination', 'комбін'): 'Жирна',
    ('комбін', 'комбінован', 'mixed', 't-zone', 't-зона'): 'Комбінована',
    ('чутлив', 'sensitive', 'сенсив', 'геперчут', 'atopic', 'атонік'): 'Чутлива',
    ('всі типи', 'всіх тип', 'all skin', 'all.type', 'any skin', 'універсальн'): 'Всі типи',
}

# Keywords that indicate specific skin types in descriptions
SKIN_TYPE_KEYWORDS = {
    'сух': ['сух', 'dry', 'дегідрат'],
    'жирн': ['жирн', 'oily', 'себо', 'матув', 'глян', 'комбін', 't-zone'],
    'чутлив': ['чутлив', 'sensitive', 'сенсив', 'геперчут', 'атонік', ' couperose', 'купероз'],
    'нормальн': ['нормальн', 'normal'],
    'комбінован': ['комбін', 'combined', 'mixed', 't-zone', 't-зона'],
    'акне': ['акне', 'acne', 'проблем', 'vuгр', 'pimple'],
}

PURPOSE_KEYWORDS = {
    'зволож': ['зволож', 'hydrat', 'moistur', 'гиалурон', 'гидру', 'влажн'],
    'відновл': ['відновл', 'регенерац', 'репейр', 'repair', 'нориш', 'nourish'],
    'заспокоєнн': ['заспоко', 'спок', 'calm', 'sooth', 'купероз', 'розецеа', 'розацеа', 'почервон', '紅'],
    'освітленн': ['освітл', 'піднижен', 'тон', 'віт c', 'вітамін c', 'пigмент', 'спотил', 'bright', 'white', 'illumina', 'radiance', 'пigмент', 'pigment'],
    'антивіков': ['антивік', 'омолодж', 'ліфтинг', 'ретинол', 'ретінал', 'пепт', 'перепід', 'wrinkl', 'anti.age', 'anti-age', 'age'],
    'антиоксид': ['антиокс', 'антіокс', 'вітамін e', 'ферулова', 'coenzyme', 'q10', 'antiox'],
    'очищенн': ['очищ', 'пена', 'гель', 'мус', 'мусс', 'гідрофільн', 'зімне масло', 'cleans', 'wash', 'foam', 'cleans'],
    'тоніз': ['тоніз', 'тонік', 'лосьйон', 'toner', 'locion'],
    'матуванн': ['матув', 'себо', 'пор', 'пір', 'глян', 'blot', 'matt', 'oil.control'],
    'акне': ['акне', 'acne', 'проблем', 'вугр', 'pimple', 'blemish', 'sebo.active'],
    'сонцезах': ['spf', 'сонцезах', 'sunscreen', 'sun.protect', 'uv', 'уф'],
    'оч': ['оч', 'перелічк', 'eye', 'contour'],
    'делікатн': ['інтим', 'бікіні', 'делікат', 'intimate', 'bikini'],
    'антивіков': ['антивік', 'омолодж', 'ліфтинг', 'ретинол', 'ретінал', 'пепт', 'перепід', 'wrinkl', 'anti.age', 'anti-age', 'age'],
}

SKIN_TYPE_IN_NAME = {
    'сух': ['сух', 'dry', 'дегідрат'],
    'жирн': ['жирн', 'oily', 'себо', 'матув', 'глян', 'комбін', 't-zone'],
    'чутлив': ['чутлив', 'sensitive', 'сенсив', 'геперчут', 'атонік', 'купероз', ' couperose'],
    'нормальн': ['нормальн', 'normal'],
    'комбін': ['комбін', 'combined', 'mixed', 't-zone', 't-зона'],
    'акне': ['акне', 'acne', 'проблем', 'вугр', 'pimple'],
    'всі': ['всі типи', 'all skin', 'all skin types', 'універсальн', 'for all'],
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
    for key, purpose in PURPOSE_KEYWORDS.items():
        for kw in PURPOSE_KEYWORDS[key]:
            if kw in text:
                # Map key to actual purpose value
                if key == 'зволож':
                    found.add('Зволоження')
                elif key == 'відновл':
                    found.add('Відновлення')
                elif key == 'заспокоєнн':
                    found.add('Заспокоєння та почервоніння')
                elif key == 'освітленн':
                    found.add('Освітлення та пігментація')
                elif key == 'антивіков':
                    found.add('Антивіковий догляд')
                elif key == 'антиоксид':
                    found.add('Антиоксидантний захист')
                elif key == 'очищенн':
                    found.add('Очищення')
                elif key == 'тоніз':
                    found.add('Освіження та тонізація')
                elif key == 'матуванн':
                    found.add('Матування та пори')
                elif key == 'акне':
                    found.add('Акне та проблемна шкіра')
                elif key == 'сонцезах':
                    found.add('Сонцезахист')
                elif key == 'оч':
                    found.add('Догляд за очима')
                elif key == 'делікатн':
                    found.add('Делікатні зони')
                elif key == 'антивіков':
                    found.add('Антивіковий догляд')
    return '; '.join(sorted(found)) if found else ''

def extract_skin_type(text, name=''):
    if not text:
        text = ''
    text = normalize(text + ' ' + name)
    found = set()
    for skin, kws in SKIN_TYPE_IN_NAME.items():
        for kw in kws:
            if kw in text:
                # Map to standard values
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
                    found.add('Акне та проблемна шкіра')  # will be filtered out
                elif skin == 'всі':
                    found.add('Всі типи')
    # Remove 'Акне та проблемна шкіра' from skin types
    found.discard('Акне та проблемна шкіра')
    return '; '.join(sorted(found)) if found else ''

def parse_description_blocks(text):
    """Parse blocks like 'Призначення:', 'Тип шкіри:', etc."""
    if not text:
        return {}
    text = str(text).replace('’', "'").replace('–', '-').replace('—', '-')
    blocks = {}
    current = None
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        # Check for headers
        if 'призначен' in lower or 'показанн' in lower:
            current = 'purpose'
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                blocks.setdefault(current, []).append(parts[1].strip())
        elif 'тип шкір' in lower or 'тип кожи' in lower:
            current = 'skin_type'
            parts = line.split(':', 1)
            if len(parts) > 1 and parts[1].strip():
                blocks.setdefault(current, []).append(parts[1].strip())
        elif current and (line.startswith('Склад:') or line.startswith('Склад') or line.startswith('Актив') or line.lower().startswith('актив') or line.endswith(':')):
            current = None
        elif current:
            blocks.setdefault(current, []).append(line)
    return blocks

def clean_value(val):
    if not val:
        return ''
    val = str(val).strip()
    # Split by separators and clean
    parts = re.split(r'[;,\n•]', val)
    cleaned = []
    for p in parts:
        p = p.strip()
        p = re.sub(r'[^\w\s\-/+%().\']', '', p)
        p = p.strip(' .')
        if p:
            cleaned.append(p)
    return '; '.join(sorted(set(cleaned))) if cleaned else ''

# Compile regex
import re

# ============ MAIN ============
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
new_phrases = set()

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\nProcessing sheet: {sheet_name}")
    
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, max_row=ws.max_row, values_only=False), start=2):
        sku_cell = row[0]
        name_cell = row[1]
        type_cell = row[2]
        purpose_cell = row[3]
        desc_cell = row[11] if len(row) > 11 else None
        
        sku = sku_cell.value
        name = name_cell.value
        desc = desc_cell.value if desc_cell else None
        
        # Skip if no SKU
        if not sku:
            continue
            
        # Get current values
        type_val = type_cell.value
        purpose_val = purpose_cell.value
        
        # Check if empty
        type_empty = type_val is None or (isinstance(type_val, str) and type_val.strip() == '')
        purpose_empty = purpose_val is None or (isinstance(purpose_val, str) and purpose_val.strip() == '')
        
        if not type_empty and not purpose_empty:
            continue  # Both already filled
        
        # Get text for analysis
        name_text = str(name_cell.value) if name_cell.value else ''
        desc_text = str(desc_cell.value) if desc_cell and desc_cell.value else ''
        
        # Parse description blocks
        blocks = parse_description_blocks(str(desc_cell.value) if desc_cell and desc_cell.value else '')
        
        # Extract purpose
        purpose_from_blocks = ''
        if 'purpose' in blocks:
            purpose_from_blocks = '; '.join(blocks['purpose'])
        elif 'purpose' in blocks:
            pass
        
        skin_type_from_blocks = ''
        if 'skin_type' in blocks:
            skin_type_from_blocks = '; '.join(blocks['skin_type'])
        
        # Extract from description text
        combined_text = f"{name_text} {desc_text}".lower() if 'name_text' in locals() else ''
        name_text = str(ws.cell(row=row[0].row, column=2).value) if ws.cell(row=row[0].row, column=2).value else ''
        desc_text = str(ws.cell(row=row_idx, column=12).value) if ws.cell(row=row_idx, column=12).value else ''
        
        # Use block data first, then fall back to keyword extraction
        purpose = ''
        if 'purpose' in blocks:
            raw_purpose = '; '.join(blocks['purpose'])
            purpose = clean_value(raw_purpose)
        else:
            purpose = extract_purpose(desc_text + ' ' + name_text, name_text)
        
        skin_type = ''
        if 'skin_type' in blocks:
            raw_skin = '; '.join(blocks['skin_type'])
            skin_type = clean_value(raw_skin)
        else:
            skin_type = extract_skin_type(desc_text + ' ' + name_text, name_text)
        
        # Fill empty cells
        filled = False
        if type_empty and skin_type:
            type_cell.value = skin_type
            total_filled_type += 1
            filled = True
            report_rows.append([ws.title, row_idx, sku, name_text, 'Тип шкіри', skin_type, 'агент'])
        
        if purpose_empty and purpose:
            purpose_cell.value = purpose
            total_filled_purpose += 1
            filled = True
            report_rows.append([ws.title, row_idx, sku, name_text, 'Призначення', purpose, 'агент'])
        
        if not filled and (type_empty or purpose_empty):
            manual_fill.append([ws.title, row_idx, sku, name_text, 'Тип шкіри' if type_empty else '', 'Призначення' if purpose_empty else ''])
        
        # Track new phrases
        # (could add logic here to detect unknown phrases)

# Save
wb.save('data/price.xlsx')
print(f"\nFilled Тип шкіри: {total_filled_type}")
print(f"Filled Призначення: {total_filled_purpose}")
print(f"Manual fill needed: {len(manual_fill)}")