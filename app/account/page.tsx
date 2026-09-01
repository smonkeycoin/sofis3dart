import { StoreShell } from "@/components/layout/StoreShell";
import { TopStoreBar } from "@/components/layout/TopStoreBar";
import { PageHeader } from "@/components/store/PageHeader";

export default function AccountPage() {
  return (
    <StoreShell>
      <TopStoreBar />
      <PageHeader
        copy="La cuenta de cliente queda como placeholder visual hasta que se defina autenticacion en una fase futura."
        title="Mi cuenta"
      />
    </StoreShell>
  );
}
