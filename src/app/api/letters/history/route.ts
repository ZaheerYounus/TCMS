import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export interface LetterHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  letterType: string;
  refNo: string;
  date: string;
  company: string;
  deceasedName: string;
  folio?: string;
  legalHeir?: string;
  formData: Record<string, any>;
  createdAt: string;
}

const LOCAL_DATA_PATH = path.join(process.cwd(), "src", "data", "letterLogs.json");
const TMP_DATA_PATH = "/tmp/tcms_letterLogs.json";

let memoryLogs: LetterHistoryEntry[] | null = null;

function loadLetterLogs(): LetterHistoryEntry[] {
  if (memoryLogs) return memoryLogs;

  // 1. Try serverless /tmp
  try {
    if (fs.existsSync(TMP_DATA_PATH)) {
      const data = fs.readFileSync(TMP_DATA_PATH, "utf-8");
      memoryLogs = JSON.parse(data);
      if (Array.isArray(memoryLogs)) return memoryLogs;
    }
  } catch (e) {}

  // 2. Try local project file
  try {
    if (fs.existsSync(LOCAL_DATA_PATH)) {
      const data = fs.readFileSync(LOCAL_DATA_PATH, "utf-8");
      memoryLogs = JSON.parse(data);
      if (Array.isArray(memoryLogs)) return memoryLogs;
    }
  } catch (e) {}

  memoryLogs = [];
  return memoryLogs;
}

function saveLetterLogs(logs: LetterHistoryEntry[]) {
  memoryLogs = logs;
  // Write to /tmp for serverless
  try {
    fs.writeFileSync(TMP_DATA_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {}

  // Write to project file if available
  try {
    const dir = path.dirname(LOCAL_DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const all = searchParams.get("all") === "true";

    const logs = loadLetterLogs();

    let filtered = [...logs];

    // If not admin and not explicitly requesting all, filter by current user
    if (user && user.role !== "ADMIN" && !all) {
      filtered = filtered.filter(
        (l) => l.userId === user.username || l.userId === user.id
      );
    }

    if (type && type !== "ALL") {
      filtered = filtered.filter((l) => l.letterType === type);
    }

    if (q) {
      filtered = filtered.filter(
        (l) =>
          l.refNo?.toLowerCase().includes(q) ||
          l.deceasedName?.toLowerCase().includes(q) ||
          l.folio?.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.legalHeir?.toLowerCase().includes(q) ||
          l.userName?.toLowerCase().includes(q)
      );
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, logs: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch letter history", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const body = await req.json();

    const logs = loadLetterLogs();

    const newEntry: LetterHistoryEntry = {
      id: body.id || `LTR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.username || body.userId || "staff",
      userName: user?.name || body.userName || "Staff Member",
      letterType: body.letterType || "First Letter",
      refNo: body.refNo || "N/A",
      date: body.date || new Date().toISOString().split("T")[0],
      company: body.company || "N/A",
      deceasedName: body.deceasedName || "N/A",
      folio: body.folio || "",
      legalHeir: body.legalHeir || "",
      formData: body.formData || {},
      createdAt: new Date().toISOString(),
    };

    // Prepend to list
    logs.unshift(newEntry);
    // Keep last 500 logs
    if (logs.length > 500) {
      logs.length = 500;
    }
    saveLetterLogs(logs);

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to record letter", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Letter ID is required" }, { status: 400 });
    }

    const logs = loadLetterLogs();
    const updated = logs.filter((l) => l.id !== id);
    saveLetterLogs(updated);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete letter log", details: err?.message },
      { status: 500 }
    );
  }
}
