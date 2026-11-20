"use client";

import React, { useState } from "react";
import StudioLayout from "@/components/StudioLayout";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function PricingPage() {
  const { t } = useLanguage();
  const { user, openLoginModal } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <StudioLayout
      activeTool="pricing"
      title={t("pricing")}
      badge="TUKANFT PRO"
    >
      <div className="flex-1 flex flex-col h-full w-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 py-4">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-600/15 text-rose-400 border border-rose-500/25 inline-block mb-3">
              FLEXIBLE PLANS FOR CREATORS & MUSICIANS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Unlock the Full Power of Tukanft Audio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Unlimited high-resolution score exports, neural optical recognition, AI audio transcription, and cloud storage.
            </p>

            {/* Billing Toggle */}
            <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  billingCycle === "monthly" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Yearly</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free Tier */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Free Starter
                </span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Essential engraving and MIDI conversion for students and hobbyists.
                </p>

                <ul className="flex flex-col gap-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ Standard MIDI to Sheet Music</li>
                  <li className="flex items-center gap-2">✓ 88-Key Virtual Piano visualizer</li>
                  <li className="flex items-center gap-2">✓ Up to 3 score conversions / day</li>
                  <li className="flex items-center gap-2">✓ Standard MusicXML export</li>
                </ul>
              </div>

              <button
                onClick={openLoginModal}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
              >
                {user ? "Current Plan" : "Get Started Free"}
              </button>
            </div>

            {/* Pro Studio Tier */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-rose-950/40 to-slate-900 border-2 border-rose-500/50 flex flex-col justify-between gap-6 relative shadow-2xl shadow-rose-600/10 scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-rose-600 text-white shadow">
                MOST POPULAR
              </div>

              <div>
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                  Pro Studio
                </span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">
                    ${billingCycle === "monthly" ? "12" : "9.60"}
                  </span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Complete professional audio & notation studio with unlimited high-res exports.
                </p>

                <ul className="flex flex-col gap-2.5 text-xs text-slate-200 font-medium">
                  <li className="flex items-center gap-2">✨ Unlimited MIDI & MusicXML exports</li>
                  <li className="flex items-center gap-2">✨ Neural Sheet Music Scanner & OMR</li>
                  <li className="flex items-center gap-2">✨ AI Audio Transcription (MP3 to MIDI)</li>
                  <li className="flex items-center gap-2">✨ AI MIDI Prompt Generator</li>
                  <li className="flex items-center gap-2">✨ Grand staff split & smart tuplets</li>
                  <li className="flex items-center gap-2">✨ Priority server processing queue</li>
                </ul>
              </div>

              <button
                onClick={openLoginModal}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30"
              >
                Upgrade to Pro Studio
              </button>
            </div>

            {/* Creator / Lifetime Pack */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between gap-6">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Credit Pack
                </span>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-extrabold text-white">$29</span>
                  <span className="text-xs text-slate-500">/ one-time</span>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  100 processing credits for on-demand transcription and large score engraving.
                </p>

                <ul className="flex flex-col gap-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">✓ 100 AI Audio / OMR Credits</li>
                  <li className="flex items-center gap-2">✓ No recurring monthly subscription</li>
                  <li className="flex items-center gap-2">✓ Credits never expire</li>
                  <li className="flex items-center gap-2">✓ Full MusicXML & MIDI download</li>
                </ul>
              </div>

              <button
                onClick={openLoginModal}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700"
              >
                Buy Credit Pack
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
