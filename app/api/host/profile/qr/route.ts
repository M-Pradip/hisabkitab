import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const profile = await prisma.hostProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      paymentQrImageData: true,
      paymentQrImageMimeType: true,
    },
  });

  if (!profile?.paymentQrImageData) {
    return new Response("QR image not found", { status: 404 });
  }

  return new Response(Buffer.from(profile.paymentQrImageData), {
    headers: {
      "Content-Type": profile.paymentQrImageMimeType ?? "image/png",
      "Cache-Control": "no-store",
    },
  });
}
