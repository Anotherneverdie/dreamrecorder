import { NextResponse } from "next/server";
import { getGeneration } from "@/lib/constants";
import { appendSubmission, readSubmissions } from "@/lib/storage";
import type { Submission } from "@/lib/types";

export async function GET() {
  const submissions = await readSubmissions();
  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Omit<Submission, "id" | "createdAt">;

    if (!body.birthYear || body.birthYear < 1990 || body.birthYear > 2010) {
      return NextResponse.json(
        { error: "出生年份需在 1990–2010 之间" },
        { status: 400 },
      );
    }

    const submission: Submission = {
      ...body,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      generation: body.generation || getGeneration(body.birthYear),
    };

    await appendSubmission(submission);
    return NextResponse.json({ ok: true, submission });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
