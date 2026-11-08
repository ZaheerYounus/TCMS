"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut, Menu, User, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenMobile?: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<{ id: string; username: string; name: string; role: 'ADMIN' | 'STAFF' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/inquiry?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {}
    router.push('/login');
    router.refresh();
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-3 sm:px-6 shadow-sm sticky top-0 z-30 gap-3">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        className="md:hidden text-slate-700 hover:text-[#0B2B5E] hover:bg-slate-100 shrink-0"
        aria-label="Open Navigation Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

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
            placeholder="Global Folio Search (e.g. 1892, 44058, Deceased Name...)"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {/* Right Badges & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-semibold text-[#D85B10]">
          <span className="h-2 w-2 rounded-full bg-[#F37021] animate-pulse" />
          CDC Pakistan Real-Time Node
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
          <div className="h-7 w-7 rounded-full bg-[#0B2B5E] text-white flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left max-w-[120px]">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate">{user?.name || 'Staff User'}</p>
            <p className="text-[10px] text-[#F37021] font-semibold leading-tight uppercase tracking-wider">{user?.role || 'STAFF'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title="Sign out of TCMS"
          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
