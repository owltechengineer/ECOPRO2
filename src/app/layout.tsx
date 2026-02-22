import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ECOPRO — Gestionale Multi-Attività",
  description:
    "Sistema imprenditoriale personale per startup e imprenditori seriali. Dashboard, project management, finanza, AI e market intelligence.",
  keywords: ["gestionale", "startup", "project management", "business intelligence"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(222 47% 7%)",
              color: "hsl(213 31% 91%)",
              border: "1px solid hsl(222 40% 12%)",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
