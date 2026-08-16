"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Loader2, Lock } from "lucide-react";
import { formatMoneyWith, money } from "@/lib/money";
import { formatDeliveryDate } from "@/lib/delivery";
import { localePath } from "@/lib/locale";
import { newOrderId, saveOrder, type StoredOrder, type StoredSubOrder } from "@/lib/orders-store";
import { rememberAddress, useAddresses } from "@/lib/addresses";
import { useCart, useMarket, useToast } from "@/components/providers";
import { EmptyState, InlineAlert, MerchantLogo, PageContainer, ProductImage, Skeleton } from "@/components/ui";
import { useCartValidation, type CartGroup } from "@/components/cart/use-cart-validation";
import { AddressForm, validateAddress, type AddressValues } from "./address-form";

type Step = "delivery" | "payment";
/** Grant credits are money the buyer already has — never behind a typed code. */
const GRANT_CREDIT_MINOR = 750_000;

export function CheckoutView({ locale }: { locale: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { config, deliverTo, user } = useMarket();
  const { lines, clear } = useCart();
  const { push } = useToast();
  const state = useCartValidation();

  const step: Step = search.get("step") === "payment" ? "payment" : "delivery";

  const [values, setValues] = useState<AddressValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addresses: saved } = useAddresses();
  const [methods, setMethods] = useState<Record<string, "standard" | "express">>({});
  const [payment, setPayment] = useState(config.paymentMethods[0]?.id ?? "card");
  const [useGrantCredit, setUseGrantCredit] = useState(true);
  const [promo, setPromo] = useState<{ code: string; label: string; discountMinor: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Generated once per checkout attempt and sent with order creation.
  const [idempotencyKey] = useState(() => `ck_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);

  const fmt = (minor: number) => formatMoneyWith(money(minor, config.currency.code), config.currency);

  // Prefill from the delivery area and the signed-in name, without ever
  // overwriting what the buyer has already typed. Derived during render — the
  // React-endorsed replacement for a sync-props-to-state effect.
  const prefillKey = `${deliverTo.region}|${deliverTo.subRegion}|${user?.name ?? ""}`;
  const [prevPrefillKey, setPrevPrefillKey] = useState<string | null>(null);
  if (prefillKey !== prevPrefillKey) {
    setPrevPrefillKey(prefillKey);
    setValues((current) => ({
      region: deliverTo.region,
      subRegion: deliverTo.subRegion,
      fullName: user?.name ?? "",
      ...current,
    }));
  }

  const expressSurcharge = useMemo(
    () =>
      state.groups.reduce(
        (sum, g) => sum + (methods[g.merchant.id] === "express" ? Math.round(g.deliveryCost * 0.6) : 0),
        0,
      ),
    [state.groups, methods],
  );

  const deliveryTotal = state.deliveryTotal + expressSurcharge;
  const grantCredit = useGrantCredit ? Math.min(GRANT_CREDIT_MINOR, state.itemsTotal) : 0;
  const discountTotal = (promo?.discountMinor ?? 0) + grantCredit;
  const total = Math.max(0, state.itemsTotal + deliveryTotal - discountTotal);

  function goToStep(next: Step) {
    const params = new URLSearchParams(search.toString());
    params.set("step", next);
    router.push(`?${params}`, { scroll: true });
  }

  function submitDelivery(event: React.FormEvent) {
    event.preventDefault();
    const found = validateAddress(config, values);
    setErrors(found);
    if (Object.keys(found).length) {
      // Never lose form state on error — every field is preserved.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    rememberAddress(values);
    goToStep("payment");
  }

  async function placeOrder() {
    if (submitting) return;
    setSubmitting(true);
    try {
      // A real build POSTs the idempotency key with order creation; the local
      // store applies the same rule so a double-submit cannot double-charge.
      await new Promise((resolve) => setTimeout(resolve, 900));
      const id = newOrderId();
      const order: StoredOrder = {
        id,
        placedAt: new Date().toISOString(),
        idempotencyKey,
        currency: config.currency.code,
        subOrders: state.groups.map((group, index) => toSubOrder(group, id, index, methods[group.merchant.id])),
        itemsTotal: state.itemsTotal,
        deliveryTotal,
        discount: discountTotal ? { label: promo?.label ?? "Grant credit", amount: discountTotal } : undefined,
        total,
        address: values,
        paymentMethod: config.paymentMethods.find((m) => m.id === payment)?.label ?? "Card",
      };
      saveOrder(order);
      clear();
      router.push(localePath(locale, `/market/checkout/confirmation/${id}`));
    } catch {
      setSubmitting(false);
      push({ message: "Payment could not start. Nothing was charged.", tone: "danger" });
    }
  }

  if (!lines.length && !submitting) {
    return (
      <PageContainer className="py-10">
        <EmptyState
          title="There is nothing to check out"
          body="Your cart is empty. Add something first and your delivery details will be waiting here."
          action={
            <Link
              href={localePath(locale, "/market")}
              className="tap-target inline-flex items-center rounded-md bg-primary px-4 font-medium text-primary-foreground"
            >
              Browse categories
            </Link>
          }
        />
      </PageContainer>
    );
  }

  // Full-page state during the payment handoff — no partial UI inviting a back-button.
  if (submitting) {
    return (
      <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center gap-3 py-10 text-center">
        <Loader2 size={32} className="animate-spin text-primary" />
        <h1 className="text-h1">Taking you to pay {fmt(total)}</h1>
        <p className="text-body text-muted-foreground">Do not close this page or press back.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 lg:py-8">
      <ol className="mb-5 flex items-center gap-3 text-small">
        <StepChip index={1} label="Delivery" active={step === "delivery"} done={step === "payment"} />
        <span className="h-px flex-1 bg-border" />
        <StepChip index={2} label="Payment" active={step === "payment"} done={false} />
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {step === "delivery" ? (
            <>
              {saved.length ? (
                <section className="rounded-lg border border-border bg-card p-4">
                  <h2 className="mb-3 text-h2">Saved addresses</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {saved.map((address, index) => (
                      <button
                        key={index}
                        onClick={() => setValues(address)}
                        className={`rounded-lg border p-3 text-left text-small ${
                          values.phone === address.phone && values.street === address.street
                            ? "border-primary bg-primary-soft"
                            : "border-border"
                        }`}
                      >
                        <span className="block font-semibold text-foreground">{address.fullName}</span>
                        <span className="block text-muted-foreground">
                          {address.street}, {address.subRegion}, {address.region}
                        </span>
                        <span className="block text-subtle-foreground">{address.phone}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <form onSubmit={submitDelivery} className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-h2">Delivery address</h2>
                <AddressForm
                  config={config}
                  values={values}
                  errors={errors}
                  onChange={(name, value) =>
                    setValues((prev) => ({
                      ...prev,
                      [name]: value,
                      // Changing region invalidates the sub-region beneath it.
                      ...(name === "region" ? { subRegion: "" } : {}),
                    }))
                  }
                />

                <h2 className="mb-3 mt-6 text-h2">Delivery method</h2>
                <div className="flex flex-col gap-3">
                  {state.groups.map((group) => (
                    <div key={group.merchant.id} className="rounded-lg border border-border p-3">
                      <p className="mb-2 text-small font-semibold text-foreground">{group.merchant.name}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(["standard", "express"] as const).map((method) => {
                          const active = (methods[group.merchant.id] ?? "standard") === method;
                          const cost =
                            method === "express" ? Math.round(group.deliveryCost * 1.6) : group.deliveryCost;
                          return (
                            <label
                              key={method}
                              className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-small ${
                                active ? "border-primary bg-primary-soft" : "border-border"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`method-${group.merchant.id}`}
                                checked={active}
                                onChange={() => setMethods((m) => ({ ...m, [group.merchant.id]: method }))}
                                className="mt-0.5 accent-primary"
                              />
                              <span>
                                <span className="block font-medium text-foreground">
                                  {method === "standard" ? "Standard" : "Express"}
                                </span>
                                <span className="block text-muted-foreground">
                                  {fmt(cost)}
                                  {group.estimatedDate
                                    ? ` · arrives ${formatDeliveryDate(group.estimatedDate)}${
                                        method === "express" ? " or sooner" : ""
                                      }`
                                    : ""}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="tap-target mt-5 w-full rounded-md bg-primary font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Continue to payment
                </button>
                <p className="mt-2 text-center text-small text-subtle-foreground">
                  No account needed. You can create one after your order is placed.
                </p>
              </form>
            </>
          ) : (
            <>
              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-h2">Delivering to</h2>
                  <button onClick={() => goToStep("delivery")} className="text-small font-medium text-primary">
                    Change
                  </button>
                </div>
                <p className="text-body text-foreground">{values.fullName}</p>
                <p className="text-body text-muted-foreground">
                  {values.street}
                  {values.landmark ? `, ${values.landmark}` : ""}, {values.subRegion}, {values.region}
                </p>
                <p className="text-body text-muted-foreground">{values.phone}</p>
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-h2">How do you want to pay?</h2>
                <div className="flex flex-col gap-2">
                  {config.paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                        payment === method.id ? "border-primary bg-primary-soft" : "border-border"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={payment === method.id}
                        onChange={() => setPayment(method.id)}
                        className="mt-1 accent-primary"
                      />
                      <span>
                        <span className="block text-body font-medium text-foreground">{method.label}</span>
                        <span className="block text-small text-muted-foreground">{method.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {/* Pay-on-delivery is not offered at launch. */}
                <p className="mt-3 text-small text-subtle-foreground">
                  Pay on delivery is not available yet. Your money is held until you confirm the item arrived.
                </p>
              </section>

              <section className="rounded-lg surface-raised">
                <h2 className="border-b border-border px-4 py-3 text-h2">Review your order</h2>
                {state.groups.map((group) => (
                  <div key={group.merchant.id} className="border-b border-border px-4 py-3 last:border-0">
                    <div className="mb-2 flex items-center gap-2">
                      <MerchantLogo seed={group.merchant.logoSeed} name={group.merchant.name} size={28} />
                      <p className="flex-1 text-small font-semibold text-foreground">{group.merchant.name}</p>
                      {group.estimatedDate ? (
                        <p className="text-small text-success">Arrives {formatDeliveryDate(group.estimatedDate)}</p>
                      ) : null}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {group.lines.map((line) => (
                        <li key={`${line.productId}-${line.variantId}`} className="flex items-center gap-3">
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                            <ProductImage seed={line.imageSeed} alt="" label={line.title} className="h-full w-full" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 text-small text-foreground">{line.title}</span>
                            <span className="block text-micro text-subtle-foreground">
                              {line.variantLabel ? `${line.variantLabel} · ` : ""}Qty {line.quantity}
                            </span>
                          </span>
                          <span className="shrink-0 text-small font-medium text-foreground">
                            {fmt(line.currentPrice * line.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 flex justify-between text-small text-muted-foreground">
                      <span>Delivery from this store</span>
                      <span className="font-medium text-foreground">
                        {fmt(
                          methods[group.merchant.id] === "express"
                            ? Math.round(group.deliveryCost * 1.6)
                            : group.deliveryCost,
                        )}
                      </span>
                    </p>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h,0px)+1.5rem)] lg:h-fit">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-h2">Order summary</h2>

            <dl className="flex flex-col gap-2 text-body">
              <Row label="Items" value={state.loading ? "—" : fmt(state.itemsTotal)} />
              <Row label="Delivery" value={state.loading ? "—" : fmt(deliveryTotal)} />
              {promo ? (
                <Row
                  label={promo.label}
                  value={`− ${fmt(promo.discountMinor)}`}
                  tone="success"
                  onRemove={() => setPromo(null)}
                />
              ) : null}
              {grantCredit ? <Row label="Grant credit applied" value={`− ${fmt(grantCredit)}`} tone="success" /> : null}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <dt className="text-h2">Total</dt>
                <dd className="text-price-lg text-foreground">{state.loading ? <Skeleton className="h-7 w-24" /> : fmt(total)}</dd>
              </div>
            </dl>

            <GrantCreditRow
              amountLabel={fmt(GRANT_CREDIT_MINOR)}
              applied={useGrantCredit}
              onToggle={() => setUseGrantCredit((v) => !v)}
            />

            <PromoCodeField
              itemsTotal={state.itemsTotal}
              applied={promo}
              onApplied={setPromo}
              onRemoved={() => setPromo(null)}
            />

            {step === "payment" ? (
              <>
                <p className="mt-4 rounded-md border border-primary/30 bg-primary-soft px-3 py-2 text-small text-muted-foreground">
                  <span className="font-semibold text-primary">Your money is protected.</span> Each store is paid only
                  after you confirm their part of the order arrived.
                </p>
                <button
                  onClick={placeOrder}
                  disabled={state.loading}
                  className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-success font-semibold text-success-foreground hover:bg-success/90 disabled:bg-border disabled:text-subtle-foreground"
                >
                  <Lock size={16} />
                  Pay {fmt(total)}
                </button>
              </>
            ) : (
              <p className="mt-4 text-small text-subtle-foreground">
                Delivery is quoted per store. Adding more from the same store rarely costs more to ship.
              </p>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function toSubOrder(
  group: CartGroup,
  orderId: string,
  index: number,
  method?: "standard" | "express",
): StoredSubOrder {
  return {
    id: `${orderId}-${index + 1}`,
    merchant: group.merchant,
    items: group.lines.map((line) => ({
      title: line.title,
      imageSeed: line.imageSeed,
      quantity: line.quantity,
      unitPrice: line.currentPrice,
      variantLabel: line.variantLabel,
      href: line.href,
    })),
    subtotal: group.subtotal,
    deliveryCost: method === "express" ? Math.round(group.deliveryCost * 1.6) : group.deliveryCost,
    estimatedDate: group.estimatedDate,
    status: "awaiting_confirmation",
  };
}

function StepChip({ index, label, active, done }: { index: number; label: string; active: boolean; done: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-small font-semibold ${
          done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-background-alt text-subtle-foreground"
        }`}
      >
        {done ? <Check size={14} /> : index}
      </span>
      <span className={active || done ? "font-semibold text-foreground" : "text-subtle-foreground"}>{label}</span>
    </li>
  );
}

function Row({
  label,
  value,
  tone,
  onRemove,
}: {
  label: string;
  value: string;
  tone?: "success";
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className={tone === "success" ? "text-success" : "text-muted-foreground"}>
        {label}
        {onRemove ? (
          <button onClick={onRemove} className="ml-2 text-small text-subtle-foreground underline hover:text-destructive">
            Remove
          </button>
        ) : null}
      </dt>
      <dd className={`font-medium ${tone === "success" ? "text-success" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}

/** Money the buyer already has is auto-applied, with a toggle to hold it back. */
function GrantCreditRow({
  amountLabel,
  applied,
  onToggle,
}: {
  amountLabel: string;
  applied: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-md border border-success/30 bg-success-soft p-3">
      <input
        id="grant-credit"
        type="checkbox"
        checked={applied}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 accent-success"
      />
      <label htmlFor="grant-credit" className="text-small">
        <span className="block font-semibold text-success">Grant credit: {amountLabel}</span>
        <span className="block text-muted-foreground">
          From your SMEDAN programme balance. Untick to save it for a later order.
        </span>
      </label>
    </div>
  );
}

function PromoCodeField({
  itemsTotal,
  applied,
  onApplied,
  onRemoved,
}: {
  itemsTotal: number;
  applied: { code: string; label: string; discountMinor: number } | null;
  onApplied: (value: { code: string; label: string; discountMinor: number }) => void;
  onRemoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, itemsTotal }),
      });
      const data = await res.json();
      if (data.ok) {
        onApplied({ code: data.code, label: data.label, discountMinor: data.discountMinor });
        setOpen(false);
        setCode("");
      } else {
        setError(data.reason);
      }
    } catch {
      setError("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <p className="mt-3 flex items-center justify-between rounded-md border border-success/30 bg-success-soft px-3 py-2 text-small">
        <span className="font-medium text-success">Code {applied.code} applied</span>
        <button onClick={onRemoved} className="text-muted-foreground underline hover:text-destructive">
          Remove
        </button>
      </p>
    );
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-small font-medium text-primary"
      >
        Have a promo code?
        <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <div className="mt-2">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="promo-code">
              Promo code
            </label>
            <input
              id="promo-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FIRST10"
              className="h-11 min-w-0 flex-1 rounded-md border border-border px-3 text-body text-foreground"
            />
            <button
              onClick={apply}
              disabled={!code || busy}
              className="tap-target shrink-0 rounded-md border border-border px-4 text-small font-semibold text-foreground disabled:text-subtle-foreground"
            >
              {busy ? "Checking…" : "Apply"}
            </button>
          </div>
          {error ? (
            <div className="mt-2">
              <InlineAlert tone="danger">{error}</InlineAlert>
            </div>
          ) : null}
          <p className="mt-2 text-micro text-subtle-foreground">One code per order.</p>
        </div>
      ) : null}
    </div>
  );
}
