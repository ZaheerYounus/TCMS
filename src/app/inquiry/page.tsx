"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Clock, 
  Calendar, 
  FileText, 
  Building2, 
  User, 
  Phone, 
  Archive, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Save, 
  History, 
  UserCheck, 
  MessageSquare, 
  ArrowRight,
  Send,
  Layers,
  ShieldCheck,
  Check,
  Plus,
  RotateCcw,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  FolderPlus,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  X,
  Info
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
import Link from "next/link";

// 4 Transmission Team Members
const TEAM_USERS = [
  { id: "ZA", name: "Zaheer Ahmed", role: "Team Lead / Registrar", color: "bg-blue-600" },
  { id: "AY", name: "Azib Yousuf", role: "Senior Transmission Officer", color: "bg-[#F37021]" },
  { id: "MS", name: "Muqaddas Sharif", role: "Transmission Officer", color: "bg-emerald-600" },
  { id: "ZJ", name: "Zohaib Jamal", role: "Operations Officer", color: "bg-purple-600" },
];

const STAGES = [
  { key: "reqRecDate", title: "1. Request Received", icon: FileText, color: "text-blue-600" },
  { key: "formSentDate", title: "2. Formalities Sent", icon: Send, color: "text-orange-500" },
  { key: "formRecDate", title: "3. Formalities Received", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "formSentAgain1", title: "4. Formalities Sent (R2)", icon: Send, color: "text-amber-500" },
  { key: "formRecAgain1", title: "5. Formalities Recv (R2)", icon: CheckCircle2, color: "text-emerald-500" },
  { key: "fwdCompDate", title: "6. Sent to Company", icon: Building2, color: "text-purple-600" },
  { key: "appRecDate", title: "7. Company Approved", icon: ShieldCheck, color: "text-purple-700" },
  { key: "fwdTransDate", title: "8. Sent to Transfer", icon: Layers, color: "text-cyan-600" },
  { key: "recTransDate", title: "9. Back from Transfer", icon: CheckCircle2, color: "text-cyan-700" },
  { key: "physAppFwdComp", title: "10. Sent for Signing", icon: FileText, color: "text-indigo-600" },
  { key: "sharesRecComp", title: "11. Signed Shares Recv", icon: CheckCircle2, color: "text-indigo-700" },
  { key: "sharesFwdDate", title: "12. Shares Delivered", icon: CheckCircle2, color: "text-emerald-700" },
];

function InquiryContent() {
  const searchParams = useSearchParams();
  const initialFolio = searchParams?.get("folio") || searchParams?.get("q") || "";

  const [activeUser, setActiveUser] = useState(TEAM_USERS[0]);
  const [searchFolio, setSearchFolio] = useState(initialFolio);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [caseRecord, setCaseRecord] = useState<any | null>(null);
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [showResultsTable, setShowResultsTable] = useState(true);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Update form fields
  const [editStatus, setEditStatus] = useState("");
  const [newDiscussionNote, setNewDiscussionNote] = useState("");
  const [dateUpdates, setDateUpdates] = useState<Record<string, string>>({});

  // In-Page Physical Filing Assignment Dialog state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignFileNo, setAssignFileNo] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [companyFiles, setCompanyFiles] = useState<any[]>([]);
  const [loadingCompanyFiles, setLoadingCompanyFiles] = useState(false);

  // Select a specific case to view full correspondence trail
  const selectCase = (c: any) => {
    setCaseRecord(c);
    setEditStatus(c.status || "Pending");
    setDateUpdates({
      reqRecDate: c.reqRecDate || "",
      formSentDate: c.formSentDate || "",
      formRecDate: c.formRecDate || "",
      fwdCompDate: c.fwdCompDate || "",
      appRecDate: c.appRecDate || "",
      fwdTransDate: c.fwdTransDate || "",
      recTransDate: c.recTransDate || "",
      physAppFwdComp: c.physAppFwdComp || "",
      sharesFwdDate: c.sharesFwdDate || "",
    });

    setTimeout(() => {
      const el = document.getElementById("case-details-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Perform search returning all matching folios in the series with aggressive cache-busting
  const performSearch = async (folioToSearch: string) => {
    if (!folioToSearch.trim()) return;
    setLoading(true);
    setSearchExecuted(true);
    try {
      const res = await fetch(`/api/mis?q=${encodeURIComponent(folioToSearch.trim())}&limit=50&_t=${Date.now()}`, { 
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      const recs = data?.records || [];
      setSearchResults(recs);

      // If exact match exists as only result, open it directly
      if (recs.length === 1 && String(recs[0].folio).toLowerCase().trim() === folioToSearch.toLowerCase().trim()) {
        selectCase(recs[0]);
        setShowResultsTable(false);
      } else if (recs.length > 0) {
        // If series search has matches (e.g. 122, 123), show the disambiguation list and select first by default
        selectCase(recs[0]);
        setShowResultsTable(true);
      } else {
        setCaseRecord(null);
        setShowResultsTable(false);
      }
    } catch (err) {
      console.error("Folio inquiry search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFolio) {
      performSearch(initialFolio);
    }
  }, [initialFolio]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchFolio);
  };

  const handleClearSearch = () => {
    setSearchFolio("");
    setSearchResults([]);
    setCaseRecord(null);
    setSearchExecuted(false);
    setShowResultsTable(false);
  };

  // Instant Auto-Save when status dropdown or quick pill is clicked
  const handleQuickStatusChange = async (newStatus: string) => {
    if (!caseRecord || !newStatus) return;
    setEditStatus(newStatus);
    setSaving(true);
    try {
      const payload = {
        caseId: caseRecord.caseId,
        folio: caseRecord.folio,
        company: caseRecord.company,
        status: newStatus,
        updates: dateUpdates,
        user: `${activeUser.name} (${activeUser.id})`,
        userId: activeUser.id,
        actionTitle: `Status updated to ${newStatus}`
      };

      const res = await fetch("/api/mis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();
      if (resJson.success && resJson.record) {
        const updated = {
          ...resJson.record,
          filingInfo: caseRecord.filingInfo
        };
        setCaseRecord(updated);
        setSearchResults(prev => prev.map(r => r.caseId === updated.caseId ? updated : r));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Auto-save status error:", e);
    } finally {
      setSaving(false);
    }
  };

  // Save case updates & audit note
  const handleSaveUpdates = async () => {
    if (!caseRecord) return;
    setSaving(true);
    try {
      const payload = {
        caseId: caseRecord.caseId,
        folio: caseRecord.folio,
        company: caseRecord.company,
        status: editStatus,
        updates: dateUpdates,
        discussionNote: newDiscussionNote,
        user: `${activeUser.name} (${activeUser.id})`,
        userId: activeUser.id,
        actionTitle: newDiscussionNote 
          ? `Logged discussion note & updated status to ${editStatus}`
          : `Status updated to ${editStatus}`
      };

      const res = await fetch("/api/mis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();
      if (resJson.success && resJson.record) {
        const updated = {
          ...resJson.record,
          filingInfo: caseRecord.filingInfo
        };
        setCaseRecord(updated);
        // Also update in searchResults list
        setSearchResults(prev => prev.map(r => r.caseId === updated.caseId ? updated : r));
        setNewDiscussionNote("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save updates to MIS database.");
    } finally {
      setSaving(false);
    }
  };

  // Open physical filing assignment modal with capacity recommendations
  const openAssignModal = async () => {
    if (!caseRecord) return;
    setIsAssignModalOpen(true);
    setAssignFileNo("");
    setAssignError("");
    setAssignSuccess(false);
    setLoadingCompanyFiles(true);

    try {
      // Find files for this specific company
      const compParam = caseRecord.company ? encodeURIComponent(caseRecord.company.split(' ')[0]) : "";
      const res = await fetch(`/api/filing?company=${compParam}`);
      const json = await res.json();
      const fls = json.files || [];
      setCompanyFiles(fls);

      // Auto-suggest top recommended available folder (<40 cases)
      const topAvailable = fls.find((f: any) => f.currentCases < 40);
      if (topAvailable) {
        setAssignFileNo(topAvailable.fileNo);
      }
    } catch (err) {
      console.error("Failed to load company filing folders:", err);
    } finally {
      setLoadingCompanyFiles(false);
    }
  };

  // Submit physical filing assignment
  const handleAssignFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    if (!caseRecord || !assignFileNo) return;

    // Check if target file is full
    const targetFile = companyFiles.find((f: any) => f.fileNo.toUpperCase().trim() === assignFileNo.toUpperCase().trim());
    if (targetFile && targetFile.currentCases >= 50) {
      setAssignError(`Selected folder is already full (50/50 cases). Please choose a folder with available capacity.`);
      return;
    }

    setAssigningLoading(true);
    try {
      const res = await fetch("/api/filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folio: caseRecord.folio,
          company: caseRecord.company,
          fileNo: assignFileNo,
          deceased: caseRecord.deceased,
          officer: activeUser.id
        })
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        setAssignError(resJson.error || "Failed to assign to physical file.");
      } else {
        // Also log this in case audit trail
        await fetch("/api/mis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId: caseRecord.caseId,
            folio: caseRecord.folio,
            user: `${activeUser.name} (${activeUser.id})`,
            userId: activeUser.id,
            actionTitle: `Assigned to Physical File: ${assignFileNo}`,
            discussionNote: `Registered folio in designated physical folder ${assignFileNo} by ${activeUser.name}`
          })
        });

        // Update local case state with filingInfo
        const updatedFilingInfo = [{
          fileNo: assignFileNo,
          letterDate: new Date().toISOString().split('T')[0],
          officer: activeUser.id,
          remarks: 'Registered from Case Inquiry'
        }];

        setCaseRecord({
          ...caseRecord,
          filingInfo: updatedFilingInfo
        });

        setAssignSuccess(true);
        setTimeout(() => {
          setIsAssignModalOpen(false);
          setAssignSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      setAssignError(err.message || "Network error occurred.");
    } finally {
      setAssigningLoading(false);
    }
  };

  const filingMatch = caseRecord?.filingInfo && caseRecord.filingInfo.length > 0 
    ? caseRecord.filingInfo[0] 
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top CDCSR Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-6 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#F37021] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                Case Inquiry &amp; Audit Trail
              </span>
              <span className="text-xs text-orange-200 font-medium">CDC Share Registrar Services Limited</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Single Folio Status &amp; Correspondence Tracker
            </h1>
            <p className="text-blue-100/80 text-xs mt-0.5">
              1-Click complaint resolution: Search any folio number or series to view all matching cases, complete 23-column timeline, physical filing, and audit logs.
            </p>
          </div>

          {/* Active Operator Switcher (Team of 4) */}
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-orange-300 block">Active Team Member</span>
              <span className="text-xs font-bold text-white">{activeUser.name} ({activeUser.id})</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
              {TEAM_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveUser(u)}
                  className={`h-7 w-7 rounded-md font-bold text-xs flex items-center justify-center transition-all ${
                    activeUser.id === u.id ? `${u.color} text-white shadow-md scale-105` : 'bg-white/10 text-blue-200 hover:bg-white/20'
                  }`}
                  title={`${u.name} - ${u.role}`}
                >
                  {u.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Instant Folio Search Bar */}
      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Folio or Series (e.g. 122, 123, 44058, 19316, 11814)..."
                value={searchFolio}
                onChange={(e) => setSearchFolio(e.target.value)}
                className="pl-9 pr-9 h-10 text-sm font-bold text-[#0B2B5E] focus-visible:ring-[#F37021]"
              />
              {searchFolio && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                  title="Clear Search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold h-10 px-6 shrink-0 shadow-sm w-full sm:w-auto"
            >
              <Search className="mr-1.5 h-4 w-4" />
              {loading ? "Searching Series..." : "Search Folios"}
            </Button>
            {searchFolio && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearSearch}
                className="h-10 px-4 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </form>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-500 overflow-x-auto">
            <span className="font-semibold text-slate-700">Quick Samples:</span>
            {["122", "123", "44058", "19316", "11814", "801058480", "25957", "90909"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => { setSearchFolio(f); performSearch(f); }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-orange-100 text-[#0B2B5E] font-mono font-bold transition-colors"
              >
                #{f}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SERIES DISAMBIGUATION RESULTS LIST */}
      {searchResults.length > 1 && (
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#F37021]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-[#F37021]" />
                  Matching Folios in Series &quot;{searchFolio}&quot; ({searchResults.length} Cases Found)
                </CardTitle>
                <CardDescription className="text-xs">
                  All matching cases in this folio series are displayed below. Select any case to inspect.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResultsTable(!showResultsTable)}
                className="text-xs font-bold h-7 border-slate-300 text-slate-700"
              >
                {showResultsTable ? "Hide Results List" : `Show All ${searchResults.length} Matches`}
              </Button>
            </div>
          </CardHeader>

          {showResultsTable && (
            <CardContent className="space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-700 bg-orange-50/70 p-2.5 rounded-lg border border-orange-200">
                <span className="flex items-center gap-1.5 font-bold text-orange-950">
                  <Info className="h-4 w-4 text-[#F37021] shrink-0" />
                  Click on any row or click "Inspect Case" to open full audit trail.
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                  Use horizontal scroll to inspect all columns &harr;
                </span>
              </div>

              {/* Table Container with Visible Horizontal Scrollbar */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[360px] overflow-y-auto shadow-inner scrollbar-thin scrollbar-thumb-[#F37021]/60 scrollbar-track-slate-100">
                <Table className="min-w-[920px]">
                  <TableHeader className="bg-slate-100 text-xs sticky top-0 z-20 shadow-xs border-b border-slate-200">
                    <TableRow>
                      <TableHead className="w-[110px] font-black text-slate-800">Folio #</TableHead>
                      <TableHead className="min-w-[220px] font-bold text-slate-800">Company</TableHead>
                      <TableHead className="min-w-[180px] font-bold text-slate-800">Deceased Shareholder</TableHead>
                      <TableHead className="min-w-[150px] font-bold text-slate-800">Applicant / Legal Heir</TableHead>
                      <TableHead className="w-[130px] font-bold text-slate-800">MIS Status</TableHead>
                      <TableHead className="w-[140px] font-bold text-slate-800">Physical Folder</TableHead>
                      <TableHead className="sticky right-0 bg-slate-200/95 backdrop-blur z-30 text-center w-[140px] border-l border-slate-300 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.12)] font-black text-[#0B2B5E]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {searchResults.map((c: any) => {
                      const isSelected = caseRecord?.caseId === c.caseId;
                      const hasFiling = c.filingInfo && c.filingInfo.length > 0;
                      return (
                        <TableRow 
                          key={c.caseId} 
                          onClick={() => selectCase(c)}
                          className={`group cursor-pointer transition-colors duration-150 ${
                            isSelected 
                              ? 'bg-orange-100/80 font-bold border-l-4 border-l-[#F37021]' 
                              : 'hover:bg-orange-50/60'
                          }`}
                        >
                          <TableCell className="font-mono font-black text-[#F37021] text-sm whitespace-nowrap">
                            #{c.folio}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">{c.company}</TableCell>
                          <TableCell className="text-slate-800">Late {c.deceased || 'N/A'}</TableCell>
                          <TableCell className="text-slate-600">{c.legalHeir || 'Heir'}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-bold whitespace-nowrap ${
                              c.isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-[#D85B10]'
                            }`}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasFiling ? (
                              <Badge className="bg-blue-100 text-[#0B2B5E] font-mono text-[10px] font-bold whitespace-nowrap">
                                {c.filingInfo[0].fileNo}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-[11px] whitespace-nowrap">Not in Files</span>
                            )}
                          </TableCell>
                          <TableCell className={`sticky right-0 z-10 text-center border-l border-slate-200 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)] transition-colors ${
                            isSelected ? 'bg-orange-100' : 'bg-white group-hover:bg-orange-50'
                          }`}>
                            <Button
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              onClick={(e) => { e.stopPropagation(); selectCase(c); }}
                              className={`h-7 px-3 text-xs font-bold shadow-2xs whitespace-nowrap ${
                                isSelected 
                                  ? 'bg-[#0B2B5E] text-white hover:bg-[#103a7a]' 
                                  : 'text-[#0B2B5E] border-blue-300 hover:bg-[#F37021] hover:text-white hover:border-[#F37021]'
                              }`}
                            >
                              {isSelected ? "Opened" : "Inspect Case"}
                              <ChevronRight className="ml-1 h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Main Results View */}
      {loading ? (
        <Card className="p-12 text-center text-slate-500 font-semibold text-sm">
          Searching comprehensive transmission lifecycle trail for Folio series &quot;{searchFolio}&quot;...
        </Card>
      ) : !caseRecord ? (
        <Card className="p-12 text-center text-slate-500 border-dashed">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700 text-sm">
            {searchExecuted ? `No Case Found for "${searchFolio}"` : "No Folio Searched Yet"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {searchExecuted 
              ? "No matching transmission cases found. Please verify the folio number."
              : "Enter a folio number or series above (e.g. 122, 123, 44058) to inspect full series matches and correspondence trail."}
          </p>
        </Card>
      ) : (
        <div id="case-details-section" className="space-y-6 pt-2">
          {/* Active Case Banner */}
          {searchResults.length > 1 && (
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0B2B5E]">Currently Inspecting:</span>
                <Badge className="bg-[#F37021] text-white font-mono font-bold">Folio #{caseRecord.folio}</Badge>
                <span className="text-slate-700 font-semibold">{caseRecord.company} &bull; Late {caseRecord.deceased}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResultsTable(true)}
                className="text-xs font-bold text-[#0B2B5E] hover:text-[#F37021] h-7"
              >
                Switch to another match in series ({searchResults.length} available) &rarr;
              </Button>
            </div>
          )}

          {/* Top Overview & Physical Filing Cross-Reference Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Case Particulars */}
            <Card className="lg:col-span-2 border-slate-200 shadow-sm border-l-4 border-l-[#0B2B5E]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#0B2B5E] text-white font-mono font-bold">{caseRecord.caseId}</Badge>
                    <span className="text-xs text-slate-500">MIS Transmission Register</span>
                  </div>
                  <Badge className={`font-bold text-xs ${
                    caseRecord.isClosed ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-[#D85B10]'
                  }`}>
                    {caseRecord.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-black text-slate-900 mt-1">
                  {caseRecord.company}
                </CardTitle>
                <CardDescription className="text-xs">
                  Folio # <span className="font-bold text-[#F37021] font-mono text-sm">{caseRecord.folio}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Deceased Shareholder:</span>
                    <strong className="text-slate-900 text-sm font-bold">Late {caseRecord.deceased || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Applicant / Legal Heir:</span>
                    <strong className="text-[#0B2B5E] text-sm font-bold">{caseRecord.legalHeir || 'Heir'}</strong>
                  </div>
                </div>

                {caseRecord.remarks && (
                  <div className="p-2.5 rounded-md bg-orange-50/70 border border-orange-200 text-xs">
                    <span className="font-bold text-orange-900 block mb-0.5">Latest MIS Remarks:</span>
                    <p className="text-slate-700">{caseRecord.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Physical Filing Status Card with In-Page Assignment */}
            <Card className="border-slate-200 shadow-sm border-l-4 border-l-[#F37021] flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Archive className="h-4 w-4 text-[#F37021]" />
                    Physical Filing Registry
                  </CardTitle>
                  {filingMatch ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                      Filed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">
                      Not in Files
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Cross-referenced with physical filing records
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1">
                {filingMatch ? (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Designated Folder:</span>
                      <strong className="text-[#0B2B5E] font-mono text-sm font-bold">{filingMatch.fileNo}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Letter Filing Date:</span>
                      <span className="font-mono text-slate-800 font-semibold">{filingMatch.letterDate || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Filing Staff:</span>
                      <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">{filingMatch.officer || 'ZA'}</span>
                    </div>
                    {filingMatch.remarks && (
                      <p className="text-[11px] text-slate-600 border-t pt-1.5 italic">
                        &quot;{filingMatch.remarks}&quot;
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold">No Physical Folder Assigned</p>
                    <p className="text-[11px] text-slate-600">This folio is not indexed in physical folders yet. You can assign it to an available folder below.</p>
                  </div>
                )}

                {/* 1-Click Action to Open or Assign */}
                {filingMatch ? (
                  <Link href={`/filing?q=${encodeURIComponent(caseRecord.folio)}`} className="w-full">
                    <Button className="w-full bg-[#0B2B5E] hover:bg-[#103a7a] text-white text-xs font-bold h-9">
                      <Archive className="mr-1.5 h-3.5 w-3.5 text-[#F37021]" />
                      Open in Filing ({filingMatch.fileNo})
                      <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={openAssignModal}
                    className="w-full bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold h-9 shadow-sm"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Assign to Physical Folder Now
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 23-Column Chronological Correspondence Trail (Visual Step Timeline) */}
          <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#F37021]" />
                    Complete Chronological Correspondence Trail
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Every recorded action from initial letter receipt to share transmission and dividend delivery
                  </CardDescription>
                </div>
                <Badge className="bg-slate-100 text-slate-700 font-mono text-[11px]">
                  12 Key Milestones
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {STAGES.map((st) => {
                  const stageDate = caseRecord[st.key] || "";
                  const hasDate = Boolean(stageDate && stageDate !== "-" && stageDate !== "Not Recorded");

                  return (
                    <div 
                      key={st.key}
                      className={`p-3 rounded-xl border transition-all ${
                        hasDate 
                          ? 'bg-white border-blue-200 shadow-2xs hover:border-[#F37021]' 
                          : 'bg-slate-50/50 border-slate-200/70 opacity-65'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-700 truncate">{st.title}</span>
                        <st.icon className={`h-3.5 w-3.5 ${hasDate ? st.color : 'text-slate-400'}`} />
                      </div>
                      <div className="font-mono text-xs font-bold">
                        {hasDate ? (
                          <span className="text-[#0B2B5E] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {stageDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal">Pending / Not Occurred</span>
                        )}
                      </div>
                      
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Live Update Form & Discussion Logger */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Update Controls */}
            <Card className="lg:col-span-7 border-slate-200 shadow-sm border-t-4 border-t-[#F37021]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Save className="h-4 w-4 text-[#F37021]" />
                      Update Case Status &amp; Log Actions
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Changes will be persisted immediately to MIS database under user &quot;{activeUser.name}&quot;
                    </CardDescription>
                  </div>
                  {saveSuccess && (
                    <Badge className="bg-emerald-600 text-white font-bold text-xs animate-bounce">
                      Saved to Database!
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Update Status:</label>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ⚡ Auto-Saves to DB
                        </span>
                      </div>
                      <select
                        value={editStatus}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditStatus(val);
                          handleQuickStatusChange(val);
                        }}
                        className="w-full h-8 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E] focus:ring-[#F37021] focus:border-[#F37021]"
                      >
                        <option value="Pending">Pending (Action with Us)</option>
                        <option value="Waiting">Waiting (Awaiting Legal Heirs)</option>
                        <option value="Custody Items Awaited">Custody Items Awaited</option>
                        <option value="Partially Closed">Partially Closed (Shares Delivered, Residual Pending)</option>
                        <option value="Co. - Case Review & Approval">Co. - Case Review &amp; Approval</option>
                        <option value="Co. - Signing">Co. - Signing</option>
                        <option value="In Transfer">In Transfer (CDS System Entry)</option>
                        <option value="Case Closed">Case Closed (Transmitted &amp; Delivered)</option>
                        <option value="Co. - Dividend Payment">Co. - Dividend Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Active Signing Officer:</label>
                      <select
                        value={activeUser.id}
                        onChange={(e) => {
                          const u = TEAM_USERS.find(user => user.id === e.target.value);
                          if (u) setActiveUser(u);
                        }}
                        className="w-full h-8 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E] focus:ring-[#F37021]"
                      >
                        {TEAM_USERS.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.id}) - {u.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 1-Click Quick Status Action Pills */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">1-Click Quick Status Updates:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Pending", val: "Pending", color: "hover:bg-orange-600 bg-orange-500 text-white" },
                        { label: "Partially Closed", val: "Partially Closed", color: "hover:bg-teal-700 bg-teal-600 text-white" },
                        { label: "Waiting", val: "Waiting", color: "hover:bg-amber-600 bg-amber-500 text-white" },
                        { label: "Custody Items Awaited", val: "Custody Items Awaited", color: "hover:bg-purple-600 bg-purple-500 text-white" },
                        { label: "Co. Signing", val: "Co. - Signing", color: "hover:bg-cyan-700 bg-cyan-600 text-white" },
                        { label: "Co. Approval", val: "Co. - Case Review & Approval", color: "hover:bg-indigo-700 bg-indigo-600 text-white" },
                        { label: "In Transfer", val: "In Transfer", color: "hover:bg-blue-700 bg-blue-600 text-white" },
                        { label: "Case Closed", val: "Case Closed", color: "hover:bg-emerald-700 bg-emerald-600 text-white" },
                      ].map((btn) => (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => handleQuickStatusChange(btn.val)}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition-all shadow-2xs ${
                            editStatus === btn.val 
                              ? `${btn.color} ring-2 ring-offset-1 ring-slate-400 font-extrabold scale-105` 
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          {editStatus === btn.val && "✓ "}
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Dates Quick Editor */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block">Milestone Dates Editor:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Formalities Sent Date:</span>
                      <Input
                        type="date"
                        value={dateUpdates.formSentDate || ""}
                        onChange={(e) => setDateUpdates({ ...dateUpdates, formSentDate: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Forwarded to Company:</span>
                      <Input
                        type="date"
                        value={dateUpdates.fwdCompDate || ""}
                        onChange={(e) => setDateUpdates({ ...dateUpdates, fwdCompDate: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Shares Delivered Date:</span>
                      <Input
                        type="date"
                        value={dateUpdates.sharesFwdDate || ""}
                        onChange={(e) => setDateUpdates({ ...dateUpdates, sharesFwdDate: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Call / Discussion Note */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#F37021]" />
                    Log Discussion or Investigation Note:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Discussed with applicant on phone, explained that succession certificate is awaited from court. Follow-up scheduled for next week..."
                    value={newDiscussionNote}
                    onChange={(e) => setNewDiscussionNote(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-[#F37021] focus:border-[#F37021]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    onClick={handleSaveUpdates}
                    disabled={saving}
                    className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-md h-9 px-5"
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {saving ? "Saving to MIS Database..." : "Save & Sync to MIS Database"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: User Audit Trail Log */}
            <Card className="lg:col-span-5 border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <History className="h-4 w-4 text-[#0B2B5E]" />
                      Audit Trail &amp; Team Logs
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Recorded activity by transmission team members
                    </CardDescription>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 text-[10px] font-mono">
                    {caseRecord.auditTrail?.length || 0} Actions Logged
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[420px] overflow-y-auto pt-1">
                {caseRecord.auditTrail && caseRecord.auditTrail.length > 0 ? (
                  caseRecord.auditTrail.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-[#0B2B5E] text-white text-[10px] font-bold flex items-center justify-center">
                            {log.userId || log.user?.split(' ')?.[0]?.[0] || 'U'}
                          </span>
                          <span className="font-bold text-slate-900">{log.user || 'Team Member'}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                      </div>
                      <p className="font-semibold text-[#0B2B5E] text-xs pt-0.5">{log.action}</p>
                      {log.note && (
                        <p className="text-slate-600 text-[11px] bg-white p-2 rounded border border-slate-200 mt-1">
                          &quot;{log.note}&quot;
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                    <UserCheck className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="font-bold text-xs text-slate-600">No User Audit Logs Yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Any status updates, discussion notes or file assignments you save will automatically be logged here with your user ID.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SMART PHYSICAL FILE ASSIGNMENT DIALOG WITH PRIORITY & 50-LIMIT PROTECTION */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-[#F37021]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2B5E] flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#F37021]" />
              Assign Folio to Physical File
            </DialogTitle>
            <DialogDescription className="text-xs">
              Designate a physical folder for Folio #{caseRecord?.folio} ({caseRecord?.company}). System prioritizes folders with available capacity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignFileSubmit} className="space-y-3 py-1 text-xs">
            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Folio Number:</span>
                <strong className="text-[#F37021] font-mono text-sm font-bold">#{caseRecord?.folio}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Company:</span>
                <strong className="text-[#0B2B5E] font-semibold">{caseRecord?.company}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Deceased:</span>
                <span className="text-slate-700">Late {caseRecord?.deceased || 'N/A'}</span>
              </div>
            </div>

            {/* Smart Folder Selector categorized by Capacity */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Select Physical Folder *:
              </label>

              {loadingCompanyFiles ? (
                <div className="p-3 text-center text-slate-400 text-xs">
                  Loading company filing folders...
                </div>
              ) : companyFiles.length > 0 ? (
                <select
                  value={assignFileNo}
                  onChange={(e) => {
                    setAssignFileNo(e.target.value);
                    setAssignError("");
                  }}
                  required
                  className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E] focus:ring-[#F37021]"
                >
                  <option value="">-- Choose Designated Folder --</option>
                  
                  {/* Group 1: Available Folders (<40 cases) - TOP PRIORITY */}
                  <optgroup label="⭐ RECOMMENDED (Available Capacity)">
                    {companyFiles
                      .filter((f: any) => f.currentCases < 40)
                      .map((f: any) => (
                        <option key={f.fileNo} value={f.fileNo} className="text-emerald-800 font-bold">
                          {f.fileNo} • {f.currentCases}/50 cases ({50 - f.currentCases} slots available)
                        </option>
                      ))}
                  </optgroup>

                  {/* Group 2: Warning Folders (40-49 cases) */}
                  {companyFiles.some((f: any) => f.currentCases >= 40 && f.currentCases < 50) && (
                    <optgroup label="⚠️ CAUTION (Near Capacity)">
                      {companyFiles
                        .filter((f: any) => f.currentCases >= 40 && f.currentCases < 50)
                        .map((f: any) => (
                          <option key={f.fileNo} value={f.fileNo} className="text-amber-800">
                            {f.fileNo} • {f.currentCases}/50 cases ({50 - f.currentCases} slots left)
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {/* Group 3: FULL Folders (>=50 cases) - LOCKED & DISABLED */}
                  {companyFiles.some((f: any) => f.currentCases >= 50) && (
                    <optgroup label="❌ FULL &amp; LOCKED (No Slots Left)">
                      {companyFiles
                        .filter((f: any) => f.currentCases >= 50)
                        .map((f: any) => (
                          <option key={f.fileNo} value={f.fileNo} disabled className="text-red-500 bg-red-50">
                            {f.fileNo} • {f.currentCases}/50 cases [FULL - 50/50 cases]
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <Input
                  placeholder="e.g. HBL - FILE # 02, OGDC - FILE # 06"
                  value={assignFileNo}
                  onChange={(e) => {
                    setAssignFileNo(e.target.value);
                    setAssignError("");
                  }}
                  required
                  className="h-9 text-xs"
                />
              )}

              {/* Create new folder button */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Want to start a new volume?</span>
                <button
                  type="button"
                  onClick={() => {
                    const prefix = caseRecord?.company ? caseRecord.company.split(' ')[0] : 'FILE';
                    setAssignFileNo(`${prefix} - FILE # ${Math.floor(Math.random() * 40) + 10}`);
                  }}
                  className="text-[#F37021] font-bold hover:underline"
                >
                  + Generate New File ID
                </button>
              </div>
            </div>

            {/* Error / Caution Banner if Full Folder is chosen */}
            {assignError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-bold flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{assignError}</span>
              </div>
            )}

            {/* Success Message */}
            {assignSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                Folio successfully assigned and filed!
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={assigningLoading || Boolean(assignError)}
                className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-sm"
              >
                {assigningLoading ? "Registering..." : "Save & Assign to Physical File"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CaseInquiryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold text-xs">Loading case inquiry system...</div>}>
      <InquiryContent />
    </Suspense>
  );
}
