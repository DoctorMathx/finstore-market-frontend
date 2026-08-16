"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { localePath } from "@/lib/locale";

export type HeroSlide = {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  hue: number;
};

/**
 * Each slide is a real merchandising moment, never a stock illustration.
 * Autoplay 6s, pause on hover, swipe on mobile, dots rather than arrows.
 */
export function HeroBand({ slides, locale }: { slides: HeroSlide[]; locale: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 50) {
          setIndex((i) => (i + (delta < 0 ? 1 : slides.length - 1)) % slides.length);
        }
        touchStart.current = null;
      }}
      className="relative overflow-hidden rounded-xl border border-border"
      style={{
        // Low-lightness on the dark default; the light theme lifts it via the
        // overlay below rather than needing a second gradient.
        background: `linear-gradient(115deg, hsl(${slide.hue} 55% 12%), hsl(${(slide.hue + 45) % 360} 60% 22%))`,
      }}
    >
      <div className="flex aspect-[3/2] items-center px-5 py-6 sm:aspect-[16/5] sm:px-10">
        <div className="relative z-10 max-w-lg">
          <p className="mb-1 text-micro uppercase tracking-wide text-primary">{slide.eyebrow}</p>
          <h2 className="text-display text-white">{slide.title}</h2>
          <p className="mt-2 text-body text-white/70">{slide.body}</p>
          <Link
            href={localePath(locale, slide.href)}
            className="tap-target mt-4 inline-flex items-center justify-center rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {slide.ctaLabel}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${s.title}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-primary" : "w-2 bg-foreground/25"}`}
          />
        ))}
      </div>
    </section>
  );
}
