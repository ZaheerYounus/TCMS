import { Suspense } from "react";
import { SharesDeliveryLetter } from "@/components/letters/SharesDeliveryLetter";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery of Shares Letter | CDCSR STMS",
  description: "Official Letter for forwarding physical transmitted shares to legal heirs",
};

export default function SharesDeliveryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Delivery of Shares...</div>}>
      <SharesDeliveryLetter />
    </Suspense>
  );
}
