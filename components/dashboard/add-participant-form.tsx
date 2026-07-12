"use client";

import { useActionState, useEffect } from "react";

import { addParticipantAction, type SessionActionState } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const initialState: SessionActionState = {};

export function AddParticipantForm({ sessionId }: { sessionId: string }) {
  const [state, action, isPending] = useActionState(
    addParticipantAction,
    initialState,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Participant added",
        description: state.success,
        variant: "success",
      });
    }

    if (state?.error) {
      toast({
        title: "Unable to add participant",
        description: state.error,
        variant: "error",
      });
    }
  }, [state?.error, state?.success, toast]);

  return (
    <form action={action} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-4 md:grid-cols-3">
        <Input name="name" placeholder="Participant name" required />
        <Input name="phoneNumber" placeholder="Phone number" />
        <Input
          name="shareAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount due"
          required
        />
      </div>

      {state?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.error}
        </div>
      ) : null}

      <Button type="submit" isLoading={isPending}>
        Add participant
      </Button>
    </form>
  );
}
