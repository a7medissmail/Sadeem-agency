"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Homepage anchors that are currently switched off in /admin/settings.
 * MainNavbar drops the matching "/#anchor" links so the nav never points at a
 * section that isn't rendered any more.
 */
const HiddenAnchorsContext = createContext<readonly string[]>([]);

export function NavAnchorsProvider({
  hiddenAnchors,
  children,
}: {
  hiddenAnchors: readonly string[];
  children: ReactNode;
}) {
  return <HiddenAnchorsContext.Provider value={hiddenAnchors}>{children}</HiddenAnchorsContext.Provider>;
}

export function useHiddenAnchors() {
  return useContext(HiddenAnchorsContext);
}
