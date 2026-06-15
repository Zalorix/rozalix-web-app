"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DEMO_LOGIN } from "@/lib/seed";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/EmptyState";

export default function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState(DEMO_LOGIN.email);
  const [password, setPassword] = useState(DEMO_LOGIN.password);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → skip the form.
  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);
    if (res.error) setError(res.error);
    else router.replace("/dashboard");
  }

  if (!ready || user) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid h-dvh overflow-y-auto lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <Logo />
            <span className="font-[var(--font-display)] text-lg font-semibold">
              Rozalix Console
            </span>
          </div>

          <h1 className="text-2xl font-semibold">Sign in to your dashboard</h1>
          <p className="mt-1.5 text-sm text-[var(--color-slate-500)]">
            Manage your enquiries and website content in one place.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-error-soft)] px-3 py-2 text-[13px] font-medium text-[var(--color-error)]">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <Spinner />
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--color-slate-200)] bg-[var(--color-slate-50)] px-4 py-3 text-[13px] text-[var(--color-slate-500)]">
            <span className="font-semibold text-[var(--color-slate-600)]">
              Demo login
            </span>{" "}
            — prefilled. Email{" "}
            <code className="font-[var(--font-mono)]">{DEMO_LOGIN.email}</code>,
            password{" "}
            <code className="font-[var(--font-mono)]">{DEMO_LOGIN.password}</code>
            .
          </div>
        </div>
      </div>

      {/* Brand side */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{
          background:
            "linear-gradient(150deg, var(--color-indigo-deeper), var(--color-indigo) 55%, var(--color-violet))",
        }}
      >
        <div className="absolute inset-0 opacity-[0.15] [background:radial-gradient(600px_400px_at_80%_10%,#fff,transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <blockquote className="max-w-md text-2xl leading-snug font-[var(--font-display)] font-medium">
            “Every site we ship comes with a dashboard — so clients own their
            leads and content from day one.”
          </blockquote>
          <p className="mt-4 text-sm text-white/70">
            CRM + CMS, built into your Rozalix website.
          </p>
        </div>
      </div>
    </div>
  );
}
