import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatMoney, formatPct } from "../utils/format";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-lg">
      <div className="mb-2 font-semibold">{label}</div>
      {payload.map((item) => (
        <div key={item.name} className="flex justify-between gap-6">
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-medium">{formatMoney(item.value)} ₸</span>
        </div>
      ))}
    </div>
  );
}

export default function ChartsSection({ chartMonths, sponsorStats }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="card p-5">
        <div className="mb-1 text-lg font-semibold text-slate-800">План / факт по периодам</div>
        <div className="mb-4 text-sm text-slate-500">Бюджет освоения по месяцам, тенге</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartMonths} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="plan" name="План" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="fact" name="Факт" fill="#1e6fd9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-1 text-lg font-semibold text-slate-800">Исполнение по спонсорам</div>
        <div className="mb-4 text-sm text-slate-500">Январь–май, % от плана</div>
        <div className="space-y-4">
          {sponsorStats?.slice(0, 6).map((item) => (
            <div key={item.sponsor}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{item.sponsor}</span>
                <span className="text-slate-500">
                  {formatMoney(item.ytdFact)} / {formatMoney(item.ytdPlan)} ₸
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-[#1e6fd9]"
                  style={{ width: `${Math.min(item.execution, 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {item.projects} проектов · {formatPct(item.execution)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
