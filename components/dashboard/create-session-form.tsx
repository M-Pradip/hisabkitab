"use client";

import { useActionState, useEffect } from "react";

import { createSessionAction, type SessionActionState } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const initialState: SessionActionState = {};

export function CreateSessionForm() {
  const [state, action, isPending] = useActionState(
    createSessionAction,
    initialState,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state?.error) {
      toast({
        title: "Could not create session",
        description: state.error,
        variant: "error",
      });
    }
  }, [state?.error, toast]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="title">
            Session title
          </label>
          <Input id="title" name="title" placeholder="Friday dinner split" required />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="totalAmount"
          >
            Total amount
          </label>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="currency">
            Currency
          </label>
          <Input id="currency" name="currency" defaultValue="NPR" required />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="description"
          >
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            placeholder="Optional note for the session"
          />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.error}
        </div>
      ) : null}

      <Button type="submit" isLoading={isPending}>
        Create settlement session
      </Button>
    </form>
  );
}
