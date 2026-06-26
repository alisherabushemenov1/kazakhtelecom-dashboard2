"""Show where periods are located in the sheet. Run: python scripts/show_periods.py"""
from app.parser import _detect_month_blocks
from app.sheets import fetch_sheet_dataframe


def col_letter(n: int) -> str:
    s = ""
    n += 1
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def main() -> None:
    df, _ = fetch_sheet_dataframe()
    blocks = _detect_month_blocks(df)

    print("Периоды находятся в СТРОКЕ 3 таблицы, начиная с колонки J")
    print("Под каждым месяцем: строка 4 = план/факт, строка 5 = Всего/Оборудование/СМР")
    print()
    print(f"{'Период':<20} {'План (Всего)':<12} {'Факт (Всего)':<12}")
    print("-" * 44)
    for block in blocks:
        plan_col = col_letter(block["plan_cols"][0])
        fact_col = col_letter(block["fact_cols"][0])
        print(f"{block['label']:<20} {plan_col:<12} {fact_col:<12}")


if __name__ == "__main__":
    main()
