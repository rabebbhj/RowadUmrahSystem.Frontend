import { useEffect, useState } from "react";
import { getPackagesByDate } from "../services/travelers.service";
import type { DateTravelPackage } from "../types/travelers";

export function useDatePackages(dateId: string, onUnauthorized: () => void) {
  const [items, setItems] = useState<DateTravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const packages = await getPackagesByDate(dateId);
        if (!cancelled) setItems(packages);
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
  }, [dateId, onUnauthorized, refreshToken]);

  return { items, loading, error, retry: () => setRefreshToken((value) => value + 1) };
}

