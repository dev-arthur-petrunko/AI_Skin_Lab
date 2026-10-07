import json

f = 'src/messages/uk.json'
with open(f, encoding='utf-8') as fp:
    d = json.load(fp)

d['hero'].update({
    'ctaAsk': 'Запитати AI',
    'moodTitle': 'Оберіть категорію',
    'moodHint': 'Фільтр товарів за типом'
})

d['mood'] = {
    'label': 'Категорія',
    'all': 'Усі',
    'fresh': 'Догляд',
    'sweet': 'Макіяж',
    'wood': 'Парфумерія'
}

with open(f, 'w', encoding='utf-8') as fp:
    json.dump(d, fp, ensure_ascii=False, indent=4)

print('Updated uk.json')