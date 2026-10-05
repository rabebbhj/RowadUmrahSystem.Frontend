import { useEffect, useState } from "react";
import { getTravelDates } from "../services/travelers.service";
import type { TravelDate } from "../types/travelers";

export function useTravelDates(onUnauthorized: () => void) {
  const [items, setItems] = useState<TravelDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const dates = await getTravelDates();
        if (!cancelled) setItems(dates);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          onUnauthorized();
          return;
        }
        setError(error instanceof Error ? error.message : "تعذر تحميل البيانات، يرجى المحاولة مرة أخرى.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [onUnauthorized, refreshToken]);

  return { items, loading, error, retry: () => setRefreshToken((value) => value + 1) };
}

