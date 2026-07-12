import { Prisma } from "@prisma/client";

export function formatMoney(
  amount: Prisma.Decimal | number | string,
  currency = "NPR",
) {
  const value = typeof amount === "number" ? amount : Number(amount);

  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getInitials(name?: string | null) {
  if (!name) {
    return "HK";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function formatRelativeTime(date?: Date | string | null) {
  if (!date) {
    return "Never";
  }

  const resolvedDate = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - resolvedDate.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPhoneNumber(value?: string | null) {
  if (!value) {
    return "—";
  }

  return value;
}
