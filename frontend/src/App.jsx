import { Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import { useDashboard } from "./hooks/useDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OverviewPage from "./pages/OverviewPage";
import ProjectsPage from "./pages/ProjectsPage";
import RegionsPage from "./pages/RegionsPage";
import SponsorsPage from "./pages/SponsorsPage";
import DetailPage from "./pages/DetailPage";

const PAGES = {
  overview: OverviewPage,
  projects: ProjectsPage,
  regions: RegionsPage,
  sponsors: SponsorsPage,
  detail: DetailPage
};

function DashboardApp() {
  const { user, logout } = useAuth();
  const { data, loading, error, live, reload } = useDashboard(true);
  const [page, setPage] = useState("overview");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7]">
        <div className="text-center">
          <img src="/logo.png" alt="" className="mx-auto mb-4 h-16 object-contain opacity-90" />
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#1e6fd9] border-t-transparent" />
          <p className="text-slate-500">Загрузка данных из Google Sheets...</p>
          <p className="mt-2 text-xs text-slate-400">Первый запуск может занять до 30 секунд</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-6">
        <div className="card max-w-lg p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-600">Ошибка загрузки</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const PageComponent = PAGES[page] || OverviewPage;

  return (
    <div className="min-h-screen bg-[#eef2f7]">
      <Header
        live={live}
        updatedAt={data.updatedAt}
        activePage={page}
        onNavigate={setPage}
        user={user}
        onLogout={logout}
        reportTitle={data.reportTitle}
        onRefresh={reload}
      />

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        <PageComponent data={data} onNavigate={setPage} />
      </main>    </div>
  );
}

function LoadingScreen({ message = "Загрузка..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#1e6fd9] border-t-transparent" />
      <p className="sr-only">{message}</p>
    </div>
  );
}

function ProtectedDashboard() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen message="Проверка входа" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardApp />;
}

function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen message="Проверка входа" />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/*" element={<ProtectedDashboard />} />
    </Routes>
  );
}
