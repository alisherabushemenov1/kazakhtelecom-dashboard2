import { formatMoney, formatPct } from "../utils/format";

export default function KpiCard({ title, value, subtitle, trend, accent = "blue" }) {
  const accents = {
    blue: "text-[#1e6fd9]",
    orange: "text-amber-500",
    green: "text-emerald-600",
    slate: "text-slate-800"
  };

  return (
    <div className="card p-5">
      <div className="mb-3 text-sm font-medium text-slate-500">{title}</div>
      <div className={`text-3xl font-bold tracking-tight ${accents[accent]}`}>{value}</div>
      {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
      {trend && (
        <div className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {trend}
        </div>
      )}
    </div>
  );
}

export function KpiGrid({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="План БКВ 2026"
        value={`${formatMoney(kpis.planBkv2026)} ₸`}
        subtitle={`Оборуд: ${formatMoney(kpis.planEquipment)} · СМР: ${formatMoney(kpis.planSmr)}`}
        accent="blue"
      />
      <KpiCard
        title={`Факт — ${kpis.periodLabel || "Май"}`}
        value={`${formatMoney(kpis.periodFact)} ₸`}
        subtitle={`${formatPct(kpis.periodExecution)} от плана (${formatMoney(kpis.periodPlan)} ₸)`}
        accent="green"
      />
      <KpiCard
        title={`Факт — ${kpis.ytdLabel || "Январь–май"}`}
        value={`${formatMoney(kpis.ytdFact)} ₸`}
        subtitle={`${formatPct(kpis.ytdExecution)} от плана (${formatMoney(kpis.ytdPlan)} ₸)`}
        accent="blue"
      />
      <KpiCard
        title="Проектов в реестре"
        value={kpis.totalProjects}
        subtitle={`Стратегические: ${formatMoney(kpis.strategicPlanTotal)} ₸`}
        accent="slate"
      />
    </div>
  );
}
