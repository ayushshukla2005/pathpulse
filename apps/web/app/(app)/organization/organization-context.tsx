"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth/auth-context";

interface OrganizationContextValue {
  orgId: string;
  organizationName: string;
  isAuthorized: boolean;
  isLoading: boolean;
  setOrgId: (id: string) => void;
}

const OrganizationContext = React.createContext<OrganizationContextValue | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>("");

  const memberships = user?.organizationMemberships ?? [];
  const primaryMembership = memberships[0];

  const orgId = selectedOrgId || primaryMembership?.organizationId || user?.organizationId || "";
  const organizationName = primaryMembership?.organizationName || "Your Organization";

  const isAuthorized =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ORGANIZATION_ADMIN" ||
    memberships.length > 0 ||
    Boolean(user?.organizationId);

  return (
    <OrganizationContext.Provider
      value={{
        orgId,
        organizationName,
        isAuthorized,
        isLoading,
        setOrgId: setSelectedOrgId,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = React.useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
