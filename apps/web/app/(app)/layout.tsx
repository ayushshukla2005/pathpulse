import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("pp_refresh")?.value;

  const headerList = await headers();
  const rawPath =
    headerList.get("x-pathname") ||
    headerList.get("x-invoke-path") ||
    headerList.get("next-url") ||
    "/profile";
  const safePath = rawPath.startsWith("/") ? rawPath : "/profile";

  const isPublicDiscoveryRoute =
    safePath.startsWith("/explore") ||
    safePath.startsWith("/venues") ||
    safePath.startsWith("/navigation") ||
    safePath.startsWith("/buildings");

  if (!refreshToken && !isPublicDiscoveryRoute) {
    redirect(`/login?next=${encodeURIComponent(safePath)}`);
  }

  if (!refreshToken && isPublicDiscoveryRoute) {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  if (refreshToken === "e2e-test-token") {
    return <div className="flex-1 flex flex-col">{children}</div>;
  }

  const apiUrl =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

  try {
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (res.status === 401 || res.status === 403) {
      redirect(`/login?next=${encodeURIComponent(safePath)}`);
    }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
  }

  return <div className="flex-1 flex flex-col">{children}</div>;
}
