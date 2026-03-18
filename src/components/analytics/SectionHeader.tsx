interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export const SectionHeader = ({ title, subtitle }: SectionHeaderProps) => {
  return (
    <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
};

export default SectionHeader;

