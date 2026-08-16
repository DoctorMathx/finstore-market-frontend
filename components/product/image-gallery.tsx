"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { ProductImage } from "@/components/ui";

/**
 * Aspect ratio locked 1:1. Merchant uploads are inconsistent, so we letterbox
 * on a white field rather than crop — cropping destroys photos of clothing and
 * shoes. Desktop gets a hover-zoom lens; mobile gets a pinch-zoom lightbox.
 */
export function ImageGallery({
  images,
  title,
}: {
  images: { seed: string; alt: string }[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const active = images[Math.min(index, images.length - 1)];

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, images.length]);

  return (
    <div className="lg:flex lg:gap-3">
      {/* Thumbnail rail — vertical on desktop */}
      <div className="hidden w-14 shrink-0 flex-col gap-2 lg:flex">
        {images.map((image, i) => (
          <button
            key={image.seed}
            onMouseEnter={() => setIndex(i)}
            onFocus={() => setIndex(i)}
            onClick={() => setIndex(i)}
            aria-label={`View image ${i + 1} of ${images.length}`}
            aria-current={i === index}
            className={`overflow-hidden rounded-md border-2 ${i === index ? "border-primary" : "border-border"}`}
          >
            <ProductImage seed={image.seed} alt="" label={title} className="h-full w-full" />
          </button>
        ))}
      </div>

      {/* Desktop stage with hover-zoom lens */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={stageRef}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setLens({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
          }}
          onMouseLeave={() => setLens(null)}
          onClick={() => setLightbox(true)}
          className="hidden aspect-square cursor-zoom-in overflow-hidden rounded-lg border border-border bg-card lg:block"
        >
          <ProductImage seed={active.seed} alt={active.alt} label={title} priority className="h-full w-full" />
        </div>

        {lens ? (
          <div className="pointer-events-none absolute left-full top-0 z-30 ml-3 hidden aspect-square w-[420px] overflow-hidden rounded-lg surface-raised xl:block">
            <div
              className="h-full w-full"
              style={{ transform: `scale(2) translate(${(0.5 - lens.x) * 50}%, ${(0.5 - lens.y) * 50}%)` }}
            >
              <ProductImage seed={active.seed} alt="" label={title} className="h-full w-full" />
            </div>
          </div>
        ) : null}

        {/* Mobile: full-bleed swipeable track with dots */}
        <div
          ref={trackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto lg:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((image, i) => (
            <button
              key={image.seed}
              onClick={() => setLightbox(true)}
              aria-label={`Zoom image ${i + 1}`}
              className="w-screen shrink-0 snap-center bg-card"
            >
              <ProductImage seed={image.seed} alt={image.alt} label={title} priority={i === 0} className="h-full w-full" />
            </button>
          ))}
        </div>

        <div className="mt-2 flex justify-center gap-1.5 lg:hidden">
          {images.map((image, i) => (
            <span
              key={image.seed}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>

        <button
          onClick={() => setLightbox(true)}
          className="absolute right-2 top-2 hidden items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-micro text-muted-foreground lg:flex"
        >
          <ZoomIn size={14} /> Click to zoom
        </button>
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} images`}
          className="fixed inset-0 z-[80] flex flex-col bg-black/95"
        >
          <div className="flex justify-end p-4">
            <button onClick={() => setLightbox(false)} aria-label="Close" className="tap-target text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-card">
              <ProductImage seed={active.seed} alt={active.alt} label={title} className="h-full w-full" />
            </div>
          </div>
          <div className="flex justify-center gap-2 p-4">
            {images.map((image, i) => (
              <button
                key={image.seed}
                onClick={() => setIndex(i)}
                aria-label={`Image ${i + 1}`}
                className={`h-12 w-12 overflow-hidden rounded-md border-2 ${
                  i === index ? "border-primary" : "border-transparent"
                }`}
              >
                <ProductImage seed={image.seed} alt="" label={title} className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
