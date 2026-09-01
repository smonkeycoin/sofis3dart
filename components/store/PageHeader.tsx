export function PageHeader({
  title,
  copy,
}: {
  title: string;
  copy: string;
}) {
  return (
    <section className="mb-6 mt-6 rounded-[8px] bg-neutral-50 px-6 py-7 sm:px-8">
      <h1 className="text-3xl font-black leading-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-relaxed text-ink/68">
        {copy}
      </p>
    </section>
  );
}
