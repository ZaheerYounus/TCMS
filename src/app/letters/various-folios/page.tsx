import { Suspense } from "react";
import { MainLetterGenerator } from "@/app/letters/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Various Folios 1st Letter | CDCSR TCMS",
  description: "Official CDCSR 1st transmission intimation and requirements requisition letter for multiple folios",
};

export default function VariousFoliosFirstLetterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-xs">Loading Various Folios Letter...</div>}>
      <MainLetterGenerator initialMode="multi" />
    </Suspense>
  );
}
