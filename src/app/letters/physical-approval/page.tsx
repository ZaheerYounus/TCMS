import { Suspense } from "react";
import { PhysicalApprovalLetter } from "@/components/letters/PhysicalApprovalLetter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physical Approval Letter to Company Secretary | CDCSR STMS",
  description: "Official Letter for forwarding transfer registers and certificates to Company Secretary for approval",
};

export default function PhysicalApprovalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Physical Approval Letter...</div>}>
      <PhysicalApprovalLetter />
    </Suspense>
  );
}
