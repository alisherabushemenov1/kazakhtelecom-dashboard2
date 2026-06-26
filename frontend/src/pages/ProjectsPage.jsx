import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import ProjectDetailPanel from "../components/ProjectDetailPanel";
import { DEFAULT_FILTERS, filterProjects, getMonthValues } from "../utils/filters";
import { sortItems } from "../utils/sort";
import { executionColor, formatMoney, formatPct } from "../utils/format";

const COLUMNS = [
  { key: "name", label: "Проект" },
  { key: "type", label: "Тип" },
  { key: "region", label: "Область" },
  { key: "sponsor", label: "Спонсор" },
  { key: "plan2026", label: "План 2026" },
  { key: "ytdPlan", label: "План периода" },
  { key: "ytdFact", label: "Факт периода" },
  { key: "execution", label: "Исполнение" }
];

export default function ProjectsPage({ data }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState("plan2026");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedId, setSelectedId] = useState(null);

  const filtered = useMemo(() => {
    const items = filterProjects(data.projects, filters);
    return sortItems(items, sortKey, sortDir, filters.month);
  }, [data.projects, filters, sortKey, sortDir]);

  const selected = filtered.find((p) => p.id === selectedId) || data.projects.find((p) => p.id === selectedId);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Реестр проектов</h1>
        <p className="text-sm text-slate-500">
          {filtered.length} из {data.projects.length} проектов · сортировка и фильтрация
        </p>
      </div>

      <div className="card p-5">
        <FilterBar filters={filters} onChange={setFilters} meta={data.filters} />
      </div>

      {selected && (
        <ProjectDetailPanel
          project={selected}
          monthKey={filters.month}
          onClose={() => setSelectedId(null)}
        />
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">№</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-5 py-3">
                    <button type="button" onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-[#1e6fd9]">
                      {col.label}
                      {sortKey === col.key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project, index) => {
                const month = getMonthValues(project, filters.month);
                const exec = month.plan > 0 ? Math.round((month.fact / month.plan) * 1000) / 10 : 0;

                return (
                  <tr
                    key={project.id}
                    className={`table-row border-t border-slate-100 ${selectedId === project.id ? "bg-blue-50/60" : ""}`}
                  >
                    <td className="px-5 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{project.name}</div>
                      {project.spp && <div className="text-xs text-slate-400">{project.spp}</div>}
                    </td>
                    <td className="px-5 py-3">{project.typeLabel}</td>
                    <td className="px-5 py-3 text-slate-600">{project.region || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{project.sponsor || "—"}</td>
                    <td className="px-5 py-3 font-medium">{formatMoney(project.plan2026.total)} ₸</td>
                    <td className="px-5 py-3">{formatMoney(month.plan)} ₸</td>
                    <td className="px-5 py-3">{formatMoney(month.fact)} ₸</td>
                    <td className={`px-5 py-3 font-semibold ${executionColor(exec)}`}>{formatPct(exec)}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(project.id)}
                        className="rounded-lg border border-[#1e6fd9]/30 px-3 py-1 text-xs font-medium text-[#1e6fd9] hover:bg-blue-50"
                      >
                        Подробнее
                      </button>
                    </td>
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
