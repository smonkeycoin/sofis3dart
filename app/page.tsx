import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { BestSellers } from "@/components/store/BestSellers";
import { Hero } from "@/components/store/Hero";
import { TrustStrip } from "@/components/store/TrustStrip";

export default function Home() {
  return (
    <StoreShell>
      <TopStoreBar />
      <Hero />
      <BestSellers />
      <TrustStrip />
    </StoreShell>
  );
}
