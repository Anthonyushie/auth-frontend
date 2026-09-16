import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import Navbar from "@/components/Navbar";

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
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-[#1c1917] antialiased">
        <AuthProvider>
          <SubscriptionProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px-57px)]">{children}</main>
            <footer className="border-t border-[#e7e5e4]">
              <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
                <p className="text-xs font-semibold tracking-tight text-[#a8a29e]">
                  Tynk
                </p>
                <p className="text-xs text-[#a8a29e]">
                  Independent publication · ₦5,000/mo
                </p>
              </div>
            </footer>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
