"use client";

import { useEffect, useRef, useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { ProductImage } from "@/components/ui";

/**
 * Aspect ratio locked 1:1 on every surface. Merchant uploads are inconsistent,
 * so each frame is a fixed square and the photo letterboxes inside it — an
 * unconstrained <img> takes its natural height, which on a 390px phone turns a
 * portrait shot into a 900px wall the buyer has to scroll past to reach the
 * price. Desktop gets a hover-zoom lens; mobile gets a pinch-zoom lightbox.
 *
 * Mobile also advances on its own every few seconds, because the second and
 * third photo are where the detail lives and most buyers never swipe. The
 * first deliberate touch hands control back for the rest of the visit.
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
  const [autoPlay, setAutoPlay] = useState(true);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

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

  useEffect(() => {
    if (!autoPlay || lightbox || images.length < 2) return;
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Only advance while the gallery is actually on screen and the tab is
    // focused — otherwise the buyer returns to a carousel mid-flight.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.4 },
    );
    observer.observe(track);

    const yieldControl = () => setAutoPlay(false);
    track.addEventListener("pointerdown", yieldControl, { passive: true });
    track.addEventListener("touchstart", yieldControl, { passive: true });
    track.addEventListener("wheel", yieldControl, { passive: true });

    const timer = window.setInterval(() => {
      if (document.hidden || !visibleRef.current) return;
      const width = track.clientWidth;
      if (!width) return; // Desktop: the track is display:none, so nothing to page.
      const next = (Math.round(track.scrollLeft / width) + 1) % images.length;
      track.scrollTo({ left: next * width, behavior: "smooth" });
    }, 4200);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      track.removeEventListener("pointerdown", yieldControl);
      track.removeEventListener("touchstart", yieldControl);
      track.removeEventListener("wheel", yieldControl);
    };
  }, [autoPlay, lightbox, images.length]);

  function goTo(i: number) {
    setAutoPlay(false);
    setIndex(i);
    const track = trackRef.current;
    if (track?.clientWidth) track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="lg:flex lg:gap-3">
      {/* Thumbnail rail — vertical on desktop */}
      <div className="hidden w-14 shrink-0 flex-col gap-2 lg:flex">
        {images.map((image, i) => (
          <button
            key={image.seed}
            type="button"
            onMouseEnter={() => setIndex(i)}
            onFocus={() => setIndex(i)}
            onClick={() => setIndex(i)}
            aria-label={`View image ${i + 1} of ${images.length}`}
            aria-current={i === index}
            className={`aspect-square overflow-hidden rounded-md border-2 ${i === index ? "border-primary" : "border-border"}`}
          >
            <ProductImage seed={image.seed} alt="" label={title} className="h-full w-full" />
          </button>
        ))}
      </div>

      {/* Desktop stage with hover-zoom lens */}
      <div className="relative min-w-0 flex-1">
        <div
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

        {/* Mobile: full-bleed swipeable track. Each slide is one square frame
            the width of the track, so the page height never depends on what a
            merchant happened to upload. */}
        <div
          ref={trackRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className="-mx-4 flex snap-x snap-mandatory overflow-x-auto sm:-mx-6 lg:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((image, i) => (
            <button
              key={image.seed}
              type="button"
              onClick={() => setLightbox(true)}
              aria-label={`Zoom image ${i + 1} of ${images.length}`}
              className="aspect-square w-full shrink-0 grow-0 basis-full snap-center bg-product-canvas"
            >
              <ProductImage
                seed={image.seed}
                alt={image.alt}
                label={title}
                priority={i === 0}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>

        {/* Dots double as jump targets; tapping one also stops the auto-advance. */}
        <div className="mt-2 flex justify-center lg:hidden">
          {images.map((image, i) => (
            <button
              key={image.seed}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border-strong"}`}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="absolute right-2 top-2 hidden items-center gap-1 rounded-md bg-card/90 px-2 py-1 text-small text-muted-foreground lg:flex"
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
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close"
              className="tap-target text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="aspect-square w-full max-w-2xl overflow-hidden rounded-lg bg-product-canvas">
              <ProductImage seed={active.seed} alt={active.alt} label={title} className="h-full w-full" />
            </div>
          </div>
          <div className="flex justify-center gap-2 p-4">
            {images.map((image, i) => (
              <button
                key={image.seed}
                type="button"
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
