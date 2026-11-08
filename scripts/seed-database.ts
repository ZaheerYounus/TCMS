import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { hashPassword } from "../src/lib/auth";
import { normalizeStatusCode } from "../src/lib/statusLabels";
import { normalizeCompanyName, isValidDateString } from "../src/lib/companyDictionary";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting TCMS Database Migration & Seed...");

  // 1. Seed Users (Admin + 4 Staff)
  console.log("Seeding core staff accounts...");
  const adminHash = await hashPassword("Admin@TCMS2026");
  const staff1Hash = await hashPassword("Staff1@TCMS");
  const staff2Hash = await hashPassword("Staff2@TCMS");
  const staff3Hash = await hashPassword("Staff3@TCMS");
  const staff4Hash = await hashPassword("Staff4@TCMS");

  const users = [
    { username: "admin", name: "System Administrator", role: "ADMIN", passwordHash: adminHash },
    { username: "staff1", name: "Staff Member 1", role: "STAFF", passwordHash: staff1Hash },
    { username: "staff2", name: "Staff Member 2", role: "STAFF", passwordHash: staff2Hash },
    { username: "staff3", name: "Staff Member 3", role: "STAFF", passwordHash: staff3Hash },
    { username: "staff4", name: "Staff Member 4", role: "STAFF", passwordHash: staff4Hash },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, role: u.role },
      create: u,
    });
  }
  console.log("Users seeded successfully.");

  // 2. Migrate Cases
  const misPath = path.join(__dirname, "..", "src", "data", "misRecords.json");
  if (fs.existsSync(misPath)) {
    console.log("Loading MIS records from file...");
    const rawCases = JSON.parse(fs.readFileSync(misPath, "utf-8"));
    console.log(`Found ${rawCases.length} cases to import.`);

    let count = 0;
    for (const c of rawCases) {
      // Exclude test rows (Section 3.8)
      if (c.caseId === "TR-013259" || c.caseId === "TR-013258" || c.deceased === "Subject Shareholder") {
        continue;
      }

      const statusCode = c.statusCode || normalizeStatusCode(c.status);
      const isClosed = statusCode === "CLOSED" || c.isClosed === true;
      const cleanCompany = normalizeCompanyName(c.company);

      await prisma.case.upsert({
        where: { caseId: c.caseId },
        update: {
          company: cleanCompany,
          folio: String(c.folio).trim(),
          deceased: c.deceased || "",
          legalHeir: c.legalHeir || "",
          status: c.status || "Waiting",
          statusCode,
          isClosed,
          remarks: c.remarks || "",
          workedThisMonth: Boolean(c.workedThisMonth),
        },
        create: {
          caseId: c.caseId,
          compSymbol: c.compSymbol || null,
          company: cleanCompany,
          folio: String(c.folio).trim(),
          deceased: c.deceased || "",
          legalHeir: c.legalHeir || "",
          status: c.status || "Waiting",
          statusCode,
          isClosed,
          reqRecDate: isValidDateString(c.reqRecDate) ? c.reqRecDate : null,
          formSentDate: isValidDateString(c.formSentDate) ? c.formSentDate : null,
          formRecDate: isValidDateString(c.formRecDate) ? c.formRecDate : null,
          fwdCompDate: isValidDateString(c.fwdCompDate) ? c.fwdCompDate : null,
          appRecDate: isValidDateString(c.appRecDate) ? c.appRecDate : null,
          fwdTransDate: isValidDateString(c.fwdTransDate) ? c.fwdTransDate : null,
          recTransDate: isValidDateString(c.recTransDate) ? c.recTransDate : null,
          physAppFwdComp: isValidDateString(c.physAppFwdComp) ? c.physAppFwdComp : null,
          sharesRecComp: isValidDateString(c.sharesRecComp) ? c.sharesRecComp : null,
          sharesFwdDate: isValidDateString(c.sharesFwdDate) ? c.sharesFwdDate : null,
          chqRecComp: isValidDateString(c.chqRecComp) ? c.chqRecComp : null,
          chqFwdLegalHeir: isValidDateString(c.chqFwdLegalHeir) ? c.chqFwdLegalHeir : null,
          remarks: c.remarks || "",
          workedThisMonth: Boolean(c.workedThisMonth),
        },
      });

      count++;
      if (count % 1000 === 0) {
        console.log(`Imported ${count} cases...`);
      }
    }
    console.log(`Total cases imported: ${count}`);
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Migration/seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
