export function buildReminderMessage({
  participantName,
  sessionTitle,
  shareAmount,
  billSummary,
}: {
  participantName: string;
  sessionTitle: string;
  shareAmount: string;
  billSummary: string;
}) {
  return [
    `Hi ${participantName} 👋`,
    "",
    "This is a payment reminder from Hisab Kitab.",
    "",
    "Session:",
    sessionTitle,
    "",
    "Amount Due:",
    `NPR ${shareAmount}`,
    "",
    "Bill Summary:",
    billSummary,
    "",
    "Please pay the host using the attached payment QR.",
    "",
    "Thank you.",
  ].join("\n");
}
