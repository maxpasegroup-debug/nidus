import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server/demo-auth";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    return NextResponse.json(user);
  } catch (_error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
