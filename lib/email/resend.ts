import "server-only";

import {
  Resend,
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
} from "resend";

const prizeAdminBccEnvVar = "PRIZE_ADMIN_BCC";

export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return new Resend(apiKey);
}

export function getResendFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error(
      "Missing RESEND_FROM_EMAIL. Verify the sending domain in Resend before setting the production sender.",
    );
  }

  return fromEmail;
}

export function getPrizeAdminBcc() {
  const adminBcc = process.env[prizeAdminBccEnvVar];

  if (!adminBcc) {
    throw new Error(`Missing ${prizeAdminBccEnvVar}.`);
  }

  return adminBcc;
}

export async function sendPrizeParticipantTransactionalEmail(
  payload: Omit<CreateEmailOptions, "from">,
  options?: CreateEmailRequestOptions,
) {
  if ("cc" in payload && payload.cc) {
    throw new Error("Prize participant transactional emails must not use CC.");
  }

  const resend = createResendClient();
  const from = getResendFromEmail();

  const email = {
    ...payload,
    bcc: mergeBcc(payload.bcc, getPrizeAdminBcc()),
    from,
  } as CreateEmailOptions;

  return resend.emails.send(email, options);
}

function mergeBcc(existingBcc: CreateEmailOptions["bcc"], adminBcc: string) {
  const bcc = Array.isArray(existingBcc)
    ? existingBcc
    : existingBcc
      ? [existingBcc]
      : [];

  return Array.from(new Set([...bcc, adminBcc]));
}
