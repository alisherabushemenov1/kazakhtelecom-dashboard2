import ChartsSection from "../components/ChartsSection";
import { KpiGrid } from "../components/KpiCard";

export default function OverviewPage({ data }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">Обзор реализации проектов</h1>
          <p className="text-sm text-slate-500">
            Сводные показатели по плану БКВ 2026 и освоению бюджета
          </p>
        </div>
        <KpiGrid kpis={data.kpis} />
      </section>

      <ChartsSection chartMonths={data.chartMonths} sponsorStats={data.sponsorStats} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TypeSummaryCard title="По типам проектов" items={data.typeStats} />
        <TypeSummaryCard title="Топ областей" items={data.regionStats.slice(0, 5).map((r) => ({
          label: r.region,
          count: r.count,
          plan2026: r.plan2026,
          execution: r.execution
        }))} />
      </section>
    </div>
  );
}

function TypeSummaryCard({ title, items }) {
  return (
    <div className="card p-5 md:col-span-1 xl:col-span-1">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.type || item.label} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <div className="font-medium text-slate-700">{item.typeLabel || item.label}</div>
              <div className="text-xs text-slate-400">{item.count} проектов</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800">
                {Math.round(item.plan2026).toLocaleString("ru-RU")} ₸
              </div>
              {"execution" in item && (
                <div className="text-xs text-slate-400">{item.execution}% исполнения</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
