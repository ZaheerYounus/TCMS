import { Suspense } from "react";
import { ChequesDeliveryLetter } from "@/components/letters/ChequesDeliveryLetter";
import { LetterNavTabs } from "@/components/letters/LetterNavTabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery of Cheques Letter | CDCSR STMS",
  description: "Official Letter for forwarding banker's cheques for unpaid dividends to legal heirs",
};

export default function ChequesDeliveryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Delivery of Cheques...</div>}>
      <div className="w-full max-w-screen-2xl mx-auto pb-12">
        <LetterNavTabs currentType="cheques-delivery" />
        <ChequesDeliveryLetter />
      </div>
    </Suspense>
  );
}
