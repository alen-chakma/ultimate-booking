import { NextRequest, NextResponse } from "next/server";
import { getAdminFirebase } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = 60 * 60 * 24 * 5 * 1000; // 5 days in ms

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const { auth } = getAdminFirebase();

    // Verify the ID token
    const decoded = await auth.verifyIdToken(token);

    // Create a session cookie
    const sessionCookie = await auth.createSessionCookie(token, {
      expiresIn: SESSION_DURATION,
    });

    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_DURATION / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
