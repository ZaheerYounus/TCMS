"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Send, 
  CreditCard, 
  Building, 
  Stamp, 
  SearchX,
  Sparkles, 
  Layers,
  Smartphone,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type LetterTypeId = 
  | "initial" 
  | "first-letter"
  | "various-folios"
  | "shares-delivery" 
  | "cheques-delivery" 
  | "cds-account" 
  | "physical-approval" 
  | "no-folio-found";

export interface LetterTypeInfo {
  id: LetterTypeId;
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  icon: any;
}

export const LETTER_TYPES: LetterTypeInfo[] = [
  {
    id: "first-letter",
    title: "1st Letter (Single)",
    subtitle: "Single Folio Scrutiny",
    desc: "Single Folio Transmission Requirements",
    href: "/letters/first-letter",
    icon: FileText,
  },
  {
    id: "various-folios",
    title: "Various Folios",
    subtitle: "Multi-Company Scrutiny",
    desc: "Multiple Companies & Folios Transmission Requirements",
    href: "/letters/various-folios",
    icon: Layers,
  },
  {
    id: "shares-delivery",
    title: "Delivery of Shares",
    subtitle: "Physical Shares",
    desc: "Forwarding physical transmitted shares to legal heirs",
    href: "/letters/shares-delivery",
    icon: Send,
  },
  {
    id: "cheques-delivery",
    title: "Delivery of Cheques",
    subtitle: "Dividend Cheques",
    desc: "Forwarding banker's cheques for unpaid dividends",
    href: "/letters/cheques-delivery",
    icon: CreditCard,
  },
  {
    id: "physical-approval",
    title: "Physical Approval",
    subtitle: "Company Secretary",
    desc: "Forwarding registers & certificates to Company Secretary",
    href: "/letters/physical-approval",
    icon: Stamp,
  },
  {
    id: "cds-account",
    title: "CDS Account",
    subtitle: "Book-Entry Transmission",
    desc: "Transmission under CDS Account (Closed / Intra-Report)",
    href: "/letters/cds-account",
    icon: Building,
  },
  {
    id: "no-folio-found",
    title: "No Folio Found",
    subtitle: "Records Notice",
    desc: "Intimation of no records found against CNIC/Name",
    href: "/letters/no-folio-found",
    icon: SearchX,
  },
];

interface LetterNavTabsProps {
  currentType?: LetterTypeId;
  onOpenMobileInbox?: () => void;
  onOpenHistory?: () => void;
}

export function LetterNavTabs({ currentType, onOpenMobileInbox, onOpenHistory }: LetterNavTabsProps) {
  const pathname = usePathname();
  const [pendingScanCount, setPendingScanCount] = useState(0);

  useEffect(() => {
    fetch("/api/letters/mobile-uploads?status=PENDING")
      .then((r) => r.json())
      .then((d) => {
        if (d.uploads) setPendingScanCount(d.uploads.length);
      })
      .catch(() => {});
  }, []);

  const activeId: LetterTypeId = currentType || 
    (pathname?.includes("various-folios") ? "various-folios" :
     pathname?.includes("first-letter") ? "first-letter" :
     pathname?.includes("shares-delivery") ? "shares-delivery" :
     pathname?.includes("cheques-delivery") ? "cheques-delivery" :
     pathname?.includes("cds-account") ? "cds-account" :
     pathname?.includes("physical-approval") ? "physical-approval" :
     pathname?.includes("no-folio-found") ? "no-folio-found" :
     "first-letter");

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs mb-6 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 pt-1 gap-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#F37021]" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
            Dedicated Letter Templates
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Upload direct link */}
          <Link
            href="/letters/mobile-upload"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#0B2B5E] border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5 text-[#F37021]" />
            <span>Upload Scan from Mobile</span>
          </Link>

          {/* Desktop Inbox trigger */}
          {onOpenMobileInbox && (
            <button
              onClick={onOpenMobileInbox}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5 text-slate-600" />
              <span>Mobile Scans Inbox</span>
              {pendingScanCount > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-[#F37021] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingScanCount}
                </span>
              )}
            </button>
          )}

          {/* Letter History trigger */}
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
            >
              <History className="h-3.5 w-3.5 text-slate-600" />
              <span>Letter History</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {LETTER_TYPES.map((tab) => {
          const isActive = activeId === tab.id;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "group relative flex flex-col p-2.5 rounded-lg border transition-all text-left",
                isActive
                  ? "bg-[#0B2B5E] text-white border-[#0B2B5E] shadow-sm shadow-blue-900/30 ring-2 ring-[#F37021]/60"
                  : "bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className={cn(
                  "p-1.5 rounded-md",
                  isActive ? "bg-white/10 text-white" : "bg-white text-[#0B2B5E] shadow-xs"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
                {tab.title}
              </div>
              <div className={cn(
                "text-[10px] leading-tight truncate",
                isActive ? "text-orange-200 font-medium" : "text-slate-500"
              )}>
                {tab.subtitle}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
