import { useEffect, useState } from "react";
import { getTravelersByPackage } from "../services/travelers.service";
import type { PackageTraveler } from "../types/travelers";

export function usePackageTravelers(dateId: string, packageId: string, onUnauthorized: () => void) {
  const [items, setItems] = useState<PackageTraveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const travelers = await getTravelersByPackage(dateId, packageId);
        if (!cancelled) setItems(travelers);
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
  }, [dateId, onUnauthorized, packageId, refreshToken]);

  return { items, loading, error, retry: () => setRefreshToken((value) => value + 1) };
}

