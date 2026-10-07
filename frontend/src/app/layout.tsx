import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import LenisProvider from "@/components/LenisProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { LivingBackground } from "@/components/LivingBackground";

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
            <LivingBackground />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
