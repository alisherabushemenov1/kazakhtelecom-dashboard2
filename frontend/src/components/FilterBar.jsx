import { DEFAULT_FILTERS } from "../utils/filters";

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#1e6fd9]";
const selectClass = inputClass;

export default function FilterBar({ filters, onChange, meta, showMonth = true, showAmount = true }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <input
          type="search"
          placeholder="Поиск: проект, область, СПП, спонсор..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className={`${inputClass} w-full xl:max-w-md`}
        />
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
          className="self-start rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Сбросить фильтры
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        <select value={filters.type} onChange={(e) => update("type", e.target.value)} className={selectClass}>
          <option value="">Все типы</option>
          {meta.types.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>

        <select value={filters.region} onChange={(e) => update("region", e.target.value)} className={selectClass}>
          <option value="">Все области</option>
          {meta.regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>

        <select value={filters.sponsor} onChange={(e) => update("sponsor", e.target.value)} className={selectClass}>
          <option value="">Все спонсоры</option>
          {meta.sponsors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={filters.manager} onChange={(e) => update("manager", e.target.value)} className={selectClass}>
          <option value="">Все менеджеры</option>
          {meta.managers.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {showMonth && (
          <select value={filters.month} onChange={(e) => update("month", e.target.value)} className={selectClass}>
            {(meta.allMonths || meta.months).map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        )}

        {showAmount && (
          <>
            <input
              type="number"
              placeholder="Сумма от, ₸"
              value={filters.amountFrom}
              onChange={(e) => update("amountFrom", e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              placeholder="Сумма до, ₸"
              value={filters.amountTo}
              onChange={(e) => update("amountTo", e.target.value)}
              className={inputClass}
            />
          </>
        )}
      </div>
    </div>
  );
}
