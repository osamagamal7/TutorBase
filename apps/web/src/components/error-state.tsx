import { Button } from '@/components/ui/button';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">{message}</h1>
      {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}
