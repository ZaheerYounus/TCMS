import { Suspense } from "react";
import { CdsAccountLetter } from "@/components/letters/CdsAccountLetter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CDS Account Transmission Letter | CDCSR STMS",
  description: "Official Letter for transmission under CDS Account (Closed account & intra-account movement checklist)",
};

export default function CdsAccountPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading CDS Account Letter...</div>}>
      <CdsAccountLetter />
    </Suspense>
  );
}
