import { NextResponse } from "next/server";
import { loginWithPassword } from "@/lib/server/demo-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Email or mobile and password are required", code: 400 }, { status: 400 });
    }

    const response = await loginWithPassword(identifier, password);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const status = message === "Invalid credentials" ? 401 : 400;

    return NextResponse.json({ success: false, message, code: status }, { status });
  }
}

