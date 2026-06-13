"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSuccess = (user) => {
    if (!user) return;

    switch (user.role) {
      case 'KITCHEN':
        router.push("/kitchen");
        break;
      case 'CASHIER':
        router.push("/pos/session");
        break;
      case 'ADMIN':
      default:
        router.push("/dashboard");
        break;
    }
  };

  const onSubmit = async (data) => {
    const user = await login(data.email, data.password);
    if (user) {
      handleLoginSuccess(user);
    }
  };

  const handleQuickLogin = async (role) => {
    let email = "";
    let password = "password123";

    if (role === "admin") email = "admin@odoo-cafe.com";
    if (role === "kitchen") email = "gordon@odoo-cafe.com";
    if (role === "cashier") email = "jagjeet@odoo-cafe.com";

    const user = await login(email, password);
    if (user) handleLoginSuccess(user);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#FBFBF2]">

      {/* ✅ Left Side - Premium Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden px-16 py-20
        bg-[#1A4D2E]"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop')]
          bg-cover bg-center opacity-20"
        ></div>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A4D2E] via-[#1A4D2E]/50 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 max-w-xl text-[#FEFCE8] space-y-10">

          {/* Logo Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
          >
            <div className="h-24 w-24 rounded-3xl bg-[#FEFCE8]/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-[#FEFCE8]/20">
              <Image
                src="/odoo_cafe_logo.png"
                alt="logo"
                width={82}
                height={82}
                className="object-contain brightness-0 invert"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <h2 className="text-6xl font-extrabold leading-[1.1] tracking-tight text-[#FEFCE8]">
            Brewing Success,
            <span className="block text-[#4ADE80]">
              One Cup at a Time.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-[#E8F5E9] leading-relaxed max-w-md opacity-90">
            The premium point-of-sale system designed for modern cafés —
            <span className="font-semibold text-[#FEFCE8]">
              {" "}
              efficient, beautiful, and powerful.
            </span>
          </p>

          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FEFCE8]/10 border border-[#FEFCE8]/20 text-sm text-[#E8F5E9]">
            ☕ Built for cafes & restaurants worldwide
          </div>
        </div>
      </div>

      {/* ✅ Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-[#FBFBF2]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-[#1A4D2E]/5 border border-[#E8F5E9]"
        >
          {/* Title */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1A4D2E]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[#5F6F65]">
              Please enter your details to sign in.
            </p>

            {/* Quick Access Grid */}
            <div className="mt-6 mb-6 p-4 bg-beige-100 rounded-2xl border border-[#E8F5E9]">
              <p className="text-xs font-bold text-[#5F6F65] uppercase mb-3">Quick Demo Access</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="p-3 bg-white hover:bg-gold-100 rounded-xl text-xs font-bold text-[#1A4D2E] shadow-sm transition-colors border border-transparent hover:border-gold-300"
                >
                  👑 Admin
                </button>
                <button
                  onClick={() => handleQuickLogin('kitchen')}
                  className="p-3 bg-white hover:bg-orange-100 rounded-xl text-xs font-bold text-orange-800 shadow-sm transition-colors border border-transparent hover:border-orange-300"
                >
                  👨‍🍳 Kitchen
                </button>
                <button
                  onClick={() => handleQuickLogin('cashier')}
                  className="p-3 bg-white hover:bg-green-100 rounded-xl text-xs font-bold text-green-800 shadow-sm transition-colors border border-transparent hover:border-green-300"
                >
                  🛒 Cashier
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-500 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="text-sm font-bold text-[#1A4D2E] ml-1">
                  Email address
                </label>
                <Input
                  {...register("email")}
                  type="email"
                  placeholder="barista@odoocafe.com"
                  className="mt-2 h-14 rounded-2xl border-gray-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E] bg-gray-50/50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-bold text-[#1A4D2E] ml-1">
                  Password
                </label>
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="mt-2 h-14 rounded-2xl border-gray-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E] bg-gray-50/50"
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1A4D2E] focus:ring-[#1A4D2E]"
                />
                <label
                  htmlFor="show-password"
                  className="text-sm text-[#5F6F65] cursor-pointer"
                >
                  Show Password
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-bold text-[#1A4D2E] hover:text-[#143d24]"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-2xl bg-[#1A4D2E] hover:bg-[#143d24] text-[#FEFCE8] shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>


          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#5F6F65]">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#1A4D2E] hover:text-[#143d24]"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
