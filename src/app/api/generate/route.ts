import { NextResponse } from "next/server";
import { generateDreamcoreImages } from "@/lib/image-gen";
import { buildPlaceholderImages } from "@/lib/placeholder-images";
import type { GenerateContext } from "@/lib/prompts";

// 保持你原项目设置的最大超时时间，防止生图时间过长导致 Vercel/Zeabur 函数中断
export const maxDuration = 120;

type GenerateRequest = GenerateContext & {
  demoMode?: boolean;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateRequest;

    // 基础校验：如果没有输入梦境描述，直接拦截
    if (!body.dreamDescription?.trim()) {
      return NextResponse.json(
        { error: "请先完成梦境描述再生成图片" },
        { status: 400 },
      );
    }

    // 检查是否开启了演示模式（IMAGE_DEMO_MODE）
    const useDemo =
      body.demoMode === true || process.env.IMAGE_DEMO_MODE === "true";

    if (useDemo) {
      const images = buildPlaceholderImages(body);
      return NextResponse.json({ images, demo: true });
    }

    // 正常调用：生成一个批次 ID，并调用更换了 Google SDK 的 image-gen 核心函数
    const batchId = crypto.randomUUID().slice(0, 8);
    const images = await generateDreamcoreImages(body, batchId);

    return NextResponse.json({ images, demo: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "生成失败";
    
    // 关键改动：检查错误信息中是否包含我们在 image-gen.ts 里抛出的 Google 免费额度耗尽标识
    const isQuotaOut = message.includes("QUOTA_EXHAUSTED");
    
    return NextResponse.json(
      { 
        // 如果是免费额度到头了，给用户一个温柔的提示，否则显示具体错误
        error: isQuotaOut ? "当前体验人数过多，免费生图额度已耗尽，请明天再试" : message, 
        // 巧妙的一步：将错误码 code 伪装成 BALANCE_INSUFFICIENT
        // 这样你前端写好的“余额不足/无法生成”的精美弹窗样式完全不需要改动，直接就能触发
        code: isQuotaOut ? "BALANCE_INSUFFICIENT" : "GENERATION_FAILED" 
      },
      { status: isQuotaOut ? 429 : 500 },
    );
  }
}