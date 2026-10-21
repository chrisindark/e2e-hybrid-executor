import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states';

export default function NotFound() {
  return (
    <div className="py-10">
      <EmptyState
        title="Page not found"
        description="The link you followed doesn't lead anywhere. Head back to the dashboard to find what you were looking for."
        action={<Button render={<Link href="/" />}>Back to dashboard</Button>}
      />
    </div>
  );
}
