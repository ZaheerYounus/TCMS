import { Suspense } from "react";
import { SharesDeliveryLetter } from "@/components/letters/SharesDeliveryLetter";
import { LetterNavTabs } from "@/components/letters/LetterNavTabs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery of Shares Letter | CDCSR STMS",
  description: "Official Letter for forwarding physical transmitted shares to legal heirs",
};

export default function SharesDeliveryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Delivery of Shares...</div>}>
      <div className="w-full max-w-screen-2xl mx-auto pb-12">
        <LetterNavTabs currentType="shares-delivery" />
        <SharesDeliveryLetter />
      </div>
    </Suspense>
  );
}
