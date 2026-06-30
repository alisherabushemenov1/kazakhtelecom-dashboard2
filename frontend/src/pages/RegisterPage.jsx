import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthField, AuthLayout, authInputClass } from "../components/AuthLayout";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      await register(form.fullName, form.email, form.password, form.phone);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Регистрация" subtitle="Создайте аккаунт для доступа к дашборду">
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField label="ФИО">
          <input className={authInputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Ибраев Азамат Серикович" required />
        </AuthField>
        <AuthField label="Email">
          <input type="email" className={authInputClass} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.kz" required />
        </AuthField>
        <AuthField label="Номер телефона">
          <input type="tel" className={authInputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+7 777 000 0000" required />
        </AuthField>
        <AuthField label="Пароль">
          <input type="password" className={authInputClass} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Минимум 6 символов" minLength={6} required />
        </AuthField>
        <AuthField label="Подтвердите пароль">
          <input type="password" className={authInputClass} value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Введите пароль ещё раз" minLength={6} required />
        </AuthField>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#1e6fd9] py-3 text-sm font-semibold text-white hover:bg-[#185bb5] disabled:opacity-60">
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Уже есть аккаунт?{" "}
        <Link to="/login" className="font-medium text-[#1e6fd9] hover:underline">
          Войти
        </Link>
      </p>
    </AuthLayout>
  );
}
