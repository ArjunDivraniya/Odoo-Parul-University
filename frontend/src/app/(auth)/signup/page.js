"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { signup, isLoading, error } = useAuthStore();
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
    <div className="flex min-h-screen w-full bg-[#FBFBF2]">

      {/* ✅ Right Side - Signup Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-[#FBFBF2]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-[#1A4D2E]/5 border border-[#E8F5E9]"
        >
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#1A4D2E]">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-[#5F6F65]">
              Join Odoo Cafe today.
            </p>

            {error && (
              <p className="mt-3 text-sm text-red-500 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Form */}
          <form
            className="mt-8 space-y-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Shop Name */}
            <div>
              <label className="text-sm font-bold text-[#1A4D2E] ml-1">
                Shop Name
              </label>
              <Input
                {...register("shopName")}
                placeholder="Priy Cafe"
                className="mt-2 h-14 rounded-2xl border-gray-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E] bg-gray-50/50"
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-[#1A4D2E] ml-1">
                  First Name
                </label>
                <Input
                  {...register("firstName")}
                  placeholder="Jane"
                  className="mt-2 h-14 rounded-2xl border-gray-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E] bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#1A4D2E] ml-1">
                  Last Name
                </label>
                <Input
                  {...register("lastName")}
                  placeholder="Doe"
                  className="mt-2 h-14 rounded-2xl border-gray-200 focus:border-[#1A4D2E] focus:ring-[#1A4D2E] bg-gray-50/50"
                />
              </div>
            </div>

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

            {/* Show Password */}
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

            {/* Button */}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold rounded-2xl bg-[#1A4D2E] hover:bg-[#143d24] text-[#FEFCE8] shadow-lg hover:shadow-xl transition-all duration-300"
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
          <p className="text-center text-sm text-[#5F6F65]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#1A4D2E] hover:text-[#143d24]"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* ✅ Left Side - Branding Section (Fully Right Aligned) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden px-16 py-20
        bg-[#1A4D2E]"
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop')]
          bg-cover bg-center opacity-20"
        ></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A4D2E] via-[#1A4D2E]/50 to-transparent"></div>

        {/* ✅ Content Shifted to Right */}
        <div className="relative z-10 max-w-xl text-[#FEFCE8] space-y-10 ml-auto text-right pr-16">

          {/* Logo Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex justify-end"
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

          {/* Heading Right */}
          <h2 className="text-6xl font-extrabold leading-[1.1] tracking-tight text-[#FEFCE8]">
            Join the
            <span className="block text-[#4ADE80]">
              Cafe Revolution.
            </span>
          </h2>

          {/* Subtitle Right */}
          <p className="text-lg text-[#E8F5E9] leading-relaxed max-w-md ml-auto opacity-90">
            Start managing your café with the workflow that feels as good as
            your coffee tastes —
            <span className="font-semibold text-[#FEFCE8]">
              {" "}
              smooth, modern, and powerful.
            </span>
          </p>

          {/* Badge Right */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#FEFCE8]/10 border border-[#FEFCE8]/20 text-sm text-[#E8F5E9] ml-auto">
            ☕ Built for cafés & restaurants worldwide
          </div>
        </div>
      </div>
    </div>
  );
}
