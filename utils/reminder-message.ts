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
    `Hi ${participantName},`,
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

export function buildReminderEmailTemplate({
  participantName,
  participantEmail,
  sessionTitle,
  shareAmount,
  billSummary,
}: {
  participantName: string;
  participantEmail: string;
  sessionTitle: string;
  shareAmount: string;
  billSummary: string;
}) {
  const safeParticipantName = escapeHtml(participantName);
  const safeSessionTitle = escapeHtml(sessionTitle);
  const safeShareAmount = escapeHtml(shareAmount);
  const safeBillSummary = escapeHtml(billSummary);
  const subject = `Payment reminder for ${sessionTitle}`;
  const text = [
    `Hi ${participantName},`,
    "",
    "This is a payment reminder from Hisab Kitab.",
    "",
    `Recipient: ${participantEmail}`,
    `Session: ${sessionTitle}`,
    `Amount Due: NPR ${shareAmount}`,
    `Bill Summary: ${billSummary}`,
    "",
    "Please complete the payment using the host's payment QR or payment details.",
    "",
    "Thank you,",
    "Hisab Kitab",
  ].join("\n");

  const html = `
    <div style="margin:0;padding:0;background:#f6f7fb;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:28px;border-radius:24px 24px 0 0;color:#fff;">
          <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;opacity:.75;">Hisab Kitab</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;">Payment reminder</h1>
        </div>
        <div style="background:#ffffff;padding:28px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 24px 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Hi ${safeParticipantName},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#334155;">This is a friendly reminder from Hisab Kitab that your payment is still pending.</p>
          <div style="border:1px solid #e2e8f0;border-radius:20px;padding:20px;background:#f8fafc;">
            <p style="margin:0 0 10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">Details</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Session:</strong> ${safeSessionTitle}</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>Amount Due:</strong> NPR ${safeShareAmount}</p>
            <p style="margin:0;font-size:15px;line-height:1.6;"><strong>Bill Summary:</strong> ${safeBillSummary}</p>
          </div>
          <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#334155;">
            Please complete the payment using the host's payment QR or payment details.
          </p>
          <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#0f172a;">
            Thank you,<br />Hisab Kitab
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
