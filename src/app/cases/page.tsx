"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  ArrowRight,
  CheckCircle2,
  FileText,
  X,
  Building2,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  MapPin,
  CheckSquare,
  AlertOctagon,
  Calendar,
  Clock
} from "lucide-react";
import { formatDateDDMMYYYY, calculateAgingDays } from "@/lib/dateUtils";
import { getCompanyPolicy } from "@/lib/companyRules";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const getStatusBadge = (status: string, isClosed?: boolean, workedThisMonth?: boolean) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('partially')) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-teal-100 text-teal-800 border-teal-300 text-[10px] font-bold whitespace-nowrap">
          Partially Closed
        </Badge>
        {workedThisMonth && <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">Sep 26</span>}
      </div>
    );
  }
  if (isClosed || s.includes('closed') || s === 'case closed') {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold whitespace-nowrap">
          Closed (Transmitted)
        </Badge>
        {workedThisMonth && <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">Sep 26</span>}
      </div>
    );
  }
  if (s === 'pending') {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-orange-100 text-[#F37021] border-orange-300 text-[10px] font-bold whitespace-nowrap">
          Pending with Us
        </Badge>
        {workedThisMonth && <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">Sep 26</span>}
      </div>
    );
  }
  if (s.includes('custody')) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-bold whitespace-nowrap">
          Custody Awaited
        </Badge>
        {workedThisMonth && <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">Sep 26</span>}
      </div>
    );
  }
  if (s.includes('waiting') || s.includes('awaiting')) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-semibold whitespace-nowrap">
          Awaiting Legal Heirs
        </Badge>
        {workedThisMonth && <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1 rounded">Sep 26</span>}
      </div>
    );
  }
  if (s.includes('review') || s.includes('approval')) {
    return <Badge className="bg-indigo-100 text-indigo-900 border-indigo-200 text-[10px] font-semibold whitespace-nowrap">Co. Review &amp; Approval</Badge>;
  }
  if (s.includes('signing')) {
    return <Badge className="bg-cyan-100 text-cyan-900 border-cyan-200 text-[10px] font-bold whitespace-nowrap">Co. - Signing</Badge>;
  }
  if (s.includes('transfer')) {
    return <Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[10px] font-semibold whitespace-nowrap">In Transfer</Badge>;
  }
  return <Badge variant="outline" className="bg-slate-100 text-slate-800 text-[10px] font-medium whitespace-nowrap">{status || 'Under Review'}</Badge>;
};

function CasesContent() {
  const searchParams = useSearchParams();
  const initialCompany = searchParams?.get("company") || "ALL";
  const initialStatus = searchParams?.get("thisMonth") === "true" 
    ? "WORKED_THIS_MONTH" 
    : (searchParams?.get("status") || "ALL");

  const [cases, setCases] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [selectedCompany, setSelectedCompany] = useState(initialCompany);
  const [sortByAging, setSortByAging] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Document Receipt Modal State (Requirement 5)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedCaseForReceipt, setSelectedCaseForReceipt] = useState<any>(null);
  const [receivedDocDate, setReceivedDocDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([
    "Notarized Death Certificate",
    "Notarized CNIC Copies of Legal Heirs"
  ]);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [updatingReceipt, setUpdatingReceipt] = useState(false);

  const fetchCases = (pg: number, st: string, comp: string, q: string) => {
    startTransition(async () => {
      try {
        let url = `/api/mis?page=${pg}&limit=50&q=${encodeURIComponent(q)}&_t=${Date.now()}`;
        if (st === "WORKED_THIS_MONTH") {
          url += "&thisMonth=true";
        } else if (st !== "ALL") {
          url += `&status=${st}`;
        }
        if (comp && comp !== "ALL") {
          url += `&company=${encodeURIComponent(comp)}`;
        }
        const res = await fetch(url, { 
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        const data = await res.json();
        setCases(data.records || []);
        setSummary(data.summary || null);
        setTotalPages(data.totalPages || 1);
        setTotalCases(data.total || 0);
      } catch (err) {
        console.error("Failed to load cases:", err);
      }
    });
  };

  useEffect(() => {
    fetchCases(page, selectedStatus, selectedCompany, searchQuery);
  }, [page, selectedStatus, selectedCompany]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases(1, selectedStatus, selectedCompany, searchQuery);
  };

  const handleClearFilter = () => {
    setSearchQuery("");
    setSelectedCompany("ALL");
    setSelectedStatus("ALL");
    setPage(1);
    fetchCases(1, "ALL", "ALL", "");
  };

  // Get unique companies list from summary
  const companyOptions: any[] = summary?.companyMisSummary || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Active Cases &amp; Trail</h2>
            <Badge className="bg-[#0B2B5E] text-white font-bold">{totalCases.toLocaleString()} Records</Badge>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Real-time status register. Click any <strong className="text-[#F37021]">Folio #</strong> to inspect complete 23-column audit trail, correspondence dates and timeline in Case Inquiry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => fetchCases(page, selectedStatus, selectedCompany, searchQuery)} 
            variant="outline" 
            size="sm" 
            className="text-slate-700 hover:border-[#F37021] text-xs font-bold border-slate-300"
          >
            <RotateCcw className={`mr-1.5 h-3.5 w-3.5 text-[#F37021] ${isPending ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="space-y-3">
            {/* Search & Company Filter Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search Folio (e.g. 6575, 122), Deceased, Heir..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs focus-visible:ring-[#F37021]" 
                />
              </form>

              {/* Company Selector Dropdown */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 hidden sm:inline" />
                <select
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 text-[#0B2B5E] focus:ring-[#F37021] w-full md:w-72"
                >
                  <option value="ALL">🏢 All Client Companies</option>
                  {companyOptions.filter((c: any) => c.company && !c.company.toLowerCase().includes('unknown')).map((c: any) => (
                    <option key={c.company} value={c.company}>
                      {c.company} ({c.total} cases)
                    </option>
                  ))}
                </select>

                {(searchQuery || selectedCompany !== "ALL" || selectedStatus !== "ALL") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilter}
                    className="h-9 px-2 text-xs text-slate-500 hover:text-red-600 shrink-0"
                    title="Clear all filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Category Tabs with Live MIS Case Counts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {[
                { label: `All Cases (${summary?.totalCases?.toLocaleString() || '13,256'})`, val: "ALL" },
                { label: `Active / Pending with Us (${summary?.pending?.toLocaleString() || '305'})`, val: "PENDING", highlight: true },
                { label: `Co. - Signing (${summary?.coSigning?.toLocaleString() || '24'})`, val: "CO_SIGNING", cyan: true },
                { label: `Partially Closed (${summary?.partiallyClosed?.toLocaleString() || '905'})`, val: "PARTIALLY_CLOSED", teal: true },
                { label: `Co. - Review & Approval (${summary?.coApproval?.toLocaleString() || '95'})`, val: "CO_APPROVAL", indigo: true },
                { label: `Worked This Month (${summary?.workedThisMonth?.toLocaleString() || '97'})`, val: "WORKED_THIS_MONTH", blue: true },
                { label: `Awaiting Legal Heirs (${summary?.waitingLegalHeirs?.toLocaleString() || '6,322'})`, val: "WAITING" },
                { label: `In Transfer (${summary?.inTransfer?.toLocaleString() || '1'})`, val: "IN_TRANSFER" },
                { label: `Closed / Transmitted (${summary?.totalClosed?.toLocaleString() || '3,180'})`, val: "CLOSED", emerald: true },
              ].map((st) => (
                <Button
                  key={st.val}
                  variant={selectedStatus === st.val ? "default" : "outline"}
                  size="sm"
                  onClick={() => { setSelectedStatus(st.val); setPage(1); }}
                  className={`text-xs h-7.5 transition-all ${
                    selectedStatus === st.val 
                      ? 'bg-[#F37021] hover:bg-[#D85B10] text-white font-black shadow-sm scale-102' 
                      : st.highlight 
                        ? 'border-orange-300 text-[#F37021] bg-orange-50/50 hover:bg-orange-100 font-bold'
                        : st.teal
                          ? 'border-teal-300 text-teal-800 bg-teal-50/50 hover:bg-teal-100 font-bold'
                          : st.cyan
                            ? 'border-cyan-300 text-cyan-800 bg-cyan-50/50 hover:bg-cyan-100 font-bold'
                            : st.indigo
                              ? 'border-indigo-300 text-indigo-800 bg-indigo-50/50 hover:bg-indigo-100 font-bold'
                              : st.blue
                                ? 'border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-semibold'
                                : st.emerald
                                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 font-semibold'
                                  : 'text-slate-600 hover:border-[#F37021]'
                  }`}
                >
                  {st.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Clean, Streamlined Table - Removed Physical File & Redundant Date Columns */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/90 text-xs border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-[100px] font-bold text-slate-800">Case ID</TableHead>
                  <TableHead className="w-[130px] font-black text-[#F37021]">Folio #</TableHead>
                  <TableHead className="min-w-[200px] font-bold text-slate-800">Company &amp; Policy</TableHead>
                  <TableHead className="min-w-[180px] font-bold text-slate-800">Deceased &amp; Heir</TableHead>
                  <TableHead className="w-[130px] font-bold text-slate-800">Location / Holder</TableHead>
                  <TableHead className="w-[160px] font-bold text-slate-800">Status &amp; Formalities</TableHead>
                  <TableHead className="text-right font-bold text-[#0B2B5E] w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-14 text-slate-500 font-semibold">
                      Loading MIS transmission records...
                    </TableCell>
                  </TableRow>
                ) : cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-14 text-slate-500">
                      No transmission records matched the search query or company filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((c) => {
                    const primaryFolio = String(c.folio || '').split(',')[0].trim();
                    const policy = getCompanyPolicy(c.company);
                    const isWaitingHeirs = String(c.status || '').toLowerCase().includes('waiting') || String(c.status || '').toLowerCase().includes('awaiting');
                    const agingDays = calculateAgingDays(c.formSentDate || c.reqRecDate);

                    return (
                      <TableRow 
                        key={c.caseId} 
                        className="hover:bg-orange-50/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          window.location.href = `/inquiry?folio=${encodeURIComponent(primaryFolio)}&company=${encodeURIComponent(c.company || '')}`;
                        }}
                      >
                        <TableCell className="font-mono font-bold text-[#0B2B5E] whitespace-nowrap">
                          {c.caseId}
                        </TableCell>

                        {/* Interactive Clickable Folio Link */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Link 
                            href={`/inquiry?folio=${encodeURIComponent(primaryFolio)}&company=${encodeURIComponent(c.company || '')}`}
                            className="inline-flex items-center gap-1.5 font-mono font-black text-xs text-[#F37021] bg-orange-50 group-hover:bg-[#F37021] group-hover:text-white px-2 py-0.5 rounded-md border border-orange-200 transition-all shadow-2xs"
                            title="Click to inspect full 23-column audit trail in Case Inquiry"
                          >
                            <span>#{c.folio}</span>
                            <ArrowUpRight className="h-3 w-3 opacity-70 group-hover:opacity-100" />
                          </Link>
                        </TableCell>

                        {/* Client Company */}
                        <TableCell className="font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px] font-bold" title={c.company}>{c.company}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <strong className="text-slate-900 block leading-tight font-bold">Late {c.deceased || 'N/A'}</strong>
                            <span className="text-slate-500 text-[11px] block">{c.legalHeir || 'Legal Heir'}</span>
                          </div>
                        </TableCell>

                        {/* Location / Physical Holder Tracker (Requirement 23) */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {c.location || (c.filingInfo && c.filingInfo.length > 0 ? c.filingInfo[0].fileNo : 'With ZA')}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status, Aging, and Awaiting Legal Heirs Documents at a Glance (Requirements 3 & 26) */}
                        <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <div>{getStatusBadge(c.status, c.isClosed, c.workedThisMonth)}</div>
                            {isWaitingHeirs && (
                              <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 max-w-[160px] truncate" title="Awaiting: Notarized Death Cert, CNIC, Succession Certificate">
                                Awaiting: Death Cert, Succession
                              </div>
                            )}
                            {agingDays > 10 && !c.isClosed && (
                              <div className="flex items-center gap-1 text-[9px] text-red-600 font-bold">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{agingDays}d pending</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedCaseForReceipt(c);
                                setReceiptModalOpen(true);
                              }}
                              className="h-7 px-2 text-[11px] font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                              title="Update Received Documents (Date & Types)"
                            >
                              <CheckSquare className="h-3 w-3 mr-1 text-emerald-600" />
                              Recv Docs
                            </Button>
                            <Link 
                              href={`/inquiry?folio=${encodeURIComponent(primaryFolio)}&company=${encodeURIComponent(c.company || '')}`}
                            >
                              <Button 
                                size="sm" 
                                className="bg-[#0B2B5E] hover:bg-[#153e7e] text-white font-bold text-xs h-7 px-2 shadow-2xs"
                                title="Inspect Complete Audit Trail & Timeline"
                              >
                                <Eye className="h-3 w-3 text-[#F37021]" />
                              </Button>
                            </Link>
                            <Link 
                              href={`/letters?folio=${encodeURIComponent(primaryFolio)}&company=${encodeURIComponent(c.company || '')}&deceased=${encodeURIComponent(c.deceased || '')}&heir=${encodeURIComponent(c.legalHeir || '')}`}
                              className="inline-flex items-center justify-center rounded-md text-xs font-bold h-7 px-2 bg-slate-100 hover:bg-orange-100 text-[#0B2B5E] hover:text-[#F37021] border border-slate-200 transition-colors"
                              title="Generate Transmission Letter for this case"
                            >
                              <FileText className="h-3 w-3" />
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

          {/* Pagination Controls */}
          <div className="flex items-center justify-between p-3 border-t border-slate-200 text-xs text-slate-600 bg-slate-50/50">
            <div>
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCases.toLocaleString()} records)
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-7.5 px-2.5 text-xs font-semibold"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-7.5 px-2.5 text-xs font-semibold"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Receipt Update Modal (Requirement 5) */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="max-w-lg border-t-4 border-t-emerald-600">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-600" />
              Update Received Documents
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record receipt date and check off document types received from legal heirs for Folio #{selectedCaseForReceipt?.folio}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Case Particulars:</span>
              <strong className="text-slate-900 block font-bold text-sm">
                #{selectedCaseForReceipt?.folio} - {selectedCaseForReceipt?.company}
              </strong>
              <span className="text-slate-600 block mt-0.5">
                Deceased: Late {selectedCaseForReceipt?.deceased} | Heir: {selectedCaseForReceipt?.legalHeir}
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Receipt Date (Standard DD/MM/YYYY) *</label>
              <Input
                type="date"
                value={receivedDocDate}
                onChange={(e) => setReceivedDocDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Document Types Received: *</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {[
                  "Legible Notarized Death Certificate",
                  "Notarized CNIC Copies of Legal Heirs",
                  "Attested Succession Certificate / Court Order",
                  "Shareholder Information Form (SIF) / Transmission Deed",
                  "Shares Transfer Duty / Revenue Stamps",
                  "Original Share Certificates",
                  "Original Dividend Warrants (if any)",
                  "24-Digit IBAN Bank Certificate",
                  "Family Registration Certificate (FRC)",
                ].map((docName) => {
                  const isChecked = selectedDocTypes.includes(docName);
                  return (
                    <label key={docName} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedDocTypes(prev => 
                            prev.includes(docName) ? prev.filter(d => d !== docName) : [...prev, docName]
                          );
                        }}
                        className="rounded border-slate-300 text-[#F37021] focus:ring-[#F37021]"
                      />
                      <span>{docName}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes / Discrepancies Observed:</label>
              <Input
                placeholder="e.g. Received via courier, verified against Member Register..."
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReceiptModalOpen(false)}
              className="text-xs h-9 font-bold"
            >
              Cancel
            </Button>
            <Button
              disabled={updatingReceipt}
              onClick={async () => {
                if (!selectedCaseForReceipt) return;
                setUpdatingReceipt(true);
                try {
                  await fetch('/api/mis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      caseId: selectedCaseForReceipt.caseId,
                      folio: selectedCaseForReceipt.folio,
                      status: 'Pending',
                      actionTitle: `Documents Received on ${formatDateDDMMYYYY(receivedDocDate)}`,
                      discussionNote: `Received: ${selectedDocTypes.join(', ')}. ${receiptNotes}`,
                      updates: {
                        formRecDate: receivedDocDate,
                        status: 'Pending'
                      }
                    })
                  });
                  setReceiptModalOpen(false);
                  fetchCases(page, selectedStatus, selectedCompany, searchQuery);
                } catch (e) {
                  alert('Failed to update document receipt');
                } finally {
                  setUpdatingReceipt(false);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4"
            >
              {updatingReceipt ? "Saving..." : "Record Receipt & Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold text-xs">Loading transmission register...</div>}>
      <CasesContent />
    </Suspense>
  );
}
