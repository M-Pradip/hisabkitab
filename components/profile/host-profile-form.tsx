"use client";

import { useActionState, useEffect } from "react";

import { updateProfileAction, type ProfileActionState } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const initialState: ProfileActionState = {};

export function HostProfileForm({
  profile,
}: {
  profile: {
    fullName?: string | null;
    paymentProvider?: string | null;
    phoneNumber?: string | null;
    premiumStatus?: boolean | null;
    hasQrImage?: boolean;
  };
}) {
  const [state, action, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Profile saved",
        description: state.success,
        variant: "success",
      });
    }

    if (state?.error) {
      toast({
        title: "Profile update failed",
        description: state.error,
        variant: "error",
      });
    }
  }, [state?.error, state?.success, toast]);

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
            Full name
          </label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile.fullName ?? ""}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="paymentProvider"
            >
              Payment provider
            </label>
            <Select
              id="paymentProvider"
              name="paymentProvider"
              defaultValue={profile.paymentProvider ?? "ESEWA"}
            >
              <option value="ESEWA">eSewa</option>
              <option value="KHALTI">Khalti</option>
              <option value="BANK_QR">Bank QR</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="phoneNumber"
            >
              Phone number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={profile.phoneNumber ?? ""}
              placeholder="+977 98XXXXXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="premiumStatus"
          >
            Premium status
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input
              id="premiumStatus"
              name="premiumStatus"
              type="checkbox"
              defaultChecked={Boolean(profile.premiumStatus)}
              className="h-4 w-4 rounded border-slate-300 text-slate-950"
            />
            <span className="text-sm text-slate-700">Mark this host as premium</span>
          </label>
        </div>

        {state?.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {state.error}
          </div>
        ) : null}

        <Button type="submit" isLoading={isPending}>
          Save profile
        </Button>
      </div>

      <div className="space-y-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Payment QR</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Upload a private QR image. It will only be shown to you through an
            authenticated route.
          </p>
        </div>

        {profile.hasQrImage ? (
          <img
            src="/api/host/profile/qr"
            alt="Current payment QR"
            className="aspect-square w-full max-w-sm rounded-3xl border border-slate-200 bg-white object-contain p-3"
          />
        ) : (
          <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm text-slate-500">
            No QR uploaded yet
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="paymentQrImage">
            Replace QR image
          </label>
          <Input
            id="paymentQrImage"
            name="paymentQrImage"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          />
          <p className="text-xs leading-5 text-slate-500">
            PNG, JPG, or WebP. Maximum size 5 MB.
          </p>
        </div>
      </div>
    </form>
  );
}
