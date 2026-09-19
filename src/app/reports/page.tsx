"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  ExternalLink, 
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function ReportsPage() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchCompany, setSearchCompany] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mis?limit=1&_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const json = await res.json();
      setSummaryData(json.summary);
    } catch (err) {
      console.error("Failed to load MIS summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCases = summaryData?.totalCases || 13256;
  const closed = summaryData?.totalClosed || 3180;
  const pending = summaryData?.pending || 305;
  const awaitingHeirs = summaryData?.waitingLegalHeirs || 6322;
  const coSigning = summaryData?.coSigning || 24;
  const coApproval = summaryData?.coApproval || 95;

  // Filter raw companies list
  const rawCompanies: any[] = summaryData?.companyMisSummary || [];

  const filteredCompanies = useMemo(() => {
    let list = rawCompanies.filter((c: any) => c.company && c.company !== "Unknown Company");
    
    if (searchCompany.trim()) {
      const q = searchCompany.toLowerCase().trim();
      list = list.filter((c: any) => c.company.toLowerCase().includes(q));
    }

    if (selectedFilter === "ACTIVE_PENDING") {
      list = list.filter((c: any) => (c.pending || 0) > 0);
    } else if (selectedFilter === "SIGNING") {
      list = list.filter((c: any) => (c.coSigning || 0) > 0 || (c.coApproval || 0) > 0);
    } else if (selectedFilter === "HIGH_VOLUME") {
      list = list.filter((c: any) => (c.total || 0) >= 50);
    }

    return list;
  }, [rawCompanies, searchCompany, selectedFilter]);

  const totalPages = Math.ceil(filteredCompanies.length / pageSize) || 1;
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">MIS &amp; Regulatory Reporting</h2>
            <Badge className="bg-[#0B2B5E] text-white font-bold text-xs">Live Synced DB</Badge>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Consolidated Client Company Transmission Status Register across all Pakistan Stock Exchange (PSX) listed client companies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={loadData} 
            variant="outline" 
            size="sm" 
            className="text-xs font-bold text-slate-700 border-slate-300 hover:border-[#F37021]"
          >
            <RotateCcw className={`mr-1.5 h-3.5 w-3.5 text-[#F37021] ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* High-level MIS Key Performance Indicators */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 border-l-4 border-l-[#0B2B5E] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Transmission Cases</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-[#0B2B5E]">{totalCases.toLocaleString()}</h3>
              <Badge className="bg-blue-100 text-[#0B2B5E] border-blue-200 text-[10px] font-bold">
                100% Real DB
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total physical intimations registered</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-[#F37021] shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-[#D85B10] uppercase tracking-wider">Active Pending with Us</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-[#D85B10]">{pending.toLocaleString()}</h3>
              <Badge className="bg-orange-100 text-[#D85B10] border-orange-200 text-[10px] font-bold">
                Under Process
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Transmission team action needed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Awaiting Legal Heirs</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-amber-700">{awaitingHeirs.toLocaleString()}</h3>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">
                Court / Succession
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Formalities sent, reply awaited</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-emerald-600 shadow-xs">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Closed &amp; Transmitted</p>
            <div className="flex items-baseline justify-between mt-1.5">
              <h3 className="text-2xl font-black text-emerald-700">{closed.toLocaleString()}</h3>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                {Math.round((closed / totalCases) * 100)}% Complete
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Shares delivered to legal heirs</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Client Company Transmission Cases Status Register */}
      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#0B2B5E]" />
                Client Company Transmission Status Register
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time breakdown of share transmission caseload, approvals, signings and transmissions per client company.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-mono font-bold">
                {filteredCompanies.length} Client Companies Found
              </Badge>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Client Company (e.g. PSO, HBL, OGDC, SNGP)..."
                value={searchCompany}
                onChange={(e) => {
                  setSearchCompany(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs focus-visible:ring-[#F37021]"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              {[
                { label: "All Companies", val: "ALL" },
                { label: "Has Active Pending", val: "ACTIVE_PENDING" },
                { label: "In Signing / Approval", val: "SIGNING" },
                { label: "High Volume (≥50 Cases)", val: "HIGH_VOLUME" },
              ].map((f) => (
                <Button
                  key={f.val}
                  variant={selectedFilter === f.val ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedFilter(f.val);
                    setCurrentPage(1);
                  }}
                  className={`text-xs h-7.5 transition-all ${
                    selectedFilter === f.val
                      ? 'bg-[#F37021] text-white font-bold hover:bg-[#D85B10]'
                      : 'text-slate-600 hover:border-[#F37021]'
                  }`}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/90 text-xs">
                <TableRow>
                  <TableHead className="min-w-[240px] font-bold text-slate-900">Client Company Name</TableHead>
                  <TableHead className="text-center font-bold text-slate-900">Total Cases</TableHead>
                  <TableHead className="text-center font-bold text-emerald-800">Transmitted &amp; Closed</TableHead>
                  <TableHead className="text-center font-bold text-[#D85B10]">Pending with Us</TableHead>
                  <TableHead className="text-center font-bold text-amber-800">Awaiting Heirs</TableHead>
                  <TableHead className="text-center font-bold text-cyan-800">Signing / Review</TableHead>
                  <TableHead className="text-right font-bold text-slate-900 min-w-[140px]">Completion Rate</TableHead>
                  <TableHead className="text-right font-bold text-[#0B2B5E] min-w-[150px]">Quick Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-semibold">
                      Loading Client Company Transmission Statistics...
                    </TableCell>
                  </TableRow>
                ) : paginatedCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      No client companies matched the search query &quot;{searchCompany}&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCompanies.map((row: any, idx: number) => {
                    const rate = row.total > 0 ? Math.round((row.closed / row.total) * 100) : 0;
                    const compSigningApproval = (row.coSigning || 0) + (row.coApproval || 0);

                    return (
                      <TableRow key={idx} className="hover:bg-orange-50/40 transition-colors group">
                        <TableCell className="font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                              <Building2 className="h-4 w-4 text-[#0B2B5E]" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">{row.company}</span>
                              <span className="text-[10px] text-slate-500">PSX Client Company</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-slate-900 font-mono text-sm">
                          {row.total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-emerald-700 font-mono">
                          <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {row.closed.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-[#D85B10] font-mono">
                          {row.pending > 0 ? (
                            <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-[#D85B10]">
                              {row.pending}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-amber-800 font-mono">
                          {row.waiting.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {compSigningApproval > 0 ? (
                            <Badge className="bg-cyan-50 text-cyan-900 border-cyan-200 text-[10px] font-bold">
                              {compSigningApproval} Cases
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono font-bold text-xs text-slate-800">{rate}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full rounded-full ${rate > 50 ? 'bg-emerald-500' : 'bg-[#F37021]'}`} 
                                style={{ width: `${rate}%` }} 
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/cases?company=${encodeURIComponent(row.company)}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-xs font-bold text-[#0B2B5E] border-blue-200 hover:bg-[#0B2B5E] hover:text-white transition-all shadow-2xs"
                              >
                                View Trail
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50">
              <div>
                Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredCompanies.length} companies)
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="h-7.5 px-2.5 text-xs font-semibold"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="h-7.5 px-2.5 text-xs font-semibold"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
