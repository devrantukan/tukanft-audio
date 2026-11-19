"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email.trim() || undefined);
  };

  const handleDemoLogin = () => {
    login("devrantukan@gmail.com", "Devran Tukan");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 border border-slate-800 mb-3 shadow-inner">
            <Image
              src="/tukan-logo.png"
              alt="Tukanft Logo"
              width={34}
              height={34}
              className="rounded-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Tukanft</span>
            <span className="text-xs uppercase font-extrabold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
              audio
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp
              ? "Create your Tukanft Audio account"
              : "Sign in to save scores and access monthly conversion credits"}
          </p>
        </div>

        {/* Quick Demo Login Option */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-rose-900/40"
        >
          <div className="relative w-5 h-5 rounded-full overflow-hidden ring-1 ring-white/50">
            <Image
              src="/tukan-logo.png"
              alt="Wise Toucan"
              fill
              className="object-cover"
            />
          </div>
          <span>Continue as Devran Tukan (1-Click)</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[11px] uppercase font-bold text-slate-500">
            Or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-medium text-xs transition"
          >
            {isSignUp ? "Create Free Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle sign in / sign up */}
        <div className="mt-5 text-center text-xs text-slate-500">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2 ml-1"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-rose-400 hover:text-rose-300 font-medium underline underline-offset-2 ml-1"
              >
                Sign up free
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
