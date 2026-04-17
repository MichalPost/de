import os, re

# Find unclosed string attributes like placeholder="text? or placeholder="text…?
# Pattern: ="...? followed by newline (missing closing quote)
pattern = re.compile(r'="([^"]*)\?\s*\n')

for base in ['apps/web/src', 'apps/mobile/src']:
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d != 'node_modules']
        for f in files:
            if not f.endswith(('.tsx', '.ts')):
                continue
            path = os.path.join(root, f)
            content = open(path, encoding='utf-8').read()
            matches = list(pattern.finditer(content))
            if not matches:
                continue
            print(f'\n{path.replace(chr(92), "/")}:')
            for m in matches:
                line_num = content[:m.start()].count('\n') + 1
                print(f'  line {line_num}: {repr(m.group()[:60])}')
            # Fix: replace ="text? with ="text"
            fixed = pattern.sub(lambda m: f'="{m.group(1)}"\n', content)
            open(path, 'w', encoding='utf-8').write(fixed)
            print(f'  -> Fixed {len(matches)} occurrence(s)')
