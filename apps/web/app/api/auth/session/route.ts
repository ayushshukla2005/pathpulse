import { NextRequest, NextResponse } from "next/server";
import type { CurrentUserProfile, TokenPair } from "@pathpulse/shared-types";

export async function GET(request: NextRequest) {
  try {
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

    const apiUrl =
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
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

    const meRes = await fetch(`${apiUrl}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          accessToken: null,
        },
        { status: 200 },
      );
    }

    const userProfile = (await meRes.json()) as CurrentUserProfile;

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
      value: refreshData.tokens.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        accessToken: null,
      },
      { status: 200 },
    );
  }
}
