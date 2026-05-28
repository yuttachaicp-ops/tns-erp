import re

path = r'backend/src/app/personal/cat-health/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r"padding:'4px\s+12px'", "padding:'4px 12px'", c)
c = re.sub(r"padding:'10px\s+20px'", "padding:'10px 20px'", c)
c = re.sub(r"padding:'10px\s+24px'", "padding:'10px 24px'", c)
c = re.sub(r"padding:'8px\s+16px'", "padding:'8px 16px'", c)
c = re.sub(r"padding:'8px\s+12px'", "padding:'8px 12px'", c)

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(c)

print('Fixed OK')