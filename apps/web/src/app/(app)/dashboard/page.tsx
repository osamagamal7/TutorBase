import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { CardSkeleton } from '@/components/loading-skeleton';

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your courses and upcoming sessions."
        actions={<Button>New course</Button>}
      />

      <CardSkeleton count={12} />
    </>
  );
}
