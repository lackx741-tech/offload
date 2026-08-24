"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="flex min-h-screen">
      {!isLoginPage && <Sidebar />}
      <div className="flex-1 min-w-0 transition-all duration-300">
        {!isLoginPage && <Header />}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
