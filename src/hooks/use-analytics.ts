"use client";
import { useEffect, useState } from "react";
import { analyticsApi } from "../services/workspace";
import { useApp } from "../stores/app-store";
export function useAnalytics(id: string, days?: number) {
  const { db } = useApp();
  const baseline = db.analytics?.[id];
  const [state, setState] = useState(baseline);
  useEffect(() => {
    let active = true;
    analyticsApi(id, days || baseline?.days || 7)
      .then((result) => {
        if (active) setState(result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id, days, baseline]);
  return state || baseline;
}
