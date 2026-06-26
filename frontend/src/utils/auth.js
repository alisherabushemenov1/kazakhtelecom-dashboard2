const TOKEN_KEY = "kt_dashboard_token";
const USER_KEY = "kt_dashboard_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  let data = {};
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(response.status === 502 || response.status === 503
        ? "Сервер недоступен. Запустите backend: python -m app.main"
        : "Ошибка сервера");
    }
  }

  if (!response.ok) {
    let message = data.detail || data.error || "Ошибка запроса";
    if (Array.isArray(message)) {
      message = message.map((item) => item.msg || item).join(", ");
    }
    throw new Error(message);
  }
  return data;
}

export async function registerUser(payload) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function loginUser(payload) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function fetchMe() {
  return apiFetch("/api/auth/me");
}
