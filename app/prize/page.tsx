import type { Metadata } from "next";
import { PrizeLanding } from "@/components/prize/PrizeLanding";
import { prizeRaffle } from "@/lib/prize";

const prizeShareTitle = "¡Tenemos ganador! Apple Watch SE 3 | SOFI'S 3D ART";
const prizeShareDescription =
  "Felicitamos a Benjamín Iglesias Meyer, ganador del Apple Watch SE 3 con el boleto #13. Gracias por apoyar el emprendimiento de Sofía.";
const prizeShareImageUrl = `${prizeRaffle.canonicalUrl}/prize/sofia-avatar.png`;
const prizeShareImageAlt =
  "Avatar original de Sofía — SOFI'S 3D ART";

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
        width: 384,
        height: 314,
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
