"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  Clock3,
  ExternalLink,
  Heart,
  LockKeyhole,
  Sparkles,
  Star,
  Ticket,
  Video,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  buildGoogleCalendarUrl,
  buildIcsHref,
  formatTicketNumber,
  getAvailabilityCopy,
  getAvailableTicketCount,
  initialPrizeTickets,
  prizeRaffle,
  type PrizeTicket,
} from "@/lib/prize";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type PublicPrizeTicketRow = {
  buyer_initials: string | null;
  purchased_at: string | null;
  raffle_slug: string;
  status: PrizeTicket["status"];
  ticket_number: number;
};

const statusLabels: Record<PrizeTicket["status"], string> = {
  AVAILABLE: "Disponible",
  HELD: "Reservado temporalmente",
  PAID: "Pagado",
  BLOCKED: "Bloqueado",
};

function ticketFromRow(row: PublicPrizeTicketRow): PrizeTicket {
  return {
    buyerInitials: row.buyer_initials ?? undefined,
    number: row.ticket_number,
    purchasedAt: row.purchased_at ?? undefined,
    status: row.status,
  };
}

function getPurchasedDateLabel(purchasedAt?: string) {
  if (!purchasedAt) {
    return "";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    timeZone: prizeRaffle.timezone,
    year: "numeric",
  })
    .format(new Date(purchasedAt))
    .replace(".", "")
    .toUpperCase();
}

function getCountdown(): Countdown {
  const remaining = Math.max(
    new Date(prizeRaffle.drawAtIso).getTime() - Date.now(),
    0,
  );
  const seconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

function CountdownUnit({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="min-w-0 rounded-[8px] bg-white/70 px-3 py-2 text-center shadow-subtle">
      <div className="text-xl font-black leading-none text-ink sm:text-2xl">
        {value === null ? "--" : value.toString().padStart(2, "0")}
      </div>
      <div className="mt-1 text-[0.62rem] font-black uppercase text-ink/58">
        {label}
      </div>
    </div>
  );
}

function TicketButton({
  selected,
  ticket,
  onSelect,
}: {
  selected: boolean;
  ticket: PrizeTicket;
  onSelect: (ticket: PrizeTicket) => void;
}) {
  const ticketLabel = formatTicketNumber(ticket.number);
  const canChoose = ticket.status === "AVAILABLE";
  const paidDetails =
    ticket.status === "PAID"
      ? [
          `Boleto #${ticketLabel}`,
          `Comprado por ${ticket.buyerInitials ?? "X.X."}`,
          getPurchasedDateLabel(ticket.purchasedAt),
          "PAGADO ✓",
        ]
          .filter(Boolean)
          .join("\n")
      : null;

  return (
    <button
      aria-label={
        paidDetails ??
        (!canChoose
          ? `Boleto ${ticketLabel}: ${statusLabels[ticket.status]}`
          : `Elegir boleto ${ticketLabel}`)
      }
      className={[
        "group relative grid aspect-square min-h-[54px] place-items-center rounded-[8px] border text-xl font-black transition sm:min-h-[68px] sm:text-2xl",
        ticket.status === "AVAILABLE"
          ? "border-soft-gray bg-white text-black shadow-subtle hover:-translate-y-0.5 hover:border-brand-pink hover:text-brand-pink hover:shadow-pink"
          : "",
        ticket.status === "HELD"
          ? "cursor-not-allowed border-purple-soft bg-purple-soft text-brand-purple"
          : "",
        ticket.status === "PAID"
          ? "border-brand-purple bg-brand-purple text-white shadow-purple hover:z-20"
          : "",
        ticket.status === "BLOCKED"
          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-muted"
          : "",
        selected && canChoose ? "ring-4 ring-pink-soft" : "",
      ].join(" ")}
      disabled={ticket.status === "HELD" || ticket.status === "BLOCKED"}
      onClick={() => {
        if (canChoose) {
          onSelect(ticket);
        }
      }}
      title={paidDetails ?? (!canChoose ? statusLabels[ticket.status] : `Elegir #${ticketLabel}`)}
      type="button"
    >
      {ticket.status === "HELD" ? (
        <Clock3 aria-hidden className="absolute right-2 top-2 h-3.5 w-3.5" />
      ) : null}
      {ticket.status === "PAID" ? (
        <Check aria-hidden className="absolute right-2 top-2 h-3.5 w-3.5" />
      ) : null}
      <span>{ticketLabel}</span>
      {ticket.status === "AVAILABLE" ? (
        <span className="pointer-events-none absolute bottom-1 hidden text-[0.54rem] font-black uppercase text-brand-pink opacity-0 transition group-hover:opacity-100 sm:block">
          Elegir
        </span>
      ) : null}
      {paidDetails ? (
        <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-30 hidden w-44 -translate-x-1/2 whitespace-pre-line rounded-[8px] bg-ink px-3 py-2 text-center text-[0.68rem] font-black leading-snug text-white shadow-soft group-hover:block group-focus-visible:block">
          {paidDetails}
        </span>
      ) : null}
    </button>
  );
}

export function PrizeLanding() {
  const [selectedTicket, setSelectedTicket] = useState<PrizeTicket | null>(null);
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [tickets, setTickets] = useState<PrizeTicket[]>(initialPrizeTickets);
  const [checkoutState, setCheckoutState] = useState<"idle" | "loading">("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const availableTickets = getAvailableTicketCount(tickets);
  const googleCalendarUrl = useMemo(() => buildGoogleCalendarUrl(), []);
  const icsHref = useMemo(() => buildIcsHref(), []);

  const refreshTickets = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("public_raffle_ticket_states")
        .select("raffle_slug, ticket_number, status, buyer_initials, purchased_at")
        .eq("raffle_slug", prizeRaffle.slug)
        .order("ticket_number", { ascending: true });

      if (error || !data) {
        return;
      }

      setTickets((data as PublicPrizeTicketRow[]).map(ticketFromRow));
    } catch {
      setTickets(initialPrizeTickets);
    }
  }, []);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getCountdown());
    const timeout = window.setTimeout(updateCountdown, 0);
    const interval = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    try {
      const supabase = createSupabaseBrowserClient();

      void supabase
        .from("public_raffle_ticket_states")
        .select("raffle_slug, ticket_number, status, buyer_initials, purchased_at")
        .eq("raffle_slug", prizeRaffle.slug)
        .order("ticket_number", { ascending: true })
        .then(({ data }) => {
          if (isMounted && data) {
            setTickets((data as PublicPrizeTicketRow[]).map(ticketFromRow));
          }
        });

      const channel = supabase
        .channel("prize-public-ticket-state")
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `raffle_slug=eq.${prizeRaffle.slug}`,
            schema: "public",
            table: "public_raffle_ticket_states",
          },
          (payload) => {
            const row = payload.new as PublicPrizeTicketRow | null;

            if (!row || row.raffle_slug !== prizeRaffle.slug) {
              return;
            }

            setTickets((currentTickets) =>
              currentTickets.map((ticket) =>
                ticket.number === row.ticket_number ? ticketFromRow(row) : ticket,
              ),
            );
          },
        )
        .subscribe();

      return () => {
        isMounted = false;
        void supabase.removeChannel(channel);
      };
    } catch {
      return () => {
        isMounted = false;
      };
    }
  }, []);

  async function startCheckout() {
    if (!selectedTicket || checkoutState === "loading") {
      return;
    }

    setCheckoutState("loading");
    setCheckoutError(null);

    try {
      const response = await fetch("/api/prize/checkout", {
        body: JSON.stringify({ ticketNumber: selectedTicket.number }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.checkoutUrl) {
        if (response.status === 409) {
          await refreshTickets();
        }

        throw new Error(data.error ?? "No pudimos iniciar Checkout TEST.");
      }

      window.location.assign(data.checkoutUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No pudimos iniciar Checkout TEST.";
      setCheckoutError(message);
      setCheckoutState("idle");
    }
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <section className="mx-auto grid w-full max-w-[1480px] gap-6 px-4 pb-10 pt-5 sm:px-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
        <aside className="grid gap-5 lg:sticky lg:top-5 lg:self-start">
          <Link className="block w-fit" href="/" aria-label="Ir a SOFI'S 3D ART">
            <Wordmark />
          </Link>
          <p className="-mt-4 text-lg font-semibold text-muted">
            Imagina. Imprime. Disfruta.
          </p>

          <div className="relative mx-auto h-[315px] w-full max-w-[260px] lg:h-[380px]">
            <Image
              alt="Apple Watch SE 3"
              className="object-contain"
              fill
              priority
              sizes="(max-width: 1024px) 260px, 280px"
              src="/prize/apple-watch-se-3-transparent.png"
            />
          </div>

          <div className="grid gap-0 overflow-hidden rounded-[8px] border border-soft-gray bg-white shadow-subtle">
            <div className="grid grid-cols-[42px_1fr] gap-3 border-b border-soft-gray px-5 py-4">
              <Ticket aria-hidden className="h-7 w-7 text-brand-pink" />
              <div>
                <p className="text-xs font-bold text-ink/65">
                  Total de boletos
                </p>
                <p className="text-2xl font-black text-brand-pink">
                  {prizeRaffle.totalTickets}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-[42px_1fr] gap-3 border-b border-soft-gray px-5 py-4">
              <LockKeyhole aria-hidden className="h-7 w-7 text-brand-purple" />
              <div>
                <p className="text-xs font-bold text-ink/65">
                  Precio por boleto
                </p>
                <p className="text-2xl font-black text-brand-purple">
                  {prizeRaffle.ticketPriceLabel}
                </p>
              </div>
            </div>
            <a
              className="grid grid-cols-[42px_1fr] gap-3 border-b border-soft-gray px-5 py-4 transition hover:bg-pink-soft"
              href={icsHref}
              download="sofis-3d-art-rifa-apple-watch-se-3.ics"
            >
              <CalendarDays aria-hidden className="h-7 w-7 text-brand-purple" />
              <div>
                <p className="text-xs font-bold text-ink/65">
                  Fecha del sorteo
                </p>
                <p className="text-xl font-black text-brand-purple">
                  {prizeRaffle.drawDateLabel}
                </p>
                <p className="text-sm font-bold text-ink/75">
                  {prizeRaffle.drawTimeLabel} ({prizeRaffle.drawTimeZoneLabel})
                </p>
                <p className="mt-2 text-xs font-black uppercase text-brand-pink">
                  Agregar a calendario
                </p>
              </div>
            </a>
            <a
              className="grid grid-cols-[42px_1fr] gap-3 px-5 py-4 transition hover:bg-pink-soft"
              href={prizeRaffle.instagramUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Camera aria-hidden className="h-7 w-7 text-brand-pink" />
              <div>
                <p className="text-xs font-bold text-ink/65">En vivo por</p>
                <p className="text-xl font-black text-brand-pink">
                  {prizeRaffle.instagramHandle}
                </p>
              </div>
            </a>
          </div>

          <p className="hidden items-start gap-3 text-[0.95rem] font-bold leading-relaxed text-ink/78 lg:flex">
            <Heart
              aria-hidden
              className="mt-1 h-5 w-5 shrink-0 text-brand-pink"
            />
            <span>
              Hecho con amor para ayudar a mi emprendimiento de llaveritos 3D.
            </span>
          </p>
        </aside>

        <div className="min-w-0">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_245px] xl:items-start">
            <header>
              <h1 className="text-[2.3rem] font-black leading-tight tracking-normal text-ink sm:text-[3.4rem] lg:text-[3.8rem]">
                Rifa{" "}
                <span className="text-brand-pink">Apple Watch SE 3</span>{" "}
                <span className="text-brand-pink">♥</span>
              </h1>
              <p className="mt-3 text-xl font-bold leading-snug text-ink/75">
                {getAvailabilityCopy(availableTickets)} ¡Gracias por apoyar{" "}
                <span className="text-brand-pink">mi sueño!</span>
              </p>
            </header>

            <aside className="overflow-hidden rounded-[8px] bg-brand-purple text-center text-white shadow-purple">
              <div className="px-5 py-4">
                <p className="flex items-center justify-center gap-2 text-sm font-black">
                  <Star aria-hidden className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
                  Sorteo en vivo
                </p>
                <p className="mt-3 text-2xl font-black">
                  {prizeRaffle.drawDateLabel}
                </p>
                <p className="mt-1 text-lg font-extrabold">
                  {prizeRaffle.drawTimeLabel} ({prizeRaffle.drawTimeZoneLabel})
                </p>
              </div>
              <a
                className="flex items-center justify-center gap-2 bg-brand-pink px-4 py-3 text-sm font-black transition hover:bg-[#d92d79]"
                href={prizeRaffle.instagramUrl}
                rel="noreferrer"
                target="_blank"
              >
                Ver Instagram <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
            </aside>
          </div>

          <section className="mt-6 rounded-[8px] border border-soft-gray bg-white p-4 shadow-soft sm:p-5">
            <div
              id="tickets"
              className="grid grid-cols-5 gap-3 sm:gap-5 lg:grid-cols-10"
            >
              {tickets.map((ticket) => (
                <TicketButton
                  key={ticket.number}
                  onSelect={setSelectedTicket}
                  selected={selectedTicket?.number === ticket.number}
                  ticket={ticket}
                />
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 rounded-[8px] border border-soft-gray bg-white px-5 py-5 shadow-subtle md:grid-cols-4">
            {[
              {
                icon: Ticket,
                title: "Solo 50 boletos",
                text: "Mas chances para ganar",
                color: "text-brand-pink",
              },
              {
                icon: LockKeyhole,
                title: "Pago seguro",
                text: "Checkout protegido",
                color: "text-brand-purple",
              },
              {
                icon: Heart,
                title: "Con tu apoyo",
                text: "Sofia sigue creando",
                color: "text-brand-pink",
              },
              {
                icon: Sparkles,
                title: "Premio increible",
                text: "Apple Watch SE 3",
                color: "text-brand-yellow",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className="flex items-center gap-4" key={item.title}>
                  <Icon aria-hidden className={`h-9 w-9 ${item.color}`} />
                  <div>
                    <p className="font-black text-ink">{item.title}</p>
                    <p className="text-sm font-semibold leading-snug text-ink/70">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="mt-7 overflow-hidden rounded-[8px] bg-brand-purple text-white shadow-purple">
            <div className="grid items-center gap-6 px-6 py-7 md:grid-cols-[1fr_320px]">
              <div>
                <p className="text-lg font-bold">
                  Cada boleto es un paso mas para hacer mi sueño realidad.
                </p>
                <p className="mt-3 text-2xl font-black">
                  ¡Gracias por ser parte de esto! ♡
                </p>
                <div className="mt-5 grid max-w-[410px] grid-cols-4 gap-2">
                  <CountdownUnit label="dias" value={countdown?.days ?? null} />
                  <CountdownUnit label="horas" value={countdown?.hours ?? null} />
                  <CountdownUnit label="min" value={countdown?.minutes ?? null} />
                  <CountdownUnit label="seg" value={countdown?.seconds ?? null} />
                </div>
              </div>
              <div className="grid grid-cols-3 items-end gap-2">
                <Image
                  alt="Pulpo articulado 3D rosa"
                  className="w-full object-contain"
                  height={180}
                  src="/products/pulpo-articulado-flexi.png"
                  width={180}
                />
                <Image
                  alt="Maceta impresa en 3D azul"
                  className="w-full object-contain"
                  height={180}
                  src="/products/maceta-espiral.png"
                  width={180}
                />
                <Image
                  alt="Dinosaurio 3D verde"
                  className="w-full object-contain"
                  height={180}
                  src="/products/dinosaurio-flexi.png"
                  width={180}
                />
              </div>
            </div>
          </section>

          <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle">
              <h2 className="text-2xl font-black tracking-normal">
                ¿Como se elegira al ganador?
              </h2>
              <p className="mt-4 text-base font-semibold leading-relaxed text-ink/72">
                Los 50 boletos corresponden directamente a los numeros 01-50. El
                ganador sera seleccionado mediante una herramienta digital de
                seleccion aleatoria durante la transmision en vivo.
              </p>
              <p className="mt-4 text-base font-black text-brand-purple">
                {prizeRaffle.drawDateLabel} · {prizeRaffle.drawTimeLabel} ·{" "}
                {prizeRaffle.instagramHandle}
              </p>
            </div>

            <div className="rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle">
              <h2 className="text-2xl font-black tracking-normal">
                Sorteo en
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <CountdownUnit label="dias" value={countdown?.days ?? null} />
                <CountdownUnit label="horas" value={countdown?.hours ?? null} />
                <CountdownUnit label="min" value={countdown?.minutes ?? null} />
                <CountdownUnit label="seg" value={countdown?.seconds ?? null} />
              </div>
              <div className="mt-5 grid gap-2">
                <a
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-purple px-4 text-sm font-black text-white transition hover:bg-[#6645df]"
                  href={googleCalendarUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Google Calendar <ExternalLink aria-hidden className="h-4 w-4" />
                </a>
                <a
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-soft-gray bg-white px-4 text-sm font-black text-ink transition hover:border-brand-pink hover:text-brand-pink"
                  download="sofis-3d-art-rifa-apple-watch-se-3.ics"
                  href={icsHref}
                >
                  Apple / Outlook
                </a>
              </div>
            </div>
          </section>

          <section className="mt-7 rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle">
            <h2 className="text-2xl font-black tracking-normal">
              Conoce el sueño detrás de esta rifa
            </h2>
            <div className="mt-5 grid min-h-[260px] place-items-center rounded-[8px] bg-neutral-100 text-center">
              <div>
                <Video
                  aria-hidden
                  className="mx-auto h-12 w-12 text-brand-purple"
                />
                <p className="mt-4 text-lg font-black text-ink">
                  Video de Sofia
                </p>
                <p className="mt-1 text-sm font-bold text-ink/62">
                  Proximamente
                </p>
              </div>
            </div>
            <a
              className="mt-5 inline-flex h-12 items-center rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink transition hover:-translate-y-0.5"
              href="#tickets"
            >
              Elegir mi numero
            </a>
          </section>

          {selectedTicket ? (
            <div className="sticky bottom-4 z-30 mt-6 rounded-[8px] border border-brand-pink bg-white p-4 shadow-pink">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-brand-pink">
                    Boleto seleccionado
                  </p>
                  <p className="text-2xl font-black">
                    #{formatTicketNumber(selectedTicket.number)} ·{" "}
                    {prizeRaffle.ticketPriceLabel}
                  </p>
                </div>
                <button
                  className="h-12 rounded-lg bg-ink px-5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                  disabled={checkoutState === "loading"}
                  onClick={startCheckout}
                  type="button"
                >
                  {checkoutState === "loading"
                    ? "Reservando..."
                    : "Ir a Checkout TEST"}
                </button>
              </div>
              {checkoutError ? (
                <p className="mt-3 text-sm font-black text-brand-pink">
                  {checkoutError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
