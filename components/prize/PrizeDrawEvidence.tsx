"use client";

import Image from "next/image";
import { useRef } from "react";
import { X } from "lucide-react";

// Add the organizer's unedited screenshot to public/prize and set this path when available.
const evidenceImage: string | null = null;

export function PrizeDrawEvidence() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <section aria-labelledby="resultado-heading" className="mt-6 scroll-mt-5 rounded-[8px] border border-soft-gray bg-white p-5 shadow-subtle sm:p-6" id="resultado">
      <h2 className="text-2xl font-black text-brand-purple" id="resultado-heading">Resultado del sorteo</h2>
      <p className="mt-3 font-semibold leading-relaxed text-ink/75">Benjamín Iglesias Meyer ganó el Apple Watch SE 3 con el boleto #13 en el sorteo del 1 de noviembre de 2026.</p>
      {evidenceImage ? (
        <>
          <button aria-label="Ampliar captura del resultado del sorteo" className="mt-5 block w-full overflow-hidden rounded-[8px] border border-soft-gray text-left shadow-subtle focus-visible:outline-2 focus-visible:outline-brand-pink" onClick={() => dialogRef.current?.showModal()} type="button">
            <Image alt="Captura original del resultado del sorteo" className="h-auto w-full object-contain" height={720} src={evidenceImage} unoptimized width={1280} />
            <span className="block px-4 py-3 text-sm font-black text-brand-pink">Ampliar captura</span>
          </button>
          <dialog aria-label="Captura ampliada del resultado del sorteo" className="m-auto max-h-[95vh] max-w-[95vw] rounded-[8px] border-0 bg-white p-3 shadow-soft backdrop:bg-ink/80" ref={dialogRef}>
            <button aria-label="Cerrar captura" className="ml-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-pink text-white" onClick={() => dialogRef.current?.close()} type="button"><X aria-hidden className="h-5 w-5" /></button>
            <Image alt="Captura original ampliada del resultado del sorteo" className="max-h-[80vh] w-auto max-w-full object-contain" height={720} src={evidenceImage} unoptimized width={1280} />
          </dialog>
        </>
      ) : (
        <p className="mt-4 rounded-[8px] bg-purple-soft px-4 py-3 text-sm font-semibold text-brand-purple">La captura original del resultado se incorporará en cuanto esté disponible.</p>
      )}
    </section>
  );
}
