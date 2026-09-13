"use client";

import { motion } from "framer-motion";
import { Table, CreditCard, QrCode, ChefHat, Monitor, BarChart3, ArrowRight, Coffee } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

import { useSettings } from "@/context/SettingsContext";

const features = [
  {
    icon: Table,
    title: "Table Management",
    description: "Efficient table-based ordering with interactive floor and table views for seamless restaurant operations."
  },
  {
    icon: CreditCard,
    title: "Fast Checkout",
    description: "Quick billing and checkout process supporting multiple payment methods for faster service."
  },
  {
    icon: QrCode,
    title: "UPI QR Payments",
    description: "Modern QR-based UPI payments integrated with digital wallet systems for contactless transactions."
  },
  {
    icon: ChefHat,
    title: "Kitchen Order Tracking",
    description: "Real-time Kitchen Display System (KDS) for instant order updates and efficient kitchen management."
  },
  {
    icon: Monitor,
    title: "Customer Display",
    description: "Customer-facing displays showing order status and payment information for better customer experience."
  },
  {
    icon: BarChart3,
    title: "Sales Reports & Dashboard",
    description: "Comprehensive analytics with session-based reporting and export options for business insights."
  }
];

export default function Home() {
  const { cafeName } = useSettings();

  return (
    <div className="min-h-screen bg-[#FCF9F2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3E2B21]/60 via-[#3E2B21]/30 to-[#FCF9F2]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-10">
              <div className="h-28 w-28 rounded-[32px] bg-[#3E2B21] flex items-center justify-center shadow-[0_25px_60px_rgba(62,43,33,0.4)] rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image src="/odoo_cafe_logo.png" alt="logo" width={100} height={100} className="object-contain brightness-0 invert" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-6 text-white tracking-tight font-serif">
              {cafeName}
              <span className="block text-2xl lg:text-3xl font-medium mt-3 text-white/80 font-sans">Smart POS System</span>
            </h1>

            <p className="text-lg lg:text-xl text-white/70 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Experience the perfect blend of modern technology and artisanal coffee culture. Order, pay, and enjoy with our seamless POS system.
            </p>

            <Link href="/login">
              <Button size="lg" className="bg-white hover:bg-[#FCF9F2] text-[#3E2B21] px-10 py-6 text-lg font-bold rounded-full shadow-[0_15px_40px_rgba(62,43,33,0.3)] hover:shadow-[0_20px_50px_rgba(62,43,33,0.4)] transition-all duration-300 transform hover:-translate-y-1">
                Start Ordering
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#F3EDE5] text-[#3E2B21] text-sm font-semibold border border-[#EBE4D5] mb-6">
              <Coffee className="h-4 w-4" /> Crafted for Excellence
            </div>
            <h2 className="text-3xl lg:text-5xl font-black text-[#3E2B21] mb-5 font-serif tracking-tight">
              Everything your cafe needs
            </h2>
            <p className="text-lg text-[#3E2B21]/60 max-w-2xl mx-auto font-medium">
              Designed to provide the smoothest experience for both your baristas and your beloved customers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[28px] shadow-[0_4px_20px_rgba(62,43,33,0.02)] hover:shadow-[0_12px_40px_rgba(62,43,33,0.08)] transition-all duration-300 border border-[#EBE4D5]/60 group"
              >
                <div className="h-12 w-12 rounded-[16px] bg-[#F3EDE5] flex items-center justify-center mb-6 group-hover:bg-[#3E2B21] group-hover:text-white transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-[#6B4423] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-black text-[#3E2B21] mb-3">{feature.title}</h3>
                <p className="text-[#3E2B21]/50 leading-relaxed font-medium text-[15px]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-24 bg-[#3E2B21] mx-4 lg:mx-8 rounded-[40px] relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-black mb-6 text-white font-serif tracking-tight">
              Join the {cafeName} Family
            </h2>
            <p className="text-lg lg:text-xl text-white/60 mb-12 max-w-2xl mx-auto font-medium">
              Ready to elevate your coffee experience? Sign in to manage your orders efficiently.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-white text-[#3E2B21] hover:bg-[#FCF9F2] px-10 py-5 text-lg font-bold rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:shadow-xl transition-all duration-300">
                Log In to POS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
