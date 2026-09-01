import "server-only";

import {
  Resend,
  type CreateEmailOptions,
  type CreateEmailRequestOptions,
} from "resend";

const prizeAdminBccEnvVar = "PRIZE_ADMIN_BCC";
const requiredSender = "SOFI'S 3D ART <prize@mail.sofis3d.art>";
const requiredDomain = "mail.sofis3d.art";

export function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return new Resend(apiKey);
}

export function getResendFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (fromEmail !== requiredSender) {
    throw new Error(
      `EMAIL BLOCKED: RESEND_FROM_EMAIL must be exactly ${requiredSender}.`,
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

  await assertResendPrizeDomainVerified(resend);

  const email = {
    ...payload,
    bcc: mergeBcc(payload.bcc, getPrizeAdminBcc()),
    from,
  } as CreateEmailOptions;

  return resend.emails.send(email, options);
}

async function assertResendPrizeDomainVerified(resend: Resend) {
  const { data, error } = await resend.domains.list();

  if (error) {
    throw new Error(`EMAIL BLOCKED: ${error.message}`);
  }

  const domain = data?.data.find((item) => item.name === requiredDomain);

  if (
    !domain ||
    domain.status !== "verified" ||
    domain.capabilities?.sending !== "enabled"
  ) {
    throw new Error(
      `EMAIL BLOCKED: ${requiredDomain} is not verified for sending in Resend.`,
    );
  }
}

function mergeBcc(existingBcc: CreateEmailOptions["bcc"], adminBcc: string) {
  const bcc = Array.isArray(existingBcc)
    ? existingBcc
    : existingBcc
      ? [existingBcc]
      : [];

  return Array.from(new Set([...bcc, adminBcc]));
}
