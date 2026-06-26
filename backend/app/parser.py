from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from .config import DEFAULT_PERIOD_KEY, DEFAULT_YTD_KEY, month_key

TYPE_LABELS = {
    "П": "Проект",
    "ВП": "Внутренний проект",
    "Н": "Новый проект",
    "Е": "Единичный",
    "ИТОГО:": "Итого",
}

REGION_SUFFIX_RE = re.compile(r"_(.+)$")
SKIP_MONTH_HEADERS = {
    "экономия бкв 2026",
    "неосвоение бкв 2026",
    "вп объемы бкв 2026",
    "% освоения от годовых объемов дуп",
}


def parse_number(value: Any) -> float:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return 0.0
    text = str(value).strip().replace("\u00a0", "").replace(" ", "")
    if not text or text.lower() == "nan":
        return 0.0

    if "," in text:
        parts = text.lstrip("-").split(",")
        if len(parts) > 1 and all(part.isdigit() and len(part) == 3 for part in parts[1:]):
            text = text.replace(",", "")
        elif "." not in text:
            text = text.replace(",", ".")
        else:
            text = text.replace(",", "")

    try:
        return float(text)
    except ValueError:
        return 0.0


def pct(actual: float, planned: float) -> float:
    if planned <= 0:
        return 0.0
    return round((actual / planned) * 100, 1)


def extract_region(name: str) -> str:
    match = REGION_SUFFIX_RE.search(name)
    if match:
        return match.group(1).strip()
    lowered = name.lower()
    if "регион" in lowered or "област" in lowered or "г." in lowered:
        return name
    if "стратег" in lowered:
        return "Стратегические"
    if "шпд" in lowered:
        return "ШПД"
    if "волс" in lowered or "ftth" in lowered or "gpon" in lowered:
        return "ВОЛС / FTTH"
    return "Прочие"


def extract_category(name: str, project_type: str) -> str:
    region = extract_region(name)
    if region not in {"Прочие", "Стратегические", "ШПД", "ВОЛС / FTTH"}:
        return "По областям"
    if project_type == "ВП":
        return "Внутренние проекты"
    if project_type == "Н":
        return "Новые проекты"
    if project_type == "Е":
        return "Единичные"
    return region


def _read_block(row: pd.Series, cols: tuple[int, int, int]) -> dict[str, float]:
    return {
        "total": parse_number(row.iloc[cols[0]]),
        "equipment": parse_number(row.iloc[cols[1]]),
        "smr": parse_number(row.iloc[cols[2]]),
    }


def _row_kind(raw_type: Any) -> str:
    if raw_type is None or (isinstance(raw_type, float) and pd.isna(raw_type)):
        return "detail"
    text = str(raw_type).strip()
    mapping = {
        "ИТОГО:": "total",
        "П": "project",
        "ВП": "subproject",
        "Н": "new",
        "Е": "single",
    }
    return mapping.get(text, "detail")


def _detail_level(name: str) -> int:
    if name.startswith("- "):
        return 2
    if "в том числе" in name.lower():
        return 1
    return 1


def _detect_notes_col(df: pd.DataFrame) -> int:
    for col in range(df.shape[1]):
        value = df.iloc[2, col]
        if pd.notna(value) and "пояснен" in str(value).lower():
            return col
    return df.shape[1] - 1


def _detect_month_blocks(df: pd.DataFrame) -> list[dict[str, Any]]:
    month_map: dict[str, dict[str, Any]] = {}
    current_month: str | None = None

    for col in range(9, df.shape[1] - 2):
        header = str(df.iloc[2, col]).strip() if pd.notna(df.iloc[2, col]) else ""
        section = str(df.iloc[3, col]).strip().lower() if pd.notna(df.iloc[3, col]) else ""
        metric = str(df.iloc[4, col]).strip() if pd.notna(df.iloc[4, col]) else ""

        if header and header.lower() not in SKIP_MONTH_HEADERS and "пояснен" not in header.lower():
            if section in {"", "план", "факт"} or metric == "Всего":
                current_month = header

        if not current_month or section not in {"план", "факт"} or metric != "Всего":
            continue

        key = month_key(current_month)
        if key not in month_map:
            month_map[key] = {
                "key": key,
                "label": current_month,
                "plan_cols": None,
                "fact_cols": None,
            }

        cols = (col, col + 1, col + 2)
        if section == "план":
            month_map[key]["plan_cols"] = cols
        else:
            month_map[key]["fact_cols"] = cols

    blocks = [item for item in month_map.values() if item["plan_cols"] and item["fact_cols"]]
    return blocks


def _build_item(row: pd.Series, idx: int, month_blocks: list[dict[str, Any]], notes_col: int) -> dict[str, Any]:
    title = str(row.iloc[5]).strip()
    raw_type = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
    kind = _row_kind(row.iloc[1])

    item: dict[str, Any] = {
        "id": f"row-{idx}",
        "rowIndex": int(idx),
        "kind": kind,
        "type": raw_type,
        "typeLabel": TYPE_LABELS.get(raw_type, raw_type or "Детализация"),
        "spp": str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else "",
        "sponsor": str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else "",
        "manager": str(row.iloc[4]).strip() if pd.notna(row.iloc[4]) else "",
        "name": title,
        "region": "",
        "category": "",
        "plan2026": _read_block(row, (6, 7, 8)),
        "months": {},
        "notes": str(row.iloc[notes_col]).strip() if notes_col < len(row) and pd.notna(row.iloc[notes_col]) else "",
        "details": [],
        "detailLevel": _detail_level(title) if kind == "detail" else 0,
    }

    for block in month_blocks:
        item["months"][block["key"]] = {
            "label": block["label"],
            "plan": _read_block(row, block["plan_cols"]),
            "fact": _read_block(row, block["fact_cols"]),
        }

    if kind != "detail":
        item["category"] = extract_category(title, raw_type)
        item["region"] = extract_region(title)

    return item


def _aggregate_region_stats(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    regions: dict[str, dict[str, Any]] = {}

    for project in projects:
        region = project["region"] or "Прочие"
        if region not in regions:
            regions[region] = {
                "region": region,
                "projects": [],
                "count": 0,
                "plan2026": 0.0,
                "ytdPlan": 0.0,
                "ytdFact": 0.0,
            }

        bucket = regions[region]
        bucket["projects"].append(project)
        bucket["count"] += 1
        bucket["plan2026"] += project["plan2026"]["total"]

        ytd = project["months"].get(DEFAULT_YTD_KEY) or next(iter(project["months"].values()), None)
        if ytd:
            bucket["ytdPlan"] += ytd["plan"]["total"]
            bucket["ytdFact"] += ytd["fact"]["total"]

    stats = []
    for data in regions.values():
        stats.append(
            {
                **data,
                "execution": pct(data["ytdFact"], data["ytdPlan"]),
                "projects": sorted(data["projects"], key=lambda p: p["plan2026"]["total"], reverse=True),
            }
        )

    stats.sort(key=lambda x: x["plan2026"], reverse=True)
    return stats


def _period_block(summary_months: dict[str, Any], key: str) -> dict[str, Any]:
    if key in summary_months:
        return summary_months[key]
    first = next(iter(summary_months.values()), None)
    if first:
        return first
    return {"plan": {"total": 0, "equipment": 0, "smr": 0}, "fact": {"total": 0, "equipment": 0, "smr": 0}}


def parse_dataframe(
    df: pd.DataFrame,
    *,
    updated_at: str,
    file_name: str,
    file_path: str,
    source: str = "excel",
    report_title: str = "Факт освоения БКВ — май 2026",
) -> dict[str, Any]:
    notes_col = _detect_notes_col(df)
    month_blocks = _detect_month_blocks(df)

    totals_row = df.iloc[5]
    strategic_row = df.iloc[6] if len(df) > 6 else totals_row

    summary = {
        "planTotal": _read_block(totals_row, (6, 7, 8)),
        "strategicPlan": _read_block(strategic_row, (6, 7, 8)),
        "months": {},
    }

    for block in month_blocks:
        summary["months"][block["key"]] = {
            "label": block["label"],
            "plan": _read_block(totals_row, block["plan_cols"]),
            "fact": _read_block(totals_row, block["fact_cols"]),
        }

    projects: list[dict[str, Any]] = []
    groups: list[dict[str, Any]] = []
    detail_lines: list[dict[str, Any]] = []
    current_group: dict[str, Any] | None = None
    current_project: dict[str, Any] | None = None

    for idx in range(5, len(df)):
        row = df.iloc[idx]
        name = row.iloc[5]
        if pd.isna(name) or not str(name).strip():
            continue

        item = _build_item(row, idx, month_blocks, notes_col)
        kind = item["kind"]

        if kind == "total":
            continue

        if kind == "detail":
            detail_lines.append(item)
            if current_project is not None:
                current_project["details"].append(item)
            continue

        if kind == "project" and not item["spp"]:
            current_group = {**item, "children": []}
            groups.append(current_group)
            current_project = item
            projects.append(item)
            continue

        if kind in {"project", "subproject", "new", "single"}:
            projects.append(item)
            current_project = item
            if current_group is not None and kind in {"project", "subproject"} and item["spp"]:
                current_group["children"].append(item)

    sponsors = sorted({p["sponsor"] for p in projects if p["sponsor"]})
    managers = sorted({p["manager"] for p in projects if p["manager"]})
    regions = sorted({p["region"] for p in projects if p["region"]})
    types = sorted({p["type"] for p in projects if p["type"]})

    period = _period_block(summary["months"], DEFAULT_PERIOD_KEY)
    ytd = _period_block(summary["months"], DEFAULT_YTD_KEY)
    plan_ytd = ytd["plan"]["total"]
    fact_ytd = ytd["fact"]["total"]

    kpis = {
        "totalProjects": len(projects),
        "planBkv2026": summary["planTotal"]["total"],
        "planEquipment": summary["planTotal"]["equipment"],
        "planSmr": summary["planTotal"]["smr"],
        "periodLabel": period.get("label", "Май") if isinstance(period, dict) and "label" in period else summary["months"].get(DEFAULT_PERIOD_KEY, {}).get("label", "Май"),
        "periodPlan": period["plan"]["total"] if "plan" in period else 0,
        "periodFact": period["fact"]["total"] if "fact" in period else 0,
        "periodExecution": pct(period["fact"]["total"], period["plan"]["total"]) if "plan" in period else 0,
        "ytdLabel": summary["months"].get(DEFAULT_YTD_KEY, {}).get("label", "Январь–май"),
        "ytdPlan": plan_ytd,
        "ytdFact": fact_ytd,
        "ytdExecution": pct(fact_ytd, plan_ytd),
        "strategicPlanTotal": summary["strategicPlan"]["total"],
    }

    chart_month_keys = ["january", "february", "march", "april", "may"]
    chart_months = []
    for key in chart_month_keys:
        if key not in summary["months"]:
            continue
        block = summary["months"][key]
        chart_months.append(
            {
                "month": block["label"],
                "key": key,
                "plan": block["plan"]["total"],
                "fact": block["fact"]["total"],
                "execution": pct(block["fact"]["total"], block["plan"]["total"]),
            }
        )

    sponsor_stats = []
    for sponsor in sponsors:
        rows = [p for p in projects if p["sponsor"] == sponsor]
        ytd_plan = sum(p["months"].get(DEFAULT_YTD_KEY, {}).get("plan", {}).get("total", 0) for p in rows)
        ytd_fact = sum(p["months"].get(DEFAULT_YTD_KEY, {}).get("fact", {}).get("total", 0) for p in rows)
        sponsor_stats.append(
            {
                "sponsor": sponsor,
                "projects": len(rows),
                "plan2026": sum(p["plan2026"]["total"] for p in rows),
                "ytdPlan": ytd_plan,
                "ytdFact": ytd_fact,
                "execution": pct(ytd_fact, ytd_plan),
            }
        )
    sponsor_stats.sort(key=lambda x: x["plan2026"], reverse=True)

    type_stats = []
    for type_code in types:
        rows = [p for p in projects if p["type"] == type_code]
        ytd_plan = sum(p["months"].get(DEFAULT_YTD_KEY, {}).get("plan", {}).get("total", 0) for p in rows)
        ytd_fact = sum(p["months"].get(DEFAULT_YTD_KEY, {}).get("fact", {}).get("total", 0) for p in rows)
        type_stats.append(
            {
                "type": type_code,
                "typeLabel": TYPE_LABELS.get(type_code, type_code),
                "count": len(rows),
                "plan2026": sum(p["plan2026"]["total"] for p in rows),
                "ytdPlan": ytd_plan,
                "ytdFact": ytd_fact,
                "execution": pct(ytd_fact, ytd_plan),
            }
        )

    display_months = [
        b for b in month_blocks if b["key"] in {"january", "february", "march", "april", "may", "jan_april", "jan_may", "june"}
    ] or month_blocks[:8]

    amounts = [p["plan2026"]["total"] for p in projects if p["plan2026"]["total"] > 0]

    return {
        "updatedAt": updated_at,
        "fileName": file_name,
        "filePath": file_path,
        "dataSource": source,
        "reportTitle": report_title,
        "defaultPeriodKey": DEFAULT_PERIOD_KEY,
        "defaultYtdKey": DEFAULT_YTD_KEY,
        "summary": summary,
        "kpis": kpis,
        "chartMonths": chart_months,
        "sponsorStats": sponsor_stats,
        "regionStats": _aggregate_region_stats(projects),
        "typeStats": type_stats,
        "projects": projects,
        "groups": groups,
        "detailLinesCount": len(detail_lines),
        "filters": {
            "sponsors": sponsors,
            "managers": managers,
            "regions": regions,
            "types": [{"code": t, "label": TYPE_LABELS.get(t, t)} for t in types],
            "months": [{"key": b["key"], "label": b["label"]} for b in display_months],
            "allMonths": [{"key": b["key"], "label": b["label"]} for b in month_blocks],
            "amountRange": {
                "min": min(amounts) if amounts else 0,
                "max": max(amounts) if amounts else 0,
            },
        },
    }


def parse_excel(path: Path) -> dict[str, Any]:
    df = pd.read_excel(path, header=None)
    mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
    return parse_dataframe(
        df,
        updated_at=mtime,
        file_name=path.name,
        file_path=str(path),
        source="excel",
    )
