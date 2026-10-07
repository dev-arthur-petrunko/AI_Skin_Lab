import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MoodProvider } from "@/components/MoodProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { Aurora } from "@/components/Aurora";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <MoodProvider>
            <Aurora />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <ChatWidget />
          </MoodProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
