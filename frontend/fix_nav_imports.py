import glob

for f in glob.glob('src/**/*.tsx', recursive=True):
    content = open(f, encoding='utf-8').read()
    content = content.replace('from "next-intl/navigation"', 'from "@/i18n/navigation"')
    content = content.replace("from 'next-intl/navigation'", 'from "@/i18n/navigation"')
    open(f, 'w', encoding='utf-8').write(content)
    print(f'Updated {f}')

print('Done')