import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Tynk",
  description: "Tynk — stories worth subscribing to",
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
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        <AuthProvider>
          <SubscriptionProvider>
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
