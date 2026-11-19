"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  plan: "FREE" | "PRO";
  creditsUsed: number;
  creditsTotal: number;
  creditPacks: number;
  resetDate: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email?: string, name?: string) => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const DEFAULT_USER: User = {
  id: "usr_devran_01",
  name: "Devran Tukan",
  email: "devrantukan@gmail.com",
  avatarUrl: "/tukan-logo.png",
  plan: "FREE",
  creditsUsed: 80,
  creditsTotal: 120,
  creditPacks: 0,
  resetDate: "Dec 1",
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  isLoginModalOpen: false,
  openLoginModal: () => {},
  closeLoginModal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load user from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("tukanft_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read auth state from localStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (email?: string, name?: string) => {
    const newUser: User = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email,
      name: name || (email ? email.split("@")[0] : DEFAULT_USER.name),
    };
    setUser(newUser);
    try {
      localStorage.setItem("tukanft_user", JSON.stringify(newUser));
    } catch (e) {}
    setIsLoginModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("tukanft_user");
    } catch (e) {}
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
