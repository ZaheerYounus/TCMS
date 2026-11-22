"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  History, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  FileText, 
  User, 
  Calendar, 
  Building2,
  ExternalLink,
  Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface LetterHistoryViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadLetter: (entry: any) => void;
}

export function LetterHistoryView({ open, onOpenChange, onLoadLetter }: LetterHistoryViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [showAllUsers, setShowAllUsers] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/letters/history?q=${encodeURIComponent(searchQuery)}&type=${selectedType}&all=${showAllUsers}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch letter history:", e);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, showAllUsers]);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this record from history?")) return;
    try {
      await fetch(`/api/letters/history?id=${id}`, { method: "DELETE" });
      setLogs(logs.filter((l) => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-t-4 border-t-[#F37021]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F37021] text-white rounded-lg">
              <History className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
                My Prepared Letters & Activity Log
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Log of letters generated across all categories with ability to view, reload, and re-download
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllUsers}
                onChange={(e) => setShowAllUsers(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0B2B5E]"
              />
              Show Team Letters
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
              className="text-xs gap-1.5 h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-3 bg-white border-b flex flex-col sm:flex-row items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Search by Deceased, Folio, Ref #, Company, or Officer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs bg-[#0B2B5E]">
              Search
            </Button>
          </form>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
          >
            <option value="ALL">All Categories</option>
            <option value="First Letter">1st Intimation Letter</option>
            <option value="Various Folios">Multiple Folios</option>
            <option value="Physical Approval">Physical Approval</option>
            <option value="CDS Account">CDS Account</option>
            <option value="Shares Delivery">Delivery of Shares</option>
            <option value="Cheques Delivery">Delivery of Cheques</option>
            <option value="No Folio Found">No Folio Found</option>
          </select>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[60vh] space-y-2">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <History className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium">No letter activity found</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Letters prepared or downloaded will be automatically recorded here.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all text-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#0B2B5E] border-blue-200 bg-blue-50/50">
                      {log.letterType}
                    </Badge>
                    <span className="font-mono text-slate-500 text-[11px]">{log.refNo}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(log.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="font-bold text-slate-800 text-sm">
                    {log.deceasedName}
                    {log.folio ? <span className="font-mono font-normal text-slate-600 text-xs ml-2">(Folio # {log.folio})</span> : null}
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-slate-400" />
                      {log.company}
                    </span>
                    {log.legalHeir && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        Heir: {log.legalHeir}
                      </span>
                    )}
                    <span className="text-slate-400">
                      Prepared by: <strong className="text-slate-700">{log.userName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onLoadLetter(log);
                      onOpenChange(false);
                    }}
                    className="text-xs h-8 border-blue-200 text-[#0B2B5E] hover:bg-blue-50"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Reload & Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleDelete(log.id, e)}
                    className="text-xs h-8 text-rose-600 hover:bg-rose-50 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
