import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Camera, ExternalLink, Heart, Sparkles, Star, Ticket, Trophy } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { PrizeDrawEvidence } from "@/components/prize/PrizeDrawEvidence";
import { PrizeFooterVideo } from "@/components/prize/PrizeFooterVideo";
import { prizeRaffle } from "@/lib/prize";
import { RaffleTickets } from "./RaffleStatus";
import styles from "./PrizeCelebration.module.css";

const confettiColors = ["bg-brand-pink", "bg-brand-purple", "bg-brand-yellow", "bg-brand-green", "bg-brand-blue"];

function CelebrationConfetti() {
  return (
    <div aria-hidden="true" className={styles.confetti}>
      {Array.from({ length: 24 }, (_, index) => (
        <span className={`${styles.confettiPiece} ${confettiColors[index % confettiColors.length]}`} key={index}
          style={{ left: `${(index * 29 + 7) % 100}%`, "--delay": `${(index % 9) * 75}ms`, "--drift": `${((index * 43) % 180) - 90}px`, "--turn": `${index % 2 === 0 ? 380 : -420}deg` } as CSSProperties} />
      ))}
    </div>
  );
}

export function PrizeLanding() {
  return (
    <main className="min-h-screen bg-white text-ink">
      <section className="mx-auto grid w-full max-w-[1480px] gap-6 px-4 pb-10 pt-5 sm:px-7 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:px-10">
        <aside className="contents lg:sticky lg:top-5 lg:grid lg:gap-5 lg:self-start">
          <div className="order-1">
            <Link className="block w-fit" href="/" aria-label="Ir a SOFI'S 3D ART"><Wordmark /></Link>
            <p className="mt-1 text-lg font-semibold text-muted">Imagina. Imprime. Disfruta.</p>
          </div>
          <div className="order-3 grid gap-5">
            <div className="relative mx-auto h-[240px] w-full max-w-[260px] lg:h-[380px]">
              <Image alt="Apple Watch SE 3, premio de la rifa" className="object-contain" fill sizes="260px" src="/prize/apple-watch-se-3-transparent.png" />
            </div>
            <div className="grid gap-0 overflow-hidden rounded-[8px] border border-soft-gray bg-white shadow-subtle">
              <div className="grid grid-cols-[42px_1fr] gap-3 border-b border-soft-gray px-5 py-4">
                <Trophy aria-hidden className="h-7 w-7 text-brand-pink" />
                <div><p className="text-xs font-bold text-ink/65">Premio de esta rifa</p><p className="text-xl font-black text-brand-pink">Apple Watch SE 3</p></div>
              </div>
              <div className="grid grid-cols-[42px_1fr] gap-3 border-b border-soft-gray px-5 py-4">
                <Ticket aria-hidden className="h-7 w-7 text-brand-purple" />
                <div><p className="text-xs font-bold text-ink/65">Total de boletos</p><p className="text-2xl font-black text-brand-purple">{prizeRaffle.totalTickets}</p></div>
              </div>
              <a className="grid grid-cols-[42px_1fr] gap-3 px-5 py-4 transition hover:bg-pink-soft focus-visible:outline-2 focus-visible:outline-brand-pink" href={prizeRaffle.instagramUrl} rel="noreferrer" target="_blank">
                <Camera aria-hidden className="h-7 w-7 text-brand-pink" />
                <div><p className="text-xs font-bold text-ink/65">Sigue nuestra aventura</p><p className="inline-flex items-center gap-2 text-xl font-black text-brand-pink">{prizeRaffle.instagramHandle}<ExternalLink aria-hidden className="h-4 w-4" /></p></div>
              </a>
            </div>
            <p className="hidden items-start gap-3 text-[0.95rem] font-bold leading-relaxed text-ink/78 lg:flex"><Heart aria-hidden className="mt-1 h-5 w-5 shrink-0 text-brand-pink" /><span>Hecho con amor para ayudar a mi emprendimiento de llaveritos 3D.</span></p>
          </div>
        </aside>

        <div className="contents lg:block lg:min-w-0">
          <header className={`relative order-2 overflow-hidden rounded-[8px] border border-pink-soft bg-pink-soft px-4 py-7 text-center sm:px-8 sm:py-9 ${styles.hero}`} id="ganador">
            <CelebrationConfetti />
            <div className={`relative z-10 ${styles.reveal}`}>
              <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black tracking-[0.08em] text-brand-purple shadow-subtle"><Trophy aria-hidden className="h-4 w-4 text-brand-yellow" /> SORTEO CONCLUIDO · 1 NOV 2026</p>
              <h1 className="mt-5 text-[clamp(2rem,8.4vw,3.8rem)] font-black leading-none text-brand-pink">🏆 ¡TENEMOS GANADOR!</h1>
              <p className="mx-auto mt-5 max-w-[18ch] text-[clamp(1.55rem,6vw,3.1rem)] font-black leading-[1.08] text-ink">BENJAMÍN IGLESIAS MEYER</p>
              <p className="mt-7 text-xs font-black tracking-[0.22em] text-brand-purple sm:text-sm">BOLETO GANADOR</p>
              <div className={`relative mx-auto w-fit ${styles.numberReveal}`}>
                <span aria-hidden className={`absolute -left-8 top-[30%] text-brand-yellow sm:-left-14 ${styles.sparkle}`}><Sparkles className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={1.7} /></span>
                <span aria-label="Boleto ganador número 13" className="block text-[clamp(7rem,34vw,13rem)] font-black leading-[1.03] tracking-[-0.07em] text-brand-purple">#13</span>
                <span aria-hidden className={`absolute -right-7 bottom-[22%] text-brand-pink sm:-right-12 ${styles.sparkleDelayed}`}><Star className="h-6 w-6 fill-brand-yellow text-brand-yellow sm:h-8 sm:w-8" /></span>
              </div>
              <p className="mt-1 text-lg font-black tracking-[0.12em] text-brand-purple sm:text-2xl">⌚ APPLE WATCH SE 3</p>
              <p className="mt-4 text-2xl font-black text-brand-pink sm:text-3xl">¡MUCHAS FELICIDADES!</p>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-ink/75 sm:text-base">Gracias a todos los participantes por apoyar el emprendimiento de Sofía.</p>
              <a className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-pink px-5 py-3 text-sm font-black text-white shadow-pink transition hover:bg-[#d92d79] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink" href="#resultado">VER RESULTADO DEL SORTEO</a>
            </div>
          </header>

          <div className="order-4 min-w-0">
            <section className="mt-0 grid items-center gap-5 rounded-[8px] border border-purple-soft bg-purple-soft px-5 py-6 text-center sm:grid-cols-[132px_1fr] sm:px-6 sm:text-left lg:mt-6" aria-labelledby="thanks-heading">
              <Image alt="Avatar original de Sofía con su llavero 3D" className="mx-auto h-32 w-32 rounded-full border-4 border-white object-cover object-center shadow-subtle" height={160} width={160} sizes="128px" src="/prize/sofia-avatar-transparent.png" />
              <div><h2 className="text-2xl font-black text-brand-purple sm:text-[1.7rem]" id="thanks-heading">¡Gracias por hacerlo posible! <Heart aria-hidden className="inline h-6 w-6 fill-brand-pink text-brand-pink" /></h2><p className="mt-3 font-semibold leading-relaxed text-ink/80">El sorteo se realizó el 1 de noviembre de 2026 a las 7:00 PM, hora de Cancún, por Google Meet. El boleto #13 resultó ganador del Apple Watch SE 3.</p><p className="mt-2 font-semibold leading-relaxed text-ink/80">Gracias por acompañar a Sofía y apoyar su emprendimiento.</p></div>
            </section>
            <PrizeDrawEvidence />
            <RaffleTickets />
            <section className="mt-7 rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle" aria-labelledby="transparency-heading">
              <h2 className="text-2xl font-black text-brand-purple" id="transparency-heading">UN SORTEO TRANSPARENTE 💜</h2>
              <p className="mt-4 font-semibold leading-relaxed text-ink/75">El sorteo concluyó el 1 de noviembre de 2026. Benjamín Iglesias Meyer ganó con el boleto #13. Conservamos la información histórica de los boletos y la aclaración del primer resultado.</p>
              <div className="mt-4 flex flex-wrap gap-5 font-bold text-brand-purple"><a className="underline" href="#bases">Consultar las bases</a><a className="underline" href="#aclaracion">Aclaración del primer sorteo</a></div>
              <details className="mt-5 scroll-mt-5 border-t border-soft-gray pt-4" id="aclaracion"><summary className="cursor-pointer font-black">Qué pasó con el número 34</summary><p className="mt-3 font-semibold leading-relaxed text-ink/75">El 25 de octubre de 2026 salió seleccionado el número 34. Al revisar los registros, confirmamos que ese boleto no tenía comprador ni pago registrado. Por eso el premio no pudo adjudicarse. Conservamos el registro de ese primer resultado; no hubo un participante descalificado.</p></details>
              <details className="mt-4 scroll-mt-5 border-t border-soft-gray pt-4" id="bases"><summary className="cursor-pointer font-black">Bases y procedimiento</summary><p className="mt-3 font-semibold leading-relaxed text-ink/75">La rifa tuvo 50 números, del 01 al 50, y un premio Apple Watch SE 3. La selección se realizó mediante una herramienta digital aleatoria durante la transmisión en vivo.</p><p className="mt-3 font-semibold leading-relaxed text-ink/75">El primer número correspondiente a un boleto válido y pagado fue el #13. Las ventas permanecen cerradas.</p></details>
            </section>
            <section className="mt-7 overflow-hidden rounded-[8px] bg-brand-purple text-white shadow-purple">
              <div className="grid items-center gap-6 px-6 py-7 md:grid-cols-[1fr_280px]">
                <div><p className="text-lg font-bold">Cada boleto fue un paso más para hacer mi sueño realidad.</p><p className="mt-3 text-2xl font-black">¡Gracias por ser parte de esto! ♡</p><p className="mt-4 font-semibold">Sorteo concluido · 1 de noviembre de 2026 · Google Meet</p></div>
                <div className="grid grid-cols-3 items-end gap-2">
                  <Image alt="Pulpo articulado 3D rosa" className="w-full object-contain" height={180} src="/products/pulpo-articulado-flexi.png" width={180} />
                  <Image alt="Maceta impresa en 3D azul" className="w-full object-contain" height={180} src="/products/maceta-espiral.png" width={180} />
                  <Image alt="Dinosaurio 3D verde" className="w-full object-contain" height={180} src="/products/dinosaurio-flexi.png" width={180} />
                </div>
              </div>
            </section>
            <section className="mt-7 rounded-[8px] border border-soft-gray bg-white p-6 shadow-subtle">
              <h2 className="text-2xl font-black tracking-normal">Conoce el sueño detrás de esta rifa</h2>
              <div className={styles.videoContainer}><PrizeFooterVideo /></div>
              <a className="mt-5 inline-flex h-12 items-center gap-2 rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink transition hover:bg-[#d92d79] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink" href="#resultado">Ver resultado del sorteo <Heart aria-hidden className="h-4 w-4" /></a>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
