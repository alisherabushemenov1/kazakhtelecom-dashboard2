const PAGES = [
  { id: "overview", label: "Обзор" },
  { id: "projects", label: "Проекты" },
  { id: "regions", label: "По областям" },
  { id: "sponsors", label: "По спонсорам" },
  { id: "detail", label: "Детализация" }
];

export default function Header({ live, updatedAt, activePage, onNavigate, user, onLogout, reportTitle, onRefresh }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Kazakhtelecom" className="h-12 w-auto object-contain" />
          <div>
            <div className="text-sm font-bold tracking-wide text-slate-900">KAZAKHTELECOM</div>
            <div className="text-xs font-semibold uppercase text-[#1e6fd9]">Project Management</div>
            <div className="text-xs text-slate-400">{reportTitle || "Ход реализации проектов"}</div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-4 lg:gap-5">
          {PAGES.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onNavigate(page.id)}
              className={`border-b-2 pb-1 text-sm font-medium transition ${
                activePage === page.id
                  ? "border-[#1e6fd9] text-[#1e6fd9]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {page.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className={`live-dot h-2 w-2 rounded-full bg-emerald-500 ${live ? "" : "opacity-30"}`} />
            {live ? "LIVE" : "OFFLINE"}
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Обновить
            </button>
          )}
          {user && (
            <div className="hidden text-right md:block">
              <div className="text-sm font-medium text-slate-800">{user.fullName}</div>
              <div className="text-xs text-slate-400">{user.phone}</div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Выйти
          </button>
          {updatedAt && (
            <span className="text-xs text-slate-400">
              {new Date(updatedAt).toLocaleString("ru-RU")}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
