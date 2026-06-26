import { formatMoney, formatPct, executionColor } from "../utils/format";
import { getMonthValues } from "../utils/filters";

export default function ProjectDetailPanel({ project, monthKey, onClose }) {
  if (!project) return null;

  const month = getMonthValues(project, monthKey);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#1e6fd9]">
            {project.typeLabel} · {project.region || "Без региона"}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
            {project.spp && <span>СПП: {project.spp}</span>}
            {project.sponsor && <span>Спонсор: {project.sponsor}</span>}
            {project.manager && <span>Менеджер: {project.manager}</span>}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
          >
            Закрыть
          </button>
        )}
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3">
        <MetricBlock title="План БКВ 2026" value={`${formatMoney(project.plan2026.total)} ₸`} subtitle={`Оборуд ${formatMoney(project.plan2026.equipment)} · СМР ${formatMoney(project.plan2026.smr)}`} />
        <MetricBlock title="План за период" value={`${formatMoney(month.plan)} ₸`} subtitle={`Оборуд ${formatMoney(month.equipmentPlan)} · СМР ${formatMoney(month.smrPlan)}`} />
        <MetricBlock title="Факт за период" value={`${formatMoney(month.fact)} ₸`} subtitle={`Оборуд ${formatMoney(month.equipmentFact)} · СМР ${formatMoney(month.smrFact)}`} accent />
      </div>

      <div className="border-t border-slate-100 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Помесячная детализация</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2 pr-4">Период</th>
                <th className="pb-2 pr-4">План</th>
                <th className="pb-2 pr-4">Факт</th>
                <th className="pb-2 pr-4">Оборуд план/факт</th>
                <th className="pb-2">СМР план/факт</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(project.months).map(([key, block]) => {
                const exec = block.plan.total > 0 ? (block.fact.total / block.plan.total) * 100 : 0;
                return (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-medium">{block.label}</td>
                    <td className="py-2 pr-4">{formatMoney(block.plan.total)} ₸</td>
                    <td className={`py-2 pr-4 font-semibold ${executionColor(exec)}`}>{formatMoney(block.fact.total)} ₸</td>
                    <td className="py-2 pr-4">{formatMoney(block.plan.equipment)} / {formatMoney(block.fact.equipment)}</td>
                    <td className="py-2">{formatMoney(block.plan.smr)} / {formatMoney(block.fact.smr)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {project.details?.length > 0 && (
        <div className="border-t border-slate-100 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Структура затрат</h3>
          <div className="space-y-2">
            {project.details.map((line) => {
              const lineMonth = getMonthValues(line, monthKey);
              return (
                <div
                  key={line.id}
                  className="flex flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
                  style={{ marginLeft: `${line.detailLevel * 12}px` }}
                >
                  <span className="font-medium text-slate-700">{line.name}</span>
                  <span className="text-slate-500">
                    План: {formatMoney(lineMonth.plan)} ₸ · Факт: {formatMoney(lineMonth.fact)} ₸
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {project.notes && (
        <div className="border-t border-slate-100 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Примечания</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.notes}</p>
        </div>
      )}
    </div>
  );
}

function MetricBlock({ title, value, subtitle, accent = false }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? "text-[#1e6fd9]" : "text-slate-900"}`}>{value}</div>
      {subtitle && <div className="mt-1 text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}
