import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { brand } from "@/lib/brand";
import { formatTicketNumber } from "@/lib/prize";

export type PrizeTicketConfirmationProps = {
  ticketNumber: number;
  buyerName?: string | null;
  amountMXN: number;
  drawDate: string;
  drawTime: string;
  instagramUrl: string;
  calendarUrl: string;
};

export const prizeTicketConfirmationSubject = (ticketNumber: number) =>
  `💜 ¡Tu boleto #${formatTicketNumber(ticketNumber)} es oficial! — SOFI'S 3D ART`;

export const prizeTicketConfirmationPreheader =
  "Gracias por apoyar este sueño. Mucha suerte en la rifa del Apple Watch SE 3 🍀";

export function buildPrizeTicketConfirmationText({
  amountMXN,
  buyerName,
  calendarUrl,
  drawDate,
  drawTime,
  instagramUrl,
  ticketNumber,
}: PrizeTicketConfirmationProps) {
  const ticketLabel = formatTicketNumber(ticketNumber);
  const thanksLine = buyerName
    ? `¡Gracias, ${buyerName}! 💜`
    : "¡Gracias por participar! 💜";

  return [
    "SOFI'S 3D ART",
    brand.tagline,
    "",
    "¡Tu boleto ya es oficial! 💜",
    thanksLine,
    "",
    "Tu pago fue confirmado y tu boleto para la rifa del Apple Watch SE 3 ya es oficial.",
    "",
    `TU NÚMERO: #${ticketLabel}`,
    "",
    `Precio pagado: $${amountMXN} MXN`,
    `Sorteo: ${drawDate}, ${drawTime}`,
    "Transmisión en vivo: @luzelamx",
    "",
    "Agregar a mi calendario:",
    calendarUrl,
    "",
    "Ver @luzelamx:",
    instagramUrl,
    "",
    "Guarda este correo como comprobante de tu participación.",
    "",
    "De verdad, gracias por apoyar a SOFI'S 3D ART y ayudarme a seguir creando cosas divertidas con impresión 3D.",
    "",
    "🍀 ¡Te deseo muchísima suerte!",
    "",
    "Con cariño,",
    "Sofía",
    "",
    "SOFI'S 3D ART",
    brand.tagline,
  ].join("\n");
}

export function PrizeTicketConfirmation({
  amountMXN,
  buyerName,
  calendarUrl,
  drawDate,
  drawTime,
  instagramUrl,
  ticketNumber,
}: PrizeTicketConfirmationProps) {
  const ticketLabel = formatTicketNumber(ticketNumber);
  const thanksLine = buyerName
    ? `¡Gracias, ${buyerName}! 💜`
    : "¡Gracias por participar! 💜";

  return (
    <Html lang="es-MX">
      <Head />
      <Preview>{prizeTicketConfirmationPreheader}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={logoTop}>SOFI&apos;S</Text>
            <Text style={logoBottom}>3D ART</Text>
            <Text style={tagline}>{brand.tagline}</Text>
          </Section>

          <Section style={successSection}>
            <Heading as="h1" style={heading}>
              ¡Tu boleto ya es oficial! 💜
            </Heading>
            <Text style={lead}>{thanksLine}</Text>
            <Text style={paragraph}>
              Tu pago fue confirmado y tu boleto para la rifa del Apple Watch SE
              3 ya es oficial.
            </Text>
          </Section>

          <Section style={ticketCard}>
            <Text style={ticketLabelStyle}>TU NÚMERO</Text>
            <Text style={ticketNumberStyle}>#{ticketLabel}</Text>
          </Section>

          <Section style={detailsSection}>
            <Detail label="Precio pagado:" value={`$${amountMXN} MXN`} />
            <Detail label="Sorteo:" value={`${drawDate}\n${drawTime}`} />
            <Detail label="Transmisión en vivo:" value="@luzelamx" />
          </Section>

          <Section style={buttonSection}>
            <Button href={calendarUrl} style={primaryButton}>
              AGREGAR A MI CALENDARIO
            </Button>
            <Button href={instagramUrl} style={secondaryButton}>
              VER @LUZELAMX
            </Button>
          </Section>

          <Section style={messageSection}>
            <Text style={paragraph}>
              Guarda este correo como comprobante de tu participación.
            </Text>
            <Text style={paragraph}>
              De verdad, gracias por apoyar a SOFI&apos;S 3D ART y ayudarme a
              seguir creando cosas divertidas con impresión 3D.
            </Text>
            <Text style={closing}>🍀 ¡Te deseo muchísima suerte!</Text>
            <Text style={signature}>
              Con cariño,
              <br />
              <br />
              Sofía
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerBrand}>SOFI&apos;S 3D ART</Text>
            <Text style={footerText}>{brand.tagline}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Section style={detailRow}>
      <Text style={detailLabel}>{label}</Text>
      <Text style={detailValue}>{value}</Text>
    </Section>
  );
}

const body = {
  margin: 0,
  backgroundColor: "#ffffff",
  color: "#252733",
  fontFamily:
    'ui-rounded, "Avenir Next", "Nunito Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container = {
  width: "100%",
  maxWidth: "620px",
  margin: "0 auto",
  padding: "32px 18px 42px",
};

const brandSection = {
  padding: "8px 0 26px",
  textAlign: "center" as const,
};

const logoTop = {
  margin: 0,
  color: brand.colors.pink,
  fontSize: "42px",
  fontWeight: 900,
  lineHeight: "38px",
  letterSpacing: "0",
};

const logoBottom = {
  margin: 0,
  color: brand.colors.purple,
  fontSize: "28px",
  fontWeight: 900,
  lineHeight: "28px",
  letterSpacing: "0",
};

const tagline = {
  margin: "10px 0 0",
  color: "#858895",
  fontSize: "16px",
  fontWeight: 700,
};

const successSection = {
  borderRadius: "8px",
  backgroundColor: "#fff0f7",
  padding: "30px 26px",
  textAlign: "center" as const,
};

const heading = {
  margin: 0,
  color: "#252733",
  fontSize: "32px",
  fontWeight: 900,
  lineHeight: "38px",
  letterSpacing: "0",
};

const lead = {
  margin: "18px 0 0",
  color: brand.colors.pink,
  fontSize: "20px",
  fontWeight: 900,
  lineHeight: "28px",
};

const paragraph = {
  margin: "14px 0 0",
  color: "#4b4d59",
  fontSize: "16px",
  fontWeight: 600,
  lineHeight: "25px",
};

const ticketCard = {
  margin: "26px 0",
  borderRadius: "8px",
  backgroundColor: brand.colors.purple,
  padding: "30px 20px 34px",
  textAlign: "center" as const,
};

const ticketLabelStyle = {
  margin: 0,
  color: "#f3efff",
  fontSize: "13px",
  fontWeight: 900,
  letterSpacing: "0",
};

const ticketNumberStyle = {
  margin: "8px 0 0",
  color: "#ffffff",
  fontSize: "76px",
  fontWeight: 900,
  lineHeight: "80px",
  letterSpacing: "0",
};

const detailsSection = {
  border: "1px solid #e8e8ee",
  borderRadius: "8px",
  overflow: "hidden",
};

const detailRow = {
  padding: "18px 22px",
  borderBottom: "1px solid #e8e8ee",
};

const detailLabel = {
  margin: 0,
  color: "#858895",
  fontSize: "13px",
  fontWeight: 900,
  lineHeight: "18px",
};

const detailValue = {
  margin: "4px 0 0",
  color: "#252733",
  fontSize: "19px",
  fontWeight: 900,
  lineHeight: "26px",
  whiteSpace: "pre-line" as const,
};

const buttonSection = {
  padding: "28px 0 8px",
  textAlign: "center" as const,
};

const primaryButton = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  borderRadius: "8px",
  backgroundColor: brand.colors.purple,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 900,
  lineHeight: "18px",
  padding: "15px 18px",
  textAlign: "center" as const,
  textDecoration: "none",
};

const secondaryButton = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  marginTop: "12px",
  border: "1px solid #e8e8ee",
  borderRadius: "8px",
  backgroundColor: "#ffffff",
  color: brand.colors.pink,
  fontSize: "14px",
  fontWeight: 900,
  lineHeight: "18px",
  padding: "14px 18px",
  textAlign: "center" as const,
  textDecoration: "none",
};

const messageSection = {
  padding: "8px 0 0",
};

const closing = {
  margin: "22px 0 0",
  color: "#252733",
  fontSize: "18px",
  fontWeight: 900,
  lineHeight: "27px",
};

const signature = {
  margin: "18px 0 0",
  color: "#252733",
  fontSize: "17px",
  fontWeight: 700,
  lineHeight: "25px",
};

const divider = {
  margin: "30px 0 22px",
  borderColor: "#e8e8ee",
};

const footer = {
  textAlign: "center" as const,
};

const footerBrand = {
  margin: 0,
  color: brand.colors.pink,
  fontSize: "16px",
  fontWeight: 900,
};

const footerText = {
  margin: "6px 0 0",
  color: "#858895",
  fontSize: "13px",
  fontWeight: 700,
};
