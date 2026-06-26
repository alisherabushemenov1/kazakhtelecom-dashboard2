import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import ProjectDetailPanel from "../components/ProjectDetailPanel";
import { DEFAULT_FILTERS, filterRegions, getMonthValues } from "../utils/filters";
import { executionColor, formatMoney, formatPct } from "../utils/format";

export default function RegionsPage({ data }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expanded, setExpanded] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const regions = useMemo(() => filterRegions(data.regionStats, filters), [data.regionStats, filters]);
  const selected = data.projects.find((p) => p.id === selectedId);

  function toggleRegion(region) {
    setExpanded((prev) => ({ ...prev, [region]: !prev[region] }));
  }

  function expandAll() {
    const next = {};
    regions.forEach((r) => {
      next[r.region] = true;
    });
    setExpanded(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Прогресс по областям</h1>
          <p className="text-sm text-slate-500">
            Иерархический просмотр: область → проекты · {regions.length} областей
          </p>
        </div>
        <button
          type="button"
          onClick={expandAll}
          className="self-start rounded-xl border border-[#1e6fd9]/30 px-4 py-2 text-sm font-medium text-[#1e6fd9] hover:bg-blue-50"
        >
          Развернуть всё
        </button>
      </div>

      <div className="card p-5">
        <FilterBar filters={filters} onChange={setFilters} meta={data.filters} showAmount />
      </div>

      {selected && (
        <ProjectDetailPanel project={selected} monthKey={filters.month} onClose={() => setSelectedId(null)} />
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Область / проект</th>
                <th className="px-5 py-3">План 2026</th>
                <th className="px-5 py-3">План периода</th>
                <th className="px-5 py-3">Факт периода</th>
                <th className="px-5 py-3">Исполнение</th>
                <th className="px-5 py-3">СМР факт</th>
              </tr>
            </thead>
            <tbody>
              {regions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    Нет данных по выбранным фильтрам
                  </td>
                </tr>
              ) : (
                regions.map((region) => {
                const isOpen = expanded[region.region];
                const monthTotals = region.projects.reduce(
                  (acc, p) => {
                    const m = getMonthValues(p, filters.month);
                    acc.plan += m.plan;
                    acc.fact += m.fact;
                    acc.smrFact += m.smrFact;
                    return acc;
                  },
                  { plan: 0, fact: 0, smrFact: 0 }
                );
                const exec = monthTotals.plan > 0 ? (monthTotals.fact / monthTotals.plan) * 100 : 0;

                return (
                  <RegionBlock
                    key={region.region}
                    region={region}
                    isOpen={isOpen}
                    exec={exec}
                    monthTotals={monthTotals}
                    filters={filters}
                    onToggle={() => toggleRegion(region.region)}
                    onSelect={setSelectedId}
                  />
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RegionBlock({ region, isOpen, exec, monthTotals, filters, onToggle, onSelect }) {
  return (
    <>
      <tr className="table-row border-t border-slate-100 bg-slate-50/70">
        <td className="px-5 py-3">
          <button type="button" onClick={onToggle} className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="text-slate-400">{isOpen ? "▼" : "▶"}</span>
            {region.region}
            <span className="text-xs font-normal text-slate-400">{region.count} проектов</span>
          </button>
        </td>
        <td className="px-5 py-3 font-semibold">{formatMoney(region.plan2026)} ₸</td>
        <td className="px-5 py-3">{formatMoney(monthTotals.plan)} ₸</td>
        <td className="px-5 py-3">{formatMoney(monthTotals.fact)} ₸</td>
        <td className={`px-5 py-3 font-semibold ${executionColor(exec)}`}>{formatPct(exec)}</td>
        <td className="px-5 py-3">{formatMoney(monthTotals.smrFact)} ₸</td>
      </tr>

      {isOpen &&
        region.projects.map((project) => {
          const month = getMonthValues(project, filters.month);
          const projectExec = month.plan > 0 ? (month.fact / month.plan) * 100 : 0;

          return (
            <tr key={project.id} className="table-row border-t border-slate-100">
              <td className="px-5 py-3 pl-12">
                <button type="button" onClick={() => onSelect(project.id)} className="text-left hover:text-[#1e6fd9]">
                  <div className="font-medium text-slate-700">{project.name}</div>
                  <div className="text-xs text-slate-400">{project.typeLabel}{project.spp ? ` · ${project.spp}` : ""}</div>
                </button>
              </td>
              <td className="px-5 py-3">{formatMoney(project.plan2026.total)} ₸</td>
              <td className="px-5 py-3">{formatMoney(month.plan)} ₸</td>
              <td className="px-5 py-3">{formatMoney(month.fact)} ₸</td>
              <td className={`px-5 py-3 ${executionColor(projectExec)}`}>{formatPct(projectExec)}</td>
              <td className="px-5 py-3">{formatMoney(month.smrFact)} ₸</td>
            </tr>
          );
        })}
    </>
  );
}
