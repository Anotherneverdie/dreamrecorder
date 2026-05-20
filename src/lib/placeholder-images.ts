import { buildPromptVariants } from "./prompts";
import type { GenerateContext } from "./prompts-types";
import type { GeneratedImage } from "./image-gen";

const GRADIENTS = [
  ["#f3d6e0", "#f5ecd4", "#faf3e6"],
  ["#e8d4dc", "#f0e8d8", "#f8e8e0"],
];

function svgDataUrl(title: string, subtitle: string, colors: string[]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576" viewBox="0 0 1024 576">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors[0]}"/>
      <stop offset="50%" style="stop-color:${colors[1]}"/>
      <stop offset="100%" style="stop-color:${colors[2]}"/>
    </linearGradient>
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/><feColorMatrix type="saturate" values="0"/></filter>
  </defs>
  <rect width="1024" height="576" fill="url(#g)"/>
  <rect width="1024" height="576" filter="url(#n)" opacity="0.08"/>
  <text x="512" y="260" text-anchor="middle" font-family="Songti SC, SimSun, serif" font-size="28" fill="#5c4f52">演示占位图 · Demo</text>
  <text x="512" y="310" text-anchor="middle" font-family="Songti SC, SimSun, serif" font-size="22" fill="#8a7d80">${title}</text>
  <text x="512" y="360" text-anchor="middle" font-family="Songti SC, SimSun, serif" font-size="16" fill="#8a7d80" opacity="0.85">${subtitle.slice(0, 48)}</text>
  <text x="512" y="500" text-anchor="middle" font-family="Songti SC, SimSun, serif" font-size="14" fill="#8a7d80" opacity="0.6">充值 SiliconFlow 后可切换为真实 AI 生图</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildPlaceholderImages(ctx: GenerateContext): GeneratedImage[] {
  const variants = buildPromptVariants(ctx);
  return variants.map((v, i) => ({
    id: v.id,
    label: `${v.label}（演示）`,
    prompt: v.prompt,
    imageUrl: svgDataUrl(
      v.label,
      ctx.fillBlank.sentence || ctx.dreamDescription.slice(0, 40),
      GRADIENTS[i % GRADIENTS.length],
    ),
    isDemo: true,
  }));
}
