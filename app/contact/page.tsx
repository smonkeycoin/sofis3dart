import { Mail, MessageCircle } from "lucide-react";
import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";

export default function ContactPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="Pedidos especiales, colores, medidas y regalos personalizados pueden coordinarse antes de imprimir."
        title="Contacto"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <a
          className="flex items-center gap-4 rounded-[8px] border border-soft-gray bg-white p-6 font-black text-ink shadow-subtle hover:text-brand-pink"
          href="mailto:hola@sofis3dart.example"
        >
          <Mail aria-hidden className="h-6 w-6 text-brand-pink" />
          hola@sofis3dart.example
        </a>
        <a
          className="flex items-center gap-4 rounded-[8px] border border-soft-gray bg-white p-6 font-black text-ink shadow-subtle hover:text-brand-purple"
          href="https://wa.me/520000000000"
        >
          <MessageCircle aria-hidden className="h-6 w-6 text-brand-purple" />
          WhatsApp de pedidos
        </a>
      </div>
    </StoreShell>
  );
}
