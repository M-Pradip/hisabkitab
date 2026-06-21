import { NextResponse } from "next/server";
import { broadcastSession } from "@/lib/sse";
import { destroyCloudinaryImage, uploadCloudinaryImage } from "@/lib/cloudinary";
import { applySessionAction, getSession } from "@/lib/store";

export const runtime = "nodejs";

function isImageFile(file) {
  return (
    file &&
    typeof file === "object" &&
    typeof file.type === "string" &&
    file.type.startsWith("image/")
  );
}

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const provider = String(formData.get("provider") || session.paymentProvider || session.paymentMethod || "").trim();

  if (!isImageFile(file)) {
    return NextResponse.json(
      { error: "Please upload a valid image file." },
      { status: 400 },
    );
  }

  const uploaded = await uploadCloudinaryImage({
    file,
    folder: `hisabkita/sessions/${id}/qr`,
  });

  try {
    const nextSession = await applySessionAction(id, {
      type: "set_payment_qr",
      paymentProvider: provider,
      paymentQrImage: uploaded.secureUrl,
      paymentQrFileName: file.name || "payment-qr",
      paymentQrPublicId: uploaded.publicId,
      paymentQrAssetId: uploaded.assetId,
    });

    if (!nextSession) {
      throw new Error("Session could not be updated.");
    }

    broadcastSession(id, nextSession);

    return NextResponse.json({ session: nextSession });
  } catch (error) {
    try {
      await destroyCloudinaryImage(uploaded.publicId);
    } catch {
      // Rollback cleanup is best-effort.
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the uploaded QR image.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const session = await getSession(id);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.paymentQrPublicId) {
    try {
      await destroyCloudinaryImage(session.paymentQrPublicId);
    } catch {
      // Best-effort cleanup.
    }
  }

  const nextSession = await applySessionAction(id, {
    type: "clear_payment_qr",
  });

  if (!nextSession) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  broadcastSession(id, nextSession);

  return NextResponse.json({ session: nextSession });
}
