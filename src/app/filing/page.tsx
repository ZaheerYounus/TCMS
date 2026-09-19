"use client";

import { useState, useEffect, useTransition, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Folder, 
  Search, 
  Archive, 
  AlertTriangle, 
  CheckCircle2, 
  CheckCircle,
  FileText, 
  ArrowRight, 
  X, 
  Plus, 
  Layers,
  Building2,
  Check,
  RotateCcw,
  AlertCircle,
  FolderPlus,
  ShieldAlert,
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

function FilingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";

  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState<"all" | "critical" | "warning" | "healthy">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [companySearch, setCompanySearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Full folder inspect dialog state
  const [inspectFolder, setInspectFolder] = useState<any | null>(null);
  const [folderCases, setFolderCases] = useState<any[]>([]);
  const [loadingFolderCases, setLoadingFolderCases] = useState(false);

  // Assign file dialog state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignFolio, setAssignFolio] = useState("");
  const [assignCompany, setAssignCompany] = useState("");
  const [assignFileNo, setAssignFileNo] = useState("");
  const [assignDeceased, setAssignDeceased] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchFilingData = (fType: string, q: string, comp: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/filing?q=${encodeURIComponent(q.trim())}&filter=${fType}&company=${encodeURIComponent(comp)}`);
        const resJson = await res.json();
        setData(resJson);
      } catch (err) {
        console.error("Failed to load filing data:", err);
      }
    });
  };

  useEffect(() => {
    fetchFilingData(filterType, searchQuery, companyFilter);
  }, [filterType, companyFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilingData(filterType, searchQuery, companyFilter);
  };

  // Dedicated instant clear search handler
  const handleClearSearch = () => {
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("q");
      window.history.replaceState({}, "", url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""));
    }
    fetchFilingData(filterType, "", companyFilter);
  };

  const openFolderInspection = async (folder: any) => {
    setInspectFolder(folder);
    setLoadingFolderCases(true);
    try {
      const res = await fetch(`/api/filing?inspectFile=${encodeURIComponent(folder.fileNo)}`);
      const json = await res.json();
      setFolderCases(json.cases || []);
    } catch (err) {
      console.error("Failed to inspect folder:", err);
      setFolderCases(folder.cases || []);
    } finally {
      setLoadingFolderCases(false);
    }
  };

  // Open assign dialog with pre-filled folio (and auto-fetch MIS particulars)
  const openAssignWithFolio = async (folioToAssign: string) => {
    setAssignFolio(folioToAssign);
    setAssignFileNo("");
    setAssignError("");
    setAssignSuccess(false);

    // Try to auto-populate from MIS if available
    try {
      const res = await fetch(`/api/mis?q=${encodeURIComponent(folioToAssign)}&limit=1`);
      const misData = await res.json();
      if (misData.records && misData.records.length > 0) {
        const rec = misData.records[0];
        setAssignCompany(rec.company || "");
        setAssignDeceased(rec.deceased ? `Late ${rec.deceased}` : "");
      }
    } catch (e) {}

    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    if (!assignFolio || !assignFileNo) {
      setAssignError("Folio and File Number are required.");
      return;
    }

    // Check if target file is full in existing files
    const allFiles = data?.files || [];
    const targetFile = allFiles.find((f: any) => f.fileNo.toUpperCase().trim() === assignFileNo.toUpperCase().trim());
    if (targetFile && targetFile.currentCases >= 50) {
      setAssignError(`یہ فائل ${assignFileNo} پہلے ہی فل ہے (50/50 کیسز)۔ اس میں مزید کیسز الاؤڈ نہیں ہیں۔ برائے مہربانی دستیاب فائل منتخب کریں۔`);
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch('/api/filing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio: assignFolio,
          company: assignCompany || (targetFile ? targetFile.company : 'CDCSR Issuer'),
          fileNo: assignFileNo,
          deceased: assignDeceased
        })
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        setAssignError(resJson.error || "Failed to assign folio to file.");
      } else {
        setAssignSuccess(true);
        setTimeout(() => {
          setIsAssignOpen(false);
          setAssignSuccess(false);
          setAssignFolio("");
          setAssignFileNo("");
          fetchFilingData(filterType, searchQuery, companyFilter);
        }, 1200);
      }
    } catch (e: any) {
      setAssignError(e.message || "Network error occurred.");
    } finally {
      setIsAssigning(false);
    }
  };

  const criticalCount = data?.criticalCount || 30;
  const warningCount = data?.warningCount || 47;
  const healthyCount = data?.healthyCount || 399;
  const totalFiles = data?.totalPhysicalFiles || 476;
  const totalCasesInFiling = data?.totalRecords || 11481;

  const files = data?.files || [];
  const matchedRecords = data?.matchedRecords || [];
  const allCompanies: any[] = data?.companies || [];

  // Filtered companies for dropdown / search
  const filteredCompaniesList = useMemo(() => {
    if (!companySearch.trim()) return allCompanies;
    const q = companySearch.toLowerCase().trim();
    return allCompanies.filter((c: any) => c.company.toLowerCase().includes(q));
  }, [allCompanies, companySearch]);

  // Selected company summary stats
  const activeCompanyData = useMemo(() => {
    if (companyFilter === "ALL") return null;
    return allCompanies.find((c: any) => c.company.toUpperCase().trim() === companyFilter.toUpperCase().trim());
  }, [allCompanies, companyFilter]);

  // Available files for the assign modal
  const assignModalAvailableFiles = useMemo(() => {
    if (!data?.files) return [];
    if (!assignCompany) return data.files;
    return data.files.filter((f: any) => 
      f.company.toUpperCase().includes(assignCompany.toUpperCase()) ||
      assignCompany.toUpperCase().includes(f.company.toUpperCase())
    );
  }, [data?.files, assignCompany]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Physical Filing Management</h2>
            <Badge className="bg-[#0B2B5E] text-white font-bold">{totalFiles} Folders Tracked</Badge>
            <Badge className="bg-orange-100 text-[#D85B10] border-orange-200 font-bold">{totalCasesInFiling.toLocaleString()} Filed Cases</Badge>
            <Badge className="bg-blue-100 text-[#0B2B5E] border-blue-200 font-bold">{allCompanies.length} Client Companies</Badge>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Physical folder registry &amp; volume capacity monitor (Standard Limit: 50 cases per folder). Search any folio or browse any client company.
          </p>
        </div>
        <Button 
          onClick={() => {
            setAssignFolio("");
            setAssignFileNo("");
            setAssignCompany(companyFilter !== "ALL" ? companyFilter : "");
            setAssignDeceased("");
            setAssignError("");
            setIsAssignOpen(true);
          }}
          className="bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Assign Folio to Physical File
        </Button>
      </div>

      {/* Capacity KPI Monitor Cards (50 Cases Standard Limit) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          onClick={() => setFilterType(filterType === "critical" ? "all" : "critical")}
          className={`cursor-pointer transition-all duration-150 border-l-4 border-l-red-500 ${filterType === 'critical' ? 'ring-2 ring-red-500 shadow-md bg-red-50/30' : 'hover:shadow-md'}`}
        >
          <CardContent className="flex items-center p-5 gap-4">
            <div className="p-3 bg-red-100 rounded-xl text-red-600 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Full Folders (&ge;50 Cases / گنجائش ختم)</p>
              <h3 className="text-2xl font-black text-red-900 mt-0.5">{criticalCount} Folders</h3>
              <p className="text-xs text-red-600 mt-0.5 font-semibold">FULL &bull; مزید کیسز نہ ڈالیں (Do Not Assign)</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setFilterType(filterType === "warning" ? "all" : "warning")}
          className={`cursor-pointer transition-all duration-150 border-l-4 border-l-amber-500 ${filterType === 'warning' ? 'ring-2 ring-amber-500 shadow-md bg-amber-50/30' : 'hover:shadow-md'}`}
        >
          <CardContent className="flex items-center p-5 gap-4">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Near Capacity (40-49 Cases / قریب الختم)</p>
              <h3 className="text-2xl font-black text-amber-900 mt-0.5">{warningCount} Folders</h3>
              <p className="text-xs text-amber-700 mt-0.5">Approaching limit &bull; 1 to 10 slots remaining</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setFilterType(filterType === "healthy" ? "all" : "healthy")}
          className={`cursor-pointer transition-all duration-150 border-l-4 border-l-emerald-600 ${filterType === 'healthy' ? 'ring-2 ring-emerald-500 shadow-md bg-emerald-50/30' : 'hover:shadow-md'}`}
        >
          <CardContent className="flex items-center p-5 gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Available Space (&lt;40 Cases / گنجائش موجود ہے)</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-0.5">{healthyCount} Folders</h3>
              <p className="text-xs text-emerald-700 mt-0.5 font-semibold">Space available &bull; Safe to assign new cases</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALL COMPANIES SELECTOR & DIRECTORY BROWSER */}
      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#F37021]" />
                Browse Files by Client Company (تمام 134 کمپنیوں کی لسٹ)
              </CardTitle>
              <CardDescription className="text-xs">
                Select any client company to view all its physical folders and capacity status.
              </CardDescription>
            </div>

            {/* Quick Searchable Dropdown for All 134 Companies */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full h-8 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E] focus:ring-[#F37021] focus:border-[#F37021]"
                >
                  <option value="ALL">-- ALL CLIENT COMPANIES ({allCompanies.length} کل کمپنیاں) --</option>
                  {allCompanies.map((c: any) => (
                    <option key={c.company} value={c.company}>
                      {c.company} ({c.totalFiles} Files &bull; {c.availableFiles} Available, {c.fullFiles} Full)
                    </option>
                  ))}
                </select>
              </div>

              {companyFilter !== "ALL" && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCompanyFilter("ALL")}
                  className="h-8 text-xs text-slate-500 hover:text-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Quick Popular Company Shortcut Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2 text-xs">
            <span className="text-slate-500 font-bold shrink-0">Top Companies:</span>
            {["ALL", "HBL", "OGDC", "ABL", "SNGP", "PSO", "DLL", "INDU", "FATIMA", "ENGRO", "BAHL", "MCB", "FFC"].map((c) => {
              const compStat = allCompanies.find(ac => ac.company === c);
              const isSelected = companyFilter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompanyFilter(c)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 ${
                    isSelected 
                      ? 'bg-[#0B2B5E] text-white shadow-sm ring-1 ring-[#0B2B5E]' 
                      : 'bg-slate-100 text-slate-700 hover:bg-orange-100 hover:text-[#D85B10]'
                  }`}
                >
                  {c} {compStat ? `(${compStat.totalFiles})` : ""}
                </button>
              );
            })}
          </div>

          {/* Selected Company Profile Banner */}
          {activeCompanyData && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-orange-50/60 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-[#F37021] tracking-wider block">Selected Client Company</span>
                <strong className="text-[#0B2B5E] text-base font-black">{activeCompanyData.company}</strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {activeCompanyData.totalCases.toLocaleString()} cases filed across {activeCompanyData.totalFiles} physical volumes.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-center">
                  <span className="block text-xs font-black">{activeCompanyData.availableFiles} Available</span>
                  <span className="text-[9px] font-bold text-emerald-700">گنجائش موجود ہے</span>
                </div>
                {activeCompanyData.warningFiles > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 text-center">
                    <span className="block text-xs font-black">{activeCompanyData.warningFiles} Almost Full</span>
                    <span className="text-[9px] font-bold text-amber-700">40-49 کیسز</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-lg bg-red-100/80 border border-red-300 text-red-900 text-center">
                  <span className="block text-xs font-black">{activeCompanyData.fullFiles} Full</span>
                  <span className="text-[9px] font-bold text-red-700">گنجائش ختم</span>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* SEARCH BAR WITH INSTANT CLEAR BUTTON */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search Folio # (e.g. 44058, 6066), Folder ID (e.g. HBL - FILE # 02), or Deceased name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs font-semibold focus-visible:ring-[#F37021]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 h-5 w-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                  title="Clear Search (ہٹائیں)"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-[#F37021] hover:bg-[#D85B10] text-white h-10 px-5 text-xs font-bold shadow-sm shrink-0 w-full sm:w-auto">
              <Search className="mr-1.5 h-3.5 w-3.5" />
              Locate Folio
            </Button>
            {searchQuery && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClearSearch}
                className="h-10 px-4 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Clear (ریسیٹ کریں)
              </Button>
            )}
          </form>

          {/* If folio searched but NOT found in physical filing */}
          {searchQuery && matchedRecords.length === 0 && !isPending && (
            <div className="mt-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="text-amber-900 font-bold block">
                    Folio #{searchQuery} is not currently filed in any physical folder!
                  </strong>
                  <span className="text-amber-700 text-[11px]">
                    یہ فولیو فزیکل فائلنگ ریکارڈ میں موجود نہیں ہے۔ آپ اسے ابھی کسی دستیاب فائل میں اسائن کر سکتے ہیں۔
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button 
                  onClick={() => openAssignWithFolio(searchQuery)}
                  className="bg-[#F37021] hover:bg-[#D85B10] text-white text-xs font-bold h-8 px-4 shadow-sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Assign Folio #{searchQuery} Now (فائل میں ایڈ کریں)
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSearch}
                  className="h-8 text-xs text-slate-500 hover:text-slate-800"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear Search
                </Button>
              </div>
            </div>
          )}

          {/* Matched Folios Box with Instant Clear Button */}
          {matchedRecords.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-50/90 to-blue-50/70 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D85B10] flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-[#F37021]" />
                  Exact Folio Physical Locations Found in Filing ({matchedRecords.length})
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearSearch}
                  className="text-xs h-7 text-slate-600 hover:text-red-600 hover:bg-red-50 font-bold"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> Clear Search (فولیو رزلٹ ہٹائیں)
                </Button>
              </div>
              <div className="border rounded-lg bg-white max-h-[240px] overflow-y-auto shadow-inner">
                <Table>
                  <TableHeader className="bg-slate-50 text-xs">
                    <TableRow>
                      <TableHead>Folio #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Deceased Shareholder</TableHead>
                      <TableHead>Physical File Number</TableHead>
                      <TableHead>Filing / Letter Date</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead className="text-right">Folder Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {matchedRecords.map((rec: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-orange-50/40">
                        <TableCell className="font-mono font-bold text-[#F37021] text-sm">{rec.folio}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{rec.company}</TableCell>
                        <TableCell>{rec.deceased || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className="bg-[#0B2B5E] text-white text-[11px] font-mono font-bold">
                            {rec.fileNo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-slate-500">{rec.letterDate || 'Recorded'}</TableCell>
                        <TableCell>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border">
                            {rec.officer || 'ZA'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFolderInspection({ fileNo: rec.fileNo, company: rec.company, currentCases: 1 })}
                            className="h-7 text-[11px] font-bold text-[#0B2B5E] border-blue-200 hover:bg-blue-50"
                          >
                            Inspect Volume ({rec.fileNo})
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Physical Folders Directory Table */}
      <Card className="border-slate-200 shadow-sm border-t-4 border-t-[#0B2B5E]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#0B2B5E]" />
                Physical Folders Directory ({files.length} Volumes Shown)
              </CardTitle>
              <CardDescription className="text-xs">
                Capacity limit enforced: Maximum 50 cases per physical folder volume.
              </CardDescription>
            </div>
            {companyFilter !== "ALL" && (
              <Badge className="bg-[#0B2B5E] text-white font-mono text-xs">
                Filter: {companyFilter}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[220px]">Physical File Number</TableHead>
                  <TableHead>Client Company</TableHead>
                  <TableHead className="text-center">Total Cases Filed</TableHead>
                  <TableHead className="text-center">Limit</TableHead>
                  <TableHead>Capacity Status</TableHead>
                  <TableHead>Action Recommendation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500 font-semibold">
                      Loading physical folders directory...
                    </TableCell>
                  </TableRow>
                ) : files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      No physical folders found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((f: any, idx: number) => {
                    const capacityLimit = 50;
                    const percentage = Math.round((f.currentCases / capacityLimit) * 100);
                    const isCritical = f.currentCases >= 50;
                    const isWarning = f.currentCases >= 40 && f.currentCases < 50;
                    const remainingSlots = Math.max(0, capacityLimit - f.currentCases);

                    return (
                      <TableRow key={idx} className="hover:bg-slate-50">
                        <TableCell className="font-mono font-bold text-slate-900 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-[#0B2B5E]" />
                          {f.fileNo}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-800 text-xs">{f.company}</TableCell>
                        <TableCell className="text-center font-bold text-slate-900 text-xs">{f.currentCases} Cases</TableCell>
                        <TableCell className="text-center text-slate-500 text-xs font-mono">50</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-full ${isCritical ? 'bg-red-500' : isWarning ? 'bg-[#F37021]' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono">
                              {percentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isCritical ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300 font-bold text-[10px]">
                              FULL / مزید کیسز نہ ڈالیں
                            </Badge>
                          ) : isWarning ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                              ALMOST FULL / {remainingSlots} باقی ہیں
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                              AVAILABLE / {remainingSlots} خالی ہیں
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openFolderInspection(f)}
                            className="text-xs text-[#0B2B5E] hover:text-[#F37021] font-bold"
                          >
                            Inspect Cases ({f.currentCases})
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Folder Cases Inspection Dialog */}
      <Dialog open={!!inspectFolder} onOpenChange={(open) => !open && setInspectFolder(null)}>
        <DialogContent className="max-w-3xl border-t-4 border-t-[#0B2B5E]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-lg font-bold text-[#0B2B5E] flex items-center gap-2">
                  <Folder className="h-5 w-5 text-[#F37021]" />
                  {inspectFolder?.fileNo}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Client: <strong className="text-slate-800 font-semibold">{inspectFolder?.company}</strong> &bull; Total Cases in Volume: <strong className="text-[#F37021] font-mono font-bold">{folderCases.length}</strong>
                </DialogDescription>
              </div>
              <Badge className={`text-xs font-bold ${
                inspectFolder?.currentCases >= 50 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : inspectFolder?.currentCases >= 40 
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                {inspectFolder?.currentCases >= 50 ? 'FULL (50/50)' : `${Math.max(0, 50 - (inspectFolder?.currentCases || 0))} Slots Left`}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              All Cases &amp; Folios Filed in this Volume ({folderCases.length}):
            </h4>
            <div className="border rounded-lg max-h-[380px] overflow-y-auto shadow-inner">
              <Table>
                <TableHeader className="bg-slate-50 text-xs sticky top-0">
                  <TableRow>
                    <TableHead>Folio #</TableHead>
                    <TableHead>Deceased Shareholder</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date Filed</TableHead>
                    <TableHead>Officer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {loadingFolderCases ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 font-semibold">
                        Retrieving all cases from physical filing database...
                      </TableCell>
                    </TableRow>
                  ) : folderCases.length > 0 ? (
                    folderCases.map((c: any, i: number) => (
                      <TableRow key={i} className="hover:bg-slate-50">
                        <TableCell className="font-mono font-bold text-[#F37021]">{c.folio}</TableCell>
                        <TableCell className="font-semibold text-slate-800">{c.deceased || 'N/A'}</TableCell>
                        <TableCell>{c.company}</TableCell>
                        <TableCell className="font-mono text-slate-500">{c.letterDate || c.date || 'Recorded'}</TableCell>
                        <TableCell>
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border">
                            {c.officer || 'ZA'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                        No case detail records available for this file.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMART ASSIGN FOLIO TO PHYSICAL FILE DIALOG (50-CASES LIMIT ENFORCED) */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md border-t-4 border-t-[#F37021]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0B2B5E] flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-[#F37021]" />
              Assign Folio to Physical File
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a folio in a designated physical file folder. Folders at 50 capacity cannot accept new cases.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSubmit} className="space-y-3 py-1 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-0.5">Folio Number * (فولیو نمبر)</label>
              <Input 
                placeholder="e.g. 44058, 240920" 
                value={assignFolio}
                onChange={(e) => setAssignFolio(e.target.value)}
                required
                className="h-9 text-xs font-mono font-bold text-[#0B2B5E]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-0.5">Company Name (کمپنی)</label>
              <select
                value={assignCompany}
                onChange={(e) => {
                  setAssignCompany(e.target.value);
                  setAssignFileNo("");
                }}
                className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5"
              >
                <option value="">-- Select Company --</option>
                {allCompanies.map((c: any) => (
                  <option key={c.company} value={c.company}>
                    {c.company} ({c.availableFiles} Available folders)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-0.5">Deceased Shareholder Name</label>
              <Input 
                placeholder="e.g. Late Saiyed Ali" 
                value={assignDeceased}
                onChange={(e) => setAssignDeceased(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Smart Folder Selector with 50-limit locking */}
            <div>
              <label className="font-bold text-slate-700 block mb-0.5">
                Designated Physical File * (دستیاب فائل منتخب کریں)
              </label>

              {assignModalAvailableFiles.length > 0 ? (
                <select
                  value={assignFileNo}
                  onChange={(e) => {
                    setAssignFileNo(e.target.value);
                    setAssignError("");
                  }}
                  required
                  className="w-full h-9 text-xs font-bold rounded-lg border border-slate-300 bg-white px-2.5 text-[#0B2B5E]"
                >
                  <option value="">-- Select an Available Folder --</option>
                  {assignModalAvailableFiles.map((f: any) => {
                    const isFull = f.currentCases >= 50;
                    const remaining = Math.max(0, 50 - f.currentCases);
                    return (
                      <option 
                        key={f.fileNo} 
                        value={f.fileNo}
                        disabled={isFull}
                        className={isFull ? "text-red-500 bg-red-50 font-bold" : "text-slate-900"}
                      >
                        {f.fileNo} &bull; {f.currentCases}/50 cases {isFull ? "[FULL - گنجائش ختم (LOCKED)]" : `[${remaining} slots available]`}
                      </option>
                    );
                  })}
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
                  className="h-9 text-xs mt-1"
                />
              )}

              {/* Free text custom new folder option */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Or create new folder volume:</span>
                <button
                  type="button"
                  onClick={() => {
                    const compPrefix = assignCompany ? assignCompany.split(' ')[0] : 'FILE';
                    setAssignFileNo(`${compPrefix} - FILE # ${Math.floor(Math.random() * 50) + 10}`);
                  }}
                  className="text-[#F37021] font-bold hover:underline"
                >
                  + Create New Folder ID
                </button>
              </div>
            </div>

            {/* Error message (e.g. Folder is FULL) */}
            {assignError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-bold flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{assignError}</span>
              </div>
            )}

            {/* Success message */}
            {assignSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                Folio successfully registered in physical folder!
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAssigning || Boolean(assignError)}
                className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs shadow-sm"
              >
                {isAssigning ? "Registering..." : "Save & File in Folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FilingManagementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-semibold text-xs">Loading Physical Filing Management...</div>}>
      <FilingContent />
    </Suspense>
  );
}
