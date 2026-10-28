"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, 
  Send, 
  CreditCard, 
  Building, 
  Stamp, 
  SearchX,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LetterTypeId = 
  | "initial" 
  | "shares-delivery" 
  | "cheques-delivery" 
  | "cds-account" 
  | "physical-approval" 
  | "no-folio-found";

export interface LetterTypeInfo {
  id: LetterTypeId;
  title: string;
  urduTitle: string;
  desc: string;
  href: string;
  icon: any;
  badge?: string;
}

export const LETTER_TYPES: LetterTypeInfo[] = [
  {
    id: "initial",
    title: "1st Intimation Letter",
    urduTitle: "ابتدائی ٹرانسمیشن لیٹر",
    desc: "Single & Multi-Folio Transmission Requirements",
    href: "/letters",
    icon: FileText,
  },
  {
    id: "shares-delivery",
    title: "Delivery of Shares",
    urduTitle: "ڈیلیوری آف شیئرز",
    desc: "Forwarding physical transmitted shares to legal heirs",
    href: "/letters/shares-delivery",
    icon: Send,
    badge: "Official Form"
  },
  {
    id: "cheques-delivery",
    title: "Delivery of Cheques",
    urduTitle: "ڈیلیوری آف چیکس",
    desc: "Forwarding banker's cheques for unpaid dividends",
    href: "/letters/cheques-delivery",
    icon: CreditCard,
    badge: "Financial"
  },
  {
    id: "cds-account",
    title: "CDS Account Letter",
    urduTitle: "سی ڈی ایس اکاؤنٹ",
    desc: "Transmission under CDS Account (Closed / Intra-Report)",
    href: "/letters/cds-account",
    icon: Building,
  },
  {
    id: "physical-approval",
    title: "Physical Approval",
    urduTitle: "فزیکل اپروول (کمپنی)",
    desc: "Forwarding registers & certificates to Company Secretary",
    href: "/letters/physical-approval",
    icon: Stamp,
    badge: "Company Sec."
  },
  {
    id: "no-folio-found",
    title: "No Folio Found",
    urduTitle: "نو فولیو فاؤنڈ",
    desc: "Intimation of no records found against CNIC/Name",
    href: "/letters/no-folio-found",
    icon: SearchX,
  },
];

export function LetterNavTabs({ currentType }: { currentType?: LetterTypeId }) {
  const pathname = usePathname();

  const activeId: LetterTypeId = currentType || 
    (pathname?.includes("shares-delivery") ? "shares-delivery" :
     pathname?.includes("cheques-delivery") ? "cheques-delivery" :
     pathname?.includes("cds-account") ? "cds-account" :
     pathname?.includes("physical-approval") ? "physical-approval" :
     pathname?.includes("no-folio-found") ? "no-folio-found" :
     "initial");

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-2 shadow-sm mb-6">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#F37021]" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-600">
            Dedicated Letter Templates / مخصوص لیٹر ٹیمپلیٹس
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Sparkles className="h-3 w-3 text-[#F37021]" />
          <span>Select template to open clean dedicated workspace</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                {tab.badge && (
                  <span className={cn(
                    "text-[9px] font-semibold px-1.5 py-0.5 rounded",
                    isActive ? "bg-[#F37021] text-white" : "bg-slate-200 text-slate-600"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </div>

              <div className="font-semibold text-xs leading-tight mb-0.5 truncate">
                {tab.title}
              </div>
              <div className={cn(
                "text-[10px] font-urdu leading-tight truncate",
                isActive ? "text-orange-300 font-medium" : "text-slate-500"
              )}>
                {tab.urduTitle}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
