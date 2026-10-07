with open("src/components/Hero.tsx", "r", encoding="utf-8") as f:
    content = f.read()
lines = content.splitlines(keepends=True)
new_content = "".join(lines[:67])
open("src/components/Hero.tsx", "w", encoding="utf-8").write(new_content)
print("Fixed")