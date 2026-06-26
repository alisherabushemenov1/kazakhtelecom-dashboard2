import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import { DEFAULT_FILTERS, filterProjects, getMonthLabel, getMonthValues } from "../utils/filters";
import { sortItems } from "../utils/sort";
import { formatMoney, formatPct } from "../utils/format";

export default function SponsorsPage({ data }) {
  const defaultMonth = data.defaultYtdKey || "jan_may";
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, month: defaultMonth });
  const [selectedSponsor, setSelectedSponsor] = useState("");

  const periodLabel = getMonthLabel(data.filters, filters.month);

  const sponsorProjects = useMemo(() => {
    const base = filterProjects(data.projects, {
      ...filters,
      sponsor: selectedSponsor || filters.sponsor
    });
    return sortItems(base, "plan2026", "desc", filters.month);
  }, [data.projects, filters, selectedSponsor]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Исполнение по спонсорам</h1>
        <p className="text-sm text-slate-500">Сводка по ответственным спонсорам проектов</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.sponsorStats.map((item) => (
          <button
            key={item.sponsor}
            type="button"
            onClick={() => setSelectedSponsor((prev) => (prev === item.sponsor ? "" : item.sponsor))}
            className={`card p-5 text-left transition ${
              selectedSponsor === item.sponsor ? "ring-2 ring-[#1e6fd9]" : "hover:shadow-md"
            }`}
          >
            <div className="mb-2 text-sm font-medium text-slate-500">{item.projects} проектов</div>
            <div className="text-lg font-bold text-slate-900">{item.sponsor}</div>
            <div className="mt-3 text-sm text-slate-600">
              План 2026: <span className="font-semibold">{formatMoney(item.plan2026)} ₸</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Факт ({data.kpis?.ytdLabel || "январь–май"}): {formatMoney(item.ytdFact)} / {formatMoney(item.ytdPlan)} ₸
            </div>
            <div className="progress-bar mt-4">
              <div className="progress-fill bg-[#1e6fd9]" style={{ width: `${Math.min(item.execution, 100)}%` }} />
            </div>
            <div className="mt-2 text-xs text-slate-400">{formatPct(item.execution)} исполнения</div>
          </button>
        ))}
      </div>

      <div className="card p-5">
        <FilterBar filters={filters} onChange={setFilters} meta={data.filters} showAmount={false} />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {selectedSponsor || filters.sponsor || "Все спонсоры"} · {sponsorProjects.length} проектов
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Проект</th>
                <th className="px-5 py-3">Область</th>
                <th className="px-5 py-3">Менеджер</th>
                <th className="px-5 py-3">План 2026</th>
                <th className="px-5 py-3">Факт — {periodLabel}</th>
              </tr>
            </thead>
            <tbody>
              {sponsorProjects.map((project) => {
                const month = getMonthValues(project, filters.month);
                return (
                  <tr key={project.id} className="table-row border-t border-slate-100">
                    <td className="px-5 py-3 font-medium text-slate-800">{project.name}</td>
                    <td className="px-5 py-3">{project.region || "—"}</td>
                    <td className="px-5 py-3">{project.manager || "—"}</td>
                    <td className="px-5 py-3">{formatMoney(project.plan2026.total)} ₸</td>
                    <td className="px-5 py-3">{formatMoney(month.fact)} ₸</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
