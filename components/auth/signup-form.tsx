"use client";

import { useActionState, useEffect } from "react";

import { signupAction, type AuthActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, action, isPending] = useActionState(signupAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Signup failed",
        description: state.error,
        variant: "error",
      });
    }
  }, [state?.error, toast]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="name">
          Full name
        </label>
        <Input id="name" name="name" placeholder="Aarav Shrestha" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="password">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          required
        />
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" isLoading={isPending}>
        Create account
      </Button>
    </form>
  );
}
