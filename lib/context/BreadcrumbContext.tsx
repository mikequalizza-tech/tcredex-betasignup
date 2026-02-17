"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  breadcrumbs: Breadcrumb[] | null;
  setBreadcrumbs: (crumbs: Breadcrumb[] | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType>({
  breadcrumbs: null,
  setBreadcrumbs: () => {},
});

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[] | null>(null);

  const setBreadcrumbsMemo = useCallback((crumbs: Breadcrumb[] | null) => {
    setBreadcrumbs(crumbs);
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumbs, setBreadcrumbs: setBreadcrumbsMemo }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  return useContext(BreadcrumbContext);
}
