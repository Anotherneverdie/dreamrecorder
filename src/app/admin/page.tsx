"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { StatsResult } from "@/lib/types";

export default function AdminPage() {
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/stats");
    const data = await res.json();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative z-10 mx-auto min-h-screen max-w-3xl px-5 py-10">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-[var(--text-soft)] underline hover:text-[var(--text)]"
        >
          ← 返回问卷
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">dreamrecorder 研究员后台</h1>
        <p className="mt-2 text-sm text-[var(--text-soft)]">
          导出用户填写内容 · 统计高频关键词 · 查看像/不像反馈
        </p>
      </header>

      <section className="card mb-6 space-y-4">
        <h2 className="text-lg font-semibold">数据导出</h2>
        <div className="flex flex-wrap gap-3">
          <a className="btn-primary" href="/api/export?format=json">
            导出 JSON
          </a>
          <a className="btn-primary" href="/api/export?format=csv">
            导出 CSV
          </a>
          <button className="btn-ghost" onClick={load}>
            刷新统计
          </button>
        </div>
        <p className="text-xs text-[var(--text-soft)]">
          数据保存在项目 <code>data/submissions.json</code>
        </p>
      </section>

      {loading && <p className="text-center text-sm">加载中…</p>}

      {stats && !loading && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">总览</h2>
            <p className="text-2xl">{stats.totalSubmissions} 份问卷</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {Object.entries(stats.generationBreakdown).map(([g, n]) => (
                <span key={g} className="chip chip-active">
                  {g}：{n}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">高频关键词 Top 15</h2>
            {stats.topKeywords.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)]">暂无数据</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {stats.topKeywords.slice(0, 15).map((k) => (
                  <li key={k.word} className="flex justify-between">
                    <span>{k.word}</span>
                    <span className="text-[var(--text-soft)]">{k.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">千禧物品高频 Top 10</h2>
            <ul className="space-y-2 text-sm">
              {stats.topMillenniumItems.slice(0, 10).map((k) => (
                <li key={k.word} className="flex justify-between">
                  <span>{k.word}</span>
                  <span className="text-[var(--text-soft)]">{k.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">生成图反馈（像 / 不像）</h2>
            {stats.feedbackSummary.length === 0 ? (
              <p className="text-sm text-[var(--text-soft)]">暂无反馈</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {stats.feedbackSummary.map((f) => (
                  <li key={f.sampleId} className="rounded-xl bg-white/30 p-3">
                    <p className="font-medium">{f.label}</p>
                    <p className="mt-1 text-[var(--text-soft)]">
                      像 {f.likeCount} · 不像 {f.dislikeCount} · 像的比例{" "}
                      {f.likeRate}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
