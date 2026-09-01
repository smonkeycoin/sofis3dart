import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://sofis3dart.example",
  ),
  title: {
    default: "SOFI'S 3D ART",
    template: "%s | SOFI'S 3D ART",
  },
  description:
    "Productos 3D únicos, divertidos y hechos especialmente para vos en México.",
  openGraph: {
    title: "SOFI'S 3D ART",
    description:
      "Ecommerce de productos 3D coloridos, útiles y coleccionables.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ec3b86",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
