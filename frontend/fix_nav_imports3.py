import glob

for f in glob.glob('src/**/*.tsx', recursive=True):
    content = open(f, encoding='utf-8').read()
    content = content.replace('from "@/i18n/navigation.tsx"', 'from "@/i18n/navigation"')
    open(f, 'w', encoding='utf-8').write(content)
    print(f'Updated {f}')

print('Done')