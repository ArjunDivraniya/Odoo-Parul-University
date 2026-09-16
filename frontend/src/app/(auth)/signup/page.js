"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Coffee, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

import { useSettings } from "@/context/SettingsContext";

export default function SignupPage() {
  const { signup, isLoading, error } = useAuthStore();
  const { cafeName } = useSettings();
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    const success = await signup(data);
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FCF9F2]">

      {/* ✅ Left Side - Signup Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-[#FCF9F2]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8 bg-white p-10 rounded-[32px] shadow-[0_15px_50px_rgba(62,43,33,0.06)] border border-[#EBE4D5]/60"
        >
          {/* Heading */}
          <div className="text-center">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="h-14 w-14 rounded-[18px] bg-[#3E2B21] flex items-center justify-center shadow-md">
                <Coffee className="h-7 w-7 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[#3E2B21] font-serif">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-[#3E2B21]/40 font-medium">
              Join {cafeName ? cafeName : "us"} today.
            </p>

            {error && (
              <div className="mt-3 px-4 py-3 rounded-[14px] bg-red-50 border border-red-100">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Shop Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2 ml-1">
                Shop Name
              </label>
              <Input
                {...register("shopName")}
                placeholder="Priy Cafe"
                className="h-14 rounded-[18px] border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/25"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2 ml-1">
                  First Name
                </label>
                <Input
                  {...register("firstName")}
                  placeholder="Jane"
                  className="h-14 rounded-[18px] border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/25"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2 ml-1">
                  Last Name
                </label>
                <Input
                  {...register("lastName")}
                  placeholder="Doe"
                  className="h-14 rounded-[18px] border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/25"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2 ml-1">
                Email address
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder="barista@odoocafe.com"
                className="h-14 rounded-[18px] border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/25"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#3E2B21]/40 tracking-wider uppercase mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-14 rounded-[18px] border-[#EBE4D5] focus:border-[#3E2B21]/30 focus:ring-[#3E2B21]/10 bg-[#FDFCF7] text-sm font-medium text-[#3E2B21] placeholder:text-[#3E2B21]/25 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-[#F5EFE6] flex items-center justify-center transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-[#3E2B21]/40" />
                  ) : (
                    <Eye className="h-4 w-4 text-[#3E2B21]/40" />
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-[18px] bg-[#3E2B21] hover:bg-[#2C1810] text-white shadow-[0_8px_25px_rgba(62,43,33,0.2)] hover:shadow-[0_12px_35px_rgba(62,43,33,0.3)] transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                "Creating Account..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Get Started <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#3E2B21]/40 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#3E2B21] hover:text-[#2C1810] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ✅ Right Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden px-16 py-20 bg-[#3E2B21]">
        {/* Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-15"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#3E2B21] via-[#3E2B21]/60 to-transparent"></div>

        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <span className="absolute -left-16 top-1/4 h-48 w-48 rounded-full bg-[#A87B51]/20 blur-[120px]" />
          <span className="absolute right-10 top-10 h-32 w-32 rounded-full bg-[#D4A574]/15 blur-[90px]" />
        </div>

        <div className="relative z-10 max-w-xl text-white space-y-10 ml-auto text-right pr-16 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex justify-end"
          >
            <div className="h-20 w-20 rounded-[24px] bg-white flex items-center justify-center shadow-2xl border border-white/80 p-2.5 overflow-hidden">
              <Image
                src="/the_coffee_concept_logo.png"
                alt="logo"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          <h2 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white font-serif">
            Join the
            <span className="block text-[#D4A574]">
              Cafe Revolution.
            </span>
          </h2>

          <p className="text-lg text-white/60 leading-relaxed max-w-md ml-auto font-medium">
            Start managing your café with the workflow that feels as good as your coffee tastes —
            <span className="font-semibold text-white/80">
              {" "}smooth, modern, and powerful.
            </span>
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/10 text-sm text-white/70 font-medium ml-auto">
            <Coffee className="h-4 w-4" /> Built for cafés & restaurants worldwide
          </div>
        </div>
      </div>
    </div>
  );
}
