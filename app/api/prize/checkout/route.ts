import { prizeRaffle } from "@/lib/prize";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type HoldResult = {
  reservation_id: string;
  reserved_until: string;
};

type OrderResult = {
  order_id: string;
};

type PendingOrderForCleanup = {
  id: string;
  raffle_id: string;
  reservation_id: string | null;
  status: string;
  ticket_id: string;
};

const checkoutStartError =
  "No pudimos iniciar el pago. Tu boleto sigue disponible. Intenta nuevamente.";

function getPrizeUrl() {
  return process.env.NEXT_PUBLIC_PRIZE_URL || prizeRaffle.canonicalUrl;
}

function parseTicketNumber(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  const ticketNumber =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  if (
    !Number.isInteger(ticketNumber) ||
    ticketNumber < 1 ||
    ticketNumber > prizeRaffle.totalTickets
  ) {
    return null;
  }

  return ticketNumber;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ticketNumber = parseTicketNumber(
    typeof body === "object" && body
      ? (body as { ticketNumber?: unknown }).ticketNumber
      : null,
  );

  if (!ticketNumber) {
    return Response.json(
      { error: "ticketNumber must be an integer from 1 to 50." },
      { status: 400 },
    );
  }

  const stripePriceId = process.env.STRIPE_PRIZE_PRICE_ID;

  if (!stripePriceId) {
    console.error("Prize checkout is not configured.");
    return Response.json({ error: checkoutStartError }, { status: 500 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: holdData, error: holdError } = await supabase.rpc(
    "hold_raffle_ticket",
    {
      hold_minutes: 10,
      raffle_slug: prizeRaffle.slug,
      ticket_number: ticketNumber,
    },
  );

  if (holdError) {
    return Response.json(
      { error: "Ticket is no longer available." },
      { status: 409 },
    );
  }

  const [hold] = (holdData ?? []) as HoldResult[];

  if (!hold?.reservation_id || !hold.reserved_until) {
    return Response.json(
      { error: "Could not reserve this ticket." },
      { status: 409 },
    );
  }

  const { data: orderData, error: orderError } = await supabase.rpc(
    "create_raffle_checkout_order",
    {
      raffle_slug: prizeRaffle.slug,
      reservation_id: hold.reservation_id,
      ticket_number: ticketNumber,
    },
  );

  if (orderError) {
    return Response.json({ error: orderError.message }, { status: 409 });
  }

  const [order] = (orderData ?? []) as OrderResult[];

  if (!order?.order_id) {
    return Response.json(
      { error: "Could not create raffle order." },
      { status: 500 },
    );
  }

  const prizeUrl = getPrizeUrl();
  const metadata = {
    order_id: order.order_id,
    raffle_slug: prizeRaffle.slug,
    reservation_id: hold.reservation_id,
    ticket_number: ticketNumber.toString(),
  };

  const stripe = createStripeClient();
  let session;

  try {
    session = await stripe.checkout.sessions.create({
      cancel_url: `${prizeUrl}/?checkout=cancelled`,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata,
      mode: "payment",
      payment_intent_data: {
        metadata,
      },
      success_url: `${prizeUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await releasePendingOrderAfterCheckoutFailure({
      errorMessage: message,
      orderId: order.order_id,
      supabase,
    });

    console.error("Prize checkout session could not be created.", {
      error: message,
      orderId: order.order_id,
      ticketNumber,
    });

    return Response.json({ error: checkoutStartError }, { status: 502 });
  }

  const { error: checkoutError } = await supabase.rpc(
    "record_raffle_checkout_created",
    {
      order_id: order.order_id,
      stripe_checkout_session_id: session.id,
    },
  );

  if (checkoutError) {
    console.error("Stripe Checkout was created but order recording failed.", {
      checkoutSessionId: session.id,
      error: checkoutError.message,
      orderId: order.order_id,
    });
  }

  return Response.json({
    checkoutUrl: session.url,
    orderId: order.order_id,
    reservationId: hold.reservation_id,
    reservedUntil: hold.reserved_until,
  });
}

async function releasePendingOrderAfterCheckoutFailure({
  errorMessage,
  orderId,
  supabase,
}: {
  errorMessage: string;
  orderId: string;
  supabase: SupabaseClient;
}) {
  const { data: order } = await supabase
    .from("raffle_orders")
    .select("id, raffle_id, reservation_id, status, ticket_id")
    .eq("id", orderId)
    .maybeSingle();

  const pendingOrder = order as PendingOrderForCleanup | null;

  if (!pendingOrder || pendingOrder.status !== "PENDING") {
    return;
  }

  await supabase
    .from("raffle_orders")
    .update({ status: "CANCELLED" })
    .eq("id", pendingOrder.id)
    .eq("status", "PENDING");

  await supabase
    .from("raffle_tickets")
    .update({
      reservation_id: null,
      reserved_until: null,
      status: "AVAILABLE",
      stripe_checkout_session_id: null,
    })
    .eq("id", pendingOrder.ticket_id)
    .eq("status", "HELD")
    .eq("reservation_id", pendingOrder.reservation_id);

  await supabase.from("raffle_events").insert({
    event_type: "ADMIN_RELEASED",
    metadata: {
      error: errorMessage.slice(0, 1000),
      order_id: pendingOrder.id,
      reason: "stripe_checkout_creation_failed",
    },
    raffle_id: pendingOrder.raffle_id,
    ticket_id: pendingOrder.ticket_id,
  });
}
