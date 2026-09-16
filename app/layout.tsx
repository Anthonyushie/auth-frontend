import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import Navbar from "@/components/Navbar";
import DesktopOnlyGate from "@/components/DesktopOnlyGate";

export const metadata: Metadata = {
  title: "Tynk — Stories worth reading",
  description: "Tynk is an independent publication. Subscribe for full access to every story.",
  icons: {
    icon: "/tynk_logo.png",
    apple: "/tynk_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tynk-theme");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-[#1c1917] antialiased dark:bg-[#0c0a09] dark:text-[#fafaf9]">
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <DesktopOnlyGate>
                <Navbar />
                <main className="min-h-[calc(100vh-64px-57px)]">{children}</main>
                <footer className="border-t border-[#e7e5e4] dark:border-[#292524]">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                  <p className="text-xs font-semibold tracking-tight text-[#a8a29e]">
                    Tynk
                  </p>
                  <p className="text-xs text-[#a8a29e]">
                    Independent publication · ₦5,000/mo
                  </p>
                </div>
              </footer>
              </DesktopOnlyGate>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
