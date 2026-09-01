export type PrizeTicketStatus = "AVAILABLE" | "HELD" | "PAID" | "BLOCKED";

export type PrizeTicket = {
  number: number;
  status: PrizeTicketStatus;
  buyerInitials?: string;
  purchasedAt?: string;
};

export const prizeRaffle = {
  slug: "apple-watch-se-3",
  name: "Rifa Apple Watch SE 3",
  prizeName: "Apple Watch SE 3",
  totalTickets: 50,
  ticketPriceCents: 34700,
  ticketPriceLabel: "$347 MXN",
  currency: "MXN",
  drawDateLabel: "15 OCT 2026",
  drawTimeLabel: "8:00 PM",
  timezone: "America/Cancun",
  drawAtIso: "2026-10-16T01:00:00.000Z",
  instagramHandle: "@luzelamx",
  instagramUrl: "https://instagram.com/luzelamx",
  canonicalUrl: "https://prize.sofis3d.art",
};

export const initialPrizeTickets: PrizeTicket[] = Array.from(
  { length: prizeRaffle.totalTickets },
  (_, index) => ({
    number: index + 1,
    status: "AVAILABLE",
  }),
);

export function formatTicketNumber(number: number) {
  return number.toString().padStart(2, "0");
}

export function getAvailableTicketCount(tickets: PrizeTicket[]) {
  return tickets.filter((ticket) => ticket.status === "AVAILABLE").length;
}

export function getAvailabilityCopy(available: number) {
  if (available === 0) {
    return "SOLD OUT";
  }

  if (available <= 3) {
    return `ULTIMOS ${available}`;
  }

  if (available <= 10) {
    return `Ultimos ${available} boletos`;
  }

  if (available <= 20) {
    return `Solo quedan ${available} boletos`;
  }

  return `Solo ${available} boletos disponibles.`;
}

export function buildGoogleCalendarUrl() {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "RIFA APPLE WATCH SE 3 - SOFI'S 3D ART",
    dates: "20261016T010000Z/20261016T020000Z",
    ctz: prizeRaffle.timezone,
    details:
      "Rifa en vivo del Apple Watch SE 3 de SOFI'S 3D ART.\n\nLa transmision sera realizada en Instagram:\n@luzelamx\nhttps://instagram.com/luzelamx",
    location: "Instagram Live - @luzelamx",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsHref() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SOFIS 3D ART//PRIZE V1//ES",
    "BEGIN:VEVENT",
    "UID:sofis-3d-art-prize-apple-watch-se-3-20261015@sofis3d.art",
    "DTSTAMP:20260901T000000Z",
    "DTSTART:20261016T010000Z",
    "DTEND:20261016T020000Z",
    "SUMMARY:RIFA APPLE WATCH SE 3 - SOFI'S 3D ART",
    "DESCRIPTION:Rifa en vivo del Apple Watch SE 3 de SOFI'S 3D ART.\\n\\nLa transmision sera realizada en Instagram:\\n@luzelamx\\nhttps://instagram.com/luzelamx",
    "LOCATION:Instagram Live - @luzelamx",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
