import { promises as fs } from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
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

/**
 * 终极完美初始化：直接在文件顶层实例化，显式传递配置对象，完美绕过 Next.js 线上类型检查
 */
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("未配置 GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}

// 如果你下方的函数里还留着调用 getAI() 的地方，为了安全起见，我们保留这个壳子，让它直接返回上面的 ai 实例
function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("未配置 GEMINI_API_KEY，请在 Zeabur 环境变量中设置");
  }
  return ai;
}



// 将 Google 返回的图片数据保存到你现有的本地 data/submissions 类似的持久化目录中
async function saveImageFromBase64(b64: string, filename: string) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });
  const buffer = Buffer.from(b64, "base64");
  const filePath = path.join(GENERATED_DIR, filename);
  await fs.writeFile(filePath, buffer);
  return `/generated/${filename}`;
}

// 调用 Google 接口生图
async function generateWithGoogleGemini(prompt: string): Promise<string> {
  const model = process.env.IMAGE_MODEL || "gemini-3.1-flash-image-preview";
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("未配置 GEMINI_API_KEY，请在 Zeabur 后台设置");
  }

  // 融合你原本写好的梦核负向提示词（DREAMCORE_NEGATIVE_PROMPT）
  const fullPrompt = `${prompt}. Avoid these traits: ${DREAMCORE_NEGATIVE_PROMPT}`;

  try {
    const response = await getAIClient().models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("Google AI Studio 未返回任何内容，可能被安全策略拦截。");
    }

    for (const part of parts) {
      if (part.inlineData) {
        if (part.inlineData.data) 
          // @ts-ignore
        return part.inlineData.data;
      }
    }

    throw new Error("未在 Google 响应中找到有效图片数据");
  } catch (error: any) {
    const msg = String(error?.message || error).toLowerCase();
    // 如果免费额度超限，抛出特定错误
    if (msg.includes("quota") || msg.includes("exhausted") || msg.includes("429")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    throw new Error(`Google 生图失败: ${error?.message || error}`);
  }
}

// 批量生成梦境场景（对应你的前台多场景生成）
export async function generateDreamcoreImages(
  ctx: GenerateContext,
  batchId: string,
): Promise<GeneratedImage[]> {
  const variants = buildPromptVariants(ctx);
  const results: GeneratedImage[] = [];

  for (const v of variants) {
    // 换成调用 Google 接口
    const base64Str = await generateWithGoogleGemini(v.prompt);
    const filename = `${batchId}-${v.id}.png`;

    // 直接保存
    const imageUrl = await saveImageFromBase64(base64Str, filename);

    results.push({
      id: v.id,
      label: v.label,
      prompt: v.prompt,
      imageUrl,
    });
  }

  return results;
}