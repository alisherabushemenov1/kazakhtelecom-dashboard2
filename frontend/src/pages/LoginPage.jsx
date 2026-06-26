import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthField, AuthLayout, authInputClass } from "../components/AuthLayout";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Вход" subtitle="Kazakhtelecom Project Management">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="Email">
          <input type="email" className={authInputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </AuthField>
        <AuthField label="Пароль">
          <input type="password" className={authInputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </AuthField>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#1e6fd9] py-3 text-sm font-semibold text-white hover:bg-[#185bb5] disabled:opacity-60">
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Нет аккаунта?{" "}
        <Link to="/register" className="font-medium text-[#1e6fd9] hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </AuthLayout>
  );
}
