import "server-only";

import { prisma } from "@/lib/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUserWithPassword({
  name,
  email,
  passwordHash,
}: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      hostProfile: {
        create: {
          fullName: name,
          paymentProvider: "ESEWA",
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function getCurrentHost(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      hostProfile: {
        select: {
          id: true,
          fullName: true,
          paymentProvider: true,
          phoneNumber: true,
          premiumStatus: true,
          paymentQrImageData: true,
          paymentQrImageMimeType: true,
          paymentQrImageName: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  if (!user.hostProfile) {
    const hostProfile = await prisma.hostProfile.create({
      data: {
        userId: user.id,
        fullName: user.name ?? user.email,
        paymentProvider: "ESEWA",
      },
      select: {
        id: true,
        fullName: true,
        paymentProvider: true,
        phoneNumber: true,
        premiumStatus: true,
        paymentQrImageData: true,
        paymentQrImageMimeType: true,
        paymentQrImageName: true,
      },
    });

    return {
      ...user,
      hostProfile,
    };
  }

  return user;
}
