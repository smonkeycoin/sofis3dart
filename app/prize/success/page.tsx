import Link from "next/link";
import { CalendarDays, Instagram, Share2, Ticket } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  formatTicketNumber,
  prizeRaffle,
} from "@/lib/prize";

export default function PrizeSuccessPage() {
  const ticketNumber = 17;

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-ink">
      <section className="mx-auto grid max-w-[720px] gap-6 rounded-[8px] border border-soft-gray bg-white p-6 text-center shadow-soft sm:p-9">
        <div>
          <p className="text-lg font-black text-brand-pink">
            ¡El #{formatTicketNumber(ticketNumber)} es tuyo!
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal">
            Rifa Apple Watch SE 3
          </h1>
        </div>

        <div className="mx-auto grid h-36 w-36 place-items-center rounded-[8px] bg-brand-purple text-6xl font-black text-white shadow-purple">
          {formatTicketNumber(ticketNumber)}
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
              {prizeRaffle.drawDateLabel}
            </dd>
          </div>
          <div className="rounded-[8px] bg-yellow-soft p-4">
            <dt className="text-xs font-black uppercase text-ink/55">En vivo</dt>
            <dd className="mt-1 text-lg font-black text-ink">
              {prizeRaffle.instagramHandle}
            </dd>
          </div>
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-purple px-4 font-black text-white shadow-purple"
            href={buildGoogleCalendarUrl()}
            rel="noreferrer"
            target="_blank"
          >
            <CalendarDays aria-hidden className="h-5 w-5" />
            Agregar a calendario
          </a>
          <a
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-soft-gray px-4 font-black text-brand-pink"
            href={prizeRaffle.instagramUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Instagram aria-hidden className="h-5 w-5" />
            Ver @luzelamx
          </a>
          <button
            className="flex h-12 items-center justify-center gap-2 rounded-lg border border-soft-gray px-4 font-black text-ink"
            type="button"
          >
            <Share2 aria-hidden className="h-5 w-5" />
            Compartir la rifa
          </button>
          <Link
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-pink px-4 font-black text-white shadow-pink"
            href="/prize"
          >
            <Ticket aria-hidden className="h-5 w-5" />
            Volver a la rifa
          </Link>
        </div>
      </section>
    </main>
  );
}
