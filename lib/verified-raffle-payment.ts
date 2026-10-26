type HistoricalOrder = {
  id: string;
  raffle_id: string;
  ticket_id: string;
  status: string;
  reservation_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
};

type HistoricalTicket = {
  id: string;
  raffle_id: string;
  ticket_number: number;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

export function isVerifiedHistoricalPayment({ order, ticket, raffle, expected }: {
  order: HistoricalOrder | null;
  ticket: HistoricalTicket | null;
  raffle: { id: string; slug: string; status: string } | null;
  expected: { orderId: string; reservationId: string; sessionId: string;
    paymentIntentId: string | null; ticketNumber: number; amount: number;
    currency: string; raffleSlug: string };
}) {
  return Boolean(order && ticket && raffle && expected.paymentIntentId &&
    raffle.status === "DRAWN" && raffle.slug === expected.raffleSlug &&
    order.status === "PAID" && ticket.status === "PAID" &&
    order.id === expected.orderId && order.reservation_id === expected.reservationId &&
    order.raffle_id === raffle.id && ticket.raffle_id === raffle.id &&
    order.ticket_id === ticket.id && ticket.ticket_number === expected.ticketNumber &&
    order.amount === expected.amount && order.currency === expected.currency &&
    order.stripe_checkout_session_id === expected.sessionId &&
    ticket.stripe_checkout_session_id === expected.sessionId &&
    order.stripe_payment_intent_id === expected.paymentIntentId &&
    ticket.stripe_payment_intent_id === expected.paymentIntentId);
}
