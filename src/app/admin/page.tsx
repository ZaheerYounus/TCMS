"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  UserCheck, 
  UserPlus,
  KeyRound,
  History, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  RefreshCw,
  Clock,
  Lock,
  Unlock,
  ShieldAlert
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserRecord {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
}

const auditLogs = [
  { user: "Zaheer Ahmed", action: "Transmission Case Management System database synchronized", target: "Data Engine", time: "Just now" },
  { user: "Zaheer Ahmed", action: "Updated Transmission Letter formalities engine", target: "Letters Module", time: "25 mins ago" },
  { user: "Azib Yousuf", action: "Dispatched transmission formalities letter", target: "HBL-19316", time: "2 hours ago" },
  { user: "Ali Raza", action: "Archived physical folder to vault", target: "Filing Archive", time: "4 hours ago" },
];

export default function AdminPage() {
  const [targetType, setTargetType] = useState<"mis" | "filing">("mis");
  const [uploadMode, setUploadMode] = useState<"merge" | "replace">("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>("");

  // Users State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [userActionError, setUserActionError] = useState("");
  const [userActionSuccess, setUserActionSuccess] = useState("");

  // Password reset state
  const [resetTargetUser, setResetTargetUser] = useState<UserRecord | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError("");
    setUserActionSuccess("");

    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      setUserActionError("Please fill out all user fields.");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      setUserActionSuccess(`Staff user ${newUsername} created successfully.`);
      setNewUsername("");
      setNewName("");
      setNewPassword("");
      setShowAddModal(false);
      await loadUsers();
    } catch (err: any) {
      setUserActionError(err.message || "Failed to create user.");
    }
  };

  const handleToggleUserStatus = async (user: UserRecord) => {
    setUserActionError("");
    setUserActionSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action: "toggleStatus",
          isActive: !user.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change user status.");
      }
      setUserActionSuccess(`User ${user.username} is now ${!user.isActive ? "Active" : "Disabled"}.`);
      await loadUsers();
    } catch (err: any) {
      setUserActionError(err.message || "Failed to toggle status.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !resetNewPassword) return;

    setUserActionError("");
    setUserActionSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetTargetUser.id,
          action: "resetPassword",
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setUserActionSuccess(`Password reset for ${resetTargetUser.username} completed.`);
      setResetTargetUser(null);
      setResetNewPassword("");
    } catch (err: any) {
      setUserActionError(err.message || "Failed to reset password.");
    }
  };

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
      setUploadError("Please choose an Excel (.xlsx, .xls) file first.");
      return;
    }

    if (uploadMode === "replace" && !confirmReplace) {
      setUploadError("You must check the confirmation checkbox to replace the entire database.");
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
      if (confirmReplace) {
        formData.append("confirmReplace", "true");
      }

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
      setConfirmReplace(false);
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
              CDC Share Registrar Services — Transmission Case Management System (TCMS). Full rights to manage accounts, master records, and data pipelines.
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
                Transmission Master Data Uploader (.xlsx / .xls)
              </CardTitle>
              <CardDescription className="text-xs">
                Upload your updated MIS or Physical Filing spreadsheets (Max 10MB). Records are validated and company names normalized automatically.
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
                  onChange={(e: any) => {
                    setUploadMode(e.target.value);
                    setConfirmReplace(false);
                  }}
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
                  3. Select Excel (.xlsx, .xls):
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
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

            {/* Replace Mode Warning & Checkbox */}
            {uploadMode === "replace" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                <label className="flex items-center gap-2 text-xs font-bold text-red-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmReplace}
                    onChange={(e) => setConfirmReplace(e.target.checked)}
                    className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  I confirm that I want to completely replace and overwrite the current database.
                </label>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileSpreadsheet className="h-4 w-4 text-[#F37021]" />
                Supported columns: <code>Folio</code>, <code>Company</code>, <code>Deceased</code>, <code>Legal Heir</code>, <code>Status</code>, <code>Remarks</code>. Max 10MB.
              </div>

              <Button
                type="submit"
                disabled={uploading || !selectedFile || (uploadMode === "replace" && !confirmReplace)}
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
                  Processed <strong>{uploadResult.recordsProcessed}</strong> records from uploaded file. Current total records: <strong>{uploadResult.totalRecords}</strong>.
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#0B2B5E] flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-[#F37021]" />
                  Authorized Staff Accounts &amp; Access Control
                </CardTitle>
                <CardDescription className="text-xs">
                  Enterprise role-based accounts (1 Admin + 4 Staff members). Add staff or reset passwords.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddModal(!showAddModal)}
                className="bg-[#0B2B5E] hover:bg-[#153a73] text-white text-xs h-8 px-3 font-semibold shrink-0"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                {showAddModal ? "Cancel" : "Add Staff User"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Action Feedback */}
            {userActionSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{userActionSuccess}</span>
              </div>
            )}
            {userActionError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{userActionError}</span>
              </div>
            )}

            {/* Add User Form Drawer */}
            {showAddModal && (
              <form onSubmit={handleCreateUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#0B2B5E] flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-[#F37021]" />
                  Create New Staff Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Username</label>
                    <Input
                      placeholder="e.g. staff5"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name</label>
                    <Input
                      placeholder="e.g. Tariq Khan"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Password</label>
                    <Input
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e: any) => setNewRole(e.target.value)}
                      className="w-full h-8 text-xs font-semibold rounded-md border border-slate-300 bg-white px-2 text-slate-800"
                    >
                      <option value="STAFF">STAFF (Masked PII)</option>
                      <option value="ADMIN">ADMIN (Full Rights)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddModal(false)}
                    className="h-8 text-xs text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs bg-[#F37021] hover:bg-[#D85B10] text-white font-bold"
                  >
                    Save Account
                  </Button>
                </div>
              </form>
            )}

            {/* Password Reset Modal / Box */}
            {resetTargetUser && (
              <form onSubmit={handleResetPassword} className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#0B2B5E] flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4 text-[#F37021]" />
                  Reset Password for {resetTargetUser.name} ({resetTargetUser.username})
                </h4>
                <div className="flex items-center gap-3">
                  <Input
                    type="password"
                    placeholder="Enter new password (min 6 chars)"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="h-8 text-xs bg-white max-w-xs"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs bg-[#0B2B5E] hover:bg-[#153a73] text-white font-bold"
                  >
                    Set Password
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setResetTargetUser(null); setResetNewPassword(""); }}
                    className="h-8 text-xs text-slate-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Users Table */}
            {loadingUsers ? (
              <div className="py-8 text-center text-xs text-slate-500">Loading staff accounts...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-slate-50">
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {users.map((u) => (
                    <TableRow key={u.id} className={u.role === 'ADMIN' ? 'bg-blue-50/20' : ''}>
                      <TableCell>
                        <p className="font-bold text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {u.id.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell className="font-mono text-slate-700">{u.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[11px] ${u.role === 'ADMIN' ? 'border-[#F37021] text-[#D85B10] bg-orange-50 font-bold' : 'bg-slate-100 text-slate-700'}`}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] font-bold ${u.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {u.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setResetTargetUser(u); setResetNewPassword(""); }}
                            title="Reset password"
                            className="h-7 px-2 text-[11px] text-slate-600 hover:text-[#0B2B5E]"
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            Reset
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleUserStatus(u)}
                            title={u.isActive ? "Disable account" : "Enable account"}
                            className={`h-7 px-2 text-[11px] ${u.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                          >
                            {u.isActive ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                            {u.isActive ? "Disable" : "Enable"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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

