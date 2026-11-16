import { NextRequest, NextResponse } from "next/server";
import type { CurrentUserProfile, TokenPair } from "@pathpulse/shared-types";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const refreshToken = request.cookies.get("pp_refresh")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        accessToken: null,
      },
      { status: 200 },
    );
  }

  const apiUrl = process.env.API_INTERNAL_URL
    ? `${process.env.API_INTERNAL_URL}/api/v1`
    : process.env.API_BASE_URL || "http://localhost:4000/api/v1";

  let refreshRes: Response;
  try {
    refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch {
    console.error(JSON.stringify({ requestId, status: 503 }));
    return NextResponse.json(
      {
        statusCode: 503,
        error: "Service Unavailable",
        message: "Authentication service unreachable",
      },
      { status: 503 },
    );
  }

  if (refreshRes.status === 401 || refreshRes.status === 403) {
    console.warn(JSON.stringify({ requestId, status: refreshRes.status }));
    const response = NextResponse.json(
      {
        authenticated: false,
        user: null,
        accessToken: null,
      },
      { status: 200 },
    );
    response.cookies.set({
      name: "pp_refresh",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (refreshRes.status >= 500) {
    console.error(JSON.stringify({ requestId, status: refreshRes.status }));
    return NextResponse.json(
      {
        statusCode: 503,
        error: "Service Unavailable",
        message: "Authentication service temporarily unavailable",
      },
      { status: 503 },
    );
  }

  if (!refreshRes.ok) {
    console.warn(JSON.stringify({ requestId, status: refreshRes.status }));
    const response = NextResponse.json(
      {
        authenticated: false,
        user: null,
        accessToken: null,
      },
      { status: 200 },
    );
    response.cookies.set({
      name: "pp_refresh",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  const refreshData = (await refreshRes.json()) as { tokens: TokenPair };
  const accessToken = refreshData.tokens.accessToken;
  const newRefreshToken = refreshData.tokens.refreshToken;

  let meRes: Response;
  try {
    meRes = await fetch(`${apiUrl}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-request-id": requestId,
      },
      cache: "no-store",
    });
  } catch {
    console.error(JSON.stringify({ requestId, status: 503 }));
    return NextResponse.json(
      {
        statusCode: 503,
        error: "Service Unavailable",
        message: "User service unreachable",
      },
      { status: 503 },
    );
  }

  if (meRes.status === 401 || meRes.status === 403) {
    console.warn(JSON.stringify({ requestId, status: meRes.status }));
    const response = NextResponse.json(
      {
        authenticated: false,
        user: null,
        accessToken: null,
      },
      { status: 200 },
    );
    response.cookies.set({
      name: "pp_refresh",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  if (meRes.status >= 500) {
    console.error(JSON.stringify({ requestId, status: meRes.status }));
    return NextResponse.json(
      {
        statusCode: 503,
        error: "Service Unavailable",
        message: "User service temporarily unavailable",
      },
      { status: 503 },
    );
  }

  if (!meRes.ok) {
    console.warn(JSON.stringify({ requestId, status: meRes.status }));
    return NextResponse.json(
      {
        statusCode: 503,
        error: "Service Unavailable",
        message: "Failed to load user profile",
      },
      { status: 503 },
    );
  }

  const userProfile = (await meRes.json()) as CurrentUserProfile;
  console.info(JSON.stringify({ requestId, status: 200 }));

  const response = NextResponse.json(
    {
      authenticated: true,
      user: userProfile,
      accessToken,
    },
    { status: 200 },
  );

  response.cookies.set({
    name: "pp_refresh",
    value: newRefreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}
