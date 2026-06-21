export const PAYMENT_PROVIDER_OPTIONS = [
  {
    value: "esewa",
    label: "eSewa",
    description: "Share an eSewa QR for quick mobile payment.",
    accent: "#5bbd3e",
  },
  {
    value: "khalti",
    label: "Khalti",
    description: "Use a Khalti QR so guests can scan and pay.",
    accent: "#7a2ea8",
  },
  {
    value: "fonepay-qr",
    label: "Fonepay QR",
    description: "Upload your Fonepay QR for direct scanning.",
    accent: "#243b84",
  },
];

export const PAYMENT_PROVIDER_VALUES = PAYMENT_PROVIDER_OPTIONS.map(
  (option) => option.value,
);

const PAYMENT_PROVIDER_LOOKUP = new Map(
  PAYMENT_PROVIDER_OPTIONS.map((option) => [option.value, option]),
);

const LEGACY_PAYMENT_PROVIDER_ALIASES = new Map([
  ["esewa", "esewa"],
  ["eSewa", "esewa"],
  ["khalti", "khalti"],
  ["Cash", "cash"],
  ["cash", "cash"],
  ["fonepay", "fonepay-qr"],
  ["fonepay qr", "fonepay-qr"],
  ["Fonepay QR", "fonepay-qr"],
  ["Fonepay", "fonepay-qr"],
]);

export function normalizePaymentProvider(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "esewa";
  }

  if (PAYMENT_PROVIDER_LOOKUP.has(raw)) {
    return raw;
  }

  const lower = raw.toLowerCase();

  if (PAYMENT_PROVIDER_LOOKUP.has(lower)) {
    return lower;
  }

  return LEGACY_PAYMENT_PROVIDER_ALIASES.get(raw) || LEGACY_PAYMENT_PROVIDER_ALIASES.get(lower) || "esewa";
}

export function getPaymentProviderMeta(value) {
  const provider = normalizePaymentProvider(value);

  if (provider === "cash") {
    return {
      value: "cash",
      label: "Cash",
      description: "Settle the bill in cash.",
      accent: "#243b84",
    };
  }

  return (
    PAYMENT_PROVIDER_LOOKUP.get(provider) || {
      value: "esewa",
      label: "eSewa",
      description: "Share an eSewa QR for quick mobile payment.",
      accent: "#5bbd3e",
    }
  );
}

export function getPaymentProviderLabel(value) {
  return getPaymentProviderMeta(value).label;
}
