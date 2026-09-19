"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Files, 
  Archive, 
  Settings,
  Users,
  ShieldCheck,
  ChevronRight,
  Building2,
  FileSignature,
  SearchCheck,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Case Inquiry & Audit", href: "/inquiry", icon: SearchCheck, highlight: true },
  { name: "Letter Generation", href: "/letters", icon: FileSignature },
  { name: "Daily Register", href: "/daily", icon: CalendarDays },
  { name: "Active Cases & Trail", href: "/cases", icon: FileText },
  { name: "Physical Filing", href: "/filing", icon: Archive },
  { name: "MIS & Reports", href: "/reports", icon: Files },
  { name: "Administration", href: "/admin", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0B2B5E] text-white border-r border-[#153a73] shadow-xl select-none">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-[#1A365D] bg-[#082046]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F37021] shadow-sm shadow-orange-900/40">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wide text-white text-base">CDCSR</span>
              <span className="text-[10px] font-bold bg-[#F37021] text-white px-1.5 py-0.5 rounded tracking-wider">
                STMS
              </span>
            </div>
            <p className="text-[11px] text-blue-200 truncate">Share Registrar Services</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-300/70">
          Core Operations
        </div>
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-[#1A365D] text-white border-l-4 border-l-[#F37021] shadow-inner shadow-black/10 font-bold pl-2.5"
                    : "text-blue-100 hover:bg-[#13386d] hover:text-white hover:translate-x-0.5"
                )}
              >
                <div className="flex items-center">
                  <item.icon 
                    className={cn(
                      "mr-3 h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-[#F37021]" : "text-blue-300 group-hover:text-white"
                    )} 
                    aria-hidden="true" 
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-[#F37021] opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Brand Accent Banner */}
        <div className="mt-auto pt-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#103875] to-[#0d2a58] border border-blue-400/20 text-xs shadow-sm">
            <div className="flex items-center gap-1.5 text-[#F37021] font-bold text-[11px] uppercase tracking-wider mb-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Institutional Secure
            </div>
            <p className="text-[11px] text-blue-200 leading-snug">
              CDC Pakistan Physical Share Transmission System
            </p>
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-[#1A365D] p-3 bg-[#082046]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A365D] border border-blue-400/30">
              <Users className="h-4 w-4 text-blue-200" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#082046]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Registrar Officer</p>
            <p className="text-[10px] text-[#F37021] font-semibold truncate">CDCSR Operations Unit</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
