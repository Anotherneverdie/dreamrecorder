import { NextResponse } from "next/server";
import { generateDreamcoreImages } from "@/lib/image-gen";
import { buildPlaceholderImages } from "@/lib/placeholder-images";
import type { GenerateContext } from "@/lib/prompts";

export const maxDuration = 120;

type GenerateRequest = GenerateContext & {
  demoMode?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!body.dreamDescription?.trim()) {
      return NextResponse.json(
        { error: "请先完成梦境描述再生成图片" },
        { status: 400 },
      );
    }

    const useDemo =
      body.demoMode === true || process.env.IMAGE_DEMO_MODE === "true";

    if (useDemo) {
      const images = buildPlaceholderImages(body);
      return NextResponse.json({ images, demo: true });
    }

    const batchId = crypto.randomUUID().slice(0, 8);
    const images = await generateDreamcoreImages(body, batchId);

    return NextResponse.json({ images, demo: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "生成失败";
    const isBalance = message.includes("BALANCE_INSUFFICIENT");
    return NextResponse.json(
      { error: message.replace("BALANCE_INSUFFICIENT: ", ""), code: isBalance ? "BALANCE_INSUFFICIENT" : "GENERATION_FAILED" },
      { status: isBalance ? 402 : 500 },
    );
  }
}
