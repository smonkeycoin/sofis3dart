export type PublicTicket = { ticket_number: number; status: "AVAILABLE" | "HELD" | "PAID" | "BLOCKED" };

// Project only these two fields. Never serialize buyer data from the source table.
export function publicTicketStates(value: unknown): PublicTicket[] | null {
  if (!Array.isArray(value) || value.length !== 50) return null;
  const numbers = new Set<number>();
  const tickets: PublicTicket[] = [];
  for (const row of value) {
    if (!row || !Number.isInteger(row.ticket_number) || row.ticket_number < 1 || row.ticket_number > 50 ||
        numbers.has(row.ticket_number) || !["AVAILABLE", "HELD", "PAID", "BLOCKED"].includes(row.status)) return null;
    numbers.add(row.ticket_number);
    tickets.push({ ticket_number: row.ticket_number, status: row.status });
  }
  return tickets.sort((a, b) => a.ticket_number - b.ticket_number);
}
