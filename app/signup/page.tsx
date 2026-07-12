import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function SignupPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1fr]">
          <Card className="self-center">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Create account
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Start hosting settlement sessions
              </h2>
            </div>
            <SignupForm />
            <p className="mt-6 text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-950 underline">
                Sign in
              </Link>
            </p>
          </Card>

          <section className="flex flex-col justify-center rounded-[32px] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Host profile
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-6xl">
              Every host gets a secure profile automatically.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Your payment provider, QR image, and phone number stay private and
              only surface inside authenticated views and reminder previews.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
