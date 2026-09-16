"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, Eye, EyeOff, Sparkles, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

import { useSettings } from "@/context/SettingsContext";

export default function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const { cafeName } = useSettings();
  const router = useRouter();
  const { register, handleSubmit, setValue } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSuccess = (user) => {
    if (!user) return;
    switch (user.role) {
      case 'KITCHEN': router.push("/kitchen"); break;
      case 'EMPLOYEE':
      case 'CASHIER': router.push("/pos/session"); break;
      case 'ADMIN':
      default: router.push("/dashboard"); break;
    }
  };

  const onSubmit = async (data) => {
    const user = await login(data.email, data.password);
    if (user) handleLoginSuccess(user);
  };

  const handleQuickLogin = async (role) => {
    let email = "";
    let password = "123456789";
    if (role === "admin") email = "arjundivraniya8@gmail.com";
    if (role === "kitchen") email = "s2@gmail.com";
    if (role === "employee" || role === "cashier") email = "s1@gmail.com";
    setValue("email", email);
    setValue("password", password);
    const user = await login(email, password);
    if (user) handleLoginSuccess(user);
  };

  return (
    <div className="flex min-h-screen w-full">

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  LEFT — CINEMATIC BRANDING PANEL                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#2A1A10]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop')`, opacity: 0.25 }}
        />

        {/* Multi-layer gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A1A10]/95 via-[#3E2B21]/70 to-[#2A1A10]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F08] via-transparent to-transparent opacity-60" />

        {/* Warm glow orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-20 top-[20%] h-[400px] w-[400px] rounded-full bg-[#A87B51]/12 blur-[150px]" />
          <div className="absolute right-[10%] top-[10%] h-[250px] w-[250px] rounded-full bg-[#D4A574]/8 blur-[120px]" />
          <div className="absolute left-[30%] bottom-[5%] h-[350px] w-[350px] rounded-full bg-[#6B4423]/15 blur-[140px]" />
        </div>

        {/* Subtle grain texture via CSS */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`}} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 lg:p-20 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="h-16 w-16 rounded-[20px] bg-white flex items-center justify-center border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-2 overflow-hidden">
              <Image src="/the_coffee_concept_logo.png" alt="logo" width={52} height={52} className="object-contain" priority />
            </div>
          </motion.div>

          {/* Main copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="space-y-8 max-w-lg"
          >
            <div className="space-y-6">
              <h1 className="text-[56px] lg:text-[64px] font-black leading-[1.05] tracking-[-0.02em] text-white">
                Brewing
                <br />
                <span className="bg-gradient-to-r from-[#D4A574] via-[#E8C4A0] to-[#D4A574] bg-clip-text text-transparent">
                  Success.
                </span>
              </h1>
              <p className="text-white/40 text-lg leading-relaxed font-medium max-w-sm">
                The premium point-of-sale built for modern cafés — efficient, beautiful, and powerful.
              </p>
            </div>

            {/* Social proof bar */}
            <div className="flex items-center gap-5">
              <div className="flex -space-x-2.5">
                {["☕", "🧑‍🍳", "💼", "🎯"].map((emoji, i) => (
                  <div key={i} className="h-9 w-9 rounded-full bg-white/[0.08] border-2 border-[#2A1A10] flex items-center justify-center text-sm backdrop-blur-sm">
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="h-8 w-px bg-white/10" />
              <p className="text-white/30 text-sm font-medium">
                Trusted by <span className="text-white/60 font-bold">500+</span> cafés
              </p>
            </div>
          </motion.div>

          {/* Bottom tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center gap-3 text-white/40 text-sm font-medium"
          >
            <Coffee className="h-4 w-4 text-[#D4A574]" />
            <span>{cafeName ? `${cafeName} POS · Built for excellence` : "Smart POS · Built for excellence"}</span>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  RIGHT — LOGIN FORM                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex w-full lg:w-[45%] items-center justify-center p-6 sm:p-10 bg-[#FAF7F2]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-[420px] space-y-0"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <div className="h-16 w-16 rounded-[20px] bg-[#3E2B21] flex items-center justify-center shadow-[0_8px_30px_rgba(62,43,33,0.3)]">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[32px] font-black tracking-tight text-[#2A1A10]"
            >
              Welcome back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-2 text-[15px] text-[#2A1A10]/35 font-medium"
            >
              Sign in to your dashboard
            </motion.p>
          </div>

          {/* Quick Demo Access */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2A1A10]/10 to-transparent" />
              <span className="text-[10px] font-bold text-[#2A1A10]/25 tracking-[0.2em] uppercase">Quick Demo</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2A1A10]/10 to-transparent" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { role: "admin", emoji: "👑", label: "Admin", color: "from-[#F5EFE6] to-[#EDE4D4]" },
                { role: "kitchen", emoji: "👨‍🍳", label: "Kitchen", color: "from-[#F5EFE6] to-[#EDE4D4]" },
                { role: "employee", emoji: "💼", label: "Employee", color: "from-[#F5EFE6] to-[#EDE4D4]" },
              ].map(({ role, emoji, label, color }) => (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  className={`group relative overflow-hidden p-3.5 bg-gradient-to-b ${color} rounded-[16px] text-[13px] font-bold text-[#2A1A10]/70 transition-all duration-300 border border-[#2A1A10]/[0.04] hover:border-[#2A1A10]/10 hover:shadow-[0_8px_25px_rgba(42,26,16,0.06)] hover:-translate-y-0.5 active:translate-y-0`}
                >
                  <span className="flex flex-col items-center gap-1.5">
                    <span className="text-lg group-hover:scale-110 transition-transform duration-300">{emoji}</span>
                    <span>{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3.5 rounded-[16px] bg-red-50/80 border border-red-100/60 backdrop-blur-sm">
              <p className="text-sm text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[11px] font-bold text-[#2A1A10]/30 tracking-[0.15em] uppercase ml-1">
                <Mail className="h-3 w-3" /> Email
              </label>
              <div className="relative group">
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="arjundivraniya8@gmail.com"
                  className="h-[54px] rounded-[16px] border-[#2A1A10]/[0.06] bg-white focus:border-[#2A1A10]/15 focus:ring-2 focus:ring-[#2A1A10]/[0.04] text-[15px] font-medium text-[#2A1A10] placeholder:text-[#2A1A10]/20 shadow-[0_2px_8px_rgba(42,26,16,0.02)] transition-all duration-200 group-hover:border-[#2A1A10]/10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[11px] font-bold text-[#2A1A10]/30 tracking-[0.15em] uppercase ml-1">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-bold text-[#2A1A10]/30 hover:text-[#2A1A10]/60 transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-[54px] rounded-[16px] border-[#2A1A10]/[0.06] bg-white focus:border-[#2A1A10]/15 focus:ring-2 focus:ring-[#2A1A10]/[0.04] text-[15px] font-medium text-[#2A1A10] placeholder:text-[#2A1A10]/20 pr-14 shadow-[0_2px_8px_rgba(42,26,16,0.02)] transition-all duration-200 group-hover:border-[#2A1A10]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-[12px] hover:bg-[#2A1A10]/[0.04] flex items-center justify-center transition-all"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px] text-[#2A1A10]/25" />
                  ) : (
                    <Eye className="h-[18px] w-[18px] text-[#2A1A10]/25" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full h-[54px] text-[16px] font-bold rounded-[16px] bg-[#2A1A10] hover:bg-[#1A0F08] text-white shadow-[0_4px_20px_rgba(42,26,16,0.25)] hover:shadow-[0_8px_30px_rgba(42,26,16,0.35)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5">
                    Sign In <ArrowRight className="h-[18px] w-[18px]" />
                  </span>
                )}
              </Button>
            </div>
          </motion.form>

          {/* Divider */}
          <div className="pt-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2A1A10]/8 to-transparent" />
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[14px] text-[#2A1A10]/30 font-medium pt-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#2A1A10]/70 hover:text-[#2A1A10] transition-colors underline decoration-[#2A1A10]/15 underline-offset-2 hover:decoration-[#2A1A10]/40"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
