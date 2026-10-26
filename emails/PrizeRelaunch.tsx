import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Text } from "@react-email/components";
import { brand } from "@/lib/brand";
import { prizeRaffle } from "@/lib/prize";

export const relaunchCampaignId = "raffle_relaunch_2026_11_01_v1";
export const relaunchSubject = "🎁 ¡El Apple Watch todavía busca ganador! Nueva fecha de la rifa";
export const relaunchPreheader = "Tus boletos siguen participando. Conoce la nueva fecha del sorteo de Sofi.";
const before = [
  "¡Hola! 💜",
  "Queremos compartirte una actualización importante sobre la rifa del Apple Watch SE 3 de Sofi.",
  "En el sorteo realizado el 25 de octubre salió seleccionado el número 34. Sin embargo, al revisar los registros, identificamos que ese boleto no había sido vendido y, por lo tanto, no tenía un ganador a quien entregar el premio.",
  "Por eso, realizaremos un nuevo sorteo:",
];
const after = [
  "No necesitas realizar ningún pago adicional ni registrarte nuevamente.",
  "Tus números siguen siendo exactamente los mismos.",
  "Queremos que todo sea claro y transparente para quienes han apoyado el emprendimiento de Sofi.",
  "Podrás seguir el sorteo a través de la cuenta oficial de Luzela (@luzelamx).",
  "Muchas gracias por tu confianza y por formar parte de este proyecto.",
  "Con cariño,",
  "Sofi y familia 💜",
];
const paragraph = { margin: "0 0 18px", color: "#4b4d59", fontSize: "16px", lineHeight: "25px" };

export function buildRelaunchText(ticketNumbers: string[]) {
  return [...before, "🎉 DOMINGO 1 DE NOVIEMBRE DE 2026", "🕖 7:00 P. M. (HORA DE CANCÚN)", "💜 ¡TU BOLETO SIGUE PARTICIPANDO!", `Tus boletos: ${ticketNumbers.map(n => `#${n}`).join(" · ")}`, ...after, "VER MIS BOLETOS", prizeRaffle.canonicalUrl, "SOFI’S 3D ART"].join("\n\n");
}

export function PrizeRelaunch({ ticketNumbers }: { ticketNumbers: string[] }) {
  return <Html lang="es-MX"><Head /><Preview>{relaunchPreheader}</Preview>
    <Body style={{ margin: 0, backgroundColor: "#fff5fa", fontFamily: '"Avenir Next", Arial, sans-serif', color: "#252733" }}>
      <Container style={{ width: "100%", maxWidth: "600px", margin: "0 auto", padding: "24px 16px", boxSizing: "border-box" }}>
        <Section style={{ textAlign: "center", padding: "0 0 20px" }}>
          <Img alt="SOFI’S 3D ART" src={`${prizeRaffle.canonicalUrl}/brand/sofis-3d-art-logo.png`} width="180" style={{ width: "180px", maxWidth: "100%", height: "auto", margin: "0 auto" }} />
        </Section>
        <Section style={{ borderRadius: "8px", backgroundColor: "#f7e7f2", padding: "24px 16px", textAlign: "center" }}>
          <Img alt="Avatar original de Sofi" src={`${prizeRaffle.canonicalUrl}/prize/sofia-avatar-transparent.png`} width="150" style={{ width: "150px", height: "auto", margin: "0 auto 16px" }} />
          <Heading as="h1" style={{ margin: 0, color: brand.colors.pink, fontSize: "28px", lineHeight: "34px" }}>¡El Apple Watch todavía busca ganador!</Heading>
          <Img alt="Apple Watch SE 3" src={`${prizeRaffle.canonicalUrl}/prize/apple-watch-se-3-transparent.png`} width="160" style={{ width: "160px", height: "auto", margin: "16px auto 0" }} />
        </Section>
        <Section style={{ backgroundColor: "#ffffff", padding: "24px 18px", borderRadius: "8px", marginTop: "16px" }}>
          {before.map(p => <Text key={p} style={paragraph}>{p}</Text>)}
          <Section style={{ padding: "22px 12px", backgroundColor: brand.colors.purple, borderRadius: "8px", textAlign: "center" }}>
            <Text style={{ margin: 0, fontSize: "21px", lineHeight: "29px", color: "white", fontWeight: 900 }}>🎉 DOMINGO 1 DE NOVIEMBRE</Text>
            <Text style={{ margin: "10px 0 0", color: "white", fontSize: "16px" }}>🕖 7:00 P. M. (HORA DE CANCÚN)</Text>
          </Section>
          <Text style={{ ...paragraph, margin: "22px 0 12px", fontWeight: 900, color: brand.colors.purple }}>💜 ¡TU BOLETO SIGUE PARTICIPANDO!</Text>
          <Text style={{ ...paragraph, padding: "16px", backgroundColor: "#f0eafa", borderRadius: "8px", fontWeight: 900, fontSize: "20px", color: brand.colors.purple, textAlign: "center", overflowWrap: "anywhere" }}>Tus boletos: {ticketNumbers.map(n => `#${n}`).join(" · ")}</Text>
          {after.map(p => <Text key={p} style={paragraph}>{p}</Text>)}
          <Button href={prizeRaffle.canonicalUrl} style={{ display: "block", padding: "17px 12px", borderRadius: "8px", backgroundColor: brand.colors.pink, color: "white", fontSize: "16px", fontWeight: 900, textAlign: "center", textDecoration: "none" }}>VER MIS BOLETOS</Button>
        </Section>
        <Text style={{ textAlign: "center", color: brand.colors.purple, fontWeight: 900, fontSize: "16px", margin: "24px 0 8px" }}>SOFI’S 3D ART</Text>
        <Text style={{ textAlign: "center", color: "#666877", fontSize: "12px", lineHeight: "19px" }}>Este aviso corresponde a tus boletos de la rifa. Conserva tu confirmación de compra.</Text>
      </Container>
    </Body>
  </Html>;
}
