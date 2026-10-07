import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MoodProvider } from "@/components/MoodProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { Aurora } from "@/components/Aurora";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <MoodProvider>
            <NextIntlClientProvider messages={messages}>
              <Aurora />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <ChatWidget />
            </NextIntlClientProvider>
          </MoodProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
