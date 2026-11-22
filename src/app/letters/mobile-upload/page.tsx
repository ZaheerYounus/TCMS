"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  UploadCloud, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft, 
  FileText, 
  Sparkles, 
  Building2, 
  User, 
  Trash2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const CATEGORIES = [
  { id: "FIRST_LETTER", name: "1st Intimation Letter (Single Folio)" },
  { id: "VARIOUS_FOLIOS", name: "1st Intimation Letter (Multiple Folios)" },
  { id: "PHYSICAL_APPROVAL", name: "Physical Approval Letter (Company Secretary)" },
  { id: "CDS_ACCOUNT", name: "CDS Account / Transmission of Dividends" },
  { id: "SHARES_DELIVERY", name: "Delivery of Physical Shares" },
  { id: "CHEQUES_DELIVERY", name: "Delivery of Dividend Cheques" },
  { id: "NO_FOLIO", name: "No Folio Found Letter" },
  { id: "GENERAL", name: "General Inward Scan" },
];

export default function MobileUploadPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("FIRST_LETTER");
  const [notes, setNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    loadRecentUploads();
  }, []);

  const loadRecentUploads = () => {
    setLoadingRecent(true);
    fetch("/api/letters/mobile-uploads?status=ALL")
      .then((r) => r.json())
      .then((d) => {
        if (d.uploads) setRecentUploads(d.uploads.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoadingRecent(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setUploadSuccess(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!imagePreview) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/letters/mobile-uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
          category: selectedCategory,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.upload) {
        setUploadSuccess(data.upload);
        setImagePreview(null);
        setNotes("");
        loadRecentUploads();
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (e: any) {
      alert("Error uploading scan: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 bg-[#0B2B5E] text-white px-4 py-3 shadow-md flex items-center justify-between">
        <Link href="/letters" className="flex items-center gap-2 text-white hover:text-amber-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-semibold">Letters Dashboard</span>
        </Link>
        <div className="text-xs font-mono bg-blue-900/80 px-2 py-1 rounded text-blue-200">
          {currentUser ? currentUser.name.split(" ")[0] : "Staff"}
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Title */}
        <div className="text-center pt-2">
          <div className="inline-flex p-3 rounded-full bg-blue-100 text-[#0B2B5E] mb-2">
            <Camera className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-[#0B2B5E]">Mobile Inward Scan</h1>
          <p className="text-xs text-slate-600 mt-1">
            Capture or upload a physical letter photo. It will instantly appear on your desktop PC ready to prepare.
          </p>
        </div>

        {/* Upload Success Alert */}
        {uploadSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-emerald-900 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Scan uploaded successfully!</span>
            </div>
            <p className="text-xs text-emerald-700">
              Your scan has been sent to TCMS. When you open TCMS on your office PC, this letter will be waiting in your <strong>Mobile Scans Inbox</strong>.
            </p>
            {uploadSuccess.extractedData && (
              <div className="bg-white/80 p-2.5 rounded border border-emerald-200 text-[11px] space-y-1">
                <div className="font-semibold text-emerald-950 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-[#F37021]" />
                  AI OCR Extracted Details:
                </div>
                {uploadSuccess.extractedData.deceased && <div><strong>Deceased:</strong> {uploadSuccess.extractedData.deceased}</div>}
                {uploadSuccess.extractedData.folio && <div><strong>Folio:</strong> {uploadSuccess.extractedData.folio}</div>}
                {uploadSuccess.extractedData.company && <div><strong>Company:</strong> {uploadSuccess.extractedData.company}</div>}
              </div>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setUploadSuccess(null)}
              className="w-full text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
            >
              Scan Another Letter
            </Button>
          </div>
        )}

        {/* Capture / Select Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold text-slate-800">1. Select Letter Category</CardTitle>
            <CardDescription className="text-xs">Which letter template is this scan for?</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B2B5E]"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quick Note / Folio # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. PSO Folio 1042 / Legal Heir Application"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0B2B5E]"
              />
            </div>

            {/* Hidden File Inputs */}
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
              className="hidden" 
            />
            <input 
              ref={galleryInputRef}
              type="file" 
              accept="image/*,application/pdf" 
              onChange={handleFileChange}
              className="hidden" 
            />

            {/* Preview or Action Buttons */}
            {imagePreview ? (
              <div className="space-y-3 pt-2">
                <div className="relative rounded-xl border border-slate-300 overflow-hidden bg-black/5 max-h-80 flex items-center justify-center">
                  <img 
                    src={imagePreview} 
                    alt="Scan Preview" 
                    className="max-h-80 w-auto object-contain" 
                  />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 text-xs"
                    disabled={isUploading}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Retake
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-2 bg-[#F37021] hover:bg-[#d95d13] text-white font-bold text-xs"
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Uploading & Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <UploadCloud className="h-4 w-4" />
                        Upload to TCMS
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-6 bg-[#0B2B5E] hover:bg-[#071c3d] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera className="h-5 w-5 text-amber-300" />
                  Take Photo with Camera
                </Button>

                <Button
                  variant="outline"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full py-5 border-slate-300 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-slate-100"
                >
                  <UploadCloud className="h-4 w-4 text-slate-500" />
                  Choose from Gallery / Files
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans Queue */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Uploads</CardTitle>
              <CardDescription className="text-[11px]">Synced to your TCMS desktop queue</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={loadRecentUploads} className="h-7 w-7 p-0">
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingRecent ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            {recentUploads.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">No recent scans uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {recentUploads.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded bg-slate-200 overflow-hidden shrink-0">
                        <img src={u.imageBase64} alt="Thumb" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {u.notes || CATEGORIES.find((c) => c.id === u.category)?.name || "Inward Letter"}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(u.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <Badge variant={u.status === "PENDING" ? "default" : "secondary"} className="text-[9px]">
                      {u.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
