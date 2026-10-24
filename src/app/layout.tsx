import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Fraunces } from "next/font/google";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "Wanderly — Travel the world. Plan everything in one place.",
    template: "%s · Wanderly",
  },
  description:
    "Discover destinations, compare ways to get there, understand entry requirements, find places to stay, build your itinerary and manage your entire trip with Wanderly.",
  keywords: ["travel planner", "itinerary", "visa requirements", "destinations", "trip budget"],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <Navbar user={user ? { id: user.id, name: user.name, role: user.role } : null} />
          <main className="min-h-[70vh] pb-20 lg:pb-0">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
