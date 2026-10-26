import { prizeRaffle } from "@/lib/prize";
import { publicTicketStates } from "@/lib/public-raffle-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!origin || !key) throw new Error("Missing public configuration");
    const url = new URL("/rest/v1/public_raffle_ticket_states", origin);
    url.search = new URLSearchParams({ select: "ticket_number,status", raffle_slug: `eq.${prizeRaffle.slug}`, order: "ticket_number.asc" }).toString();
    const response = await fetch(url, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Unavailable ticket states");
    const tickets = publicTicketStates(await response.json());
    if (!tickets) throw new Error("Incomplete ticket states");
    return Response.json(tickets, { headers });
  } catch {
    return Response.json({ error: "No pudimos verificar los boletos. Intenta de nuevo." }, { status: 503, headers });
  }
}
