"use client";

import { useState } from "react";

/**
 * Merchants paste from WhatsApp and Word, so the input is treated as hostile
 * and sanitised to a small allow-list before it reaches here.
 *
 * Collapse is a real toggle, not a CSS clamp — the full text stays in the
 * initial HTML so it is indexable either way.
 */
export function RichTextDescription({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <div
        className={`rich-text text-body text-muted-foreground ${expanded ? "" : "line-clamp-6 lg:line-clamp-none"}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-2 text-small font-medium text-primary hover:underline lg:hidden"
      >
        {expanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
}

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-border">
      <h2>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="tap-target flex w-full items-center justify-between py-3 text-left text-h2"
        >
          {title}
          <span className="text-subtle-foreground">{open ? "−" : "+"}</span>
        </button>
      </h2>
      {open ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}
