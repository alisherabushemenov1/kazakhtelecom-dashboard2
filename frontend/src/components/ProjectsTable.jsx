import { useMemo, useState } from "react";
import { executionColor, formatMoney, formatPct } from "../utils/format";
import { getMonthValues } from "../utils/filters";

export default function ProjectsTable({ projects, filters }) {
  const [search, setSearch] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [manager, setManager] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (sponsor && p.sponsor !== sponsor) return false;
      if (manager && p.manager !== manager) return false;
      if (!q) return true;
      return [p.name, p.spp, p.sponsor, p.manager].some((v) => v.toLowerCase().includes(q));
    });
  }, [projects, search, sponsor, manager]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Реестр проектов</h2>
            <p className="text-sm text-slate-500">{filtered.length} из {projects.length} проектов</p>
          </div>
          <input
            type="search"
            placeholder="Поиск: проект, СПП, спонсор..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-[#1e6fd9] lg:max-w-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Все спонсоры</option>
            {filters.sponsors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Все менеджеры</option>
            {filters.managers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">№</th>
              <th className="px-5 py-3">СПП / Проект</th>
              <th className="px-5 py-3">Спонсор</th>
              <th className="px-5 py-3">Менеджер</th>
              <th className="px-5 py-3">План 2026</th>
              <th className="px-5 py-3">Факт апр</th>
              <th className="px-5 py-3">Факт янв–май</th>
              <th className="px-5 py-3">Исполнение</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project, index) => {
              const april = getMonthValues(project, "april");
              const ytd = getMonthValues(project, "jan_may");
              const execution = ytd.plan > 0 ? Math.round((ytd.fact / ytd.plan) * 1000) / 10 : 0;

              return (
                <tr key={project.id} className="table-row border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-400">{index + 1}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{project.name}</div>
                    {project.spp && <div className="text-xs text-slate-400">{project.spp}</div>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{project.sponsor || "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{project.manager || "—"}</td>
                  <td className="px-5 py-3 font-medium">{formatMoney(project.plan2026.total)} ₸</td>
                  <td className="px-5 py-3">{formatMoney(april.fact)} ₸</td>
                  <td className="px-5 py-3">{formatMoney(ytd.fact)} ₸</td>
                  <td className={`px-5 py-3 font-semibold ${executionColor(execution)}`}>
                    {formatPct(execution)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
