import type { ReactNode } from "react";

// Standalone quotation portal — no site nav/footer
export default function QuotationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
