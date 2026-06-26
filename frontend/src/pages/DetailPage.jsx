import { useMemo, useState } from "react";
import FilterBar from "../components/FilterBar";
import ProjectDetailPanel from "../components/ProjectDetailPanel";
import { DEFAULT_FILTERS, filterProjects } from "../utils/filters";
import { sortItems } from "../utils/sort";

export default function DetailPage({ data }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState(data.projects[0]?.id || "");

  const filtered = useMemo(
    () => sortItems(filterProjects(data.projects, filters), "plan2026", "desc", filters.month),
    [data.projects, filters]
  );

  const selected = filtered.find((p) => p.id === selectedId) || filtered[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Детализация проекта</h1>
        <p className="text-sm text-slate-500">
          Помесячный план/факт, структура затрат (БЕ, подряд) и примечания
        </p>
      </div>

      <div className="card p-5">
        <FilterBar filters={filters} onChange={setFilters} meta={data.filters} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="card max-h-[70vh] overflow-y-auto p-3">
          {filtered.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => setSelectedId(project.id)}
              className={`mb-1 w-full rounded-xl px-3 py-3 text-left text-sm transition ${
                selected?.id === project.id ? "bg-blue-50 text-[#1e6fd9]" : "hover:bg-slate-50"
              }`}
            >
              <div className="font-medium">{project.name}</div>
              <div className="mt-1 text-xs text-slate-400">
                {project.region} · {project.typeLabel}
              </div>
            </button>
          ))}
        </div>

        {selected ? (
          <ProjectDetailPanel project={selected} monthKey={filters.month} />
        ) : (
          <div className="card p-8 text-center text-slate-500">Выберите проект из списка</div>
        )}
      </div>
    </div>
  );
}
