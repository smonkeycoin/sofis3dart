import type { Metadata } from "next";
import { PrizeLanding } from "@/components/prize/PrizeLanding";
import { prizeRaffle } from "@/lib/prize";

const prizeShareTitle = "Rifa Apple Watch SE 3 | SOFI'S 3D ART";
const prizeShareDescription =
  "Elige tu número. Solo 50 boletos a $347 MXN. Sorteo en vivo el 15 de octubre de 2026 a las 8:00 PM por @luzelamx.";
const prizeShareImageUrl = `${prizeRaffle.canonicalUrl}/prize/og-prize-apple-watch-se3.jpg`;
const prizeShareImageAlt =
  "Rifa Apple Watch SE 3 de SOFI'S 3D ART — 50 boletos a $347 MXN";

export const metadata: Metadata = {
  metadataBase: new URL(prizeRaffle.canonicalUrl),
  title: {
    absolute: prizeShareTitle,
  },
  description: prizeShareDescription,
  alternates: {
    canonical: prizeRaffle.canonicalUrl,
  },
  openGraph: {
    title: prizeShareTitle,
    description: prizeShareDescription,
    url: prizeRaffle.canonicalUrl,
    siteName: "SOFI'S 3D ART",
    type: "website",
    images: [
      {
        url: prizeShareImageUrl,
        width: 1200,
        height: 630,
        alt: prizeShareImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: prizeShareTitle,
    description: prizeShareDescription,
    images: [
      {
        url: prizeShareImageUrl,
        alt: prizeShareImageAlt,
      },
    ],
  },
};

export default function PrizePage() {
  return <PrizeLanding />;
}
