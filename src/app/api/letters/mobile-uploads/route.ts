import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { analyzeDocumentWithGemini } from "@/lib/geminiVision";
import fs from "fs";
import path from "path";

export interface MobileUploadEntry {
  id: string;
  userId: string;
  userName: string;
  category: string; // e.g. "FIRST_LETTER", "CDS_ACCOUNT", "PHYSICAL_APPROVAL", "NO_FOLIO", "SHARES_DELIVERY", "CHEQUES_DELIVERY", "GENERAL"
  notes?: string;
  imageBase64: string;
  mimeType: string;
  extractedData?: Record<string, any>;
  status: "PENDING" | "PROCESSED" | "ARCHIVED";
  createdAt: string;
}

const LOCAL_DATA_PATH = path.join(process.cwd(), "src", "data", "mobileUploads.json");
const TMP_DATA_PATH = "/tmp/tcms_mobileUploads.json";

let memoryUploads: MobileUploadEntry[] | null = null;

function loadUploads(): MobileUploadEntry[] {
  if (memoryUploads) return memoryUploads;

  try {
    if (fs.existsSync(TMP_DATA_PATH)) {
      const data = fs.readFileSync(TMP_DATA_PATH, "utf-8");
      memoryUploads = JSON.parse(data);
      if (Array.isArray(memoryUploads)) return memoryUploads;
    }
  } catch (e) {}

  try {
    if (fs.existsSync(LOCAL_DATA_PATH)) {
      const data = fs.readFileSync(LOCAL_DATA_PATH, "utf-8");
      memoryUploads = JSON.parse(data);
      if (Array.isArray(memoryUploads)) return memoryUploads;
    }
  } catch (e) {}

  memoryUploads = [];
  return memoryUploads;
}

function saveUploads(items: MobileUploadEntry[]) {
  memoryUploads = items;
  try {
    fs.writeFileSync(TMP_DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {}

  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "PENDING", "PROCESSED", "ALL"

    const uploads = loadUploads();
    let filtered = [...uploads];

    if (status && status !== "ALL") {
      filtered = filtered.filter((u) => u.status === status);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, uploads: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch mobile uploads", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();

    const { imageBase64, mimeType = "image/jpeg", category = "GENERAL", notes = "" } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Attempt AI extraction using Gemini Vision
    let extractedData: Record<string, any> | undefined = undefined;
    try {
      // Clean base64 string and convert to Buffer
      const cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(cleanB64, "base64");
      const aiResult = await analyzeDocumentWithGemini(buffer, mimeType);
      if (aiResult && aiResult.success && aiResult.parsed) {
        extractedData = aiResult.parsed;
      }
    } catch (ocrErr) {
      console.warn("AI extraction during mobile upload warning:", ocrErr);
    }

    const uploads = loadUploads();

    const newUpload: MobileUploadEntry = {
      id: `SCAN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.username || "staff",
      userName: user?.name || "Staff Member",
      category,
      notes,
      imageBase64: imageBase64.startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
      mimeType,
      extractedData,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    uploads.unshift(newUpload);
    // Keep last 100 uploads to manage memory
    if (uploads.length > 100) {
      uploads.length = 100;
    }
    saveUploads(uploads);

    return NextResponse.json({ success: true, upload: newUpload });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to upload mobile scan", details: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const uploads = loadUploads();
    const index = uploads.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    uploads[index].status = status;
    saveUploads(uploads);

    return NextResponse.json({ success: true, upload: uploads[index] });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update upload status", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const uploads = loadUploads();
    const updated = uploads.filter((u) => u.id !== id);
    saveUploads(updated);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete upload", details: err?.message },
      { status: 500 }
    );
  }
}
