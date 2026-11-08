"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationProvider, useOrganization } from "./organization-context";

function OrganizationLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { organizationName, isAuthorized, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <p className="text-base font-medium text-[var(--foreground)]" role="status">
          Loading organization details...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12">
        <div
          role="alert"
          className="rounded-lg border-2 border-amber-600 bg-amber-50 p-6 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          <h1 className="text-xl font-bold">Access Restricted</h1>
          <p className="mt-2 text-sm">
            This area is reserved for organization administrators. If you manage an institution or
            venue, please log in with an administrator account.
          </p>
          <div className="mt-6">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-md border-2 border-transparent bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] hover:opacity-90"
            >
              Return to Explore
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const tabs = [
    { label: "Overview", href: "/organization" },
    { label: "Buildings", href: "/organization/buildings" },
    { label: "Maintenance", href: "/organization/maintenance" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-2 border-b-2 border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Organization Dashboard
          </span>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{organizationName}</h1>
        </div>
      </div>

      <nav
        aria-label="Organization navigation"
        className="mb-8 flex space-x-2 border-b border-[var(--border)] pb-2"
      >
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/organization"
              ? pathname === "/organization"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-b-2 border-[var(--primary)] bg-[var(--muted)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <main id="main-content">{children}</main>
    </div>
  );
}

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <OrganizationLayoutContent>{children}</OrganizationLayoutContent>
    </OrganizationProvider>
  );
}
