import { NextResponse } from "next/server";
import { computeStats } from "@/lib/stats";
import { readSubmissions } from "@/lib/storage";

export async function GET() {
  const submissions = await readSubmissions();
  return NextResponse.json(computeStats(submissions));
}
