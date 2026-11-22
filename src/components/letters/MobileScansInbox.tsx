"use client";

import { useState, useEffect } from "react";
import { 
  Smartphone, 
  RefreshCw, 
  Check, 
  Trash2, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  User, 
  ArrowRight,
  Eye,
  CheckCircle2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileScansInboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectScan: (scan: any) => void;
}

export function MobileScansInbox({ open, onOpenChange, onSelectScan }: MobileScansInboxProps) {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScanDetail, setSelectedScanDetail] = useState<any | null>(null);

  const fetchScans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/letters/mobile-uploads?status=ALL");
      const data = await res.json();
      if (data.uploads) {
        setScans(data.uploads);
      }
    } catch (e) {
      console.error("Failed to fetch mobile uploads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchScans();
    }
  }, [open]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this scan?")) return;
    try {
      await fetch(`/api/letters/mobile-uploads?id=${id}`, { method: "DELETE" });
      setScans(scans.filter((s) => s.id !== id));
      if (selectedScanDetail?.id === id) setSelectedScanDetail(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkProcessed = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/letters/mobile-uploads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "PROCESSED" }),
      });
      setScans(scans.map((s) => (s.id === id ? { ...s, status: "PROCESSED" } : s)));
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = scans.filter((s) => s.status === "PENDING").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-t-4 border-t-[#0B2B5E]">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#0B2B5E] text-white rounded-lg">
              <Smartphone className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-[#0B2B5E] flex items-center gap-2">
                Mobile Scans & Inward Inbox
                {pendingCount > 0 && (
                  <Badge className="bg-[#F37021] text-white hover:bg-[#F37021]">
                    {pendingCount} New
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Letters photographed and uploaded from mobile phones by staff members
              </DialogDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchScans}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-200">
          {/* List of scans */}
          <div className="overflow-y-auto p-4 space-y-2.5 max-h-[60vh]">
            {scans.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Smartphone className="h-10 w-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-medium">No mobile scans found</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Log into TCMS on your mobile phone and upload a letter photo to see it appear here immediately.
                </p>
              </div>
            ) : (
              scans.map((scan) => {
                const isSelected = selectedScanDetail?.id === scan.id;
                return (
                  <div
                    key={scan.id}
                    onClick={() => setSelectedScanDetail(scan)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/90 border-[#0B2B5E] shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-16 w-14 rounded-lg bg-slate-100 border overflow-hidden shrink-0">
                        <img
                          src={scan.imageBase64}
                          alt="Scan thumbnail"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#0B2B5E] border-blue-200 bg-blue-50/50">
                            {scan.category.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(scan.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {scan.notes || scan.extractedData?.deceased || scan.extractedData?.company || "Uploaded Letter"}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {scan.userName}
                          </span>
                          <span className={scan.status === "PENDING" ? "text-amber-600 font-bold" : "text-emerald-600 font-medium"}>
                            {scan.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detail preview pane */}
          <div className="p-4 bg-slate-50/50 overflow-y-auto max-h-[60vh] flex flex-col justify-between">
            {selectedScanDetail ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Scan Preview & Details
                  </h4>
                  <div className="flex gap-1.5">
                    {selectedScanDetail.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleMarkProcessed(selectedScanDetail.id, e)}
                        className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Processed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDelete(selectedScanDetail.id, e)}
                      className="h-7 text-[11px] text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Scan Image Large */}
                <div className="rounded-xl border border-slate-300 overflow-hidden bg-black/5 max-h-56 flex items-center justify-center">
                  <img
                    src={selectedScanDetail.imageBase64}
                    alt="Scan Full"
                    className="max-h-56 w-auto object-contain"
                  />
                </div>

                {/* Extracted Data Card */}
                {selectedScanDetail.extractedData ? (
                  <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-xs">
                    <div className="font-bold text-[#0B2B5E] flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5 text-[#F37021]" />
                      AI OCR Extracted Details:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block">Deceased:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedScanDetail.extractedData.deceased || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Folio #:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedScanDetail.extractedData.folio || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Company:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedScanDetail.extractedData.company || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Applicant / Heir:</span>
                        <span className="font-semibold text-slate-800">
                          {selectedScanDetail.extractedData.legalHeir || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    No OCR data extracted yet. Clicking prepare will parse with active OCR.
                  </div>
                )}

                {/* Action button */}
                <Button
                  onClick={() => {
                    onSelectScan(selectedScanDetail);
                    onOpenChange(false);
                  }}
                  className="w-full bg-[#0B2B5E] hover:bg-[#071c3d] text-white font-bold text-xs py-5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText className="h-4 w-4 text-amber-300" />
                  Load into Letter Generator
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-2">
                <Eye className="h-8 w-8 text-slate-300" />
                <p className="text-xs">Select any scan from the list to preview details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
