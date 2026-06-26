"""Explain which periods exist and where numbers come from."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.data_source import load_dashboard_data


def main() -> None:
    data = load_dashboard_data()

    print("=" * 60)
    print("1. PERIODS IN TABLE (row 3 headers) - NOT calculated")
    print("=" * 60)
    for m in data["filters"]["allMonths"]:
        key = m["key"]
        block = data["summary"]["months"].get(key, {})
        plan = block.get("plan", {}).get("total", 0)
        fact = block.get("fact", {}).get("total", 0)
        status = "has data" if (plan or fact) else "zeros only"
        print(f"  {m['label']:22} ({key:10})  plan={plan:>15,.0f}  fact={fact:>15,.0f}  [{status}]")

    print()
    print("=" * 60)
    print("2. DETAIL PAGE TABLE - shows ALL periods above for each project")
    print("   (even if 0 - because column exists in Excel)")
    print("=" * 60)

    p = data["projects"][0]
    print(f"Example project: {p['name'][:55]}")
    for key, block in p["months"].items():
        pl, fa = block["plan"]["total"], block["fact"]["total"]
        mark = " <-- from Excel cell" if (pl or fa) else " <-- column exists, value is 0"
        print(f"  {block['label']:22} plan={pl:>12,.0f} fact={fa:>12,.0f}{mark}")

    print()
    print("=" * 60)
    print("3. FALLBACK (can look like 'wrong month')")
    print("   If you select 'May' but project has no May column data,")
    print("   site substitutes: jan_may -> may -> january")
    print("=" * 60)


if __name__ == "__main__":
    main()
