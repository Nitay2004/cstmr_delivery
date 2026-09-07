"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: Record<string, boolean>;
}

interface UserContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.user) setUser(data.user);
        else if (active) setUser(null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  return (
    <UserContext.Provider
      value={{ user, loading, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export function can(user: AuthUser | null | undefined, permission: string) {
  return Boolean(user?.permissions?.[permission]);
}