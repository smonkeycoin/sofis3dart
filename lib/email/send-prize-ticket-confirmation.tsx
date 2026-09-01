import "server-only";

import {
  buildPrizeTicketConfirmationText,
  PrizeTicketConfirmation,
  prizeTicketConfirmationSubject,
  type PrizeTicketConfirmationProps,
} from "@/emails/PrizeTicketConfirmation";
import { sendPrizeParticipantTransactionalEmail } from "@/lib/email/resend";

export type SendPrizeTicketConfirmationInput =
  PrizeTicketConfirmationProps & {
    idempotencyKey: string;
    to: string;
  };

export async function sendPrizeTicketConfirmation({
  idempotencyKey,
  to,
  ...props
}: SendPrizeTicketConfirmationInput) {
  const result = await sendPrizeParticipantTransactionalEmail(
    {
      to,
      subject: prizeTicketConfirmationSubject(props.ticketNumber),
      react: <PrizeTicketConfirmation {...props} />,
      text: buildPrizeTicketConfirmationText(props),
      tags: [
        {
          name: "email_type",
          value: "prize_ticket_confirmation",
        },
        {
          name: "ticket_number",
          value: props.ticketNumber.toString(),
        },
      ],
    },
    {
      idempotencyKey,
    },
  );

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
