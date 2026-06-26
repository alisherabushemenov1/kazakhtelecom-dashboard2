export function formatMoney(value) {
  if (value == null || Number.isNaN(value)) return "0";
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatPct(value) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}

export function executionColor(pct) {
  if (pct >= 90) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-red-500";
}

export function executionBarColor(pct) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-red-500";
}
