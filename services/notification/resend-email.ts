import "server-only";

import { buildReminderEmailTemplate } from "@/lib/reminder-message";

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL || "Hisab Kitab <pradipmdr0012@gmail.com>";
}

export async function sendResendEmail({
  participantEmail,
  participantName,
  sessionTitle,
  shareAmount,
  billSummary,
}: {
  participantEmail: string;
  participantName: string;
  sessionTitle: string;
  shareAmount: string;
  billSummary: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const template = buildReminderEmailTemplate({
    participantName,
    participantEmail,
    sessionTitle,
    shareAmount,
    billSummary,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: participantEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.message ||
      responseBody?.error ||
      "Unable to send email through Resend.";

    throw new Error(`Resend error: ${errorMessage}`);
  }

  return {
    message: `Email sent to ${participantName} <${participantEmail}>`,
  };
}
