import type { ReactNode } from "react";

// Proposal portal — standalone layout with no site nav or footer.
// Each page inside /p/[token] renders its own shell.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
