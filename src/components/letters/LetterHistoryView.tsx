"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  History, 
  Search, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  X
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewLog, setPreviewLog] = useState<any | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/letters/history?q=${encodeURIComponent(searchQuery)}&all=true`;
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
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      fetchLogs();
      setDeletingId(null);
      setPreviewLog(null);
    }
  }, [open, fetchLogs]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/letters/history?id=${id}`, { method: "DELETE" });
      setLogs(prev => prev.filter((l) => l.id !== id));
      setDeletingId(null);
      if (previewLog?.id === id) setPreviewLog(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-t-4 border-t-[#0B2B5E] shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0B2B5E] text-white rounded-lg shadow-xs">
              <History className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#0B2B5E]">
                Letter History (تیار کردہ لیٹرز)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                پہلے سے تیار شدہ خطوط کو دوبارہ دیکھیں، ایڈٹ کریں یا ڈیلیٹ کریں
              </DialogDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs gap-1.5 h-8 border-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Clean Search Input */}
        <div className="p-3 bg-white border-b">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              name="history_search_query"
              autoComplete="off"
              data-lpignore="true"
              data-form-type="other"
              placeholder="Search by Deceased name, Folio #, Company, or Ref #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-slate-50/70 border-slate-300 focus:bg-white"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[58vh] space-y-2.5 bg-slate-50/40">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2 bg-white rounded-xl border border-dashed border-slate-200">
              <FileText className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-600">No letters in history yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Any letters generated or downloaded will automatically be saved here for easy editing and re-use.
              </p>
            </div>
          ) : (
            logs.map((log) => {
              const isDeleting = deletingId === log.id;
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-[#0B2B5E]/40 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left Column: Primary Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {log.deceasedName || "Deceased Shareholder"}
                      </span>
                      {log.folio && (
                        <Badge variant="outline" className="text-[11px] font-mono font-bold text-[#0B2B5E] bg-blue-50/80 border-blue-200">
                          Folio # {log.folio}
                        </Badge>
                      )}
                      <Badge className="text-[10px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-100">
                        {log.letterType || "Letter"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700 truncate max-w-xs">
                        <Building2 className="h-3 w-3 text-[#F37021] shrink-0" />
                        {log.company || "Company"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-[11px] text-slate-500 truncate">
                        {log.refNo}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {log.date || new Date(log.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: 2 Simple Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Action 1: Edit & Load into Generator */}
                    <Button
                      size="sm"
                      onClick={() => {
                        onLoadLetter(log);
                        onOpenChange(false);
                      }}
                      className="text-xs h-8 bg-[#0B2B5E] hover:bg-[#103a7a] text-white font-bold px-3 gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-amber-300" />
                      Edit Letter (ایڈٹ کریں)
                    </Button>

                    {/* Action 2: Clean Delete without browser confirm */}
                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 p-0.5 rounded-lg">
                        <Button
                          size="sm"
                          onClick={(e) => handleDelete(log.id, e)}
                          className="text-[10px] h-7 bg-rose-600 hover:bg-rose-700 text-white font-bold px-2"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeletingId(null)}
                          className="text-[10px] h-7 text-slate-500 hover:text-slate-800 px-1.5"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingId(log.id)}
                        className="text-xs h-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2"
                        title="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
