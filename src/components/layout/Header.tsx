"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Shield, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Header() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 sm:px-6 shadow-sm sticky top-0 z-30">
      {/* Search Input with Brand Focus */}
      <div className="flex flex-1 max-w-xl items-center">
        <form onSubmit={handleGlobalSearch} className="relative w-full">
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-4 text-slate-400 pl-3"
            aria-hidden="true"
          />
          <Input
            id="search-field"
            className="h-10 w-full rounded-lg border-slate-200 bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#F37021] focus-visible:ring-1 focus-visible:ring-[#F37021] transition-all"
            placeholder="Global Search (CNIC: 42101..., Folio: 44058, Case ID, Deceased Name...)"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-semibold text-[#D85B10]">
          <span className="h-2 w-2 rounded-full bg-[#F37021] animate-pulse" />
          CDC Pakistan Real-Time Node
        </div>

        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-[#0B2B5E] hover:bg-blue-50">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#F37021]" />
        </Button>
      </div>
    </header>
  );
}
