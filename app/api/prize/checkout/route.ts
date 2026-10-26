export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      code: "RAFFLE_CLOSED",
      error: "La rifa ha finalizado. Ya no se pueden comprar boletos.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
