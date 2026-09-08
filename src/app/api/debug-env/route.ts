import { NextResponse } from "next/server";

export const runtime = "nodejs";

function mask(v: string | undefined): string {
  if (!v) return "NOT SET";
  if (v.length <= 8) return "SET (len=" + v.length + ")";
  return `SET (${v.slice(0, 4)}…${v.slice(-4)})`;
}

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: mask(process.env.SUPABASE_URL),
    SUPABASE_ANON_KEY: mask(process.env.SUPABASE_ANON_KEY),
    SUPABASE_STORAGE_BUCKET: mask(process.env.SUPABASE_STORAGE_BUCKET),
    NEXT_PUBLIC_SUPABASE_URL: mask(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  });
}