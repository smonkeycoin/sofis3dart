"use client";

import { useEffect, useState } from "react";
import { Check, Clock3 } from "lucide-react";
import { formatTicketNumber, prizeRaffle } from "@/lib/prize";
import { publicTicketStates, type PublicTicket } from "@/lib/public-raffle-state";

const labels = { PAID: "Vendido", AVAILABLE: "Disponible · ventas cerradas", HELD: "Reservado", BLOCKED: "No elegible" };
const colors = {
  PAID: "border-brand-purple bg-brand-purple text-white shadow-purple",
  AVAILABLE: "border-soft-gray bg-white text-ink shadow-subtle",
  HELD: "border-purple-soft bg-purple-soft text-brand-purple",
  BLOCKED: "border-neutral-200 bg-neutral-100 text-muted",
};

export function RaffleTickets() {
  const [tickets, setTickets] = useState<PublicTicket[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let pending = false;
    const controller = new AbortController();
    async function refresh() {
      if (pending) return;
      pending = true;
      try {
        const response = await fetch("/api/prize/tickets", { cache: "no-store", signal: controller.signal });
        const rows = response.ok ? publicTicketStates(await response.json()) : null;
        if (!rows) throw new Error("Unavailable");
        if (active) { setTickets(rows); setFailed(false); }
      } catch {
        if (active) { setTickets(null); setFailed(true); }
      } finally { pending = false; }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; controller.abort(); window.clearInterval(timer); };
  }, [retry]);
  return (
    <section aria-labelledby="tickets-heading" className="mt-6 scroll-mt-5 rounded-[8px] border border-soft-gray bg-white p-4 shadow-soft sm:p-5" id="tickets">
      <h2 className="text-xl font-black sm:text-2xl" id="tickets-heading">Consulta tu boleto</h2>
      <p className="mt-2 text-sm font-semibold text-ink/65">Tus números se conservan. Las ventas permanecen cerradas.</p>
      {tickets ? <>
        <div className="my-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold" aria-label="Resumen de boletos">
          <span className="text-brand-purple">{tickets.filter(t => t.status === "PAID").length} vendidos</span>
          <span>{tickets.filter(t => t.status === "AVAILABLE").length} disponibles</span>
          <span>{tickets.filter(t => t.status === "HELD").length} reservados</span>
          <span>{tickets.filter(t => t.status !== "PAID").length} sin pago confirmado</span>
        </div>
        <ol aria-label="Estados actuales de los 50 boletos" className="grid grid-cols-5 gap-2.5 sm:gap-4 lg:grid-cols-10">
          {tickets.map(ticket => <li key={ticket.ticket_number} aria-label={`Boleto ${formatTicketNumber(ticket.ticket_number)}: ${labels[ticket.status]}`} title={labels[ticket.status]} className={`relative grid aspect-square min-h-[48px] place-items-center rounded-[8px] border text-xl font-black sm:text-2xl ${colors[ticket.status]}`}>
            {ticket.status === "PAID" ? <Check aria-hidden className="absolute right-1 top-1 h-3.5 w-3.5" /> : null}
            {ticket.status === "HELD" ? <Clock3 aria-hidden className="absolute right-1 top-1 h-3.5 w-3.5" /> : null}
            <span aria-hidden="true">{formatTicketNumber(ticket.ticket_number)}</span>
          </li>)}
        </ol>
        <p className="mt-4 text-xs font-semibold leading-relaxed text-ink/65">Morado: vendido · Blanco: disponible, sin venta habilitada · Lila: reservado · Gris: no elegible. Los boletos sin pago confirmado no están incluidos en la propuesta del nuevo padrón.</p>
      </> : <div className="mt-5 text-sm font-semibold" role="status">{failed ? <>No pudimos verificar los estados. <button className="font-bold text-brand-purple underline" onClick={() => setRetry(n => n + 1)} type="button">Reintentar</button></> : "Consultando los estados de tus boletos…"}</div>}
    </section>
  );
}

export function RaffleCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, Math.floor((Date.parse(prizeRaffle.drawAtIso) - Date.now()) / 1000)));
    const start = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 1000);
    return () => { window.clearTimeout(start); window.clearInterval(timer); };
  }, []);
  if (remaining === 0) return <p className="mt-5 font-bold">Llegó la hora del sorteo. Sigue la transmisión en {prizeRaffle.instagramHandle}; publicaremos el resultado después.</p>;
  const units = remaining === null ? [null, null, null, null] : [Math.floor(remaining / 86400), Math.floor(remaining % 86400 / 3600), Math.floor(remaining % 3600 / 60), remaining % 60];
  return <div className="mt-5 grid max-w-[410px] grid-cols-4 gap-2" aria-label="Cuenta regresiva al 1 de noviembre, 7 PM, hora de Cancún">
    {units.map((value, i) => <div className="min-w-0 rounded-[8px] bg-white/70 px-3 py-2 text-center shadow-subtle" key={i}><div className="text-xl font-black leading-none text-ink sm:text-2xl">{value === null ? "--" : String(value).padStart(2, "0")}</div><div className="mt-1 text-[0.62rem] font-black uppercase text-ink/58">{["días", "horas", "min", "seg"][i]}</div></div>)}
  </div>;
}
