"use client";

import { motion } from "framer-motion";
import { Table, CreditCard, QrCode, ChefHat, Monitor, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen bg-[#FBFBF2]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-90"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#FBFBF2]/0 to-[#FBFBF2]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-8">
              <div className="h-32 w-32 rounded-3xl bg-[#1A4D2E] flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
                <Image src="/odoo_cafe_logo.png" alt="logo" width={110} height={110} className="object-contain brightness-0 invert" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-[#1A4D2E] tracking-tight">
              Odoo Cafe
              <span className="block text-2xl lg:text-3xl font-medium mt-2 text-[#5F6F65]">Smart POS System</span>
            </h1>

            <p className="text-lg lg:text-xl text-[#5F6F65] max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience the perfect blend of modern technology and artisanal coffee culture. Order, pay, and enjoy with our seamless POS system.
            </p>

            <Link href="/login">
              <Button size="lg" className="bg-[#1A4D2E] hover:bg-[#143d24] text-[#FEFCE8] px-10 py-6 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Start Ordering
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-[#1A4D2E] mb-4">
              Crafted for Excellence
            </h2>
            <p className="text-lg text-[#5F6F65] max-w-2xl mx-auto">
              Our system is designed to provide the smoothest experience for both our baristas and our beloved customers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 border border-[#E8F5E9] group"
              >
                <div className="h-14 w-14 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-7 w-7 text-[#1A4D2E]" />
                </div>
                <h3 className="text-xl font-bold text-[#1A4D2E] mb-3">{feature.title}</h3>
                <p className="text-[#5F6F65] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-24 bg-[#1A4D2E] mx-4 lg:mx-8 rounded-[2.5rem] relative overflow-hidden mb-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6 text-[#FEFCE8]">
              Join the Odoo Cafe Family
            </h2>
            <p className="text-lg lg:text-xl text-[#E8F5E9] mb-10 max-w-2xl mx-auto opacity-90">
              Ready to elevate your coffee experience? Sign in to managing your orders efficiently.
            </p>
            <Link href="/login">
              <Button size="lg" className="bg-[#FEFCE8] text-[#1A4D2E] hover:bg-white px-10 py-4 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
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
