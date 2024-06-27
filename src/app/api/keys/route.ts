import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(process.env.NEXT_PUBLIC_GROQ_API_KEY ?? undefined);
}
