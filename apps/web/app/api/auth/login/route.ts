import { NextRequest, NextResponse } from "next/server";
import type { AuthResponse, LoginRequest } from "@pathpulse/shared-types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;
    const apiUrl =
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

    const apiRes = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return NextResponse.json(data, { status: apiRes.status });
    }

    const authData = data as AuthResponse;
    const response = NextResponse.json(
      {
        user: authData.user,
        accessToken: authData.tokens.accessToken,
      },
      { status: 200 },
    );

    response.cookies.set({
      name: "pp_refresh",
      value: authData.tokens.refreshToken,
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
        message: "Failed to process login request",
      },
      { status: 500 },
    );
  }
}
