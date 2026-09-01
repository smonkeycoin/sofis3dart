import Link from "next/link";
import { CalendarDays, Camera, Ticket } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  formatTicketNumber,
  prizeRaffle,
} from "@/lib/prize";
import { createStripeClient } from "@/lib/stripe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

type PrizeSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string | string[];
  }>;
};

type VerifiedPrizeSession = {
  amount: number;
  ticketNumber: number;
};

function getSessionId(sessionId?: string | string[]) {
  return Array.isArray(sessionId) ? sessionId[0] : sessionId;
}

function parseTicketNumber(metadata: Stripe.Metadata | null) {
  const parsed = Number.parseInt(metadata?.ticket_number ?? "", 10);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > prizeRaffle.totalTickets) {
    return null;
  }

  return parsed;
}

async function verifyPrizeSession(sessionId: string | undefined) {
  if (!sessionId) {
    return null;
  }

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata ?? {};
    const ticketNumber = parseTicketNumber(metadata);

    if (
      session.payment_status !== "paid" ||
      metadata.raffle_slug !== prizeRaffle.slug ||
      !ticketNumber ||
      session.amount_total !== prizeRaffle.ticketPriceCents ||
      session.currency?.toUpperCase() !== prizeRaffle.currency
    ) {
      return null;
    }

    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from("raffle_orders")
      .select("id, status, amount, currency")
      .eq("stripe_checkout_session_id", session.id)
      .eq("status", "PAID")
      .eq("amount", prizeRaffle.ticketPriceCents)
      .eq("currency", prizeRaffle.currency)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      amount: session.amount_total,
      ticketNumber,
    } satisfies VerifiedPrizeSession;
  } catch {
    return null;
  }
}

export default async function PrizeSuccessPage({
  searchParams,
}: PrizeSuccessPageProps) {
  const params = await searchParams;
  const verifiedSession = await verifyPrizeSession(getSessionId(params.session_id));
  const ticketNumber = verifiedSession?.ticketNumber ?? null;
  const ticketLabel = ticketNumber ? formatTicketNumber(ticketNumber) : "--";

  if (!verifiedSession) {
    return (
      <main className="min-h-screen bg-white px-5 py-8 text-ink">
        <section className="mx-auto grid max-w-[720px] gap-6 rounded-[8px] border border-soft-gray bg-white p-6 text-center shadow-soft sm:p-9">
          <div>
            <p className="text-lg font-black text-brand-pink">
              No pudimos confirmar este pago
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal">
              Rifa Apple Watch SE 3
            </h1>
          </div>

          <p className="text-base font-bold leading-relaxed text-ink/70">
            Esta pantalla solo muestra boletos confirmados por Stripe. Si tu
            pago fue aprobado, espera un momento y vuelve a abrir el enlace de
            Checkout.
          </p>

          <Link
            className="mx-auto flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink"
            href="/prize"
          >
            <Ticket aria-hidden className="h-5 w-5" />
            VOLVER A LA RIFA
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-ink">
      <section className="mx-auto grid max-w-[720px] gap-6 rounded-[8px] border border-soft-gray bg-white p-6 text-center shadow-soft sm:p-9">
        <div>
          <p className="text-lg font-black text-brand-pink">
            💜 ¡EL #{ticketLabel} ES TUYO!
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal">
            Rifa Apple Watch SE 3
          </h1>
        </div>

        <div className="mx-auto grid h-36 w-36 place-items-center rounded-[8px] bg-brand-purple text-6xl font-black text-white shadow-purple">
          {ticketLabel}
        </div>

        <dl className="grid gap-3 text-left sm:grid-cols-3">
          <div className="rounded-[8px] bg-pink-soft p-4">
            <dt className="text-xs font-black uppercase text-ink/55">Precio</dt>
            <dd className="mt-1 text-lg font-black text-brand-pink">
              {prizeRaffle.ticketPriceLabel}
            </dd>
          </div>
          <div className="rounded-[8px] bg-purple-soft p-4">
            <dt className="text-xs font-black uppercase text-ink/55">Sorteo</dt>
            <dd className="mt-1 text-lg font-black text-brand-purple">
              15 OCT 2026
              <br />
              8:00 PM
            </dd>
          </div>
          <div className="rounded-[8px] bg-yellow-soft p-4">
            <dt className="text-xs font-black uppercase text-ink/55">En vivo</dt>
            <dd className="mt-1 text-lg font-black text-ink">
              {prizeRaffle.instagramHandle}
            </dd>
          </div>
        </dl>

        <div className="grid gap-3 sm:grid-cols-3">
          <a
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-purple px-4 font-black text-white shadow-purple"
            href={buildGoogleCalendarUrl()}
            rel="noreferrer"
            target="_blank"
          >
            <CalendarDays aria-hidden className="h-5 w-5" />
            AGREGAR A CALENDARIO
          </a>
          <a
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-soft-gray px-4 font-black text-brand-pink"
            href={prizeRaffle.instagramUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Camera aria-hidden className="h-5 w-5" />
            VER @LUZELAMX
          </a>
          <Link
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-pink px-4 font-black text-white shadow-pink"
            href="/prize"
          >
            <Ticket aria-hidden className="h-5 w-5" />
            VOLVER A LA RIFA
          </Link>
        </div>
      </section>
    </main>
  );
}
