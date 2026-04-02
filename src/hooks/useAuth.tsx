//  src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";
import { UserProfile } from "../types";

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lifeos_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.me()
      .then((user: UserProfile) => setProfile({ ...user, id: String(user.id) }))
      .catch(() => localStorage.removeItem("lifeos_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem("lifeos_token", token);
    setProfile({ ...user, id: String(user.id) });
  };

  const logout = () => {
    localStorage.removeItem("lifeos_token");
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);