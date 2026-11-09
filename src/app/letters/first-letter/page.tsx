import { Suspense } from "react";
import { MainLetterGenerator } from "@/app/letters/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "1st Intimation Letter (Single Folio) | CDCSR TCMS",
  description: "Official CDCSR 1st transmission intimation and requirements requisition letter for single folio",
};

export default function FirstLetterSingleFolioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading 1st Letter (Single Folio)...</div>}>
      <MainLetterGenerator initialMode="single" />
    </Suspense>
  );
}
