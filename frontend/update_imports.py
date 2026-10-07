import os
import glob

files = glob.glob('src/components/*.tsx')
for f in files:
    content = open(f, encoding='utf-8').read()
    content = content.replace('from "next-intl"', 'from "@/i18n/request"')
    open(f, 'w', encoding='utf-8').write(content)
    print(f'Updated {f}')

print(f'Updated {len(files)} files')