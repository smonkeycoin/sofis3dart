import { brand } from "@/lib/brand";

const letterClasses = [
  "text-brand-pink",
  "text-brand-purple",
  "text-brand-yellow",
  "text-brand-green",
  "text-brand-pink",
  "text-brand-purple",
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-label={brand.name} className="select-none leading-none">
      <div
        className={[
          "font-black tracking-normal",
          compact ? "text-3xl" : "text-[4.9rem]",
        ].join(" ")}
      >
        {"SOFI'S".split("").map((letter, index) => (
          <span
            className={letterClasses[index] ?? "text-brand-purple"}
            key={`${letter}-${index}`}
          >
            {letter}
          </span>
        ))}
      </div>
      <div
        className={[
          "font-black tracking-normal text-ink",
          compact ? "mt-1 text-xl" : "mt-3 text-[3.35rem]",
        ].join(" ")}
      >
        3D ART
      </div>
    </div>
  );
}
