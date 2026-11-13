import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("pp_refresh")?.value;
    const apiUrl = process.env.API_INTERNAL_URL
      ? `${process.env.API_INTERNAL_URL}/api/v1`
      : process.env.API_BASE_URL || "http://localhost:4000/api/v1";

    if (refreshToken) {
      try {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        void err;
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
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
  } catch {
    const response = NextResponse.json({ success: true }, { status: 200 });
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
}
