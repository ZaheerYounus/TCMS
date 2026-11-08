import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchCases, updateCaseRecord, getCaseByFolio, getCaseById, getDashboardMetrics } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const company = (searchParams.get("company") || "").trim();
    const thisMonth = searchParams.get("thisMonth") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const exact = searchParams.get("exact") === "true";

    const result = await searchCases({
      q,
      status,
      company,
      thisMonth,
      page,
      limit,
      exact,
      sessionRole: user?.role || "STAFF",
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("MIS GET error:", err);
    return NextResponse.json({ error: "Failed to fetch MIS records", details: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification (Section 1.4)
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json(
        { error: "Authentication required to update case status or records." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const caseId = body.caseId;

    if (!caseId) {
      return NextResponse.json({ error: "caseId is required to update a case." }, { status: 400 });
    }

    // 2. Perform safe update with field whitelisting & audit trail
    const updateResult = await updateCaseRecord(
      caseId,
      body,
      { username: currentUser.username, name: currentUser.name }
    );

    if (!updateResult.success) {
      return NextResponse.json({ error: updateResult.error }, { status: 404 });
    }

    const summary = await getDashboardMetrics();

    return NextResponse.json({
      success: true,
      message: "Case status and audit history successfully updated.",
      record: updateResult.record,
      summary,
    });
  } catch (err: any) {
    console.error("MIS POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to update case" }, { status: 500 });
  }
}
