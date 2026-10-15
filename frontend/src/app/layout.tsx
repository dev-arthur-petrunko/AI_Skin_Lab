import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import LenisProvider from "@/components/LenisProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { LivingBackground } from "@/components/LivingBackground";
import { CartProvider } from "@/providers/CartProvider";
import { OrderModalProvider } from "@/providers/OrderModalProvider";
import OrderDrawerShell from "@/components/OrderDrawerShell";

export const metadata: Metadata = {
  title: "AI Skin Lab — преміальна косметика та парфуми",
  description:
    "Преміальна косметика, догляд та парфумерія з добіркою AI-консультанта. Підбір за типом шкіри, бренди зі знижками, швидке замовлення.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <LenisProvider>
            <CartProvider>
              <OrderModalProvider>
                <LivingBackground />
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <ChatWidget />
                <OrderDrawerShell />
              </OrderModalProvider>
            </CartProvider>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
