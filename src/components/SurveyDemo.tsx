"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BIRTH_YEARS,
  CITY_SCALES,
  DREAMCORE_FAMILIARITY,
  GEO_REGIONS,
  MILLENNIUM_ITEMS,
  getGeneration,
  getGeoRegionCities,
} from "@/lib/constants";
import { downloadImage, shareImage } from "@/lib/image-actions";
import type { GeneratedImage } from "@/lib/image-gen";
import type { ImageFeedback, Submission } from "@/lib/types";

const STEPS = [
  "欢迎",
  "基础信息",
  "记忆关键词",
  "意象问卷",
  "你的梦核关键词",
  "写下梦境",
  "梦境成片",
  "完成",
] as const;

const emptyForm = {
  birthYear: 1998,
  cityScale: "",
  geoRegion: "",
  geoRegionCities: "",
  dreamcoreFamiliarity: "",
  fillBlank: {
    place: "",
    space: "",
    object: "",
    light: "",
    sense: "",
  },
  firstPlace: "",
  millenniumItems: [] as string[],
  millenniumCustom: "",
  sensory: { colors: "", light: "", sounds: "" },
  dreamcoreKeywords: "",
  dreamDescription: "",
  imageFeedback: {} as Record<string, boolean | undefined>,
  feedbackNote: "",
};

function buildSentence(f: typeof emptyForm.fillBlank) {
  const { place, space, object, light, sense } = f;
  if (!place && !space && !object) return "";
  return `在${place || "___"}的${space || "___"}里，我看见${object || "___"}，光线像${light || "___"}，空气里有${sense || "___"}。`;
}

export default function SurveyDemo() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[] | null>(
    null,
  );
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [genErrorCode, setGenErrorCode] = useState("");
  const [isDemoImages, setIsDemoImages] = useState(false);

  const generation = getGeneration(form.birthYear);
  const sentence = useMemo(() => buildSentence(form.fillBlank), [form.fillBlank]);

  const toggleItem = (item: string) => {
    setForm((prev) => {
      const exists = prev.millenniumItems.includes(item);
      return {
        ...prev,
        millenniumItems: exists
          ? prev.millenniumItems.filter((i) => i !== item)
          : [...prev.millenniumItems, item],
      };
    });
  };

  const setFeedback = (sampleId: string, like: boolean) => {
    setForm((prev) => ({
      ...prev,
      imageFeedback: { ...prev.imageFeedback, [sampleId]: like },
    }));
  };

  const requestBody = useMemo(
    () => ({
      fillBlank: { ...form.fillBlank, sentence },
      firstPlace: form.firstPlace,
      millenniumItems: form.millenniumItems,
      sensory: form.sensory,
      dreamcoreKeywords: form.dreamcoreKeywords,
      dreamDescription: form.dreamDescription,
      birthYear: form.birthYear,
      cityScale: form.cityScale,
      geoRegion: form.geoRegion,
      geoRegionCities: form.geoRegionCities,
      dreamcoreFamiliarity: form.dreamcoreFamiliarity,
    }),
    [form, sentence],
  );

  const fetchGeneratedImages = useCallback(
    async (demoMode = false) => {
      setGenLoading(true);
      setGenError("");
      setGenErrorCode("");
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...requestBody, demoMode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setGenErrorCode(data.code ?? "");
          throw new Error(data.error || "生成失败");
        }
        setGeneratedImages(data.images);
        setIsDemoImages(!!data.demo);
        setForm((prev) => ({ ...prev, imageFeedback: {} }));
      } catch (e) {
        setGenError(e instanceof Error ? e.message : "生成失败");
        setGeneratedImages(null);
        setIsDemoImages(false);
      } finally {
        setGenLoading(false);
      }
    },
    [requestBody],
  );

  useEffect(() => {
    if (step < 6) {
      setGeneratedImages(null);
      setGenError("");
      setGenErrorCode("");
      setIsDemoImages(false);
    }
  }, [step]);

  useEffect(() => {
    if (step !== 6 || generatedImages || genLoading || genError) return;
    fetchGeneratedImages();
    // 仅在进入「生成反馈」步骤时自动请求一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const canNext = () => {
    if (step === 1)
      return (
        form.birthYear >= 1990 &&
        form.birthYear <= 2010 &&
        !!form.cityScale &&
        !!form.geoRegion &&
        !!form.dreamcoreFamiliarity
      );
    if (step === 2)
      return !!(
        form.fillBlank.place &&
        form.fillBlank.space &&
        form.fillBlank.object
      );
    if (step === 3)
      return !!(form.firstPlace && form.millenniumItems.length > 0);
    if (step === 4) return form.dreamcoreKeywords.trim().length >= 2;
    if (step === 5) return form.dreamDescription.trim().length >= 10;
    if (step === 6) {
      if (genLoading || !generatedImages?.length) return false;
      return generatedImages.every(
        (s) => form.imageFeedback[s.id] !== undefined,
      );
    }
    return true;
  };

  const submit = async () => {
    if (!generatedImages?.length) return;
    setSubmitting(true);
    setError("");
    const imageFeedback: ImageFeedback[] = generatedImages.map((s) => ({
      sampleId: s.id,
      label: s.label,
      prompt: s.prompt,
      imageUrl: s.imageUrl,
      isDemo: s.isDemo,
      like: form.imageFeedback[s.id] === true,
    }));

    const payload: Omit<Submission, "id" | "createdAt"> = {
      birthYear: form.birthYear,
      cityScale: form.cityScale,
      geoRegion: form.geoRegion,
      geoRegionCities: form.geoRegionCities,
      dreamcoreFamiliarity: form.dreamcoreFamiliarity,
      generation,
      fillBlank: { ...form.fillBlank, sentence },
      firstPlace: form.firstPlace,
      millenniumItems: form.millenniumItems,
      millenniumCustom: form.millenniumCustom,
      sensory: form.sensory,
      dreamcoreKeywords: form.dreamcoreKeywords,
      dreamDescription: form.dreamDescription,
      imageFeedback,
      feedbackNote: form.feedbackNote,
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "提交失败");
      }
      setStep(7);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-2xl px-5 py-10">
      <header className="mb-8 text-center">
        <p className="text-xs tracking-[0.4em] text-[var(--text-soft)]">
          dreamrecorder
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-wide text-[var(--text)]">
          中式梦核记录器
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">
          输入你的记忆关键词，生成独一无二的中式梦核影像
        </p>
      </header>

      {step > 0 && step < 7 && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-[var(--text-soft)]">
            <span>
              步骤 {step}/{STEPS.length - 2}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/40">
            <div
              className="h-full rounded-full bg-[var(--dusty-rose)]/70 transition-all"
              style={{ width: `${(step / (STEPS.length - 2)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <main className="card space-y-6">
        {step === 0 && (
          <section className="space-y-5 text-center">
            <p className="text-lg leading-relaxed text-[var(--text)]">
              唤醒你记忆中的千禧年场景
            </p>
            <ul className="space-y-2 text-left text-sm leading-relaxed text-[var(--text-soft)]">
              <li>· 填入属于你的记忆关键词</li>
              <li>· AI 为你生成 2 张独家中式梦核照片</li>
              <li>· 可保存、分享你的梦核记忆</li>
              <li>· 约 5–8 分钟</li>
            </ul>
            <button className="btn-primary w-full" onClick={() => setStep(1)}>
              开始记录梦境
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">个人基础信息</h2>
            <p className="text-sm text-[var(--text-soft)]">
              用于生成更贴近你成长背景的梦核画面（1990–2010 年出生）
            </p>
            <label className="block space-y-2">
              <span className="text-sm">出生年份 *</span>
              <select
                className="input-field"
                value={form.birthYear}
                onChange={(e) =>
                  setForm({ ...form, birthYear: Number(e.target.value) })
                }
              >
                {BIRTH_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y} 年
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-[var(--dusty-rose)]">世代：{generation}</p>
            <label className="block space-y-2">
              <span className="text-sm">成长城市规模 *</span>
              <select
                className="input-field"
                value={form.cityScale}
                onChange={(e) =>
                  setForm({ ...form, cityScale: e.target.value })
                }
              >
                <option value="">请选择</option>
                {CITY_SCALES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm">成长地区 *</span>
              <select
                className="input-field"
                value={form.geoRegion}
                onChange={(e) => {
                  const geoRegion = e.target.value;
                  setForm({
                    ...form,
                    geoRegion,
                    geoRegionCities: getGeoRegionCities(geoRegion),
                  });
                }}
              >
                <option value="">请选择</option>
                {GEO_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id}
                  </option>
                ))}
              </select>
              {form.geoRegion && (
                <p className="text-xs leading-relaxed text-[var(--text-soft)]">
                  涵盖省份：{form.geoRegionCities}
                </p>
              )}
            </label>
            <div className="space-y-2">
              <span className="text-sm">你了解「中式梦核」吗？ *</span>
              <div className="space-y-2">
                {DREAMCORE_FAMILIARITY.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                      form.dreamcoreFamiliarity === opt.id
                        ? "border-[var(--dusty-rose)] bg-[var(--soft-pink)]/50"
                        : "border-[var(--dusty-rose)]/30 bg-white/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="familiarity"
                      className="mt-1"
                      checked={form.dreamcoreFamiliarity === opt.id}
                      onChange={() =>
                        setForm({ ...form, dreamcoreFamiliarity: opt.id })
                      }
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">填入记忆关键词</h2>
            <p className="text-sm text-[var(--text-soft)]">
              这些词将直接决定为你生成的梦核画面内容
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["place", "地点", "废弃商场"],
                  ["space", "空间", "阈限走廊"],
                  ["object", "物体", "发光的老电视"],
                  ["light", "光线", "柔粉 VHS 柔光"],
                  ["sense", "声音/气味", "磁带沙沙声"],
                ] as const
              ).map(([key, label, ph]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-sm">{label}</span>
                  <input
                    className="input-field"
                    placeholder={ph}
                    value={form.fillBlank[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        fillBlank: {
                          ...form.fillBlank,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            {sentence && (
              <div className="rounded-xl bg-[var(--muted-yellow)]/50 p-4 text-base leading-relaxed">
                {sentence}
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold">描述你的梦核意象</h2>
            <label className="block space-y-2">
              <span className="text-sm">
                你想到「中式梦核」时，最先出现的地点是什么？ *
              </span>
              <input
                className="input-field"
                placeholder="例：空荡的学校走廊、老式居民楼天台"
                value={form.firstPlace}
                onChange={(e) =>
                  setForm({ ...form, firstPlace: e.target.value })
                }
              />
            </label>
            <div className="space-y-2">
              <span className="text-sm">你记忆中的千禧年物品（多选）*</span>
              <div className="flex flex-wrap gap-2">
                {MILLENNIUM_ITEMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`chip ${form.millenniumItems.includes(item) ? "chip-active" : ""}`}
                    onClick={() => toggleItem(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input
                className="input-field"
                placeholder="补充其他物品，用逗号分隔"
                value={form.millenniumCustom}
                onChange={(e) =>
                  setForm({ ...form, millenniumCustom: e.target.value })
                }
              />
            </div>
            <label className="block space-y-2">
              <span className="text-sm">最像童年梦境的颜色</span>
              <input
                className="input-field"
                placeholder="例：柔粉、奶油黄、低饱和马卡龙"
                value={form.sensory.colors}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sensory: { ...form.sensory, colors: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">最像童年梦境的光线</span>
              <input
                className="input-field"
                placeholder="例：雾霾柔光、VHS 过曝、日落站台金光"
                value={form.sensory.light}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sensory: { ...form.sensory, light: e.target.value },
                  })
                }
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm">最像童年梦境的声音</span>
              <input
                className="input-field"
                placeholder="例：电视雪花、远处火车、空调低频嗡鸣"
                value={form.sensory.sounds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sensory: { ...form.sensory, sounds: e.target.value },
                  })
                }
              />
            </label>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">你认为的梦核关键词</h2>
            <p className="text-sm text-[var(--text-soft)]">
              请自由输入关键词（用逗号分隔），生成图片时会重点参考这些词
            </p>
            <textarea
              rows={5}
              className="input-field resize-none"
              placeholder="例：阈限空间，低像素，强颗粒，老电视雪花，无人走廊，潮湿荧光灯"
              value={form.dreamcoreKeywords}
              onChange={(e) =>
                setForm({ ...form, dreamcoreKeywords: e.target.value })
              }
            />
          </section>
        )}

        {step === 5 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">写下你的梦境</h2>
            <p className="text-sm text-[var(--text-soft)]">
              用一段话描述场景，AI 将据此生成你的第二张独家中式梦核照片（至少 10 字）
            </p>
            <textarea
              rows={7}
              className="input-field resize-none"
              placeholder="无人场景、熟悉又陌生、轻微失真、像老照片又像 CGI……"
              value={form.dreamDescription}
              onChange={(e) =>
                setForm({ ...form, dreamDescription: e.target.value })
              }
            />
            <p className="text-xs text-[var(--text-soft)]">
              已输入 {form.dreamDescription.length} 字
            </p>
          </section>
        )}

        {step === 6 && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold">你的中式梦核记忆</h2>
            <p className="text-sm text-[var(--text-soft)]">
              {isDemoImages
                ? "当前为演示占位图。请判定是否符合中式梦核，并可保存分享"
                : "根据你的关键词生成的独家中式梦核照片，可保存分享，并判定「像不像」"}
            </p>

            {genLoading && (
              <div className="rounded-xl bg-white/40 px-4 py-10 text-center text-sm text-[var(--text-soft)]">
                <p className="animate-pulse text-xl tracking-widest text-[var(--text)]">
                  梦境生成中
                </p>
                <p className="mt-3">正在根据你的记忆关键词绘制 2 张梦核照片…</p>
                <p className="mt-2 text-xs">约 20–60 秒，请勿关闭页面</p>
              </div>
            )}

            {genError && (
              <div className="space-y-3 rounded-xl border border-red-200/60 bg-white/50 p-4 text-sm">
                <p className="text-red-800/90">{genError}</p>
                {genErrorCode === "BALANCE_INSUFFICIENT" ? (
                  <>
                    <p className="leading-relaxed text-[var(--text-soft)]">
                      这是账户余额问题，不是代码错误。请打开{" "}
                      <a
                        href="https://cloud.siliconflow.cn/account/ak"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        SiliconFlow 控制台
                      </a>{" "}
                      充值（生图约 ¥0.01/张）。充值后点「重新生成」即可。
                    </p>
                    <button
                      type="button"
                      className="btn-primary w-full"
                      onClick={() => fetchGeneratedImages(true)}
                    >
                      使用演示占位图继续（无需余额）
                    </button>
                  </>
                ) : (
                  <p className="text-[var(--text-soft)]">
                    若提示 Model disabled，把 <code>IMAGE_MODEL</code> 改为{" "}
                    <code>Kwai-Kolors/Kolors</code> 后重启服务。
                  </p>
                )}
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={() => fetchGeneratedImages(false)}
                >
                  重新生成
                </button>
              </div>
            )}

            <div className="space-y-4">
              {generatedImages?.map((sample) => (
                <div key={sample.id} className="overflow-hidden rounded-xl">
                  <div className="relative aspect-video w-full bg-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sample.imageUrl}
                      alt={sample.label}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-white/60 px-2 py-1 text-xs backdrop-blur-sm">
                      {sample.isDemo ? "演示占位" : "AI 生成"} · {sample.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 bg-white/30 p-3">
                    <button
                      type="button"
                      className="btn-ghost flex-1 min-w-[5rem]"
                      onClick={() =>
                        downloadImage(
                          sample.imageUrl,
                          `dreamrecorder-${sample.id}.png`,
                        )
                      }
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      className="btn-ghost flex-1 min-w-[5rem]"
                      onClick={() => shareImage(sample.imageUrl, sample.label)}
                    >
                      分享
                    </button>
                    <button
                      type="button"
                      disabled={genLoading}
                      className={`flex-1 min-w-[4rem] rounded-full py-2 text-sm transition ${
                        form.imageFeedback[sample.id] === true
                          ? "bg-[var(--soft-pink)] text-[var(--text)]"
                          : "bg-white/40 text-[var(--text-soft)]"
                      }`}
                      onClick={() => setFeedback(sample.id, true)}
                    >
                      像梦核
                    </button>
                    <button
                      type="button"
                      disabled={genLoading}
                      className={`flex-1 min-w-[4rem] rounded-full py-2 text-sm transition ${
                        form.imageFeedback[sample.id] === false
                          ? "bg-[var(--dusty-rose)]/60 text-[var(--text)]"
                          : "bg-white/40 text-[var(--text-soft)]"
                      }`}
                      onClick={() => setFeedback(sample.id, false)}
                    >
                      不像
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {generatedImages && !genLoading && (
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={() => {
                  setGeneratedImages(null);
                  setForm((prev) => ({ ...prev, imageFeedback: {} }));
                  fetchGeneratedImages();
                }}
              >
                重新生成 2 张图
              </button>
            )}
            <label className="block space-y-2">
              <span className="text-sm">补充说明（选填）</span>
              <input
                className="input-field"
                placeholder="哪里不像？你希望看到什么？"
                value={form.feedbackNote}
                onChange={(e) =>
                  setForm({ ...form, feedbackNote: e.target.value })
                }
              />
            </label>
          </section>
        )}

        {step === 7 && (
          <section className="space-y-4 text-center">
            <p className="text-2xl">✓ 记录完成</p>
            <p className="text-sm leading-relaxed text-[var(--text-soft)]">
              你的中式梦核记忆已存档。返回上一步仍可保存、分享已生成的图片。
            </p>
            <button
              className="btn-primary w-full"
              onClick={() => {
                setForm(emptyForm);
                setGeneratedImages(null);
                setGenError("");
                setGenErrorCode("");
                setIsDemoImages(false);
                setStep(0);
              }}
            >
              再填一份
            </button>
          </section>
        )}

        {error && (
          <p className="text-center text-sm text-red-700/80">{error}</p>
        )}

        {step > 0 && step < 7 && (
          <div className="flex gap-3 pt-2">
            <button
              className="btn-ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              上一步
            </button>
            {step < 6 ? (
              <button
                className="btn-primary ml-auto"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
              >
                下一步
              </button>
            ) : (
              <button
                className="btn-primary ml-auto"
                disabled={!canNext() || submitting}
                onClick={submit}
              >
                {submitting ? "提交中…" : "保存记录并提交"}
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-xs text-[var(--text-soft)]/80">
        <Link href="/admin" className="underline hover:text-[var(--text)]">
          研究员后台 · 导出与统计
        </Link>
      </footer>
    </div>
  );
}
