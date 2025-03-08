import type React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  IconHome,
} from "@tabler/icons-react";
import { FloatingDock } from "@/components/ui/floating-dock";
import { Home, Package, Truck, BarChart2, Map, Users, Settings } from "lucide-react";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Modern Route Optimization System",
  description: "Optimize your shipments with our advanced routing system",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const links = [
    {
      title: "Dashboard",
      icon: (
        <IconHome className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/dashboard",
    },
 
    {
      title: "Shipments",
      icon: (
        <Package className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/shipments",
    },
    {
      title: "Fleet",
      icon: (
        <Truck className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/fleet",
    },
    {
      title: "Analytics",
      icon: (
        <BarChart2 className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/analytics",
    },
 
    {
      title: "Tracking",
      icon: (
        <Map className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/tracking",
    },
    {
      title: "Customers",
      icon: (
        <Users className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/customers",
    },
    {
      title: "Settings",
      icon: (
        <Settings className="h-full w-full text-blue-600 dark:text-blue-400" />
      ),
      href: "/",
    },
  ];
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <FloatingDock items={links} />
      </body>
    </html>
  );
}