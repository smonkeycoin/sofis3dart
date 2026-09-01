import type { Metadata } from "next";
import { PrizeLanding } from "@/components/prize/PrizeLanding";
import { prizeRaffle } from "@/lib/prize";

export const metadata: Metadata = {
  title: "Rifa Apple Watch SE 3",
  description:
    "Elige tu boleto para la rifa del Apple Watch SE 3 de SOFI'S 3D ART.",
  alternates: {
    canonical: prizeRaffle.canonicalUrl,
  },
  openGraph: {
    title: "Rifa Apple Watch SE 3 | SOFI'S 3D ART",
    description: "Solo 50 boletos disponibles a $347 MXN por boleto.",
    url: prizeRaffle.canonicalUrl,
    type: "website",
  },
};

export default function PrizePage() {
  return <PrizeLanding />;
}
