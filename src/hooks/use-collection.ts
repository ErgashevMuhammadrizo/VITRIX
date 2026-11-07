"use client";
import { useEffect, useState } from "react";
import { collectionApi } from "../services/workspace";
import { useApp } from "../stores/app-store";
export function useCollection<T>(
  entity: "products" | "categories" | "users" | "businesses",
  params: Record<string, string | number>,
) {
  const { mergeCollection, dataRevision, user } = useApp();
  const key = JSON.stringify(params);
  const [state, setState] = useState<{
    items: T[];
    total: number;
    loading: boolean;
    error: string;
  }>({ items: [], total: 0, loading: true, error: "" });
  // Refresh on acknowledged record revisions, not on unrelated app renders.
  const version = dataRevision;
  useEffect(() => {
    let active = true;
    if (!user) return;
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      collectionApi<T>(entity, JSON.parse(key))
        .then((result) => {
          if (!active) return;
          setState({
            items: result.items,
            total: result.pagination.total,
            loading: false,
            error: "",
          });
          mergeCollection(entity, result.items);
        })
        .catch((e) => {
          if (active)
            setState((s) => ({ ...s, loading: false, error: e.message }));
        });
    }, 180);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // mergeCollection is a store action; key and revision changes define the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, key, user?.id, version]);
  return state;
}
