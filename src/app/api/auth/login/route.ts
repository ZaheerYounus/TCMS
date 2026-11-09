import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/userService";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password, or account is disabled." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error during authentication.",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
