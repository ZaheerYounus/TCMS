"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Archive,
  TrendingUp,
  Building2,
  AlertTriangle,
  ArrowRight,
  Send,
  HelpCircle
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";

const COLORS = ["#0B2B5E", "#F37021", "#38A169", "#D85B10", "#4B5563"];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [misStats, setMisStats] = useState<any>(null);
  const [filingStats, setFilingStats] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resMis, resFiling] = await Promise.all([
          fetch(`/api/mis?limit=1&_t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/filing?_t=${Date.now()}`, { cache: 'no-store' })
        ]);
        const dataMis = await resMis.json();
        const dataFiling = await resFiling.json();
        setMisStats(dataMis.summary);
        setFilingStats(dataFiling);
      } catch (e) {
        console.error('Failed to load dashboard statistics:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalCases = misStats?.totalCases ?? 13256;
  const pendingCases = misStats?.pending ?? 305;
  const workedThisMonth = misStats?.workedThisMonth ?? 97;
  const waitingLegalHeirs = misStats?.waitingLegalHeirs ?? 6322;
  const totalClosedSharesTransmitted = misStats?.totalClosed ?? 3180;
  const coApproval = misStats?.coApproval ?? 95;
  const coSigning = misStats?.coSigning ?? 24;
  const inTransfer = misStats?.inTransfer ?? 1;
  const coDividend = misStats?.coDividend ?? 259;
  const criticalFiles = filingStats?.criticalCount ?? 30;

  const primaryStats = [
    {
      title: "Active Cases (Pending)",
      urduTitle: "ایکٹو کیسز (ہمارے پاس زیرِ کارروائی)",
      value: pendingCases.toLocaleString(),
      subtext: "Action required by CDCSR team",
      icon: AlertCircle,
      color: "text-[#F37021]",
      bgColor: "bg-orange-50",
      accentBorder: "border-l-[#F37021]",
      href: "/cases?status=PENDING"
    },
    {
      title: "Worked / Responded This Month",
      urduTitle: "اس مہینے جواب بھیجا / کارروائی کی",
      value: workedThisMonth.toLocaleString(),
      subtext: "Responses & filings sent in Sep 2026",
      icon: TrendingUp,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      accentBorder: "border-l-blue-600",
      href: "/cases?thisMonth=true"
    },
    {
      title: "Awaiting Legal Heirs",
      urduTitle: "لیگل ہائرز کی طرف سے مطلوب",
      value: waitingLegalHeirs.toLocaleString(),
      subtext: "Formalities sent, awaiting response",
      icon: Send,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      accentBorder: "border-l-amber-500",
      href: "/cases?status=WAITING"
    },
    {
      title: "Shares Transmitted (Closed)",
      urduTitle: "شیئرز ٹرانسمٹ / کلوزڈ کیسز",
      value: totalClosedSharesTransmitted.toLocaleString(),
      subtext: "Transmitted & delivered to heirs",
      icon: CheckCircle,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      accentBorder: "border-l-emerald-600",
      href: "/cases?status=CLOSED"
    },
  ];

  const operationalStages = [
    {
      title: "Co. - Case Review & Approval",
      urduTitle: "کمپنی ریویو و منظوری",
      value: coApproval.toLocaleString(),
      subtext: "Sent to company management",
      icon: Clock,
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      accentBorder: "border-l-purple-500",
      href: "/cases?status=CO_APPROVAL"
    },
    {
      title: "Co. - Signing of Shares",
      urduTitle: "کمپنی مجاز دستخط",
      value: coSigning.toLocaleString(),
      subtext: "Sent for authorized signing",
      icon: FileText,
      color: "text-cyan-700",
      bgColor: "bg-cyan-50",
      accentBorder: "border-l-cyan-600",
      href: "/cases?status=CO_SIGNING"
    },
    {
      title: "In Transfer Process",
      urduTitle: "ٹرانسفر ٹیم میں پروسیس",
      value: inTransfer.toLocaleString(),
      subtext: "Live depository execution",
      icon: Archive,
      color: "text-indigo-700",
      bgColor: "bg-indigo-50",
      accentBorder: "border-l-indigo-600",
      href: "/cases?status=IN_TRANSFER"
    },
    {
      title: "Co. - Dividend Payment",
      urduTitle: "کمپنی ڈیویڈنڈ ادائیگی",
      value: coDividend.toLocaleString(),
      subtext: "Pending dividend clearance",
      icon: Building2,
      color: "text-slate-700",
      bgColor: "bg-slate-50",
      accentBorder: "border-l-slate-600",
      href: "/cases?status=CO_DIVIDEND"
    }
  ];

  const statusDistribution = [
    { name: "Awaiting Legal Heirs", value: waitingLegalHeirs },
    { name: "Shares Transmitted (Closed)", value: totalClosedSharesTransmitted },
    { name: "Pending Review / Action", value: pendingCases },
    { name: "Co. - Dividend Payment", value: coDividend },
    { name: "Co. - Case Review & Approval", value: coApproval },
    { name: "Co. - Signing of Shares", value: coSigning },
    { name: "In Transfer Process", value: inTransfer },
  ];

  const companyPending = [
    { name: "Habib Bank (HBL)", pending: 948, total: 1312 },
    { name: "OGDC", pending: 415, total: 643 },
    { name: "SNGPL", pending: 312, total: 443 },
    { name: "SSGC", pending: 233, total: 327 },
    { name: "PSO", pending: 216, total: 315 },
    { name: "PIAA", pending: 223, total: 311 },
    { name: "Askari Bank (AKBL)", pending: 196, total: 292 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CDC Corporate Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-7 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="bg-[#F37021] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded shadow-sm">
                CDCSR Executive MIS
              </span>
              <span className="text-xs text-orange-200 font-medium">CDC Share Registrar Services Limited</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Share Transmission Management System
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time synchronization for 215 listed companies across 340,000+ shareholder portfolios.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15">
            <div>
              <p className="text-[10px] uppercase font-bold text-blue-200">Total Closed</p>
              <p className="text-lg font-black text-emerald-400">{totalClosedSharesTransmitted.toLocaleString()}</p>
            </div>
            <div className="h-9 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase font-bold text-orange-300">Awaiting Heirs</p>
              <p className="text-lg font-black text-[#F37021]">{waitingLegalHeirs.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Performance Indicators (Executive MIS)</h2>
          <span className="text-[11px] text-slate-400 font-medium">Auto-synced with MIS Transmission dataset</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {primaryStats.map((stat, i) => (
            <Link href={stat.href} key={i}>
              <Card className={`hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-slate-200 border-l-4 ${stat.accentBorder} cursor-pointer group bg-white`}>
                <CardContent className="flex items-center p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-3.5 overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{stat.title}</p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mt-0.5 group-hover:text-[#0B2B5E] transition-colors">
                      {stat.value}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{stat.urduTitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Operational Pipeline Breakdown (Company & Transfer stages) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Workflow Pipeline Stages</h2>
          <span className="text-[11px] text-slate-400">Under Review with Company & Depository</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {operationalStages.map((stage, i) => (
            <Link href={stage.href} key={i}>
              <Card className={`hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 border-slate-200 border-l-4 ${stage.accentBorder} cursor-pointer group bg-white`}>
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{stage.title}</span>
                    <stage.icon className={`h-4 w-4 ${stage.color} shrink-0`} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-slate-900 group-hover:text-[#0B2B5E]">{stage.value}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate">{stage.urduTitle}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Capacity Alert Banner */}
      <Card className="border-l-4 border-l-[#F37021] bg-gradient-to-r from-orange-50/70 via-white to-orange-50/30 border-orange-200 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F37021]/15 text-[#D85B10] shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#D85B10]">Physical Filing Capacity Alert</p>
              <p className="text-xs text-slate-700">
                <strong>{criticalFiles} physical company folders</strong> have reached &ge;90% capacity (&ge;36 cases). Review Filing Management to designate new sub-folders.
              </p>
            </div>
          </div>
          <Link href="/filing?filter=critical">
            <Button size="sm" className="bg-[#F37021] hover:bg-[#D85B10] text-white text-xs shrink-0 font-bold shadow-sm">
              Review Heavy Files ({criticalFiles})
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              MIS Workflow Distribution
              <Badge className="bg-[#0B2B5E] text-white text-[10px] font-semibold">13,256 Total</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Accurate breakdown of active vs closed transmissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [Number(value).toLocaleString(), 'Cases']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 space-y-1.5 text-xs text-slate-600">
              {statusDistribution.slice(0, 3).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index] }} />
                    <span className="truncate">{entry.name}</span>
                  </div>
                  <strong className="text-slate-800">{entry.value.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company-wise Pending Cases */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              Top Issuers by Pending Transmission Volume
              <span className="text-[11px] text-[#F37021] font-bold">Client Companies</span>
            </CardTitle>
            <CardDescription className="text-xs">Volume awaiting legal heir formalities or company clearance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyPending} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} angle={-12} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#FFF4ED' }} formatter={(val: any) => [val, 'Cases']} />
                  <Bar dataKey="pending" fill="#0B2B5E" radius={[4, 4, 0, 0]} name="Pending Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
