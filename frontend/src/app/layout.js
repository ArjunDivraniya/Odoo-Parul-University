import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/stores/auth-store";
import { CartProvider } from "@/stores/cart-store";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Odoo Cafe POS | Smart Point-of-Sale for Cafés",
  description: "Premium point-of-sale system designed for modern cafés — efficient, beautiful, and powerful. Manage orders, kitchen, payments, and analytics.",
  keywords: ["POS", "cafe", "restaurant", "point of sale", "order management", "kitchen display"],
  icons: {
    icon: "/favicon.ico",
    apple: "/odoo_cafe_logo.png",
  },
  openGraph: {
    title: "Odoo Cafe POS",
    description: "Smart POS System for Modern Cafés",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
