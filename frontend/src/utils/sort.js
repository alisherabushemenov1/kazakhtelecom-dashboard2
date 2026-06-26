import { getMonthValues } from "./filters";

export function sortItems(items, sortKey, direction, monthKey = "may") {
  const factor = direction === "asc" ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = resolveValue(a, sortKey, monthKey);
    const right = resolveValue(b, sortKey, monthKey);

    if (typeof left === "string" || typeof right === "string") {
      return String(left).localeCompare(String(right), "ru") * factor;
    }

    return ((left ?? 0) - (right ?? 0)) * factor;
  });
}

function resolveValue(item, sortKey, monthKey) {
  switch (sortKey) {
    case "name":
      return item.name;
    case "type":
      return item.typeLabel || item.type;
    case "region":
      return item.region;
    case "sponsor":
      return item.sponsor;
    case "manager":
      return item.manager;
    case "plan2026":
      return item.plan2026?.total ?? 0;
    case "ytdPlan":
    case "periodPlan":
      return getMonthValues(item, monthKey).plan;
    case "ytdFact":
    case "periodFact":
      return getMonthValues(item, monthKey).fact;
    case "execution":
      return execution(item, monthKey);
    default:
      return item.name;
  }
}

export function execution(item, monthKey = "may") {
  const { plan, fact } = getMonthValues(item, monthKey);
  if (plan <= 0) return 0;
  return Math.round((fact / plan) * 1000) / 10;
}
