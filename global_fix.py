import os

print("--- Rozpoczynam skanowanie projektu ---")

syntax_error_pattern = "              })}}"
syntax_fix_pattern   = "              })"

fixed_count = 0

for root, dirs, files in os.walk('.'):
    # Pomijamy foldery budowania i bibliotek
    if '.next' in root or 'node_modules' in root or '.git' in root:
        continue
    
    for file in files:
        if file.endswith('.tsx') or file.endswith('.jsx') or file.endswith('.ts') or file.endswith('.js'):
            full_path = os.path.join(root, file)
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Sprawdzamy czy w pliku występuje wadliwy ciąg klamer
                if "})}}" in content or "}}}" in content:
                    print(f"[!] Znaleziono blad skladni w: {full_path}")
                    
                    # Naprawiamy podwójne / potrójne klamry zamykające w JSX
                    new_content = content.replace("})}}", "})}").replace("}}})", "})")
                    
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    
                    print(f"[+] NAPRAWIONO: {full_path}")
                    fixed_count += 1
            except Exception as e:
                pass

print(f"\n--- Zakonczono! Naprawiono plikow: {fixed_count} ---")