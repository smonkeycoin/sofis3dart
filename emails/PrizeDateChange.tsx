import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand } from "@/lib/brand";
import { prizeRaffle } from "@/lib/prize";

export const prizeDateChangeCampaign = "raffle_date_change_2026_10_25";
export const prizeDateChangeSubject = "Nueva fecha para la rifa de SOFI’S 3D ART: 25 de octubre";
export const prizeDateChangePreheader = "Tu boleto sigue confirmado. El sorteo será el 25 de octubre.";

const paragraphs = [
  "Hola,",
  "Gracias por apoyar a SOFI’S 3D ART y ser parte de este proyecto.",
  "Queremos avisarte que la rifa del Apple Watch SE 3 se realizará el 25 de octubre de 2026, en lugar del 15 de octubre.",
  "Extendemos la venta diez días para sumar más participantes y apoyo al crecimiento de SOFI’S 3D ART. Sabemos que contabas con la fecha original y agradecemos tu comprensión.",
  "Tu boleto y tu número siguen confirmados. Conservamos el precio de $347 MXN por boleto y el límite de 50 boletos en total.",
  "El sorteo se transmitirá en vivo por @luzelamx.",
  "Si quieres adquirir otro número, puedes hacerlo aquí:",
];
const closing = [
  "Compartir esta invitación con alguien también es una gran forma de apoyarnos.",
  "Gracias por ayudarnos a seguir creando.",
  "SOFI’S 3D ART",
];

export function buildPrizeDateChangeText() {
  return [...paragraphs, prizeRaffle.canonicalUrl, ...closing].join("\n\n");
}

export function PrizeDateChange() {
  return (
    <Html lang="es-MX">
      <Head />
      <Preview>{prizeDateChangePreheader}</Preview>
      <Body style={{ margin: 0, backgroundColor: "#fff5fa", fontFamily: '"Avenir Next", Arial, sans-serif', color: "#252733" }}>
        <Container style={{ width: "100%", maxWidth: "620px", margin: "0 auto", padding: "24px 16px", boxSizing: "border-box" }}>
          <Section style={{ padding: "16px 0 24px", textAlign: "center" }}>
            <Text style={{ margin: 0, color: brand.colors.pink, fontSize: "36px", fontWeight: 900 }}>SOFI’S</Text>
            <Text style={{ margin: 0, color: brand.colors.purple, fontSize: "24px", fontWeight: 900 }}>3D ART</Text>
            <Text style={{ margin: "8px 0 0", color: "#666877", fontSize: "14px" }}>{brand.tagline}</Text>
          </Section>
          <Section style={{ borderRadius: "8px", backgroundColor: brand.colors.purple, padding: "24px 20px", textAlign: "center" }}>
            <Heading as="h1" style={{ margin: 0, color: "#ffffff", fontSize: "26px", lineHeight: "34px" }}>Nueva fecha para la rifa</Heading>
            <Text style={{ margin: "12px 0 0", color: "#ffffff", fontSize: "22px", fontWeight: 700 }}>25 de octubre de 2026</Text>
            <Text style={{ margin: "8px 0 0", color: "#ffffff", fontSize: "16px" }}>Rifa Apple Watch SE 3</Text>
          </Section>
          <Section style={{ marginTop: "16px", borderRadius: "8px", backgroundColor: "#ffffff", padding: "20px" }}>
            {paragraphs.map((paragraph) => <Text key={paragraph} style={paragraphStyle}>{paragraph}</Text>)}
            <Button href={prizeRaffle.canonicalUrl} style={{ display: "block", borderRadius: "8px", padding: "16px 12px", backgroundColor: brand.colors.pink, color: "#ffffff", fontSize: "17px", fontWeight: 700, textAlign: "center", textDecoration: "none" }}>Elige otro número</Button>
            <Text style={{ ...paragraphStyle, fontSize: "14px", overflowWrap: "anywhere" }}><a href={prizeRaffle.canonicalUrl} style={{ color: brand.colors.purple }}>{prizeRaffle.canonicalUrl}</a></Text>
            {closing.map((paragraph) => <Text key={paragraph} style={paragraphStyle}>{paragraph}</Text>)}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const paragraphStyle = { margin: "0 0 18px", color: "#4b4d59", fontSize: "16px", lineHeight: "25px" };
