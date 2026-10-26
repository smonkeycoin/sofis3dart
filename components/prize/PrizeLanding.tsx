import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Camera, Check, ExternalLink, Heart, Sparkles, Star, Ticket, Trophy } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { PrizeFooterVideo } from "@/components/prize/PrizeFooterVideo";
import { formatTicketNumber, prizeRaffle } from "@/lib/prize";
import styles from "./PrizeCelebration.module.css";

const winnerNumber = 34;
const ticketNumbers = Array.from({ length: prizeRaffle.totalTickets }, (_, index) => index + 1);
const confettiColors = ["bg-brand-pink", "bg-brand-purple", "bg-brand-yellow", "bg-brand-green", "bg-brand-blue"];

function CelebrationConfetti() {
  return (
    <div aria-hidden="true" className={styles.confetti}>
      {Array.from({ length: 36 }, (_, index) => (
        <span className={`${styles.confettiPiece} ${confettiColors[index % confettiColors.length]}`} key={index}
          style={{ left: `${(index * 29 + 7) % 100}%`, "--delay": `${(index % 9) * 75}ms`, "--drift": `${((index * 43) % 180) - 90}px`, "--turn": `${index % 2 === 0 ? 380 : -420}deg` } as CSSProperties} />
      ))}
    </div>
  );
}

function RaffleTickets() {
  return (
    <section aria-labelledby="tickets-heading" className="mt-6 rounded-[8px] border border-soft-gray bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black sm:text-2xl" id="tickets-heading">Los 50 boletos de esta aventura</h2>
          <p className="mt-1 text-sm font-semibold text-ink/65">Rifa finalizada. Gracias por acompañarnos.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-soft px-3 py-2 text-xs font-black text-ink"><Trophy aria-hidden className="h-4 w-4 text-brand-pink" /> Ganador #34</span>
      </div>
      <ol aria-label="Boletos de la rifa finalizada" className="grid grid-cols-5 gap-2.5 sm:gap-4 lg:grid-cols-10" id="tickets">
        {ticketNumbers.map((number) => {
          const isWinner = number === winnerNumber;
          return (
            <li aria-label={`Boleto ${formatTicketNumber(number)}. ${isWinner ? "Ganador. " : ""}Rifa finalizada.`}
              className={`relative grid aspect-square min-h-[48px] place-items-center rounded-[8px] border border-brand-purple bg-brand-purple text-xl font-black text-white sm:text-2xl ${isWinner ? "ring-[3px] ring-brand-yellow ring-offset-2" : ""}`} key={number}>
              {isWinner ? <Star aria-hidden className="absolute right-1 top-1 h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" /> : null}
              <span aria-hidden="true" className={isWinner ? "text-brand-yellow" : ""}>{formatTicketNumber(number)}</span>
            </li>
          );
        })}
      </ol>
    </section>
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
          <header className={`relative order-2 overflow-hidden rounded-[8px] border border-pink-soft bg-pink-soft px-4 py-7 text-center sm:px-8 sm:py-9 ${styles.hero}`} id="winner">
            <CelebrationConfetti />
            <div className={`relative z-10 ${styles.reveal}`}>
              <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.65rem] font-black tracking-[0.06em] text-brand-purple shadow-subtle sm:text-xs"><Check aria-hidden className="h-3.5 w-3.5" /> RIFA FINALIZADA · 25 OCT 2026</p>
              <h1 className="mt-6 text-[clamp(1.6rem,8.4vw,2.15rem)] font-black leading-none text-brand-pink sm:text-[3.3rem] xl:text-[3.9rem]">¡FELICIDADES!</h1>
              <p className="mt-3 text-base font-black tracking-[0.12em] text-ink sm:text-xl">TENEMOS GANADOR</p>
              <div className={`relative mx-auto mt-1 w-fit ${styles.numberReveal}`}>
                <span aria-hidden className={`absolute -left-8 top-[30%] text-brand-yellow sm:-left-14 ${styles.sparkle}`}><Sparkles className="h-7 w-7 sm:h-10 sm:w-10" strokeWidth={1.7} /></span>
                <span aria-label="Boleto ganador número 34" className="block text-[clamp(6.8rem,36vw,8.8rem)] font-black leading-[1.12] tracking-[-0.07em] text-brand-purple sm:text-[12rem] xl:text-[13.5rem]"><span aria-hidden="true">#34</span></span>
                <span aria-hidden className={`absolute -right-7 bottom-[22%] text-brand-pink sm:-right-12 ${styles.sparkleDelayed}`}><Star className="h-6 w-6 fill-brand-yellow text-brand-yellow sm:h-8 sm:w-8" /></span>
              </div>
              <p aria-label="Nombre de la persona ganadora protegido" className="mt-1 text-2xl font-black tracking-[0.13em] text-ink sm:text-3xl"><span aria-hidden="true">***** *****</span></p>
              <p className="mt-3 text-sm font-bold text-ink/65 sm:text-base">Ganador de un <span className="text-brand-purple">Apple Watch SE 3</span></p>
              <p className="mx-auto mt-6 max-w-xl text-base font-bold leading-relaxed text-ink/80 sm:text-lg">¡Gracias a todos por participar y apoyar el emprendimiento de Sofía!</p>
            </div>
          </header>

          <div className="order-4 min-w-0">
            <section className="mt-0 grid items-center gap-5 rounded-[8px] border border-purple-soft bg-purple-soft px-5 py-6 text-center sm:grid-cols-[132px_1fr] sm:px-6 sm:text-left lg:mt-6" aria-labelledby="thanks-heading">
              <Image alt="Avatar original de Sofía con su llavero 3D" className="mx-auto h-32 w-32 rounded-full border-4 border-white object-cover object-center shadow-subtle" height={160} width={160} sizes="128px" src="/prize/sofia-avatar-transparent.png" />
              <div><h2 className="text-2xl font-black text-brand-purple sm:text-[1.7rem]" id="thanks-heading">¡Gracias por hacerlo posible! <Heart aria-hidden className="inline h-6 w-6 fill-brand-pink text-brand-pink" /></h2><p className="mt-3 font-semibold leading-relaxed text-ink/80">Cada boleto fue una muestra de apoyo al emprendimiento de Sofía.</p><p className="mt-2 font-semibold leading-relaxed text-ink/80">Gracias por ser parte de esta aventura y ayudarnos a seguir creando.</p></div>
            </section>
            <RaffleTickets />
            <section className="mt-7 overflow-hidden rounded-[8px] bg-brand-purple text-white shadow-purple">
              <div className="grid items-center gap-6 px-6 py-7 md:grid-cols-[1fr_280px]">
                <div><p className="text-lg font-bold">Cada boleto es un paso más para hacer mi sueño realidad.</p><p className="mt-3 text-2xl font-black">¡Gracias por ser parte de esto! ♡</p></div>
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
              <a className="mt-5 inline-flex h-12 items-center gap-2 rounded-lg bg-brand-pink px-5 font-black text-white shadow-pink transition hover:bg-[#d92d79] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-pink" href="#winner">Celebrar al ganador <Heart aria-hidden className="h-4 w-4" /></a>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
