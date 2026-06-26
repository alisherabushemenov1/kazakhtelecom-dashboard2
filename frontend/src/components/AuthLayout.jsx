export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="Kazakhtelecom Project Management" className="mx-auto mb-4 h-24 object-contain" />
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0d3b7a]">Kazakhtelecom</div>
          <div className="text-sm font-medium text-[#1e6fd9]">Project Management</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#1e6fd9] focus:ring-2 focus:ring-[#1e6fd9]/20";
