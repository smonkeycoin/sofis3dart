import { sendPrizeTicketConfirmation } from "@/lib/email/send-prize-ticket-confirmation";
import { buildGoogleCalendarUrl, prizeRaffle } from "@/lib/prize";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

type MarkPaidResult = {
  ticket_id: string;
  order_id: string;
  ticket_status: string;
  paid_at: string;
};

type RaffleOrder = {
  amount: number;
  buyer_email: string | null;
  buyer_name: string | null;
  confirmation_email_claimed_at: string | null;
  confirmation_email_sent_at: string | null;
  currency: string;
  id: string;
};

export async function POST(request: Request) {
  const stripe = createStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET.");
    return Response.json({ error: "Webhook not configured." }, { status: 500 });
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      { error: `Invalid Stripe webhook signature: ${message}` },
      { status: 400 },
    );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        await confirmPrizeTicketPayment(session);
      }
    }

    if (event.type === "checkout.session.expired") {
      await expirePrizeTicketCheckout(event.data.object as Stripe.Checkout.Session);
    }

    if (event.type === "payment_intent.payment_failed") {
      await recordPrizeTicketPaymentFailure(
        event.data.object as Stripe.PaymentIntent,
      );
    }

    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to process Stripe prize webhook.", {
      error: message,
      eventId: event.id,
      eventType: event.type,
    });

    return Response.json({ error: message }, { status: 500 });
  }
}

async function confirmPrizeTicketPayment(session: Stripe.Checkout.Session) {
  const supabase = createSupabaseServiceRoleClient();
  const metadata = session.metadata ?? {};
  const orderId = getMetadataValue(metadata, ["order_id", "orderId"]);
  const ticketNumber = parseTicketNumber(metadata);
  const reservationId = getMetadataValue(metadata, [
    "reservation_id",
    "reservationId",
  ]);
  const amount = session.amount_total;
  const currency = session.currency?.toUpperCase();
  const buyerName =
    session.customer_details?.name ??
    getMetadataValue(metadata, ["buyer_name", "buyerName"]);
  const buyerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    getMetadataValue(metadata, ["buyer_email", "buyerEmail"]);
  const paymentIntentId = getStripeId(session.payment_intent);

  if (!orderId) {
    throw new Error("Missing order_id in Stripe Checkout metadata.");
  }

  if (metadata.raffle_slug !== prizeRaffle.slug) {
    throw new Error("Stripe Checkout metadata raffle_slug does not match.");
  }

  if (!reservationId) {
    throw new Error("Missing reservation_id in Stripe Checkout metadata.");
  }

  if (!amount || !currency) {
    throw new Error("Stripe Checkout session is missing amount or currency.");
  }

  const { data, error } = await supabase.rpc("mark_raffle_ticket_paid", {
    amount,
    buyer_email: buyerEmail,
    buyer_initials: getBuyerInitials(buyerName),
    buyer_name: buyerName,
    currency,
    raffle_slug: prizeRaffle.slug,
    reservation_id: reservationId,
    target_order_id: orderId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    ticket_number: ticketNumber,
  });

  if (error) {
    throw new Error(error.message);
  }

  const [paidResult] = (data ?? []) as MarkPaidResult[];

  if (!paidResult?.order_id || paidResult.ticket_status !== "PAID") {
    throw new Error("Ticket was not confirmed as PAID.");
  }

  await sendConfirmationEmailForOrder({
    buyerEmail,
    buyerName,
    orderId: paidResult.order_id,
    ticketId: paidResult.ticket_id,
    ticketNumber,
  });
}

async function expirePrizeTicketCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};

  if (metadata.raffle_slug !== prizeRaffle.slug) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.rpc("expire_raffle_checkout_session", {
    stripe_checkout_session_id: session.id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function recordPrizeTicketPaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
) {
  const metadata = paymentIntent.metadata ?? {};

  if (metadata.raffle_slug !== prizeRaffle.slug) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.rpc("record_raffle_payment_failed", {
    failure_message:
      paymentIntent.last_payment_error?.message ?? "Payment failed.",
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: paymentIntent.id,
    target_order_id: getMetadataValue(metadata, ["order_id", "orderId"]),
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function sendConfirmationEmailForOrder({
  buyerEmail,
  buyerName,
  orderId,
  ticketId,
  ticketNumber,
}: {
  buyerEmail: string | null;
  buyerName: string | null;
  orderId: string;
  ticketId: string;
  ticketNumber: number;
}) {
  const supabase = createSupabaseServiceRoleClient();
  const { data: order, error } = await supabase
    .from("raffle_orders")
    .select(
      "id, amount, currency, buyer_email, buyer_name, confirmation_email_claimed_at, confirmation_email_sent_at",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!order) {
    throw new Error(`Raffle order ${orderId} was not found.`);
  }

  const raffleOrder = order as RaffleOrder;

  if (raffleOrder.confirmation_email_sent_at) {
    return;
  }

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_raffle_confirmation_email",
    {
      order_id: orderId,
    },
  );

  if (claimError) {
    throw new Error(claimError.message);
  }

  if (!claimed) {
    return;
  }

  const recipient = raffleOrder.buyer_email ?? buyerEmail;
  const resolvedBuyerName = raffleOrder.buyer_name ?? buyerName;

  if (!recipient) {
    await recordConfirmationEmailFailure({
      errorMessage: "Missing buyer email for confirmation email.",
      orderId,
      ticketId,
      ticketNumber,
    });
    return;
  }

  try {
    const email = await sendPrizeTicketConfirmation({
      amountMXN: centsToPesos(raffleOrder.amount),
      buyerName: resolvedBuyerName,
      calendarUrl: buildGoogleCalendarUrl(),
      drawDate: "15 de octubre de 2026",
      drawTime: "8:00 PM",
      idempotencyKey: `prize-ticket-confirmation/${orderId}`,
      instagramUrl: prizeRaffle.instagramUrl,
      ticketNumber,
      to: recipient,
    });

    const { error: updateError } = await supabase
      .from("raffle_orders")
      .update({
        confirmation_email_failed_at: null,
        confirmation_email_claimed_at: null,
        confirmation_email_last_error: null,
        confirmation_email_resend_id: email?.id ?? null,
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .is("confirmation_email_sent_at", null);

    if (updateError) {
      throw new Error(updateError.message);
    }

    console.info("Prize ticket confirmation sent.", {
      adminBcc: "configured",
      participant: maskEmail(recipient),
      resendMessageId: email?.id ?? null,
      ticket: `#${ticketNumber}`,
    });

    await recordConfirmationEmailSent({
      resendEmailId: email?.id ?? null,
      ticketId,
      ticketNumber,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await recordConfirmationEmailFailure({
      errorMessage: message,
      orderId,
      ticketId,
      ticketNumber,
    });
  }
}

async function recordConfirmationEmailSent({
  resendEmailId,
  ticketId,
  ticketNumber,
}: {
  resendEmailId: string | null;
  ticketId: string;
  ticketNumber: number;
}) {
  const supabase = createSupabaseServiceRoleClient();

  await supabase.from("raffle_events").insert({
    event_type: "CONFIRMATION_EMAIL_SENT",
    metadata: {
      resend_email_id: resendEmailId,
      ticket_number: ticketNumber,
    },
    raffle_id: await getRaffleId(),
    ticket_id: ticketId,
  });
}

async function recordConfirmationEmailFailure({
  errorMessage,
  orderId,
  ticketId,
  ticketNumber,
}: {
  errorMessage: string;
  orderId: string;
  ticketId: string;
  ticketNumber: number;
}) {
  const supabase = createSupabaseServiceRoleClient();

  await supabase
    .from("raffle_orders")
    .update({
      confirmation_email_claimed_at: null,
      confirmation_email_failed_at: new Date().toISOString(),
      confirmation_email_last_error: errorMessage.slice(0, 1000),
    })
    .eq("id", orderId);

  await supabase.from("raffle_events").insert({
    event_type: "CONFIRMATION_EMAIL_FAILED",
    metadata: {
      error: errorMessage.slice(0, 1000),
      ticket_number: ticketNumber,
    },
    raffle_id: await getRaffleId(),
    ticket_id: ticketId,
  });
}

async function getRaffleId() {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("raffles")
    .select("id")
    .eq("slug", prizeRaffle.slug)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id as string;
}

function parseTicketNumber(metadata: Stripe.Metadata) {
  const ticketValue = getMetadataValue(metadata, [
    "ticket_number",
    "ticketNumber",
  ]);
  const ticketNumber = Number.parseInt(ticketValue ?? "", 10);

  if (
    !Number.isInteger(ticketNumber) ||
    ticketNumber < 1 ||
    ticketNumber > prizeRaffle.totalTickets
  ) {
    throw new Error("Missing or invalid ticket_number in Stripe metadata.");
  }

  return ticketNumber;
}

function getMetadataValue(metadata: Stripe.Metadata, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (value) {
      return value;
    }
  }

  return null;
}

function getStripeId(value: string | Stripe.PaymentIntent | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getBuyerInitials(name: string | null) {
  if (!name) {
    return null;
  }

  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 4);

  return initials || null;
}

function centsToPesos(amount: number) {
  return Math.round(amount / 100);
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "[masked email]";
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}
