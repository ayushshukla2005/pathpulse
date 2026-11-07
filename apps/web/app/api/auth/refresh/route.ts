import { NextRequest, NextResponse } from "next/server";
import type { TokenPair } from "@pathpulse/shared-types";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("pp_refresh")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          statusCode: 401,
          error: "Unauthorized",
          message: "No refresh token provided",
        },
        { status: 401 },
      );
    }

    const apiUrl =
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const apiRes = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      const response = NextResponse.json(data, { status: apiRes.status });
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

    const tokenData = data as { tokens: TokenPair };
    const response = NextResponse.json(
      {
        accessToken: tokenData.tokens.accessToken,
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "pp_refresh",
      value: tokenData.tokens.refreshToken,
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
        statusCode: 500,
        error: "Internal Server Error",
        message: "Failed to refresh token",
      },
      { status: 500 },
    );
  }
}
