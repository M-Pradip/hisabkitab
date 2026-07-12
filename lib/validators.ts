import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters long."),
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[A-Z]/, "Password must include one uppercase letter.")
    .regex(/[a-z]/, "Password must include one lowercase letter.")
    .regex(/[0-9]/, "Password must include one number.")
    .regex(/[^A-Za-z0-9]/, "Password must include one special character."),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

export const paymentProviderSchema = z.enum(["ESEWA", "KHALTI", "BANK_QR", "OTHER"]);

export const updateHostProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  paymentProvider: paymentProviderSchema,
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value.trim() : null)),
  premiumStatus: z.coerce.boolean().default(false),
});

export const createExpenseSessionSchema = z.object({
  title: z.string().trim().min(3, "Title is required."),
  description: z.string().trim().max(500, "Description is too long.").optional().or(z.literal("")),
  totalAmount: z.coerce.number().positive("Total amount must be greater than zero."),
  currency: z
    .string()
    .trim()
    .min(3, "Currency code is required.")
    .max(8, "Currency code is too long.")
    .transform((value) => value.toUpperCase()),
});

export const participantStatusSchema = z.object({
  sessionId: z.string().trim().min(1),
  participantId: z.string().trim().min(1),
  paymentStatus: z.enum(["PAID", "UNPAID"]),
});

export const reminderRequestSchema = z.object({
  sessionId: z.string().trim().min(1, "Session is required."),
  participantId: z.string().trim().min(1, "Participant is required."),
});

export const sessionParamSchema = z.object({
  sessionId: z.string().trim().min(1),
});

export const qrUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z
    .string()
    .trim()
    .refine((value) => ["image/png", "image/jpeg", "image/webp"].includes(value), {
      message: "Please upload a PNG, JPG, or WebP image.",
    }),
  size: z.number().int().positive().max(5 * 1024 * 1024, "QR image must be under 5 MB."),
});
