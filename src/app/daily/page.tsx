"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CalendarDays, 
  Inbox, 
  Send, 
  Clock, 
  Search, 
  Plus, 
  FileText, 
  Building2, 
  User, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  FileSignature, 
  ArrowRight,
  Filter,
  Check,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const OFFICERS = [
  { id: "ZA", name: "Zaheer Ahmed", role: "Team Lead / Registrar" },
  { id: "AY", name: "Azib Yousuf", role: "Senior Transmission Officer" },
  { id: "MS", name: "Muqaddas Sharif", role: "Transmission Officer" },
  { id: "ZJ", name: "Zohaib Jamal", role: "Operations Officer" },
];

export default function DailyRegisterPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    receivedToday: 0,
    dispatchedToday: 0,
    underReview: 0,
    totalThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // New Letter Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newType, setNewType] = useState<"INWARD" | "OUTWARD">("INWARD");
  const [newFolio, setNewFolio] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newShareholder, setNewShareholder] = useState("");
  const [newLegalHeir, setNewLegalHeir] = useState("");
  const [newRelation, setNewRelation] = useState("Son");
  const [newEnclosures, setNewEnclosures] = useState("Written application, CNIC copy, Death Certificate");
  const [newAssignedTo, setNewAssignedTo] = useState("ZA");
  const [newRemarks, setNewRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const fetchRegister = (dFilter = dateFilter, tFilter = typeFilter, q = searchQuery) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/daily?date=${dFilter}&type=${tFilter}&q=${encodeURIComponent(q)}&_t=${Date.now()}`);
        const data = await res.json();
        if (data.records) setRecords(data.records);
        if (data.summary) setSummary(data.summary);
      } catch (err) {
        console.error("Failed to load daily register:", err);
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchRegister(dateFilter, typeFilter, searchQuery);
  }, [dateFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegister(dateFilter, typeFilter, searchQuery);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const officer = OFFICERS.find(o => o.id === newAssignedTo);
      const res = await fetch('/api/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          folio: newFolio,
          company: newCompany,
          shareholder: newShareholder,
          legalHeir: newLegalHeir,
          relation: newRelation,
          enclosures: newEnclosures,
          assignedTo: newAssignedTo,
          officerName: officer ? officer.name : 'Zaheer Ahmed',
          remarks: newRemarks,
          date: "2026-09-19"
        })
      });

      if (!res.ok) throw new Error("Failed to save entry");
      setIsModalOpen(false);
      // Reset form
      setNewFolio("");
      setNewCompany("");
      setNewShareholder("");
      setNewLegalHeir("");
      setNewRemarks("");
      fetchRegister(dateFilter, typeFilter, searchQuery);
    } catch (err) {
      alert("Error saving daily register entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = ["Date", "Time", "Type", "Ref No", "Folio", "Company", "Shareholder", "Legal Heir", "Officer", "Status", "Remarks"];
    const rows = records.map(r => [
      r.date,
      r.time || "",
      r.type,
      `"${r.refNo}"`,
      `"${r.folio}"`,
      `"${r.company}"`,
      `"${r.shareholder}"`,
      `"${r.legalHeir}"`,
      `"${r.officerName}"`,
      r.status,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CDCSR_Daily_Correspondence_Register_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-5 sm:p-6 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#F37021] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                Daily Operations Register
              </span>
              <span className="text-xs text-orange-200">CDC Share Registrar Services Limited</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Daily Correspondence Register
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-0.5">
              Track daily incoming transmission applications, outgoing legal heir response letters, and audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-md h-9 px-4"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Log Inward Letter
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs h-9 px-3"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 border-l-4 border-l-[#F37021] shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-orange-50 text-[#F37021] rounded-xl shrink-0">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Received Today (Inward)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.receivedToday} Letters</h3>
              <p className="text-[11px] text-slate-500">Transmission requests filed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-blue-600 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dispatched Today (Outward)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.dispatchedToday} Letters</h3>
              <p className="text-[11px] text-slate-500">Formalities letters delivered</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-amber-500 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Under Review / Scrutiny</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.underReview} Cases</h3>
              <p className="text-[11px] text-slate-500">Pending response drafting</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 border-l-4 border-l-emerald-600 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total This Month (Sep 2026)</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{summary.totalThisMonth} Records</h3>
              <p className="text-[11px] text-slate-500">Monthly audit correspondence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS BAR */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Date Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-[#F37021]" /> Date:
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "week", label: "This Week" },
                { id: "month", label: "This Month" },
                { id: "all", label: "All Records" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    dateFilter === p.id 
                      ? "bg-[#0B2B5E] text-white shadow-sm" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Type:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                {[
                  { id: "ALL", label: "All Types" },
                  { id: "INWARD", label: "Inward (Received)" },
                  { id: "OUTWARD", label: "Outward (Dispatched)" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTypeFilter(t.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      typeFilter === t.id 
                        ? "bg-[#F37021] text-white shadow-sm" 
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by Folio #, Company Name, Legal Heir, Reference No., or Officer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Button 
              type="submit" 
              className="bg-[#0B2B5E] hover:bg-[#103a7a] text-white text-xs h-9 px-4 font-bold"
            >
              Search
            </Button>
            {searchQuery && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  fetchRegister(dateFilter, typeFilter, "");
                }}
                className="text-xs h-9 px-3"
              >
                Reset
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* MAIN REGISTER TABLE */}
      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#F37021]" />
              Official Correspondence Log ({records.length} Entries)
            </CardTitle>
            <CardDescription className="text-xs">
              Chronological log of daily share transmission letters and formalities
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchRegister(dateFilter, typeFilter, searchQuery)}
            className="text-xs h-7 text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 text-xs">
                <TableRow>
                  <TableHead className="w-24">Date / Time</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead>Ref #</TableHead>
                  <TableHead>Folio &amp; Company</TableHead>
                  <TableHead>Applicant / Deceased</TableHead>
                  <TableHead className="max-w-[200px]">Enclosures / Remarks</TableHead>
                  <TableHead className="w-24">Officer</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead className="text-right w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500 font-semibold">
                      Loading daily correspondence log...
                    </TableCell>
                  </TableRow>
                ) : records.length > 0 ? (
                  records.map((r, i) => (
                    <TableRow key={r.id || i} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-slate-600 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{r.date}</span>
                        <span className="text-[10px] text-slate-400">{r.time || '10:00 AM'}</span>
                      </TableCell>
                      <TableCell>
                        {r.type === 'INWARD' ? (
                          <Badge className="bg-orange-100 text-[#D85B10] border-orange-300 font-bold text-[10px]">
                            <Inbox className="mr-1 h-3 w-3" /> Inward
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-[#0B2B5E] border-blue-300 font-bold text-[10px]">
                            <Send className="mr-1 h-3 w-3" /> Outward
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                        {r.refNo}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-[#0B2B5E] block">
                          Folio #{r.folio}
                        </span>
                        <span className="text-slate-600 text-[11px] truncate block max-w-[180px]">
                          {r.company}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-900 block truncate max-w-[160px]">
                          {r.legalHeir || 'N/A'} {r.relation ? `(${r.relation})` : ''}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">
                          F/H: {r.shareholder || 'Late Shareholder'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-slate-700 text-[11px] block truncate font-medium">
                          {r.enclosures || 'Standard application'}
                        </span>
                        {r.remarks && (
                          <span className="text-slate-400 text-[10px] block truncate italic">
                            {r.remarks}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded border text-slate-700">
                          {r.assignedTo || 'ZA'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold ${
                          r.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          r.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          r.status === 'PROCESSED' ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                          'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Link href={`/letters?folio=${encodeURIComponent(r.folio)}&company=${encodeURIComponent(r.company)}&legalHeir=${encodeURIComponent(r.legalHeir || '')}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[11px] border-[#F37021] text-[#D85B10] hover:bg-orange-50 font-bold"
                          >
                            <FileSignature className="mr-1 h-3 w-3" />
                            Draft Letter
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      No correspondence entries found for the selected date filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* LOG NEW INWARD / OUTWARD LETTER DIALOG */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg border-t-4 border-t-[#F37021]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#F37021]" />
              Log Daily Correspondence Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record incoming transmission requests from legal heirs or outgoing response packages.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEntry} className="space-y-3 py-1 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Correspondence Type *</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E]"
                >
                  <option value="INWARD">INWARD (Received Mail)</option>
                  <option value="OUTWARD">OUTWARD (Dispatched)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Folio Number *</label>
                <Input
                  required
                  placeholder="e.g. 44058, 19316"
                  value={newFolio}
                  onChange={(e) => setNewFolio(e.target.value)}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Name *</label>
              <Input
                required
                placeholder="e.g. Oil & Gas Development Company Limited"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Deceased Shareholder</label>
                <Input
                  placeholder="e.g. Late Saiyed Ali"
                  value={newShareholder}
                  onChange={(e) => setNewShareholder(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Legal Heir / Applicant *</label>
                <Input
                  required
                  placeholder="e.g. Mr. Muhammad Ahmed"
                  value={newLegalHeir}
                  onChange={(e) => setNewLegalHeir(e.target.value)}
                  className="h-9 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Enclosed Documents / Subject</label>
              <Input
                placeholder="e.g. Written transmission request, CNIC copies, original certificates"
                value={newEnclosures}
                onChange={(e) => setNewEnclosures(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Officer</label>
                <select
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5"
                >
                  {OFFICERS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Relationship / Capacity</label>
                <Input
                  placeholder="e.g. Son, Daughter, Widow"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Remarks / Audit Note</label>
              <Input
                placeholder="e.g. Initial scrutiny done; awaiting formal legal heir response"
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs h-9 px-4"
              >
                {submitting ? "Logging..." : "Log Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
