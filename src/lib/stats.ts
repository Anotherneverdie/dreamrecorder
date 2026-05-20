import type { StatsResult, Submission } from "./types";

function bump(map: Record<string, number>, key: string, n = 1) {
  const k = key.trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + n;
}

function topEntries(map: Record<string, number>, limit = 20) {
  return Object.entries(map)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s,，、；;。.!！?？/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function computeStats(submissions: Submission[]): StatsResult {
  const generationBreakdown: Record<string, number> = {};
  const keywordFreq: Record<string, number> = {};
  const millenniumFreq: Record<string, number> = {};
  const feedbackMap: Record<
    string,
    { label: string; like: number; dislike: number }
  > = {};

  for (const s of submissions) {
    bump(generationBreakdown, s.generation);

    tokenize(s.firstPlace).forEach((w) => bump(keywordFreq, w));
    tokenize(s.fillBlank.sentence).forEach((w) => bump(keywordFreq, w));
    tokenize(s.dreamDescription).forEach((w) => bump(keywordFreq, w));
    tokenize(s.sensory.colors).forEach((w) => bump(keywordFreq, w));
    tokenize(s.sensory.light).forEach((w) => bump(keywordFreq, w));
    tokenize(s.sensory.sounds).forEach((w) => bump(keywordFreq, w));
    tokenize(s.dreamcoreKeywords ?? "").forEach((w) => bump(keywordFreq, w));

    [
      s.fillBlank.place,
      s.fillBlank.space,
      s.fillBlank.object,
      s.fillBlank.light,
      s.fillBlank.sense,
    ].forEach((w) => bump(keywordFreq, w));

    s.millenniumItems.forEach((item) => bump(millenniumFreq, item));
    tokenize(s.millenniumCustom).forEach((w) => bump(millenniumFreq, w));

    for (const f of s.imageFeedback) {
      if (!feedbackMap[f.sampleId]) {
        feedbackMap[f.sampleId] = { label: f.label, like: 0, dislike: 0 };
      }
      if (f.like) feedbackMap[f.sampleId].like += 1;
      else feedbackMap[f.sampleId].dislike += 1;
    }
  }

  const feedbackSummary = Object.entries(feedbackMap).map(
    ([sampleId, { label, like, dislike }]) => {
      const total = like + dislike;
      return {
        sampleId,
        label,
        likeCount: like,
        dislikeCount: dislike,
        likeRate: total ? Math.round((like / total) * 100) : 0,
      };
    },
  );

  return {
    totalSubmissions: submissions.length,
    generationBreakdown,
    topKeywords: topEntries(keywordFreq),
    topMillenniumItems: topEntries(millenniumFreq),
    feedbackSummary,
  };
}

export function submissionsToCsv(submissions: Submission[]): string {
  const headers = [
    "id",
    "createdAt",
    "birthYear",
    "cityScale",
    "geoRegion",
    "geoRegionCities",
    "dreamcoreFamiliarity",
    "generation",
    "fillBlankSentence",
    "firstPlace",
    "millenniumItems",
    "colors",
    "light",
    "sounds",
    "dreamcoreKeywords",
    "dreamDescription",
    "imageFeedback",
    "feedbackNote",
  ];

  const rows = submissions.map((s) =>
    [
      s.id,
      s.createdAt,
      s.birthYear,
      s.cityScale,
      s.geoRegion,
      s.geoRegionCities,
      s.dreamcoreFamiliarity,
      s.generation,
      s.fillBlank.sentence,
      s.firstPlace,
      s.millenniumItems.join("|"),
      s.sensory.colors,
      s.sensory.light,
      s.sensory.sounds,
      s.dreamcoreKeywords ?? "",
      s.dreamDescription,
      s.imageFeedback
        .map(
          (f) =>
            `${f.sampleId}:${f.like ? "像" : "不像"}:${f.imageUrl ?? ""}`,
        )
        .join("|"),
      s.feedbackNote,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
