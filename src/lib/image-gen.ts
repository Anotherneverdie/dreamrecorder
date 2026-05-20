import { promises as fs } from "fs";
import path from "path";
import { buildPromptVariants, DREAMCORE_NEGATIVE_PROMPT } from "./prompts";
import type { GenerateContext } from "./prompts-types";

export type GeneratedImage = {
  id: string;
  label: string;
  prompt: string;
  imageUrl: string;
  isDemo?: boolean;
};

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

const NEGATIVE_PROMPT = DREAMCORE_NEGATIVE_PROMPT;

async function saveImageFromUrl(remoteUrl: string, filename: string) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`下载图片失败: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const filePath = path.join(GENERATED_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/generated/${filename}`;
}

async function saveImageFromBase64(b64: string, filename: string) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const buffer = Buffer.from(b64, "base64");
  const filePath = path.join(GENERATED_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/generated/${filename}`;
}

function buildRequestBody(model: string, prompt: string) {
  const imageSize = process.env.IMAGE_SIZE ?? "768x512";
  const base = {
    model,
    prompt: prompt.slice(0, 4000),
    image_size: imageSize,
    negative_prompt: NEGATIVE_PROMPT,
  };

  if (model.includes("FLUX")) {
    return {
      ...base,
      num_inference_steps: Number(process.env.IMAGE_INFERENCE_STEPS ?? 4),
    };
  }

  if (model.includes("Qwen")) {
    return {
      ...base,
      num_inference_steps: Number(process.env.IMAGE_INFERENCE_STEPS ?? 20),
    };
  }

  return base;
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  const fromData = (data.data as { url?: string; b64_json?: string }[])?.[0];
  if (fromData?.url) return fromData.url;
  if (fromData?.b64_json) return `base64:${fromData.b64_json}`;

  const fromImages = (data.images as { url?: string }[])?.[0];
  if (fromImages?.url) return fromImages.url;

  return null;
}

async function generateWithSiliconFlow(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.siliconflow.cn/v1";
  const model =
    process.env.IMAGE_MODEL ??
    process.env.OPENAI_IMAGE_MODEL ??
    "Kwai-Kolors/Kolors";

  if (!apiKey) {
    throw new Error("未配置 OPENAI_API_KEY，请在 .env.local 中设置");
  }

  const res = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRequestBody(model, prompt)),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message ?? data?.error?.message ?? res.statusText;
    const msgLower = String(msg).toLowerCase();
    if (msgLower.includes("balance") || msgLower.includes("insufficient")) {
      throw new Error(
        "BALANCE_INSUFFICIENT: SiliconFlow 账户余额不足，请前往 cloud.siliconflow.cn 充值后再试",
      );
    }
    if (msgLower.includes("disabled")) {
      throw new Error(
        `模型 ${model} 已停用。请在 .env.local 将 IMAGE_MODEL 改为 Kwai-Kolors/Kolors 或 Tongyi-MAI/Z-Image-Turbo`,
      );
    }
    throw new Error(`SiliconFlow 生图失败: ${msg}`);
  }

  const url = extractImageUrl(data);
  if (!url) throw new Error("SiliconFlow 未返回图片数据");

  return url;
}

export async function generateDreamcoreImages(
  ctx: GenerateContext,
  batchId: string,
): Promise<GeneratedImage[]> {
  const variants = buildPromptVariants(ctx);
  const results: GeneratedImage[] = [];

  for (const v of variants) {
    const remote = await generateWithSiliconFlow(v.prompt);
    const filename = `${batchId}-${v.id}.png`;

    const imageUrl = remote.startsWith("base64:")
      ? await saveImageFromBase64(remote.slice(7), filename)
      : await saveImageFromUrl(remote, filename);

    results.push({
      id: v.id,
      label: v.label,
      prompt: v.prompt,
      imageUrl,
    });
  }

  return results;
}
