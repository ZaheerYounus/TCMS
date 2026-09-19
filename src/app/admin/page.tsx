"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, UserCheck, Settings2, History, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const systemUsers = [
  { name: "Ahmed Khan", email: "ahmed.khan@cdcsr.com.pk", role: "Transmission Officer", status: "Active", lastLogin: "13-09-2026 15:42" },
  { name: "Sarah Malik", email: "sarah.malik@cdcsr.com.pk", role: "Reviewer & Approver", status: "Active", lastLogin: "13-09-2026 17:10" },
  { name: "Ali Raza", email: "ali.raza@cdcsr.com.pk", role: "Filing Officer", status: "Active", lastLogin: "13-09-2026 12:05" },
  { name: "Admin Supervisor", email: "admin@cdcsr.com.pk", role: "System Administrator", status: "Active", lastLogin: "13-09-2026 18:20" },
];

const auditLogs = [
  { user: "Sarah Malik", action: "Approved Transmission Dossier", target: "TR-2026-00122", time: "10 mins ago" },
  { user: "Ahmed Khan", action: "Dispatched 1st Transmission Letter", target: "TR-2026-00125", time: "1 hour ago" },
  { user: "Ali Raza", action: "Archived physical folder ABC-001 to safe vault", target: "ABC-001", time: "3 hours ago" },
  { user: "Admin Supervisor", action: "Updated company requirements for OGDC", target: "OGDC Checklist", time: "1 day ago" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Administration & Audit</h2>
          <p className="text-slate-500">Manage user access roles, institutional compliance rules, and security logs.</p>
        </div>
        <Button className="bg-[#0B2B5E] hover:bg-[#1A365D]">
          <Plus className="mr-2 h-4 w-4" />
          Add Authorized Staff
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-700" />
                  Authorized Operators & Roles
                </CardTitle>
                <CardDescription>Role-based access matrix for CDCSR operations staff.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Assigned Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {systemUsers.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{u.lastLogin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Audit Log Stream */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#0B2B5E]" />
              Immutable Audit Trail
            </CardTitle>
            <CardDescription>Regulatory action history for internal audits.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="border-b border-slate-100 pb-3 last:border-none last:pb-0">
                  <p className="text-xs font-semibold text-slate-900">{log.user}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{log.action}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {log.target}
                    </span>
                    <span className="text-[11px] text-slate-400">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 text-xs">
              View Complete Audit Journal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
