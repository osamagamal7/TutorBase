export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? (
        <p className="text-muted-foreground">{description}</p>
      ) : null}
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
