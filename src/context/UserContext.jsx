import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../api.js";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!getToken());
  // "restored" when a stored token was turned back into a session on page
  // load, "signin" when the person just logged in or registered. The cart
  // uses this to decide whether to adopt or merge.
  const [authSource, setAuthSource] = useState(null);

  // On load, turn a stored token back into a user (or discard it if expired).
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then((u) => { setAuthSource("restored"); setUser(u); })
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      register: async (name, email, password) => {
        const data = await api("/auth/register", { method: "POST", body: { name, email, password } });
        setToken(data.token);
        setAuthSource("signin");
        setUser(data.user);
        return data.user;
      },
      login: async (email, password) => {
        const data = await api("/auth/login", { method: "POST", body: { email, password } });
        setToken(data.token);
        setAuthSource("signin");
        setUser(data.user);
        return data.user;
      },
      updateName: async (name) => {
        const data = await api("/account", { method: "PATCH", body: { name } });
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout: () => {
        setToken(null);
        setAuthSource(null);
        setUser(null);
      },
      authSource,
    }),
    [user, ready, authSource]
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
