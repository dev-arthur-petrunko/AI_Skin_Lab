import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import { ThemeProvider } from "@/components/ThemeProvider";
import { MoodProvider } from "@/components/MoodProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { Aurora } from "@/components/Aurora";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
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
