"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateHostProfileSchema } from "@/lib/validators";

export type ProfileActionState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "You must be signed in to update your profile.",
    };
  }

  const parsed = updateHostProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    paymentProvider: formData.get("paymentProvider"),
    phoneNumber: formData.get("phoneNumber"),
    premiumStatus: formData.get("premiumStatus") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the profile form.",
    };
  }

  const qrFile = formData.get("paymentQrImage");
  let paymentQrImageData: Uint8Array<ArrayBuffer> | undefined;
  let paymentQrImageMimeType: string | undefined;
  let paymentQrImageName: string | undefined;

  if (qrFile instanceof File && qrFile.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(qrFile.type)) {
      return {
        error: "Please upload a PNG, JPG, or WebP image.",
      };
    }

    if (qrFile.size > 5 * 1024 * 1024) {
      return {
        error: "The payment QR image must be smaller than 5 MB.",
      };
    }

    const qrImageBuffer = (await qrFile.arrayBuffer()) as ArrayBuffer;
    paymentQrImageData = new Uint8Array(qrImageBuffer);
    paymentQrImageMimeType = qrFile.type;
    paymentQrImageName = qrFile.name;
  }

  await prisma.hostProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      fullName: parsed.data.fullName,
      paymentProvider: parsed.data.paymentProvider,
      phoneNumber: parsed.data.phoneNumber,
      premiumStatus: parsed.data.premiumStatus,
      paymentQrImageData,
      paymentQrImageMimeType,
      paymentQrImageName,
    },
    update: {
      fullName: parsed.data.fullName,
      paymentProvider: parsed.data.paymentProvider,
      phoneNumber: parsed.data.phoneNumber,
      premiumStatus: parsed.data.premiumStatus,
      ...(paymentQrImageData
        ? {
            paymentQrImageData,
            paymentQrImageMimeType,
            paymentQrImageName,
          }
        : {}),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: "Profile updated successfully.",
  };
}
