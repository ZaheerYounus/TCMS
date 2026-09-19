"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  UserCheck, 
  Settings2, 
  History, 
  Plus, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  RefreshCw,
  FolderArchive,
  Layers,
  Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const systemUsers = [
  { name: "Zaheer Ahmed (You)", email: "zaheer.ahmed@cdcsr.com.pk", role: "Primary System Administrator & Lead", status: "Active (Master Admin)", lastLogin: "Active Now" },
  { name: "Azib Yousuf", email: "azib.yousuf@cdcsr.com.pk", role: "Senior Transmission Officer", status: "Active", lastLogin: "19-09-2026 18:40" },
  { name: "Muqaddas Sharif", email: "muqaddas.sharif@cdcsr.com.pk", role: "Transmission Officer", status: "Active", lastLogin: "19-09-2026 16:15" },
  { name: "Zohaib Jamal", email: "zohaib.jamal@cdcsr.com.pk", role: "Operations Officer", status: "Active", lastLogin: "19-09-2026 15:30" },
  { name: "Ali Raza", email: "ali.raza@cdcsr.com.pk", role: "Filing & Vault Officer", status: "Active", lastLogin: "19-09-2026 12:05" },
];

const auditLogs = [
  { user: "Zaheer Ahmed", action: "Outward folio auto-fetch & status workflow updated", target: "Daily Register", time: "Just now" },
  { user: "Zaheer Ahmed", action: "Updated Transmission Letter formalities engine", target: "Letters Module", time: "25 mins ago" },
  { user: "Azib Yousuf", action: "Dispatched transmission formalities letter", target: "HBL-19316", time: "2 hours ago" },
  { user: "Ali Raza", action: "Archived physical folder BOX-01 to safe vault", target: "Folder #01", time: "4 hours ago" },
];

export default function AdminPage() {
  const [targetType, setTargetType] = useState<"mis" | "filing">("mis");
  const [uploadMode, setUploadMode] = useState<"merge" | "replace">("merge");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null);
      setUploadError("");
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose an Excel (.xlsx, .xls) or CSV file first.");
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("targetType", targetType);
      formData.append("mode", uploadMode);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process and update database.");
      }

      setUploadResult(data);
      setSelectedFile(null);
    } catch (err: any) {
      setUploadError(err.message || "File upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2B5E] via-[#103a7a] to-[#1A365D] text-white p-5 sm:p-6 shadow-lg border border-blue-900/40">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F37021] via-orange-400 to-[#F37021]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#F37021] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                Primary Administrator Console
              </span>
              <span className="text-xs text-orange-200">CDCSR Secure Infrastructure</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              System Administration &amp; Data Pipeline
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-0.5">
              Administrator: <strong>Zaheer Ahmed (Team Lead)</strong>. Full rights to manage transmission master files, audit logs, and operational databases.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500 text-white font-bold text-xs px-3 py-1 border-0 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Full Admin Privileges Active
            </Badge>
          </div>
        </div>
      </div>

      {/* SECTION 1: MASTER DATA FILE UPLOADER (MIS & FILING) */}
      <Card className="border-slate-200 shadow-md border-t-4 border-t-[#F37021] bg-white">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
                <Database className="h-5 w-5 text-[#F37021]" />
                Transmission Master Data Uploader (Excel / CSV)
              </CardTitle>
              <CardDescription className="text-xs">
                Upload your latest daily updated MIS or Physical Filing spreadsheets. The system will parse records and immediately synchronize transmission inquiries, folio auto-fetching, and reporting.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-[#D85B10] font-bold">
              Automated Parser Ready
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Target Database Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  1. Target Dataset:
                </label>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="w-full h-10 text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 text-[#0B2B5E]"
                >
                  <option value="mis">Transmission MIS Records (Master Database)</option>
                  <option value="filing">Physical Filing Archive (Folder &amp; Box records)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {targetType === 'mis' 
                    ? "Updates transmission case status, deceased names, legal heirs & auto-fetch."
                    : "Updates physical shelf file numbers and 50-cases per folder capacities."}
                </p>
              </div>

              {/* Upload Mode */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. Update Strategy:
                </label>
                <select
                  value={uploadMode}
                  onChange={(e: any) => setUploadMode(e.target.value)}
                  className="w-full h-10 text-xs font-bold rounded-lg border border-slate-300 bg-white px-3 text-slate-800"
                >
                  <option value="merge">Merge with Existing Records (Recommended)</option>
                  <option value="replace">Replace Entire Database with New File</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {uploadMode === 'merge' 
                    ? "Preserves existing cases and adds/updates newly modified folios." 
                    : "Overwrites entire database with records present in this file."}
                </p>
              </div>

              {/* File Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  3. Select Excel (.xlsx, .xls) or CSV:
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#0B2B5E] file:text-white hover:file:bg-[#103a7a] file:cursor-pointer cursor-pointer border border-slate-300 rounded-lg p-1.5 bg-slate-50"
                />
                {selectedFile && (
                  <p className="text-[11px] text-emerald-700 font-bold mt-1 truncate">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileSpreadsheet className="h-4 w-4 text-[#F37021]" />
                Supported column headers: <code>Folio</code>, <code>Company</code>, <code>Deceased</code>, <code>Legal Heir</code>, <code>Status</code>, <code>Remarks</code>.
              </div>

              <Button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-[#F37021] hover:bg-[#D85B10] text-white font-bold text-xs h-10 px-5 shadow-sm"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                    Parsing &amp; Updating Database...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4 mr-1.5" />
                    Upload &amp; Refresh Master Data
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Success Banner */}
          {uploadResult && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">
                  Database Successfully Updated!
                </p>
                <p>
                  Processed <strong>{uploadResult.recordsProcessed}</strong> records from uploaded file. Current total records in database: <strong>{uploadResult.totalRecords}</strong>.
                </p>
                <p className="text-[11px] text-emerald-800">
                  All downstream search indexes, daily register auto-fetch, and case inquiry filters are now operating on this fresh dataset!
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-start gap-2.5 text-xs">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Database Update Error</p>
                <p>{uploadError}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: OPERATOR ROLES & ACCESS MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#F37021]" />
                  Authorized Operators &amp; Privileges
                </CardTitle>
                <CardDescription className="text-xs">
                  Role-based access matrix for CDCSR operations staff and administrators.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="text-xs bg-slate-50">
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status / Clearance</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {systemUsers.map((u, i) => (
                  <TableRow key={i} className={i === 0 ? "bg-orange-50/40 font-semibold" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {u.name}
                          {i === 0 && (
                            <Badge className="bg-[#0B2B5E] text-white text-[9px] px-1.5 py-0">You</Badge>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[11px] ${i === 0 ? 'border-[#F37021] text-[#D85B10] bg-orange-50 font-bold' : 'bg-slate-50 text-slate-700'}`}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] font-bold ${i === 0 ? 'bg-emerald-600 text-white' : 'bg-green-100 text-green-700 border-green-200'}`}>
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-[11px]">{u.lastLogin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Log Stream */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-2">
              <History className="h-4 w-4 text-[#F37021]" />
              Immutable Audit Trail
            </CardTitle>
            <CardDescription className="text-xs">Regulatory action history for internal audits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5 text-xs">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-2.5 last:border-none last:pb-0">
                  <p className="font-bold text-slate-900">{log.user}</p>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.action}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {log.target}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {log.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

