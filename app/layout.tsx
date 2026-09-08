import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Auth Frontend",
  description: "Next.js JWT authentication client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-4xl px-4 py-10">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
