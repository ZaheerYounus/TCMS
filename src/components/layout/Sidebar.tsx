"use client";

import { useState } from "react";
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
  ChevronDown,
  Building2,
  FileSignature,
  SearchCheck,
  CalendarDays,
  Clock,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavGroup {
  title: string;
  defaultOpen?: boolean;
  items: Array<{
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }>;
}

const navGroups: NavGroup[] = [
  {
    title: "Overview & Dashboard",
    defaultOpen: true,
    items: [
      { name: "Executive MIS Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Pending Queue & Aging", href: "/cases?status=PENDING", icon: Clock, badge: "Oldest 1st" },
    ]
  },
  {
    title: "Case Operations & Audit",
    defaultOpen: true,
    items: [
      { name: "Case Inquiry & Audit Trail", href: "/inquiry", icon: SearchCheck },
      { name: "Active Transmission Register", href: "/cases", icon: FileText },
      { name: "Awaiting Legal Heirs", href: "/cases?status=WAITING", icon: Send, badge: "Pending" },
    ]
  },
  {
    title: "Letters & Drafting",
    defaultOpen: true,
    items: [
      { name: "Letter Generator (1st & 2nd)", href: "/letters", icon: FileSignature },
      { name: "No Folio Found Letter", href: "/letters?template=no_folio", icon: FileText },
      { name: "CDS Dividend Transmission", href: "/letters?template=cds_account", icon: Files },
    ]
  },
  {
    title: "Registers & Physical Filing",
    defaultOpen: false,
    items: [
      { name: "Daily Register (In/Out)", href: "/daily", icon: CalendarDays },
      { name: "Physical Filing Registry", href: "/filing", icon: Archive },
    ]
  },
  {
    title: "Compliance & Governance",
    defaultOpen: false,
    items: [
      { name: "Reports & Excel Export", href: "/reports", icon: Files },
      { name: "Administration & Settings", href: "/admin", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Overview & Dashboard": true,
    "Case Operations & Audit": true,
    "Letters & Drafting": true,
    "Registers & Physical Filing": true,
    "Compliance & Governance": false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0B2B5E] text-white border-r border-[#153a73] shadow-xl select-none">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-4 border-b border-[#1A365D] bg-[#082046]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F37021] shadow-sm shadow-orange-900/40 shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wide text-white text-base">CDCSR</span>
              <span className="text-[9px] font-black bg-[#F37021] text-white px-1.5 py-0.5 rounded tracking-wider">
                STMS
              </span>
            </div>
            <p className="text-[10px] text-blue-200 truncate">Share Transmission Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3 space-y-3">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.title] ?? true;
          return (
            <div key={group.title} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/80 hover:text-white transition-colors"
              >
                <span>{group.title}</span>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 text-blue-300" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-blue-300/60" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href) && !item.href.includes("?"));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-150",
                          isActive
                            ? "bg-[#1A365D] text-white border-l-4 border-l-[#F37021] shadow-inner font-bold"
                            : "text-blue-100 hover:bg-[#13386d] hover:text-white"
                        )}
                      >
                        <div className="flex items-center min-w-0">
                          <item.icon 
                            className={cn(
                              "mr-2.5 h-4 w-4 shrink-0 transition-colors",
                              isActive ? "text-[#F37021]" : "text-blue-300 group-hover:text-white"
                            )} 
                          />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {item.badge ? (
                          <span className="text-[9px] font-bold bg-[#F37021]/80 text-white px-1.5 py-0.2 rounded shrink-0">
                            {item.badge}
                          </span>
                        ) : isActive ? (
                          <ChevronRight className="h-3.5 w-3.5 text-[#F37021] shrink-0" />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
