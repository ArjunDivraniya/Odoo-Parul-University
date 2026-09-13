import "./globals.css";

import { AuthProvider } from "@/stores/auth-store";
import { CartProvider } from "@/stores/cart-store";
import { PopupProvider } from "@/context/PopupContext";
import { SettingsProvider } from "@/context/SettingsContext";

export const metadata = {
  title: "POS | Smart Point-of-Sale for Cafés",
  description: "Premium point-of-sale system designed for modern cafés — efficient, beautiful, and powerful. Manage orders, kitchen, payments, and analytics.",
  keywords: ["POS", "cafe", "restaurant", "point of sale", "order management", "kitchen display"],
  icons: {
    icon: "/favicon.ico",
    apple: "/odoo_cafe_logo.png",
  },
  openGraph: {
    title: "POS System",
    description: "Smart POS System for Modern Cafés",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <PopupProvider>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </PopupProvider>
      </body>
    </html>
  );
}
