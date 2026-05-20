import { NextResponse } from "next/server";
import { submissionsToCsv } from "@/lib/stats";
import { readSubmissions } from "@/lib/storage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const submissions = await readSubmissions();

  if (format === "csv") {
    const csv = submissionsToCsv(submissions);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="dreamcore-submissions.csv"',
      },
    });
  }

  return new NextResponse(JSON.stringify(submissions, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dreamcore-submissions.json"',
    },
  });
}
