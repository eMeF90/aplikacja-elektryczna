import datetime
import openpyxl

# Algorytm Meeusa/Butchera do wyliczania daty Wielkanocy w dowolnym roku
def get_easter_date(year):
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime.date(year, month, day)

# Generowanie słownika polskich świąt (stałych i ruchomych)
def get_polish_holidays(year):
    easter = get_easter_date(year)
    easter_monday = easter + datetime.timedelta(days=1)
    corpus_christi = easter + datetime.timedelta(days=60)
    
    return {
        (1, 1): "nowy rok",
        (1, 6): "trzech króli",
        (easter.month, easter.day): "wielkanoc",
        (easter_monday.month, easter_monday.day): "wielkanoc",
        (5, 1): "święto pracy",
        (5, 3): "święto konstytucji",
        (corpus_christi.month, corpus_christi.day): "boże ciało",
        (8, 15): "WNMP",
        (11, 1): "wszystkich świętych",
        (11, 11): "święto niepodległości",
        (12, 24): "wigilia",
        (12, 25): "boże narodzenie",
        (12, 26): "boże narodzenie",
    }

polish_days = {
    0: 'Poniedziałek', 1: 'Wtorek', 2: 'Środa',
    3: 'Czwartek', 4: 'Piątek', 5: 'Sobota', 6: 'Niedziela'
}

print("Otwieranie godziny.xlsx...")
wb = openpyxl.load_workbook('godziny.xlsx')
ws = wb.active

updated_count = 0
for r in range(5, ws.max_row + 1):
    date_val = ws.cell(row=r, column=1).value
    
    if isinstance(date_val, (datetime.datetime, datetime.date)):
        year, month, day = date_val.year, date_val.month, date_val.day
        
        # 1. Dzień tygodnia w kolumnie B
        ws.cell(row=r, column=2).value = polish_days[date_val.weekday()]
        
        # 2. Automatyczne przypisanie święta w kolumnie C
        holidays = get_polish_holidays(year)
        if (month, day) in holidays and not ws.cell(row=r, column=3).value:
            ws.cell(row=r, column=3).value = holidays[(month, day)]
        
        # 3. Formuła obliczająca ilość godzin: Kolumna F = E - D
        ws.cell(row=r, column=6).value = f'=E{r}-D{r}'
        updated_count += 1

wb.save('godziny_naprawiony.xlsx')
print(f"Pomyślnie naprawiono {updated_count} wierszy. Zapisano do godziny_naprawiony.xlsx")