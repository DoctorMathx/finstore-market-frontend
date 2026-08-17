"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { localePath } from "@/lib/locale";
import { useMarket } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "create" | "reset";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const MIN_PASSWORD = 8;

/**
 * Email and password only, for both sign-in and account creation.
 *
 * This departs from the spec, which specifies phone-first OTP on the grounds
 * that buyers here will not remember a password. Because a password flow can
 * strand someone who forgets theirs, the reset request is part of this form
 * rather than a separate feature.
 *
 * Demo build: no credential is ever persisted. A real implementation posts to an
 * auth service and stores a session token — never the password itself.
 */
export function SignInForm({ locale }: { locale: string }) {
  const { signIn } = useMarket();
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get("returnTo") ?? "/market";

  const [mode, setMode] = useState<Mode>(search.get("mode") === "create" ? "create" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};

    if (!email.trim()) found.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim())) found.email = "That doesn't look like a valid email address.";

    if (mode === "reset") return found;

    if (!password) found.password = "Enter your password.";
    else if (mode === "create" && password.length < MIN_PASSWORD) {
      found.password = `Use at least ${MIN_PASSWORD} characters.`;
    }

    if (mode === "create") {
      if (!name.trim()) found.name = "Enter your name so we know who the order is for.";
      if (confirm !== password) found.confirm = "The two passwords don't match.";
    }

    return found;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      // Never lose what was typed — only move focus to the first problem.
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    setBusy(true);
    try {
      // Stands in for the auth request.
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (mode === "reset") {
        setResetSent(true);
        return;
      }

      signIn({
        name: mode === "create" ? name.trim() : email.trim().split("@")[0],
        email: email.trim().toLowerCase(),
      });
      router.push(localePath(locale, returnTo));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErrors({});
    setResetSent(false);
  }

  if (mode === "reset" && resetSent) {
    return (
      <div className="mx-auto w-full max-w-md rounded-lg surface-raised p-6">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={20} />
        </div>
        <h1 className="text-h1">Check your email</h1>
        {/* Never confirm whether an address is registered — that leaks accounts. */}
        <p className="mt-1 text-body text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{email.trim()}</span>, we&apos;ve sent
          a link to set a new password. It expires in 30 minutes.
        </p>
        <Button variant="outline" className="tap-target mt-4 w-full" onClick={() => switchMode("signin")}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg surface-raised p-6">
      {mode === "reset" ? (
        <button
          onClick={() => switchMode("signin")}
          className="mb-3 inline-flex items-center gap-1 text-small font-medium text-primary-strong"
        >
          <ArrowLeft size={14} /> Back to sign in
        </button>
      ) : null}

      <h1 className="text-h1">
        {mode === "create" ? "Create your account" : mode === "reset" ? "Reset your password" : "Sign in"}
      </h1>
      <p className="mt-1 text-small text-muted-foreground">
        {mode === "create"
          ? "You only need an email address and a password."
          : mode === "reset"
            ? "Enter the email you signed up with and we'll send a reset link."
            : "Sign in with your email and password."}
      </p>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        {mode === "create" ? (
          <Field
            id="auth-name"
            label="Your name"
            value={name}
            onChange={setName}
            error={errors.name}
            autoComplete="name"
          />
        ) : null}

        <Field
          id="auth-email"
          label="Email address"
          type="email"
          inputMode="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
        />

        {mode !== "reset" ? (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="auth-password" className="text-small text-muted-foreground">
                Password
              </Label>
              {mode === "signin" ? (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="text-small font-medium text-primary-strong hover:underline"
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={mode === "create" && !errors.password ? "password-hint" : undefined}
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                className="h-11 pr-11 text-body"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-small text-destructive">{errors.password}</p>
            ) : mode === "create" ? (
              <p id="password-hint" className="mt-1 text-small text-subtle-foreground">
                At least {MIN_PASSWORD} characters.
              </p>
            ) : null}
          </div>
        ) : null}

        {mode === "create" ? (
          <Field
            id="auth-confirm"
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={setConfirm}
            error={errors.confirm}
            autoComplete="new-password"
          />
        ) : null}

        <Button type="submit" disabled={busy} className="tap-target w-full font-semibold">
          {busy
            ? "Please wait…"
            : mode === "create"
              ? "Create account"
              : mode === "reset"
                ? "Send reset link"
                : "Sign in"}
        </Button>
      </form>

      {mode !== "reset" ? (
        <p className="mt-4 text-center text-small text-muted-foreground">
          {mode === "create" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => switchMode("signin")} className="font-medium text-primary-strong hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button onClick={() => switchMode("create")} className="font-medium text-primary-strong hover:underline">
                Create an account
              </button>
            </>
          )}
        </p>
      ) : null}

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-small text-muted-foreground">
          You can browse and fill your cart without an account. We only ask at checkout.
        </p>
        <Link
          href={localePath(locale, "/market")}
          className="mt-1 inline-block text-small font-medium text-primary-strong hover:underline"
        >
          Keep shopping
        </Link>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  inputMode?: "email" | "text";
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1 block text-small text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="h-11 text-body"
      />
      {error ? <p className="mt-1 text-small text-destructive">{error}</p> : null}
    </div>
  );
}
