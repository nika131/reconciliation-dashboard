import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { GlobalNetworkIndicator } from "@/components/GlobalNetworkIndicator";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reconciliation Dashboard",
  description: "Bank transactions and contracts matching engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body className={inter.className}>
        <Providers>
          <Toaster/>
          <GlobalNetworkIndicator/>
          {children}
        </Providers>
      </body>
    </html>
  );
}