"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { apiRoot } from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import type { SubscriptionStatus } from "@/types";

interface SubscriptionContextValue extends SubscriptionStatus {
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

const DEFAULT_STATE: SubscriptionStatus = {
  hasAccess: false,
  status: "None",
  currentPeriodEnd: null,
};

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<SubscriptionStatus>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!user) {
      setState(DEFAULT_STATE);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiRoot.get("/payments/status");
      const s = data.data ?? data;
      setState({
        hasAccess: Boolean(s.hasAccess),
        status: s.status ?? "None",
        currentPeriodEnd: s.currentPeriodEnd ?? null,
        planId: s.planId,
      });
    } catch {
      setState(DEFAULT_STATE);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      refreshStatus();
    } else if (!authLoading && !user) {
      setState(DEFAULT_STATE);
    }
  }, [authLoading, user, refreshStatus]);

  return (
    <SubscriptionContext.Provider value={{ ...state, loading, refreshStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error("useSubscription must be used within <SubscriptionProvider>");
  }
  return ctx;
}
