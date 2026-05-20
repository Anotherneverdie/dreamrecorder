import type { GenerateContext } from "./prompts-types";

export type { GenerateContext } from "./prompts-types";

const NEGATIVE_STYLE =
  "STRICTLY NOT: CGI, 3D render, Blender, Octane, Unreal, illustration, anime, cartoon, digital art, glossy surfaces, 8K sharp, ultra-clean edges, high-detail texture, professional studio photo, HDR, clean commercial photography, text overlay, watermark.";

const REALISM_CORE =
  "Authentic real-world photograph taken in China circa 1999-2008, NOT AI art style. Deliberately low fidelity: cheap Y2K-era 0.3-1.3 megapixel CCD camera look, blocky pixels, heavy JPEG compression artifacts, strong coarse film grain, analog scan dust, soft focus, slight motion blur, chromatic aberration, mild overexposure, soft bloom halation, low dynamic range, imperfect white balance.";

const DREAMCORE_CORE =
  "Chinese dreamcore (中式梦核): empty uninhabited liminal spaces, surreal but familiar childhood memory, nostalgic yet unsettling, quiet lonely atmosphere. Low saturation with soft pink, cream yellow, pale macaron tones, warm greenish-yellow cast, faded VHS color palette, foggy soft diffused lighting, childhood memory distortion.";

const REFERENCE_AESTHETIC =
  "Visual reference style: Chinese urban millennium snapshots — blue apartment blocks with laundry on balconies, empty school computer room with old CRT monitors, plastic playground slides on concrete, indoor children's play area with hazy window light, cramped student bedroom with pink patterned sheets, gumball machine close-up, carousel behind metal fence, tiled corridors, external AC units and tangled wires. Mundane documentary snapshot, not staged.";

const CAMERA =
  "Wide shot or medium shot, deep depth of field, optional slight fisheye or tilted angle, cinematic film still composition, golden hour or overcast soft light.";

const NO_PEOPLE =
  "Absolutely NO people, NO faces, NO human silhouettes, NO crowds. Empty scene only.";

function userKeywords(ctx: GenerateContext): string {
  const custom = ctx.dreamcoreKeywords
    .split(/[，,、；;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);
  const items = ctx.millenniumItems.slice(0, 5);
  return [...custom, ...items].filter(Boolean).join(", ");
}

function regionContext(ctx: GenerateContext): string {
  const parts = [
    ctx.geoRegion ? `Region of China: ${ctx.geoRegion}` : "",
    ctx.cityScale ? `Urban context: ${ctx.cityScale}` : "",
    ctx.geoRegionCities ? `Covered provinces: ${ctx.geoRegionCities}` : "",
  ].filter(Boolean);
  return parts.join(". ");
}

function buildBasePrompt(scene: string, ctx: GenerateContext): string {
  const keywords = userKeywords(ctx);
  return [
    REALISM_CORE,
    DREAMCORE_CORE,
    REFERENCE_AESTHETIC,
    regionContext(ctx),
    `Scene (empty, no people): ${scene}`,
    `User memory keywords to emphasize (highest priority): ${keywords || "liminal space, CRT TV, VHS, soft pink, cream yellow"}`,
    `Colors and light from user: ${ctx.sensory.colors || "soft pink, cream yellow"}, ${ctx.sensory.light || "faded VHS haze, soft diffused glow"}.`,
    `Sound/atmosphere mood: ${ctx.sensory.sounds || "quiet tape static, distant hum"}.`,
    `Objects: ${ctx.millenniumItems.slice(0, 4).join(", ") || "old CRT TV, VHS tape, cassette player"}.`,
    CAMERA,
    NO_PEOPLE,
    NEGATIVE_STYLE,
  ].join(" ");
}

export function buildPromptVariants(ctx: GenerateContext) {
  const place = ctx.fillBlank.place || "abandoned shopping mall";
  const space = ctx.fillBlank.space || "liminal hallway";
  const object = ctx.fillBlank.object || "glowing old CRT television";
  const light = ctx.fillBlank.light || "soft pink VHS diffused light";
  const sense = ctx.fillBlank.sense || "faint magnetic tape static";

  return [
    {
      id: "sample-a",
      label: "你的记忆关键词 · 梦核场景",
      prompt: buildBasePrompt(
        [
          `In ${place}, inside ${space}, ${object} sits alone under ${light}.`,
          `Atmosphere: ${sense}.`,
          `Memory place anchor: ${ctx.firstPlace || "empty school corridor"}.`,
          ctx.fillBlank.sentence,
          "Unreasonable but familiar object, childhood distortion, empty playground or residential block feeling.",
        ].join(" "),
        ctx,
      ),
    },
    {
      id: "sample-b",
      label: "你的梦境叙述 · 独家梦核",
      prompt: buildBasePrompt(
        [
          `Visualize this specific Chinese childhood dream memory as one real photograph: ${ctx.dreamDescription.slice(0, 500)}`,
          "Dreamlike liminal space, watercolor bleed at edges, blurry out-of-focus background, endless corridor or foggy field feeling if fits.",
        ].join(" "),
        ctx,
      ),
    },
  ];
}

export const DREAMCORE_NEGATIVE_PROMPT =
  "people, human, face, person, man, woman, child, crowd, CGI, 3D render, blender, octane, unreal engine, illustration, anime, cartoon, digital painting, glossy, hyperrealistic, 8k, ultra sharp, pristine clean texture, professional studio, HDR, stock photo, text, watermark, logo, nsfw";
