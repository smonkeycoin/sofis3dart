import type { ReactNode } from "react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";

export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <main className="mx-auto w-full max-w-[1216px] px-5 pb-10 pt-5 sm:px-8 lg:px-8 lg:pb-9 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
