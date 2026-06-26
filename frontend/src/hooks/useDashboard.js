import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "../utils/auth";

const POLL_MS = 8000;
const FETCH_TIMEOUT_MS = 30000;

async function apiGet(path) {
  const token = getToken();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache"
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (res.status === 503) {
      const body = await res.json().catch(() => ({}));
      const err = new Error(body.detail || "Данные загружаются...");
      err.retryable = true;
      throw err;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || "Не удалось загрузить данные");
    }

    return res.json();
  } finally {
    window.clearTimeout(timer);
  }
}

export function useDashboard(enabled) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const hashRef = useRef(null);
  const busyRef = useRef(false);

  const loadFull = useCallback(async () => {
    const json = await apiGet("/api/dashboard");
    hashRef.current = json.contentHash ?? null;
    setData(json);
    setLoading(false);
    setError(null);
    setLive(true);
    return json;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    async function refresh() {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        if (!hashRef.current) {
          await loadFull();
          return;
        }

        const sync = await apiGet("/api/dashboard/sync");
        if (cancelled) return;

        if (sync.contentHash && sync.contentHash !== hashRef.current) {
          await loadFull();
        } else {
          setLive(true);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (err.retryable) {
          setLive(false);
          setLoading(true);
          setError(null);
          return;
        }
        setError(err.name === "AbortError" ? "Сервер не отвечает. Проверьте, что backend запущен." : err.message);
        setLoading(false);
        setLive(false);
      } finally {
        busyRef.current = false;
      }
    }

    refresh();
    const pollId = window.setInterval(refresh, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [enabled, loadFull]);

  return { data, loading, error, live, reload: loadFull };
}
