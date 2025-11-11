import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/common/header";
import { ThemeSwitcher } from "@/components/common/theme-switcher";
import { getBaseURL } from "@/lib/utils";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Deegva | AI",
  description: "The best replacement for image pipelines",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <header>
            <Header />
          </header>
          <main className="flex-1">{children}</main>
          <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-3">
            <p>
              Powered by{" "}
              <a
                href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
                target="_blank"
                className="font-bold hover:underline"
                rel="noreferrer"
              >
                Supabase
              </a>
            </p>
            <ThemeSwitcher />
          </footer>
        </Providers>
      </body>
    </html>
  );
}
