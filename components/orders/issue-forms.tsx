"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { localePath } from "@/lib/locale";
import { updateOrder, useOrder } from "@/lib/orders-store";
import { useToast } from "@/components/providers";
import { InlineAlert, PageContainer, Skeleton } from "@/components/ui";

type Reason = { id: string; label: string; refund?: string };

const DISPUTE_REASONS: Reason[] = [
  { id: "not_delivered", label: "It never arrived" },
  { id: "not_as_described", label: "Not what was described" },
  { id: "damaged", label: "Arrived damaged" },
  { id: "wrong_item", label: "Wrong item sent" },
  { id: "missing_parts", label: "Parts or accessories missing" },
  { id: "counterfeit", label: "I think it's counterfeit" },
];

const RETURN_REASONS: Reason[] = [
  { id: "changed_mind", label: "Changed my mind", refund: "Return delivery is paid by you" },
  { id: "wrong_size", label: "Wrong size or fit", refund: "Return delivery is paid by you" },
  { id: "not_as_described", label: "Not as described", refund: "Return delivery is paid by the store" },
  { id: "damaged", label: "Damaged or faulty", refund: "Return delivery is paid by the store" },
];

export function IssueForm({
  locale,
  orderId,
  mode,
}: {
  locale: string;
  orderId: string;
  mode: "dispute" | "return";
}) {
  const search = useSearchParams();
  const { push } = useToast();
  const { order, hydrated } = useOrder(orderId);
  const [chosenSubId, setChosenSubId] = useState(search.get("sub") ?? "");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Defaults to the first sub-order until the buyer picks one explicitly.
  const subId = chosenSubId || order?.subOrders[0]?.id || "";

  const reasons = mode === "dispute" ? DISPUTE_REASONS : RETURN_REASONS;
  const chosen = reasons.find((r) => r.id === reason);

  if (!hydrated) {
    return (
      <PageContainer className="py-6">
        <Skeleton className="h-80 w-full" />
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer className="py-10">
        <InlineAlert tone="danger">
          We can&apos;t find order {orderId} on this device.{" "}
          <Link href={localePath(locale, "/market/orders")} className="font-semibold underline">
            Back to your orders
          </Link>
        </InlineAlert>
      </PageContainer>
    );
  }

  if (done) {
    return (
      <PageContainer className="py-10">
        <div className="mx-auto flex max-w-lg flex-col items-start gap-2 rounded-lg border border-success/30 bg-success-soft p-5">
          <CheckCircle2 size={28} className="text-success" />
          <h1 className="text-h1">{mode === "dispute" ? "Issue raised" : "Return requested"}</h1>
          <p className="text-body text-muted-foreground">
            {mode === "dispute"
              ? "Your money stays held while we look into this. The store has 48 hours to respond, then our team steps in."
              : "The store has 48 hours to approve. If they don't respond, we approve it for you and arrange pickup."}
          </p>
          <Link
            href={localePath(locale, `/market/orders/${orderId}`)}
            className="tap-target mt-2 inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
          >
            Back to the order
          </Link>
        </div>
      </PageContainer>
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason) {
      setError("Choose what went wrong so we can route this to the right team.");
      return;
    }
    if (details.trim().length < 15) {
      setError("Add a bit more detail — at least a sentence. It speeds up the resolution a lot.");
      return;
    }
    setError(null);
    if (mode === "dispute") {
      updateOrder(orderId, (o) => ({
        ...o,
        subOrders: o.subOrders.map((s) => (s.id === subId ? { ...s, status: "issue_raised" as const } : s)),
      }));
    }
    push({ message: mode === "dispute" ? "Issue raised" : "Return requested" });
    setDone(true);
  }

  return (
    <PageContainer className="py-6">
      <div className="mx-auto max-w-2xl">
        <Link href={localePath(locale, `/market/orders/${orderId}`)} className="text-small font-medium text-primary">
          ← Back to order {orderId}
        </Link>
        <h1 className="mt-1 text-display">{mode === "dispute" ? "Report an issue" : "Request a return"}</h1>
        <p className="mt-1 text-body text-muted-foreground">
          {mode === "dispute"
            ? "Tell us what happened. Your money is not released to the store while an issue is open."
            : "Returns are open for 7 days after delivery. Tell us which delivery and why."}
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
          <div>
            <label htmlFor="sub-order" className="mb-1 block text-small text-muted-foreground">
              Which delivery?
            </label>
            <select
              id="sub-order"
              value={subId}
              onChange={(e) => setChosenSubId(e.target.value)}
              className="h-11 w-full rounded-md border border-border px-2 text-body text-foreground"
            >
              {order.subOrders.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.merchant.name} — {sub.items.map((i) => i.title).join(", ").slice(0, 60)}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-2 text-small text-muted-foreground">
              {mode === "dispute" ? "What went wrong?" : "Why are you returning it?"}
            </legend>
            <div className="flex flex-col gap-2">
              {reasons.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-body ${
                    reason === option.id ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={reason === option.id}
                    onChange={() => setReason(option.id)}
                    className="mt-1 accent-primary"
                  />
                  <span>
                    <span className="block text-foreground">{option.label}</span>
                    {option.refund ? (
                      <span className="block text-small text-muted-foreground">{option.refund}</span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="details" className="mb-1 block text-small text-muted-foreground">
              What happened?
            </label>
            <textarea
              id="details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the problem in your own words. Include dates if it helps."
              className="w-full rounded-md border border-border px-3 py-2 text-body text-foreground"
            />
            <p className="mt-1 text-small text-subtle-foreground">
              Photos help a lot. You&apos;ll be able to add them once our support team replies.
            </p>
          </div>

          {error ? <InlineAlert tone="danger">{error}</InlineAlert> : null}

          <button
            type="submit"
            className="tap-target w-full rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            {mode === "dispute" ? "Raise this issue" : "Request return"}
          </button>
          {chosen?.refund ? (
            <p className="text-center text-small text-muted-foreground">{chosen.refund}.</p>
          ) : null}
        </form>
      </div>
    </PageContainer>
  );
}
