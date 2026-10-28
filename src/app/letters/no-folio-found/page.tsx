import { Suspense } from "react";
import { NoFolioFoundLetter } from "@/components/letters/NoFolioFoundLetter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "No Folio Found Letter | CDCSR STMS",
  description: "Official Letter for intimation of no records found against CNIC/Name in physical register",
};

export default function NoFolioFoundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading No Folio Found Letter...</div>}>
      <NoFolioFoundLetter />
    </Suspense>
  );
}
