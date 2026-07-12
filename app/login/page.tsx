import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="flex flex-col justify-center rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Hisab Kitab
            </div>
            <div className="mt-8">
              <BrandMark />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Sign in to manage every split, profile, and reminder.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Use Google or email/password to access your host dashboard and
              keep every session, item, and payment status in one place.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Google sign-in plus email and password
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Private host sessions and participant amounts
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Paid and unpaid tracking from the dashboard
              </div>
            </div>
          </section>

          <Card className="self-center">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Welcome back
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Login to your host account
              </h2>
            </div>
            <LoginForm />
          </Card>
        </div>
      </div>
    </main>
  );
}
