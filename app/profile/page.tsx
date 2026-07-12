import { redirect } from "next/navigation";

import { HostProfileForm } from "@/components/profile/host-profile-form";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCurrentHost } from "@/lib/queries/users";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const currentHost = await getCurrentHost(session.user.id);

  if (!currentHost) {
    redirect("/login");
  }

  const profile = currentHost.hostProfile ?? {
    fullName: currentHost.name ?? "",
    paymentProvider: "ESEWA",
    phoneNumber: null,
    premiumStatus: false,
    hasQrImage: false,
  };

  const profileWithQrFlag = {
    ...profile,
    hasQrImage: Boolean(currentHost.hostProfile?.paymentQrImageData),
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_40%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Host profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Manage your payment QR and profile details
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            The QR image is stored privately and only retrieved through an
            authenticated route when you view the profile or open the reminder
            preview.
          </p>
        </div>

        <Card>
          <HostProfileForm profile={profileWithQrFlag} />
        </Card>
      </div>
    </main>
  );
}
