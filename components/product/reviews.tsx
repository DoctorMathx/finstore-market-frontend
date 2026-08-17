"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import type { Review } from "@/lib/types";
import { ProductImage, RatingStars } from "@/components/ui";

type Filter = "all" | "photos" | "1" | "2" | "3" | "4" | "5";
type Sort = "recent" | "helpful" | "high" | "low";

export function ReviewSection({
  reviews,
  average,
  count,
  histogram,
}: {
  reviews: Review[];
  average?: number;
  count: number;
  histogram?: number[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [shown, setShown] = useState(10);

  const filtered = useMemo(() => {
    let list = reviews;
    if (filter === "photos") list = list.filter((r) => r.photos.length > 0);
    else if (filter !== "all") list = list.filter((r) => r.rating === Number(filter));

    return [...list].sort((a, b) => {
      if (sort === "helpful") return b.helpful - a.helpful;
      if (sort === "high") return b.rating - a.rating;
      if (sort === "low") return a.rating - b.rating;
      return b.date.localeCompare(a.date);
    });
  }, [reviews, filter, sort]);

  // The histogram is not rendered at all when there is nothing to plot.
  if (!count || !average || !histogram) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-h2">Reviews</h2>
        <p className="mt-1 text-body text-muted-foreground">
          No reviews yet — be the first to review this after your order arrives.
        </p>
      </div>
    );
  }

  const total = histogram.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="grid gap-5 border-b border-border p-5 lg:grid-cols-[260px_1fr]">
        <div>
          <p className="flex items-center gap-2 text-display">
            {average}
            <RatingStars value={average} size={18} />
          </p>
          <p className="text-small text-muted-foreground">{count.toLocaleString()} reviews</p>
        </div>

        <ul className="flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const value = histogram[stars - 1] ?? 0;
            const percent = Math.round((value / total) * 100);
            const active = filter === String(stars);
            return (
              <li key={stars}>
                {/* Histogram bars are clickable filters. */}
                <button
                  onClick={() => setFilter(active ? "all" : (String(stars) as Filter))}
                  className="flex w-full items-center gap-2 text-small text-muted-foreground hover:text-primary-strong"
                >
                  <span className="w-8 shrink-0 text-left">{stars} ★</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-background-alt">
                    <span
                      className={`block h-full rounded-full ${active ? "bg-primary" : "bg-primary"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                  <span className="w-9 shrink-0 text-right tabular-nums">{percent}%</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        {(["all", "photos", "5", "4", "3", "2", "1"] as Filter[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 text-small ${
              filter === key ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-muted-foreground"
            }`}
          >
            {key === "all" ? "All" : key === "photos" ? "With photos" : `${key}★`}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-small text-muted-foreground">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-md border border-border px-2 text-small text-foreground"
          >
            <option value="recent">Most recent</option>
            <option value="helpful">Most helpful</option>
            <option value="high">Highest rated</option>
            <option value="low">Lowest rated</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="p-5 text-body text-muted-foreground">No reviews match that filter.</p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.slice(0, shown).map((review) => (
            <li key={review.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <RatingStars value={review.rating} />
                <span className="text-small font-medium text-foreground">{review.author}</span>
                {review.verified ? (
                  <span className="inline-flex items-center gap-1 text-micro text-success">
                    <BadgeCheck size={13} /> Verified purchase
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-micro text-subtle-foreground">
                {new Date(review.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="mt-2 text-body text-muted-foreground">{review.body}</p>
              {review.photos.length ? (
                <div className="mt-2 flex gap-2">
                  {review.photos.map((photo) => (
                    <span key={photo} className="h-16 w-16 overflow-hidden rounded-md border border-border">
                      <ProductImage seed={photo} alt="Customer photo" label="Photo" className="h-full w-full" />
                    </span>
                  ))}
                </div>
              ) : null}
              <button className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-small text-muted-foreground hover:text-primary-strong">
                <ThumbsUp size={13} /> Helpful ({review.helpful})
              </button>
            </li>
          ))}
        </ul>
      )}

      {shown < filtered.length ? (
        <div className="border-t border-border p-4">
          <button
            onClick={() => setShown((s) => s + 10)}
            className="tap-target w-full rounded-md border border-border font-medium text-foreground"
          >
            Show more reviews
          </button>
        </div>
      ) : null}
    </div>
  );
}
