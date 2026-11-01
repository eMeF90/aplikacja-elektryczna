import os

pages = [
    r"C:\Users\akros\aplikacja-elektryczna\app\page.tsx",
    r"C:\Users\akros\aplikacja-elektryczna\app\admin\page.tsx",
    r"C:\Users\akros\aplikacja-elektryczna\app\foreman\page.tsx",
    r"C:\Users\akros\aplikacja-elektryczna\app\login\page.tsx",
    r"C:\Users\akros\aplikacja-elektryczna\app\worker\page.tsx"
]

for p in pages:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if "}}}" in content or "})}}" in content:
            print(f"[!] Znaleziono błąd w pliku: {p}")
            new_content = content.replace("})}}", "})}").replace("}}})", "})").replace("}}}", "}}")
            with open(p, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"[+] NAPRAWIONO PLIK: {p}")